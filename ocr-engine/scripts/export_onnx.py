"""Export TinyCRNN -> ONNX and gate numerical parity (PyTorch vs ONNX Runtime).

Steps
-----
1. Reconstruct TinyCRNN exactly as trained (notebook cells 27/28).
2. Load model/best_captcha_crnn.pt, model.eval().
3. Export model/captcha_crnn.onnx, opset 17, ONLY batch dim dynamic.
4. Parity: PyTorch vs ONNX Runtime (CPU) on random tensors + real CAPTCHA images.
   Report max/mean abs logit difference and greedy prediction agreement.
5. Dump golden artifacts for Rust integration tests under tests/golden/.

Exit code 1 if parity fails beyond thresholds (do not ship).

Usage: python scripts/export_onnx.py [--skip-export] [--samples 512]
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CKPT_PATH = ROOT / "model" / "best_captcha_crnn.pt"
ONNX_PATH = ROOT / "model" / "captcha_crnn.onnx"
DATA_DIR = ROOT / "data" / "student_portal"
GOLDEN_DIR = ROOT / "tests" / "golden"

IMG_H, IMG_W = 45, 175
VOCAB = "0123456789abcdefghijklmnopqrstuvwxyz"
BLANK_IDX = 0
NUM_CLASSES = len(VOCAB) + 1

MAX_LOGIT_DIFF = 2e-3


class ConvBlock(nn.Sequential):
    def __init__(self, cin, cout, stride=(1, 1)):
        super().__init__(
            nn.Conv2d(cin, cout, kernel_size=3, stride=stride, padding=1, bias=False),
            nn.BatchNorm2d(cout),
            nn.ReLU(inplace=True),
        )


class TinyCRNN(nn.Module):
    def __init__(self, num_classes, in_channels=1, lstm_hidden=128, dropout=0.25):
        super().__init__()
        self.cnn = nn.Sequential(
            ConvBlock(in_channels, 32),
            ConvBlock(32, 32, stride=(2, 2)),
            ConvBlock(32, 64),
            ConvBlock(64, 64, stride=(2, 2)),
            ConvBlock(64, 96),
        )
        self.squeeze = nn.AdaptiveAvgPool2d((1, None))
        self.lstm = nn.LSTM(96, lstm_hidden, num_layers=1, bidirectional=True, batch_first=True)
        self.dropout = nn.Dropout(dropout)
        self.classifier = nn.Linear(lstm_hidden * 2, num_classes)

    def forward(self, x):
        f = self.cnn(x)
        f = self.squeeze(f)
        f = f.squeeze(2).transpose(1, 2)
        f, _ = self.lstm(f)
        f = self.dropout(f)
        return self.classifier(f)


class ExportTinyCRNN(nn.Module):
    """Export-friendly twin of TinyCRNN.

    Replaces nn.AdaptiveAvgPool2d((1, None)) with mean(dim=2, keepdim=True),
    which is mathematically identical for the static CNN output height and
    avoids the legacy exporter's "output_size is not constant" failure.
    State dict keys are untouched.
    """

    def __init__(self, inner: TinyCRNN):
        super().__init__()
        self.inner = inner

    def forward(self, x):
        f = self.inner.cnn(x)
        f = f.mean(dim=2, keepdim=True)
        f = f.squeeze(2).transpose(1, 2)
        f, _ = self.inner.lstm(f)
        f = self.inner.dropout(f)
        return self.inner.classifier(f)


def load_model() -> TinyCRNN:
    ckpt = torch.load(CKPT_PATH, map_location="cpu", weights_only=True)
    model = TinyCRNN(NUM_CLASSES)
    model.load_state_dict(ckpt["model_state_dict"], strict=True)
    model.eval()
    print(f"loaded {CKPT_PATH.name}: epoch={ckpt['epoch']} "
          f"val_exact={ckpt['val_exact']:.4f} char_acc={ckpt['val_char_acc']:.4f}")
    return model


def build_export_model(model: TinyCRNN) -> ExportTinyCRNN:
    export_model = ExportTinyCRNN(model).eval()
    with torch.no_grad():
        x = torch.randn(3, 1, IMG_H, IMG_W)
        torch.testing.assert_close(
            model(x), export_model(x), rtol=0, atol=1e-4,
            msg=lambda m: f"export wrapper diverges from original:\n{m}",
        )
    print("export wrapper verified equivalent to TinyCRNN")
    return export_model


def load_tensor(path: Path) -> torch.Tensor:
    img = Image.open(path).convert("L")
    arr = np.asarray(img, dtype=np.float32) / 255.0
    arr = (arr - 0.5) / 0.5
    return torch.from_numpy(arr).unsqueeze(0)


def greedy_decode(logits: torch.Tensor) -> list[str]:
    """logits: [B, T, C]. Returns list[str], one entry per batch item."""
    preds = logits.argmax(dim=2)
    idx_to_char = {i + 1: c for i, c in enumerate(VOCAB)}
    texts = []
    for seq in preds.tolist():
        collapsed: list[int] = []
        prev = BLANK_IDX
        for idx in seq:
            if idx != prev:
                collapsed.append(idx)
            prev = idx
        texts.append("".join(idx_to_char[i] for i in collapsed if i != BLANK_IDX))
    return texts


def export(model: TinyCRNN) -> None:
    dummy = torch.randn(1, 1, IMG_H, IMG_W)
    export_model = build_export_model(model)
    kwargs = dict(
        f=str(ONNX_PATH),
        input_names=["image"],
        output_names=["logits"],
        dynamic_axes={"image": {0: "batch"}, "logits": {0: "batch"}},
        opset_version=17,
        do_constant_folding=True,
    )
    try:
        torch.onnx.export(export_model, dummy, dynamo=False, **kwargs)
    except TypeError:
        torch.onnx.export(export_model, dummy, **kwargs)
    size_mb = ONNX_PATH.stat().st_size / 1e6
    print(f"exported {ONNX_PATH.relative_to(ROOT)} ({size_mb:.1f} MB)")

    import onnx
    m = onnx.load(str(ONNX_PATH))
    onnx.checker.check_model(m)
    inp = m.graph.input[0]
    out = m.graph.output[0]
    dims_in = [(d.dim_param or d.dim_value) for d in inp.type.tensor_type.shape.dim]
    dims_out = [(d.dim_param or d.dim_value) for d in out.type.tensor_type.shape.dim]
    print(f"graph io: image{dims_in} -> logits{dims_out} opset={m.opset_import[0].version}")
    assert dims_in == ["batch", 1, IMG_H, IMG_W], f"bad input dims {dims_in}"
    assert dims_out == ["batch", 44, NUM_CLASSES], f"bad output dims {dims_out}"


def dump_bytes(path: Path, arr: np.ndarray) -> str:
    data = arr.astype("<f4").tobytes()
    path.write_bytes(data)
    return hashlib.sha256(data).hexdigest()


def make_goldens(model: TinyCRNN) -> None:
    GOLDEN_DIR.mkdir(parents=True, exist_ok=True)
    files = sorted(DATA_DIR.glob("*.png"))
    assert files, f"no PNGs found in {DATA_DIR}"
    rng = np.random.default_rng(21)
    picked = list(rng.choice(files, size=min(8, len(files)), replace=False))

    tensors = torch.stack([load_tensor(p) for p in picked])
    with torch.no_grad():
        pt_logits = model(tensors)
    texts = greedy_decode(pt_logits)

    sha_in = dump_bytes(GOLDEN_DIR / "input.bin", tensors.numpy())
    sha_out = dump_bytes(GOLDEN_DIR / "logits.bin", pt_logits.numpy())
    meta = {
        "batch": int(tensors.shape[0]),
        "shape_input": list(tensors.shape),
        "shape_logits": list(pt_logits.shape),
        "images": [p.name for p in picked],
        "labels": [p.stem for p in picked],
        "greedy_texts": texts,
        "sha256_input_f32le": sha_in,
        "sha256_logits_f32le": sha_out,
    }
    (GOLDEN_DIR / "meta.json").write_text(json.dumps(meta, indent=2))

    g = torch.Generator().manual_seed(7)
    cases = {
        "random": torch.randn(44, 37, generator=g).tolist(),
        "repeat_heavy": torch.randn(44, 37, generator=g).tolist(),
        "blank_heavy": torch.randn(44, 37, generator=g).tolist(),
    }
    for t in range(0, 44, 3):
        cases["repeat_heavy"][t][5] = 20.0
    for t in range(44):
        for c in range(37):
            cases["blank_heavy"][t][c] = 0.0
        cases["blank_heavy"][t][0] = 10.0
    for t in (7, 15, 30):
        cases["blank_heavy"][t][(t % 36) + 1] = 11.0
    decode_gold = {}
    for name, lg in cases.items():
        dec = greedy_decode(torch.from_numpy(np.array(lg)).unsqueeze(0))[0]
        decode_gold[name] = {"logits": lg, "greedy_text": dec}
    (GOLDEN_DIR / "decode_vectors.json").write_text(json.dumps(decode_gold))

    print(f"goldens written to {GOLDEN_DIR.relative_to(ROOT)}")
    for name, txt in zip(meta["images"], texts):
        print(f"  golden {name:<14} -> {txt!r}")


def run_parity(model: TinyCRNN, n_samples: int) -> bool:
    import onnxruntime as ort

    sess = ort.InferenceSession(str(ONNX_PATH), providers=["CPUExecutionProvider"])

    def ort_logits(x_np: np.ndarray) -> np.ndarray:
        return sess.run(["logits"], {"image": x_np})[0]

    ok = True

    print("\n[random tensors]")
    g = torch.Generator().manual_seed(1234)
    for b in (1, 2, 8, 16):
        x = torch.randn(b, 1, IMG_H, IMG_W, generator=g)
        with torch.no_grad():
            ref = model(x).numpy()
        got = ort_logits(x.numpy())
        d = np.abs(ref - got)
        agree = sum(a == b_ for a, b_ in zip(greedy_decode(torch.from_numpy(ref)),
                                             greedy_decode(torch.from_numpy(got))))
        print(f"  batch={b:<3} max_abs={d.max():.3e} mean_abs={d.mean():.3e} "
              f"greedy_agree={agree}/{b}")
        ok &= d.max() < MAX_LOGIT_DIFF and agree == b

    files = sorted(DATA_DIR.glob("*.png"))
    step = max(1, len(files) // n_samples)
    subset = files[::step][:n_samples]
    x = torch.stack([load_tensor(p) for p in subset])
    with torch.no_grad():
        ref = model(x).numpy()
    got = ort_logits(x.numpy())
    d = np.abs(ref - got)
    refs = greedy_decode(torch.from_numpy(ref))
    gots = greedy_decode(torch.from_numpy(got))
    disagree = [(p.name, a, b_) for p, a, b_ in zip(subset, refs, gots) if a != b_]
    print(f"\n[real corpus n={len(subset)}]")
    print(f"  logit max_abs={d.max():.3e} mean_abs={d.mean():.3e}")
    print(f"  greedy agreement: {len(subset) - len(disagree)}/{len(subset)}")
    for name, a, b_ in disagree[:10]:
        print(f"    DISAGREE {name}: pytorch={a!r} onnx={b_!r}")
    ok &= len(disagree) == 0

    em = sum(r == p.stem.lower() for r, p in zip(refs, subset))
    print(f"  pytorch greedy exact-vs-filename: {em}/{len(subset)} ({em / len(subset):.3f})")

    print(f"\nparity gate: {'PASS' if ok else 'FAIL'} "
          f"(threshold max_abs < {MAX_LOGIT_DIFF:g}, zero disagreement)")
    return ok


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--skip-export", action="store_true")
    ap.add_argument("--samples", type=int, default=512)
    args = ap.parse_args()

    torch.manual_seed(0)
    model = load_model()
    if not args.skip_export or not ONNX_PATH.exists():
        export(model)
    else:
        print(f"skipping export, using existing {ONNX_PATH}")

    make_goldens(model)
    passed = run_parity(model, args.samples)
    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    main()
