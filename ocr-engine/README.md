<a href="https://github.com/projectakshith/ratio-d">
  <img width="1867" height="369" alt="image" src="https://github.com/user-attachments/assets/cf152291-6290-431a-bf97-448f42a21586" />
</a>

<div align="center">

## TinyOCR

> A fast CAPTCHA OCR inference service written in Rust. Designed for RATIO'D

Receives CAPTCHA images over HTTP, dynamically batches concurrent
requests, runs inference through ONNX Runtime (CPU or NVIDIA CUDA), and returns the
decoded text via greedy CTC

</div>

## Documentation

| Doc | Contents |
|---|---|
| [`docs/api.md`](docs/api.md) | HTTP API reference — endpoints, auth, errors, metrics, client integration |
| [`docs/model.md`](docs/model.md) | Model card — TinyCRNN architecture, preprocessing, CTC decoding, ONNX export & parity gate |
| [`notebooks/tinyocr.ipynb`](notebooks/tinyocr.ipynb) | Training notebook — dataset, training pipeline, evaluation |


```
POST /predict {image bytes}
      |
axum HTTP  ->  validate  ->  preprocess (PIL-exact)  ->  bounded queue (512)
      |
dynamic batching worker   (max_batch=16, max_wait=500us)
      |
InferenceBackend trait  ->  ONNX Runtime (CPU | CUDA EP)
      |
greedy CTC decode  ->  {"text": "a7k29"}
```

## Model

TinyCRNN is a small CRNN for fixed-size CAPTCHA text recognition trained with CTC loss.
It combines a lightweight CNN feature extractor with a bidirectional LSTM that emits
per-timestep class predictions across a 44-character alignment window.

![TinyCRNN architecture](assets/model_arch.excalidraw.png)

| Property | Value |
|---|---|
| Input | `[B, 1, 45, 175]` grayscale, normalized to `[-1, 1]` |
| CNN encoder | 5 ConvBlocks (Conv3x3 + BatchNorm + ReLU); two stride-2 blocks downsample to `[B, 96, 12, 44]` |
| Sequence squeeze | `AdaptiveAvgPool2d((1, None))` collapses height -> `[B, 96, 1, 44]` -> `[B, 44, 96]` |
| Sequence model | 1-layer BiLSTM, hidden size 128 (`[B, 44, 256]`) |
| Classifier | Linear 256 -> 37 logits per timestep -> output `[B, 44, 37]` |
| Vocab | `0123456789abcdefghijklmnopqrstuvwxyz` (36 chars) + CTC blank at index 0 = **37 classes** |
| Decoding | Greedy CTC only: argmax per timestep, collapse repeats, drop blanks |

The exported ONNX graph (`model/captcha_crnn.onnx`, opset 17) keeps only the batch
dimension dynamic; spatial dims are frozen at 45x175 so every input is validated to be
exactly **175 wide x 45 tall** — wrong sizes are rejected with HTTP 400, never resized,
because the model was trained exclusively on native-size images.

Preprocessing replicates the PyTorch validation transform bit-for-bit:

```
bytes -> decode (png/jpeg/webp) -> ITU-R 601-2 luma (PIL fixed-point) ->
/255.0 -> (x - 0.5) / 0.5 -> [1, 45, 175] f32 tensor
```

This matters: PIL's `convert("L")` uses `(R*19595 + G*38470 + B*7471 + 0x8000) >> 16`,
while common image libraries use different (BT.709) weights. Rust reproduces PIL's
integer math exactly, verified bit-for-bit against PyTorch tensors in CI-style tests.

## Repository layout

```
src/
├── api/            axum routes (/predict /health /ready /metrics), auth, state
├── batching/       dynamic batching worker + bounded mpsc queue
├── decoding/       greedy CTC decoder + vocab handling
├── inference/      InferenceBackend trait, ONNX Runtime backend (cpu/cuda), buffers
├── preprocessing/  decode -> PIL-exact grayscale -> normalize -> tensor
├── config.rs       TOML config + TINYOCR_* env overrides
└── error.rs        typed errors -> HTTP status mapping

model/              captcha_crnn.onnx (generated) + vocab.json
configs/            production.toml (native), container.toml (docker)
scripts/            export_onnx.py, smoke_predict.py, benchmark_sweep.py
benches/load_test.rs  HTTP load generator (rps + p50/p95/p99)
tests/golden_parity.rs  Rust-vs-Python golden regression tests
Dockerfile          CUDA runtime image (optional)
```

## Quickstart

```powershell
# 1) Export the checkpoint to ONNX and run the parity gate (needs torch + onnxruntime)
python scripts\export_onnx.py
#    PASS = max logit diff < 2e-3 AND zero greedy disagreements vs PyTorch

# 2a) Build CPU server
cargo build --release
# 2b) Or CUDA server (requires NVIDIA GPU + driver)
cargo build --release --features cuda

# 3) Run
.\target\release\tinyocr.exe --config configs\production.toml

# 4) Predict
curl.exe -X POST http://127.0.0.1:8080/predict `
     -H "Content-Type: image/png" --data-binary "@captcha.png"

# 5) Verify accuracy against labeled samples
python scripts\smoke_predict.py --url http://127.0.0.1:8080 -n 200
```

Measured on the reference machine (RTX 4060 Laptop, i7-14650HX):

| Check | Result |
|---|---|
| PyTorch vs ONNX Runtime logits | max abs diff **2.7e-05**, mean 1.4e-06 |
| Greedy prediction agreement (512 real CAPTCHAs) | **512/512** |
| Rust preprocessing vs PyTorch tensors | **bit-exact** |
| Live server exact match vs labels (300 imgs, CPU debug build) | **97%** |
| Throughput (debug CPU build, concurrency 32) | ~1500 req/s, p95 ≈ 25 ms, zero errors |
| Dynamic batching under load | avg batch ≈ 10, most batches hit max_batch=16 |

Release builds are substantially faster; run `scripts/benchmark_sweep.py` to find the
best `backend x max_batch x max_wait x concurrency` combination on your hardware.

## Configuration

`configs/production.toml`, every field overridable by environment variable:

```toml
host = "0.0.0.0"
port = 8080
backend = "cpu"                      # or "cuda" (requires --features cuda build)
model_path = "./model/captcha_crnn.onnx"
vocab_path = "./model/vocab.json"
max_batch = 16                       # requests stacked per GPU call
max_wait_us = 500                    # batching window after first request
max_queue = 512                      # bounded queue depth (backpressure)
request_timeout_ms = 1000
max_image_bytes = 1048576
```

| Env override | Field |
|---|---|
| `TINYOCR_HOST` / `TINYOCR_PORT` | bind address |
| `TINYOCR_BACKEND` | `cpu` \| `cuda` |
| `TINYOCR_MODEL_PATH` / `TINYOCR_VOCAB_PATH` | artifact paths |
| `TINYOCR_MAX_BATCH` / `TINYOCR_MAX_WAIT_US` / `TINYOCR_MAX_QUEUE` | batching tuning |
| `TINYOCR_REQUEST_TIMEOUT_MS` / `TINYOCR_MAX_IMAGE_BYTES` | limits |
| `TINYOCR_API_KEY` | enables API-key auth when set |

The model and session load exactly once at startup, followed by a warmup inference;
`GET /ready` flips to 200 only after that. A CUDA backend that fails to initialize is a
hard startup error — the server never silently falls back to CPU.

### CUDA notes (Windows dev)

ONNX Runtime's CUDA EP needs cuDNN/cuBLAS/cudart DLLs on `PATH`. If you installed
PyTorch via pip you can borrow its bundled DLLs:

```powershell
$env:PATH = "$(python -c `"import torch,os;print(os.path.join(os.path.dirname(torch.__file__),'lib'))`");$env:PATH"
.\target\release\tinyocr.exe --config configs\production.toml
# startup log must show backend = onnxruntime-cuda
```

## API

### `POST /predict`

Send an image as raw bytes (`Content-Type: image/png`, `image/jpeg`, `image/webp`,
`application/octet-stream`) or as multipart form-data (part named `image`/`file`,
or any part with an `image/*` content type).

```bash
curl -X POST http://localhost:8080/predict \
     -H "Content-Type: image/png" \
     -H "x-api-key: $KEY" \
     --data-binary @captcha.png
```

Response `200`:

```json
{ "text": "a7k29" }
```

Errors (JSON body `{"error": "..."}`, never a stack trace):

| Status | Meaning |
|---|---|
| 400 | corrupt/unreadable image, or wrong dimensions (must be exactly 175x45) |
| 401 | missing/invalid API key (only when auth enabled) |
| 413 | body larger than `max_image_bytes` |
| 429 | queue full — backpressure, retry shortly |
| 503 | inference backend unavailable |
| 504 | request timed out |

### `GET /health`

Liveness probe. Always `{"status":"ok"}` while the process serves.

### `GET /ready`

Readiness probe. `{"ready":true}` once the model is loaded and warmup inference has
completed; `503 {"ready":false}` before that.

### `GET /metrics`

Prometheus exposition format. Counters: `tinyocr_requests_total{}`,
`tinyocr_requests_success`, `tinyocr_requests_failed`. Histograms (µs..s buckets):
`tinyocr_request_seconds`, `tinyocr_queue_wait_seconds`, `tinyocr_preprocess_seconds`,
`tinyocr_inference_seconds`, `tinyocr_decode_seconds`, plus `tinyocr_batch_size`.
Percentiles via standard PromQL:

```promql
histogram_quantile(0.99, rate(tinyocr_request_seconds_bucket[5m]))
rate(tinyocr_requests_total[1m])
histogram_quantile(0.50, rate(tinyocr_inference_seconds_bucket[5m]))
avg_over_time(tinyocr_queue_depth[5m])
```

## Client integration (AcademiaWrapper)

Only `POST /predict` is required; the client is completely unaware of which inference
backend runs behind it.

```python
import asyncio
import httpx

class CaptchaSolver:
    def __init__(self, base_url="http://127.0.0.1:8080", api_key=None):
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"x-api-key": api_key} if api_key else {},
            timeout=2.0,
        )

    async def solve(self, image_bytes: bytes) -> str:
        r = await self._client.post(
            "/predict",
            content=image_bytes,
            headers={"content-type": "image/png"},
        )
        if r.status_code == 200:
            return r.json()["text"]
        if r.status_code == 429:          # backpressure: brief retry
            await asyncio.sleep(0.05)
            return await self.solve(image_bytes)
        r.raise_for_status()
```

## Benchmarking

Build the load generator and sweep configurations:

```powershell
cargo bench --no-run    # compiles benches/load_test.rs

# single run
.\target\release\deps\load_test-*.exe --url http://127.0.0.1:8080 `
    --concurrency 32 --duration-secs 10 --data data\student_portal --json

# full matrix: backends x max_batch x max_wait x concurrency -> CSV
python scripts\benchmark_sweep.py --server target\release\tinyocr.exe `
    --loadtest "target\release\deps\load_test-*.exe" `
    --backends cpu,cuda --batches 1,4,16,32 --waits 0,250,1000 `
    --concurrency 1,8,32,128 --duration 8
```

Guidance: raise `max_batch` until p95 stops improving; keep `max_wait_us` <= ~1ms;
compare CPU vs CUDA explicitly instead of assuming the GPU wins (at batch=1 it often
doesn't for this tiny model). The sweep script reports rps + p50/p95/p99 + average GPU
utilization per configuration and prints the best config at the end.

## Correctness workflow

1. `scripts/export_onnx.py` — exports opset-17 ONNX (batch-only dynamic axes), then
   gates parity: logit max/mean abs diff vs PyTorch on random batches and up to 512 real
   CAPTCHAs, plus greedy agreement counts. Any unexplained disagreement fails the script.
2. Golden tensors land in `tests/golden/`; `cargo test` re-verifies on every build:
   bit-exact Rust preprocessing, decoder vectors (blank/repeat edge cases), end-to-end
   greedy predictions vs Python.
3. `scripts/smoke_predict.py` — live-server accuracy check against filename labels.

Primary production metric is **exact-match accuracy**; character-level accuracy is
reported by the training pipeline.

## Design guarantees

- Model/session initialized once; zero per-request loading or CUDA init.
- Strictly bounded queue — memory cannot grow unbounded under overload.
- No blocking calls on the async runtime; inference executes in a dedicated worker.
- No unsafe code anywhere.
- Backend abstraction (`InferenceBackend` trait) isolates ONNX Runtime/CUDA from API,
  batching, and decoding, so TensorRT can replace ORT later without redesign.

##  License :
  
This project is licensed under the MIT License - see the [LICENSE](https://github.com/wtfPrethiv/Quantum-Wave-Packet-Prediction-NNblob/main/LICENSE) file for details.
