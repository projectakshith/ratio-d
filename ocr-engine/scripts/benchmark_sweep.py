#!/usr/bin/env python3
"""Benchmark matrix runner for TinyOCR.

Spawns the server binary for each (backend, max_batch, max_wait) combination,
runs the load tester at several concurrency levels, and records rps +
p50/p95/p99 into CSV and markdown.

Example:
    python scripts/benchmark_sweep.py \
        --server target/release/tinyocr.exe \
        --loadtest target/release/deps/load_test-*.exe \
        --data data/student_portal \
        --backends cpu --batches 1,4,16 --waits 0,500,2000 \
        --concurrency 1,8,32,128 --duration 8
"""

from __future__ import annotations

import argparse
import csv
import glob
import json
import os
import shutil
import socket
import subprocess
import threading
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def free_port(base: int) -> int:
    port = base
    while True:
        with socket.socket() as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                port += 1


def wait_ready(port: int, timeout: float = 60.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{port}/ready", timeout=2) as r:
                if r.status == 200:
                    return True
        except Exception:
            time.sleep(0.25)
    return False


class GpuSampler(threading.Thread):
    def __init__(self):
        super().__init__(daemon=True)
        self.samples: list[float] = []
        self._stop = threading.Event()
        self.has_nvidia = shutil.which("nvidia-smi") is not None

    def run(self):
        if not self.has_nvidia:
            return
        while not self._stop.is_set():
            try:
                out = subprocess.run(
                    ["nvidia-smi", "--query-gpu=utilization.gpu",
                     "--format=csv,noheader,nounits"],
                    capture_output=True, text=True, timeout=5,
                ).stdout.strip()
                self.samples.append(float(out.splitlines()[0]))
            except Exception:
                pass
            self._stop.wait(0.5)

    def stop(self) -> float | None:
        self._stop.set()
        self.join(timeout=3)
        return sum(self.samples) / len(self.samples) if self.samples else None


def run_combo(args, backend: str, max_batch: int, max_wait_us: int, concurrency: int) -> dict:
    port = free_port(args.base_port)
    env = dict(os.environ)
    env.update({
        "TINYOCR_BACKEND": backend,
        "TINYOCR_PORT": str(port),
        "TINYOCR_MAX_BATCH": str(max_batch),
        "TINYOCR_MAX_WAIT_US": str(max_wait_us),
        "TINYOCR_MAX_QUEUE": str(args.max_queue),
        "RUST_LOG": "warn",
    })
    proc = subprocess.Popen(
        [str(args.server), "--config", str(ROOT / "configs" / "production.toml")],
        env=env, cwd=str(ROOT),
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        creationflags=getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0),
    )
    gpu = GpuSampler()
    try:
        if not wait_ready(port, args.startup_timeout):
            return {"error": "server failed to become ready"}
        gpu.start()
        time.sleep(0.5)

        cmd = [str(args.loadtest),
               "--url", f"http://127.0.0.1:{port}",
               "--concurrency", str(concurrency),
               "--duration-secs", str(args.duration),
               "--data", str(args.data),
               "--warmup", "50", "--json"]
        if args.api_key:
            cmd += ["--api-key", args.api_key]
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=args.duration * 4)
        lines = [line for line in out.stdout.splitlines() if line.startswith("{")]
        if not lines:
            return {"error": f"loadtest produced no json: {out.stderr[-300:]}"}
        result = json.loads(lines[-1])
        result["gpu_util_avg"] = gpu.stop()
        return result
    finally:
        gpu.stop()
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()


def resolve_loadtest(pattern: str) -> Path:
    p = Path(pattern)
    if p.exists():
        return p
    matches = sorted(glob.glob(pattern))
    if matches:
        return Path(matches[-1])
    raise SystemExit(f"loadtest binary not found: {pattern}")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--server", required=True)
    ap.add_argument("--loadtest", required=True)
    ap.add_argument("--data", type=Path, default=ROOT / "data" / "student_portal")
    ap.add_argument("--backends", default="cpu,cuda")
    ap.add_argument("--batches", default="1,4,16")
    ap.add_argument("--waits", default="0,500,2000")
    ap.add_argument("--concurrency", default="1,8,32,128")
    ap.add_argument("--duration", type=int, default=8)
    ap.add_argument("--base-port", type=int, default=8600)
    ap.add_argument("--max-queue", type=int, default=512)
    ap.add_argument("--startup-timeout", type=float, default=90.0)
    ap.add_argument("--api-key", default=os.environ.get("TINYOCR_API_KEY"))
    ap.add_argument("--out", type=Path, default=ROOT / "benchmark_results.csv")
    args = ap.parse_args()

    args.server = Path(args.server)
    args.loadtest = resolve_loadtest(args.loadtest)
    if not args.server.exists():
        raise SystemExit(f"server binary not found: {args.server}")

    combos = [
        (b.strip(), int(mb), int(w))
        for b in args.backends.split(",") if b.strip()
        for mb in (int(x) for x in args.batches.split(","))
        for w in (int(x) for x in args.waits.split(","))
    ]
    concurrencies = [int(c) for c in args.concurrency.split(",")]
    total = len(combos) * len(concurrencies)

    rows: list[dict] = []
    done = 0
    print(f"{total} runs ({len(combos)} configs x {len(concurrencies)} concurrency levels)\n")

    for backend, max_batch, max_wait_us in combos:
        for c in concurrencies:
            done += 1
            print(f"[{done}/{total}] {backend} batch={max_batch} wait={max_wait_us}us conc={c} ... ",
                  end="", flush=True)
            t0 = time.time()
            try:
                r = run_combo(args, backend, max_batch, max_wait_us, c)
            except Exception as exc:
                r = {"error": repr(exc)}
            took = time.time() - t0

            if "error" in r:
                print(f"FAILED ({r['error']}) [{took:.1f}s]")
                rows.append({"backend": backend, "max_batch": max_batch,
                             "max_wait_us": max_wait_us, "concurrency": c,
                             "error": r["error"]})
                continue

            row = {
                "backend": backend,
                "max_batch": max_batch,
                "max_wait_us": max_wait_us,
                "concurrency": c,
                "rps": round(r["rps"], 1),
                "p50_ms": round(r["p50_ms"], 2),
                "p95_ms": round(r["p95_ms"], 2),
                "p99_ms": round(r["p99_ms"], 2),
                "mean_ms": round(r["mean_ms"], 2),
                "errors": r["errors"],
                "gpu_util_avg": round(r.get("gpu_util_avg"), 1) if r.get("gpu_util_avg") is not None else "",
                "seconds": round(took, 1),
            }
            rows.append(row)
            print(f"rps={row['rps']} p50={row['p50_ms']}ms "
                  f"p95={row['p95_ms']}ms p99={row['p99_ms']}ms [{took:.1f}s]")

    fields = ["backend", "max_batch", "max_wait_us", "concurrency", "rps",
              "p50_ms", "p95_ms", "p99_ms", "mean_ms", "errors",
              "gpu_util_avg", "seconds", "error"]
    with open(args.out, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    print(f"\nwrote {args.out} ({len(rows)} rows)")

    ok_rows = [r for r in rows if "error" not in r]
    if ok_rows:
        best = max(ok_rows, key=lambda r: r["rps"])
        print("\nbest throughput config:")
        print(f"  {best['backend']} max_batch={best['max_batch']} "
              f"max_wait_us={best['max_wait_us']} concurrency={best['concurrency']} "
              f"-> {best['rps']} rps (p95={best['p95_ms']}ms)")


if __name__ == "__main__":
    main()
