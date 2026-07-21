import time
import asyncio
import os
import json
import hmac
import hashlib
from datetime import datetime
import httpx
import uvicorn
from core.academia_client import AcademiaClient
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from models.schemas import Credentials, LoginCredentials
from services.marks_service import MarksService
from services.profile_service import ProfileService
from services.course_service import CourseService
from services.attendance_service import AttendanceService


from services.timetable_service import TimetableService
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(timeout=10.0)
    yield
    await app.state.http_client.aclose()

def get_rate_limit_key(request: Request):
    return (
        request.headers.get("CF-Connecting-IP") or
        get_remote_address(request)
    )

limiter = Limiter(key_func=get_rate_limit_key)
app = FastAPI(lifespan=lifespan)
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "stop spamming blud"}
    )

_dev_origins = ["http://localhost:3000", "http://localhost:9002", "http://localhost:9001", "http://localhost:9000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://getratiod.lol",
        "https://www.getratiod.lol",
        *_dev_origins,
    ],
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
    max_age=86400,
)

HMAC_SECRET = os.getenv("HMAC_SECRET", "")

def verify_request(sig_header: str, body: bytes) -> bool:
    if not HMAC_SECRET:
        return True
    try:
        parts = dict(p.split("=", 1) for p in sig_header.split(","))
        timestamp = int(parts["t"])
        received = parts["v1"]
        if abs(time.time() - timestamp) > 300:
            return False
        body_hash = hashlib.sha256(body).hexdigest()
        message = f"{timestamp}.{body_hash}".encode()
        expected = hmac.new(HMAC_SECRET.encode(), message, hashlib.sha256).hexdigest()
        return hmac.compare_digest(received, expected)
    except Exception:
        return False

@app.middleware("http")
async def security_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)

    if os.getenv("ENV") == "development":
        return await call_next(request)

    if request.url.path == "/feedback":
        return await call_next(request)

    body = await request.body()

    async def receive():
        return {"type": "http.request", "body": body}

    request._receive = receive

    sig = request.headers.get("X-Ratio-Sig", "")
    if not verify_request(sig, body):
        return PlainTextResponse(status_code=403, content="forbidden")

    return await call_next(request)

def get_now():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3] + " IST"

@app.post("/feedback")
@limiter.limit("3/minute")
async def submit_feedback(request: Request):
    webhook_url = os.getenv("DISCORD_WEBHOOK", "")
    if not webhook_url:
        raise HTTPException(status_code=500, detail="not configured")
    body = await request.json()
    res = await request.app.state.http_client.post(webhook_url, json=body, timeout=8.0)
    if not res.is_success:
        raise HTTPException(status_code=502, detail="failed to deliver")
    return {"ok": True}

@app.get("/version")
async def get_version():
    return {"version": "2.0.0"}

@app.get("/pyq-proxy")
async def pyq_proxy(request: Request, path: str, q: str = None, limit: int = None, cursor: str = None):
    if not path.startswith("/"):
        raise HTTPException(status_code=400, detail="Invalid path parameter")
    target_base = "https://srm-pyq-api.onrender.com"
    target_url = f"{target_base}{path}"
    
    params = {}
    if q: params["q"] = q
    if limit: params["limit"] = limit
    if cursor: params["cursor"] = cursor

    try:
        response = await request.app.state.http_client.get(target_url, params=params, timeout=10.0)
        return JSONResponse(
            status_code=response.status_code,
            content=response.json()
        )
    except Exception as e:
        print(f"[API] PYQ Proxy Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch from PYQ API")


@app.post("/refresh")
@limiter.limit("3/minute")
async def refresh_data(creds: Credentials, request: Request):
    start_total = time.time()
    print(f"[API] Incoming REFRESH request for: ...{creds.username[-4:]}", flush=True)
    try:
        if not creds.cookies and not creds.password:
            raise HTTPException(status_code=401, detail={"type": "SESSION_EXPIRED"})

        client = AcademiaClient(creds.username, creds.password, creds.cookies)
        if not creds.cookies and os.getenv("MOCK_ACADEMIA") != "true":
            await client.authenticate(creds.captcha, creds.cdigest)

        if os.getenv("MOCK_ACADEMIA") == "true":
            from pathlib import Path
            att_html = (Path(__file__).parent / "tests" / "snapshots" / "attendance_good.html").read_text(encoding="utf-8")
            profile_html = (Path(__file__).parent / "tests" / "snapshots" / "profile_good.html").read_text(encoding="utf-8")
        else:
            res_att, res_prof = await asyncio.gather(
                client.get_attendance_html(),
                client.get_profile_html(),
                return_exceptions=True
            )
            att_html = res_att if isinstance(res_att, str) else None
            profile_html = res_prof if isinstance(res_prof, str) else None

            if (not att_html or att_html == "CONCURRENT_ERROR") and creds.password:
                print(f"{get_now()}\n  -> [AUTH] Session invalid or site glitch. Attempting re-auth...", flush=True)
                try:
                    await client.authenticate(creds.captcha, creds.cdigest)
                    res_att, res_prof = await asyncio.gather(
                        client.get_attendance_html(),
                        client.get_profile_html(),
                        return_exceptions=True
                    )
                    att_html = res_att if isinstance(res_att, str) else None
                    profile_html = res_prof if isinstance(res_prof, str) else None
                except Exception:
                    raise HTTPException(status_code=503, detail="Academia is temporarily unavailable. Try again.")

            if not att_html:
                if not creds.password:
                    raise HTTPException(status_code=401, detail={"type": "SESSION_EXPIRED"})
                print(f"{get_now()}\n  -> [AUTH] FAILED: Site returned no data after re-auth.", flush=True)
                raise HTTPException(status_code=503, detail="Academia returned no data. Site might be down.")

        attendance = AttendanceService.parse_attendance(att_html)
        marks = MarksService.parse_test_performance(att_html)
        profile = ProfileService.parse_student_profile(profile_html) if profile_html else None
        courses = CourseService.get_course_map(profile_html) if profile_html else None

        if os.getenv("MOCK_ACADEMIA") == "true":
            current_cookies = {"mock_cookie": "1234"}
        else:
            current_cookies = {c.name: c.value for c in client.session_handler.client.cookies.jar}
        print(f"[API] Refresh completed in {time.time() - start_total:.2f}s", flush=True)
        res_data = {
            "success": True,
            "attendance": attendance,
            "marks": marks,
            "cookies": current_cookies,
        }
        if profile:
            res_data["profile"] = profile
        if courses:
            res_data["courses"] = courses
        return res_data

    except (httpx.NetworkError, httpx.TimeoutException) as e:
        err_msg = str(e)
        print(f"{get_now()}\n  -> [API] NETWORK ERROR in /refresh: {err_msg}", flush=True)
        raise HTTPException(status_code=503, detail="Academia server is unreachable. Please try again later.")
    except HTTPException as e:
        raise e
    except Exception as e:
        err_msg = str(e)
        print(f"{get_now()}\n  -> [API] ERROR in /refresh: {err_msg}", flush=True)
        try:
            err_data = json.loads(err_msg)
            if isinstance(err_data, dict) and err_data.get("type") == "CAPTCHA_REQUIRED":
                raise HTTPException(status_code=401, detail=err_data)
        except Exception:
            pass
        raise HTTPException(status_code=500, detail="Something went wrong while fetching data.")

@app.post("/login")
@limiter.limit("5/minute")
async def login(creds: LoginCredentials, request: Request):
    start_total = time.time()
    print(f"[API] Incoming login request for: ...{creds.username[-4:]}", flush=True)
    try:
        client = AcademiaClient(creds.username, creds.password, creds.cookies)
        if not creds.cookies and os.getenv("MOCK_ACADEMIA") != "true":
            await client.authenticate(creds.captcha, creds.cdigest)
            
        if os.getenv("MOCK_ACADEMIA") == "true":
            from pathlib import Path
            profile_html = (Path(__file__).parent / "tests" / "snapshots" / "profile_good.html").read_text(encoding="utf-8")
        else:
            profile_html = await client.get_profile_html()
            if not profile_html or profile_html == "CONCURRENT_ERROR":
                print(f"{get_now()}\n  -> [AUTH] Re-authenticating...", flush=True)
                await client.authenticate(creds.captcha, creds.cdigest)
                profile_html = await client.get_profile_html()

            if not profile_html:
                print(f"{get_now()}\n  -> [ACADEMIA] INFO: Authenticated successfully, but profile page is not yet operational.", flush=True)
                raise HTTPException(status_code=503, detail="Academia is not fully operational yet.")

            
        profile = ProfileService.parse_student_profile(profile_html)
        course_map = CourseService.get_course_map(profile_html)
        
        raw_batch = str(profile.get("batch", "1")).strip()
        actual_batch = raw_batch.split("/")[-1].strip() if "/" in raw_batch else raw_batch
        profile["batch"] = actual_batch
        
        if actual_batch == "1":
            formatted_batch = "Batch_1"
        else:
            formatted_batch = "batch_2"
        
        if os.getenv("MOCK_ACADEMIA") == "true":
            from pathlib import Path
            att_html = (Path(__file__).parent / "tests" / "snapshots" / "attendance_good.html").read_text(encoding="utf-8")
            grid_html = ""
        else:
            att_html = await client.get_attendance_html()
            grid_html = await client.get_grid_html(formatted_batch)
        
        attendance = AttendanceService.parse_attendance(att_html)
        marks = MarksService.parse_test_performance(att_html)
        
        schedule = {}
        if grid_html:
            schedule = TimetableService.parse_unified_grid(grid_html, course_map)
            
        if os.getenv("MOCK_ACADEMIA") == "true":
            current_cookies = {"mock_cookie": "1234"}
        else:
            current_cookies = {c.name: c.value for c in client.session_handler.client.cookies.jar}
        print(f"[API] Login completed in {time.time() - start_total:.2f}s", flush=True)
        return {
            "success": True,
            "profile": profile,
            "attendance": attendance,
            "marks": marks,
            "schedule": schedule,
            "courses": course_map,
            "cookies": current_cookies,
        }
    except (httpx.NetworkError, httpx.TimeoutException) as e:
        err_msg = str(e)
        print(f"{get_now()}\n  -> [API] NETWORK ERROR in /login: {err_msg}", flush=True)
        raise HTTPException(status_code=503, detail="Academia server is unreachable. Please try again later.")
    except HTTPException as e:
        raise e
    except Exception as e:
        err_msg = str(e)
        print(f"{get_now()}\n  -> [API] ERROR in /login: {err_msg}", flush=True)
        try:
            err_data = json.loads(err_msg)
            if isinstance(err_data, dict) and err_data.get("type") == "CAPTCHA_REQUIRED":
                raise HTTPException(status_code=401, detail=err_data)
        except Exception:
            pass
        raise HTTPException(status_code=401, detail="Invalid Credentials")
