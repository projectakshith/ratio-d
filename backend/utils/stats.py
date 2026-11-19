from __future__ import annotations
import time
from typing import Any

class MetricsTracker:
    def __init__(self):
        self.start_time = time.time()
        self.total_requests = 0
        self.active_requests = 0
        self.unique_users: set[str] = set()
        self.status_counts: dict[int, int] = {}
        self.total_latency_ms = 0.0
        self.ocr_attempts = 0
        self.ocr_successes = 0

    def start_request(self):
        self.active_requests += 1

    def record_request(self, user_id: str, status_code: int, duration_ms: float):
        self.active_requests = max(0, self.active_requests - 1)
        self.total_requests += 1
        if user_id and user_id != "anon":
            self.unique_users.add(user_id)
        self.status_counts[status_code] = self.status_counts.get(status_code, 0) + 1
        self.total_latency_ms += duration_ms

    def record_ocr(self, success: bool):
        self.ocr_attempts += 1
        if success:
            self.ocr_successes += 1

    def get_summary(self) -> dict[str, Any]:
        uptime_seconds = int(time.time() - self.start_time)
        hours, remainder = divmod(uptime_seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        uptime_str = f"{hours}h {minutes}m {seconds}s" if hours else f"{minutes}m {seconds}s"

        avg_latency = (
            round(self.total_latency_ms / self.total_requests, 1)
            if self.total_requests > 0
            else 0.0
        )
        ocr_accuracy = (
            f"{(self.ocr_successes / self.ocr_attempts * 100):.1f}%"
            if self.ocr_attempts > 0
            else "N/A"
        )

        return {
            "status": "healthy",
            "uptime": uptime_str,
            "requests": {
                "total": self.total_requests,
                "active": self.active_requests,
                "status_codes": self.status_counts,
                "avg_latency_ms": avg_latency,
            },
            "users": {
                "unique_active": len(self.unique_users),
            },
            "ocr": {
                "attempts": self.ocr_attempts,
                "successes": self.ocr_successes,
                "accuracy": ocr_accuracy,
            },
        }

metrics = MetricsTracker()
