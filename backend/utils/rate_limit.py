import json
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

def extract_user_id(body: bytes) -> str | None:
    if not body:
        return None
    try:
        data = json.loads(body)
        if isinstance(data, dict):
            raw = data.get("username")
            if isinstance(raw, str) and raw.strip():
                return raw.split("@")[0].strip().lower()
    except Exception:
        pass
    return None

def get_rate_limit_key(request: Request) -> str:
    user = getattr(request.state, "user_id", None)
    if user and user != "anon":
        return f"usr:{user}"
    client_ip = request.headers.get("CF-Connecting-IP") or get_remote_address(request)
    return f"ip:{client_ip}"

limiter = Limiter(key_func=get_rate_limit_key)
