from __future__ import annotations
import contextvars
import logging
import os
import re
import sys
from logging.handlers import RotatingFileHandler

user_id_ctx: contextvars.ContextVar[str] = contextvars.ContextVar("user_id", default="anon")
client_ip_ctx: contextvars.ContextVar[str] = contextvars.ContextVar("client_ip", default="-")
req_id_ctx: contextvars.ContextVar[str] = contextvars.ContextVar("req_id", default="-")

GRAY = "\033[90m"
CYAN = "\033[36m"
YELLOW = "\033[33m"
GREEN = "\033[32m"
RED = "\033[31m"
MAGENTA = "\033[35m"
BLUE = "\033[34m"
RESET = "\033[0m"

MODULE_COLORS = {
    "API": MAGENTA,
    "PORTAL": YELLOW,
    "OCR": BLUE,
    "AUTH": CYAN,
}

class ColoredCompactFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        record.user_id = getattr(record, "user_id", None) or user_id_ctx.get()
        t = self.formatTime(record, "%H:%M:%S")

        user_color = CYAN if record.user_id != "anon" else GRAY
        user_str = f"{user_color}{record.user_id:<8}{RESET}"

        mod_color = MODULE_COLORS.get(record.name, RESET)
        mod_str = f"{mod_color}{record.name:<6}{RESET}"

        msg = record.getMessage()
        if record.levelno >= logging.ERROR:
            msg = f"{RED}{msg}{RESET}"
        elif record.levelno >= logging.WARNING:
            msg = f"{YELLOW}{msg}{RESET}"
        else:
            if " 200" in msg or "successful" in msg.lower():
                msg = msg.replace(" 200", f" {GREEN}200{RESET}")
            elif " 401" in msg:
                msg = msg.replace(" 401", f" {YELLOW}401{RESET}")
            elif " 429" in msg:
                msg = msg.replace(" 429", f" {MAGENTA}429{RESET}")
            elif " 500" in msg or " 503" in msg:
                msg = msg.replace(" 500", f" {RED}500{RESET}").replace(" 503", f" {RED}503{RESET}")

        return f"{GRAY}{t}{RESET} | {user_str} | {mod_str} | {msg}"

class DetailedFileFormatter(logging.Formatter):
    ANSI_RE = re.compile(r"\033\[[0-9;]*m")

    def format(self, record: logging.LogRecord) -> str:
        record.user_id = getattr(record, "user_id", None) or user_id_ctx.get()
        record.ip = getattr(record, "ip", None) or client_ip_ctx.get()
        record.req_id = getattr(record, "req_id", None) or req_id_ctx.get()
        msg = super().format(record)
        return self.ANSI_RE.sub("", msg)

def setup_logging(log_level: int = logging.INFO):
    stdout_handler = logging.StreamHandler(sys.stdout)
    stdout_handler.setFormatter(ColoredCompactFormatter())

    logs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
    os.makedirs(logs_dir, exist_ok=True)
    log_file = os.path.join(logs_dir, "backend.log")

    file_fmt = "%(asctime)s | %(ip)-15s | %(req_id)-8s | %(user_id)-8s | %(name)-6s | %(message)s"
    file_handler = RotatingFileHandler(
        log_file, maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8"
    )
    file_handler.setFormatter(DetailedFileFormatter(file_fmt, datefmt="%Y-%m-%d %H:%M:%S"))

    root = logging.getLogger()
    root.setLevel(log_level)
    for h in list(root.handlers):
        root.removeHandler(h)
    root.addHandler(stdout_handler)
    root.addHandler(file_handler)

    for noisy in ("httpx", "httpcore", "watchfiles", "uvicorn", "uvicorn.error", "uvicorn.access"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

def set_request_context(user_id: str, client_ip: str = "-", req_id: str = "-"):
    user_id_ctx.set(user_id)
    client_ip_ctx.set(client_ip)
    req_id_ctx.set(req_id)

api_logger = logging.getLogger("API")
portal_logger = logging.getLogger("PORTAL")
ocr_logger = logging.getLogger("OCR")
auth_logger = logging.getLogger("AUTH")
