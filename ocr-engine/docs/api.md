# HTTP API Reference

TinyOCR exposes four endpoints. Only `POST /predict` performs inference; the others
are probes/telemetry and stay unauthenticated (intended for a trusted network).

Base URL in the default configuration: `http://127.0.0.1:8080`.

---

## `POST /predict`

Recognizes the text in one CAPTCHA image and returns it as JSON.

### Request

Send the image either as **raw body bytes** or as **multipart form-data**.

Raw body:

```bash
curl -X POST http://localhost:8080/predict \
     -H "Content-Type: image/png" \
     -H "x-api-key: $KEY" \
     --data-binary @captcha.png
```

Accepted raw content types: `image/png`, `image/jpeg`, `image/webp`,
`application/octet-stream` (any bytes that decode as an image).

Multipart form-data: the part must be named `image`, `file`, `captcha`, or
`payload` — or have an `image/*` content type — or carry a filename.

```bash
curl -X POST http://localhost:8080/predict -F "image=@captcha.png"
```

Constraints:

| Limit | Default | Config key |
|---|---|---|
| Image dimensions | exactly **175 x 45** px (validated, never resized) | fixed by the model |
| Body size | 1 MiB | `max_image_bytes` / `TINYOCR_MAX_IMAGE_BYTES` |
| Request timeout | 1000 ms | `request_timeout_ms` / `TINYOCR_REQUEST_TIMEOUT_MS` |

### Response `200 OK`

```json
{ "text": "a7k29" }
```

`text` may be an empty string if the decoder saw only blanks — the server does not
guess.

### Authentication

Disabled by default. Set `TINYOCR_API_KEY` (env) to enable; every predict request
must then send a matching `x-api-key` header. Comparison is constant-time. Health,
readiness, and metrics are never gated.

### Errors

Body is always `{"error": "<message>"}` — never a stack trace. Full detail goes to
server logs only.

| Status | Meaning |
|---|---|
| 400 | corrupt/unreadable image, wrong dimensions (`image must be exactly 175x45, got WxH`) |
| 401 | missing/invalid API key (only when auth is enabled) |
| 413 | body larger than `max_image_bytes` |
| 429 | bounded queue full — backpressure; wait briefly and retry |
| 503 | inference backend unavailable |
| 504 | timed out (covers queue wait + inference; outer timeout layer is the safety net) |

429 is expected behavior under overload, not a bug: clients should retry after a
short sleep (see the Python client below).

---

## `GET /health`

Liveness probe. Always `200 {"status":"ok"}` while the process serves.

## `GET /ready`

Readiness probe. Returns `200 {"ready":true}` once the model/session is loaded and
the warmup inference has completed; `503 {"ready":false}` before that. Use this for
orchestrator readiness gates, not `/health`.

## `GET /metrics`

Prometheus text exposition (version 0.0.4).

| Metric | Type | Description |
|---|---|---|
| `tinyocr_requests_total` | counter | predict requests received |
| `tinyocr_requests_success` | counter | predict requests answered 200 |
| `tinyocr_requests_failed` | counter | predict requests answered with an error |
| `tinyocr_request_seconds` | histogram | end-to-end request latency |
| `tinyocr_queue_wait_seconds` | histogram | time spent waiting in the batching queue |
| `tinyocr_preprocess_seconds` | histogram | decode + normalize time |
| `tinyocr_inference_seconds` | histogram | ONNX Runtime batch execution time |
| `tinyocr_decode_seconds` | histogram | greedy CTC decode time |
| `tinyocr_batch_size` | histogram | requests stacked per inference call |
| `tinyocr_queue_depth` | gauge | current free slots in the queue |

Useful queries:

```promql
histogram_quantile(0.99, rate(tinyocr_request_seconds_bucket[5m]))
rate(tinyocr_requests_total[1m])
histogram_quantile(0.50, rate(tinyocr_inference_seconds_bucket[5m]))
avg_over_time(tinyocr_queue_depth[5m])
```

---

## Minimal Python client

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

## Live checks

```bash
# accuracy against filename labels in data/student_portal/
python scripts/smoke_predict.py --url http://127.0.0.1:8080 -n 200

# load test (rps + p50/p95/p99)
cargo bench --no-run   # builds benches/load_test.rs
```
