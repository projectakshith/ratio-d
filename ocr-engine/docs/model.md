# Model Documentation

TinyCRNN — a small CRNN for fixed-size CAPTCHA text recognition, trained with CTC
loss and served as ONNX. Training lives in
[`notebooks/tinyocr.ipynb`](../notebooks/tinyocr.ipynb); serving details are in
[`docs/api.md`](api.md).

## Artifacts

| File | Role | Committed? |
|---|---|---|
| `model/best_captcha_crnn.pt` | best PyTorch checkpoint (epoch, val_exact, val_char_acc) from training | source of truth |
| `model/captcha_crnn.onnx` | exported inference graph (opset 17) | generated — rebuild via `python scripts/export_onnx.py` |
| `model/vocab.json` | `{"vocab": "0123456789abcdefghijklmnopqrstuvwxyz", "blank_idx": 0}` | yes |

The ONNX file is gitignored; regenerate it from the checkpoint before building the
server (the parity gate in the export script is mandatory).

## Architecture

![TinyCRNN architecture](../assets/model_arch.excalidraw.png)

| Property | Value |
|---|---|
| Input | `[B, 1, 45, 175]` grayscale, normalized to `[-1, 1]` |
| CNN encoder | 5 ConvBlocks (Conv3x3 + BatchNorm + ReLU); channels `1→32→32→64→64→96`; two stride-2 blocks downsample spatially to `[B, 96, 12, 44]` |
| Sequence squeeze | `AdaptiveAvgPool2d((1, None))` collapses height → `[B, 96, 1, 44]` → `[B, 44, 96]` |
| Sequence model | 1-layer BiLSTM, hidden size 128 per direction → `[B, 44, 256]` |
| Classifier | Linear `256 → 37`, one logit row per timestep → output `[B, 44, 37]` |
| Dropout | 0.25 between LSTM and classifier |
| Vocab | 36 chars (`0-9a-z`) + CTC blank at index 0 = **37 classes** |
| Alignment window | 44 timesteps for a 175 px wide image (~4 px per timestep) |

### Why these choices

- **Fixed input size** — the model was trained exclusively on native-size images;
  resizing was never applied, so the server rejects wrong dimensions instead of
  resizing (resampling changes stroke statistics and hurts accuracy).
- **Height squeeze instead of flatten** — average-pooling height to 1 keeps the
  horizontal time axis intact for CTC while making the CNN/LSTM interface shape-static.
- **Greedy CTC only** — beam search gave no measurable exact-match gain on this
  vocabulary and adds latency; greedy argmax + collapse is enough.

## Preprocessing (serving)

The Rust server replicates the PyTorch validation transform bit-for-bit:

```
bytes -> decode (png/jpeg/webp) -> ITU-R 601-2 luma (PIL fixed-point) ->
/255.0 -> (x - 0.5) / 0.5 -> [1, 45, 175] f32 tensor (row-major)
```

PIL's `convert("L")` uses integer math `(R*19595 + G*38470 + B*7471 + 0x8000) >> 16`;
common image libraries use different (BT.709) weights, so the server deliberately
reproduces PIL's exact formula (`src/preprocessing/image.rs`). Verified bit-exact
against PyTorch tensors in `cargo test`.

## Decoding

Greedy CTC (`src/decoding/ctc_greedy.rs`):

1. argmax over the 37 classes at each of the 44 timesteps (ties → lowest index);
2. collapse consecutive repeated classes;
3. drop blanks (class 0);
4. map remaining indices through the vocab: class `i > 0` → `chars[i - 1]`.

Example: `blank a a blank 7` → collapse → `a 7` → `"a7"`. Separated repeats survive:
`z blank z` → `"zz"`. All-blank sequences decode to `""`.

## Export & parity gate

`python scripts/export_onnx.py`:

1. Reconstructs TinyCRNN exactly as trained and loads `best_captcha_crnn.pt`.
2. Exports opset-17 ONNX with **only the batch axis dynamic**
   (`image[batch,1,45,175] -> logits[batch,44,37]`).
3. Gates numerical parity PyTorch vs ONNX Runtime: max abs logit diff must be
   `< 2e-3` on random batches (B = 1..16) **and** greedy predictions must agree on
   up to 512 real CAPTCHAs — any disagreement fails the script (exit 1). Measured:
   max diff 2.7e-05, agreement 512/512.
4. Dumps golden tensors + decoder vectors to `tests/golden/`; `cargo test`
   re-verifies Rust preprocessing, decoding, and end-to-end predictions against them.

An export-twin wrapper replaces `AdaptiveAvgPool2d((1, None))` with an equivalent
`mean(dim=2)` because the legacy exporter cannot trace dynamic pool output sizes;
equivalence is asserted before export.

## Training (summary)

See [`notebooks/tinyocr.ipynb`](../notebooks/tinyocr.ipynb) for the full pipeline.
Dataset: labeled CAPTCHA screenshots from a student portal
(`data/student_portal/*.png`, filename = label). Primary production metric is
**exact-match accuracy**; character-level accuracy is reported during training.
