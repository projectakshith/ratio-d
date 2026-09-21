#!/usr/bin/env python3
"""Live-server accuracy smoke test.

POSTs real CAPTCHA images to a running TinyOCR server and compares the
returned text against the filename labels.

Usage:
    python scripts/smoke_predict.py [--url http://127.0.0.1:8080] \
        [--data data/student_portal] [-n 200] [--api-key KEY]
"""

from __future__ import annotations

import argparse
import json
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def post_raw(url: str, image: bytes, api_key: str | None) -> tuple[int, dict]:
    req = urllib.request.Request(
        f"{url.rstrip('/')}/predict",
        data=image,
        method="POST",
        headers={"Content-Type": "image/png", **({"x-api-key": api_key} if api_key else {})},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


def post_multipart(url: str, image: bytes, api_key: str | None) -> tuple[int, dict]:
    boundary = uuid.uuid4().hex
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="image"; filename="c.png"\r\n'
        f"Content-Type: image/png\r\n\r\n"
    ).encode() + image + f"\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request(
        f"{url.rstrip('/')}/predict",
        data=body,
        method="POST",
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            **({"x-api-key": api_key} if api_key else {}),
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://127.0.0.1:8080")
    ap.add_argument("--data", type=Path, default=ROOT / "data" / "student_portal")
    ap.add_argument("-n", type=int, default=200)
    ap.add_argument("--api-key", default=None)
    ap.add_argument("--multipart-every", type=int, default=25)
    args = ap.parse_args()

    images = sorted(args.data.glob("*.png"))[: args.n]
    if not images:
        raise SystemExit(f"no PNGs under {args.data}")

    hits = 0
    mismatches: list[tuple[str, str]] = []
    lat_ms: list[float] = []

    for i, path in enumerate(images):
        label = path.stem.lower()
        image = path.read_bytes()
        t0 = time.perf_counter()
        if args.multipart_every and i % args.multipart_every == 0:
            status, payload = post_multipart(args.url, image, args.api_key)
        else:
            status, payload = post_raw(args.url, image, args.api_key)
        lat_ms.append((time.perf_counter() - t0) * 1000)

        text = payload.get("text")
        if status != 200 or not isinstance(text, str):
            print(f"  HTTP {status}: {payload} for {path.name}")
            continue
        if text == label:
            hits += 1
        else:
            mismatches.append((label, text))

    n = len(images)
    print(f"\nexact match : {hits}/{n} ({hits / n:.4f})")
    print(f"p50 latency : {sorted(lat_ms)[n // 2]:.1f} ms")
    if mismatches:
        print("sample disagreements (label | served):")
        for lbl, got in mismatches[:10]:
            print(f"  {lbl:<12} {got}")
    raise SystemExit(0 if hits == n else 1)


if __name__ == "__main__":
    main()
