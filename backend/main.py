import time
import asyncio
import os
import json
import hmac
import hashlib
import secrets
import logging
from datetime import datetime
import httpx
import uvicorn

logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
from core.academia_client import AcademiaClient
from core.portal_client import PortalClient, PortalSession
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from models.schemas import Credentials, LoginCredentials, PortalCredentials
from services.marks_service import MarksService
from services.profile_service import ProfileService
from services.course_service import CourseService
from services.attendance_service import AttendanceService
from services.timetable_service import TimetableService
from services.portal_attendance_service import PortalAttendanceService
from services.portal_marks_service import PortalMarksService
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))

def get_rate_limit_key(request: Request):
    return (
        request.headers.get("CF-Connecting-IP") or
        get_remote_address(request)
    )

limiter = Limiter(key_func=get_rate_limit_key)
app = FastAPI()
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
        "https://api.getratiod.lol",
        *_dev_origins,
    ],
    allow_origin_regex=r"https://.*\.getratiod\.lol",
    allow_methods=["*"],
    allow_headers=["*"],
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
    async with httpx.AsyncClient() as client:
        res = await client.post(webhook_url, json=body, timeout=8.0)
    if not res.is_success:
        raise HTTPException(status_code=502, detail="failed to deliver")
    return {"ok": True}

@app.get("/version")
async def get_version():
    return {"version": "2.0.0"}

@app.get("/pyq-proxy")
async def pyq_proxy(path: str, q: str = None, limit: int = None, cursor: str = None):
    """
    Proxy requests to the SRM PYQ API to bypass CORS.
    Example: /pyq-proxy?path=/v1/courses/21CSE253T/papers
    """
    target_base = "https://srm-pyq-api.onrender.com"
    target_url = f"{target_base}{path}"
    
    params = {}
    if q: params["q"] = q
    if limit: params["limit"] = limit
    if cursor: params["cursor"] = cursor

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(target_url, params=params, timeout=10.0)
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
    print(f"[API] Incoming REFRESH request for: {creds.username}", flush=True)
    try:
        if not creds.cookies and not creds.password:
            raise HTTPException(status_code=401, detail={"type": "SESSION_EXPIRED"})

        client = AcademiaClient(creds.username, creds.password, creds.cookies)
        if not creds.cookies:
            await client.authenticate(creds.captcha, creds.cdigest)

        res_prof, res_g1, res_g2, res_att = await asyncio.gather(
            client.get_profile_html(),
            client.get_grid_html("Batch_1"),
            client.get_grid_html("batch_2"),
            client.get_attendance_html()
        )
        profile_html = res_prof if isinstance(res_prof, str) else None
        g1_html = res_g1 if isinstance(res_g1, str) else None
        g2_html = res_g2 if isinstance(res_g2, str) else None
        att_html = res_att if isinstance(res_att, str) else None

        session_dead = (profile_html is None or profile_html == "CONCURRENT_ERROR") and (att_html is None or att_html == "CONCURRENT_ERROR")

        if session_dead and creds.password:
            print(f"{get_now()}\n  -> [AUTH] Session invalid or site glitch. Attempting re-auth...", flush=True)
            try:
                await client.authenticate(creds.captcha, creds.cdigest)
                res_prof, res_g1, res_g2, res_att = await asyncio.gather(
                    client.get_profile_html(),
                    client.get_grid_html("Batch_1"),
                    client.get_grid_html("batch_2"),
                    client.get_attendance_html()
                )
                profile_html = res_prof if isinstance(res_prof, str) else None
                g1_html = res_g1 if isinstance(res_g1, str) else None
                g2_html = res_g2 if isinstance(res_g2, str) else None
                att_html = res_att if isinstance(res_att, str) else None
                session_dead = (profile_html is None or profile_html == "CONCURRENT_ERROR") and (att_html is None or att_html == "CONCURRENT_ERROR")
            except Exception as e:
                err_msg = str(e)
                if "Invalid credentials" in err_msg or "check your username/password" in err_msg.lower():
                    raise HTTPException(status_code=401, detail="Invalid Credentials")
                raise HTTPException(status_code=503, detail="Academia is temporarily unavailable. Try again.")

        if session_dead:
            if not creds.password:
                raise HTTPException(status_code=401, detail={"type": "SESSION_EXPIRED"})
            print(f"{get_now()}\n  -> [AUTH] FAILED: Site returned no data after re-auth.", flush=True)
            raise HTTPException(status_code=503, detail="Academia returned no data. Site might be down.")

        attendance = AttendanceService.parse_attendance(att_html)
        marks = MarksService.parse_test_performance(att_html)
        profile = ProfileService.parse_student_profile(profile_html) if profile_html else None
        courses = CourseService.get_course_map(profile_html) if profile_html else None

        schedule = None
        if profile and courses:
            raw_batch = str(profile.get("batch", "1")).strip()
            actual_batch = raw_batch.split("/")[-1].strip() if "/" in raw_batch else raw_batch
            profile["batch"] = actual_batch
            grid_html = g1_html if actual_batch == "1" else g2_html
            if grid_html:
                schedule = TimetableService.parse_unified_grid(grid_html, courses)

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
        if schedule:
            res_data["schedule"] = schedule
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
    print(f"[API] Incoming login request for: {creds.username}", flush=True)
    try:
        client = AcademiaClient(creds.username, creds.password, creds.cookies)
        if not creds.cookies:
            await client.authenticate(creds.captcha, creds.cdigest)
            
        res_prof, res_g1, res_g2, res_att = await asyncio.gather(
            client.get_profile_html(),
            client.get_grid_html("Batch_1"),
            client.get_grid_html("batch_2"),
            client.get_attendance_html()
        )
        profile_html = res_prof if isinstance(res_prof, str) else None
        g1_html = res_g1 if isinstance(res_g1, str) else None
        g2_html = res_g2 if isinstance(res_g2, str) else None
        att_html = res_att if isinstance(res_att, str) else None

        session_dead = (profile_html is None or profile_html == "CONCURRENT_ERROR")

        if session_dead:
            print(f"{get_now()}\n  -> [AUTH] Re-authenticating...", flush=True)
            await client.authenticate(creds.captcha, creds.cdigest)
            res_prof, res_g1, res_g2, res_att = await asyncio.gather(
                client.get_profile_html(),
                client.get_grid_html("Batch_1"),
                client.get_grid_html("batch_2"),
                client.get_attendance_html()
            )
            profile_html = res_prof if isinstance(res_prof, str) else None
            g1_html = res_g1 if isinstance(res_g1, str) else None
            g2_html = res_g2 if isinstance(res_g2, str) else None
            att_html = res_att if isinstance(res_att, str) else None

        if not profile_html:
            print(f"{get_now()}\n  -> [ACADEMIA] INFO: Authenticated successfully, but profile page is not yet operational.", flush=True)
            raise HTTPException(status_code=503, detail="Academia is not fully operational yet.")

        profile = ProfileService.parse_student_profile(profile_html)
        course_map = CourseService.get_course_map(profile_html)
        
        raw_batch = str(profile.get("batch", "1")).strip()
        actual_batch = raw_batch.split("/")[-1].strip() if "/" in raw_batch else raw_batch
        profile["batch"] = actual_batch
        
        grid_html = g1_html if actual_batch == "1" else g2_html
        
        attendance = AttendanceService.parse_attendance(att_html)
        marks = MarksService.parse_test_performance(att_html)
        
        schedule = {}
        if grid_html:
            schedule = TimetableService.parse_unified_grid(grid_html, course_map)
            
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


_portal_captcha_sessions = {}


@app.post("/portal/captcha")
@limiter.limit("5/minute")
async def portal_captcha(request: Request):
    session = PortalSession()
    try:
        info = await session.load_captcha()
    except Exception as e:
        print(f"{get_now()}\n  -> [API] ERROR loading portal captcha: {e}", flush=True)
        raise HTTPException(status_code=503, detail="Portal unavailable right now.")
    sid = secrets.token_hex(8)
    _portal_captcha_sessions[sid] = session
    if len(_portal_captcha_sessions) > 20:
        _portal_captcha_sessions.clear()
    return {"session": sid, **info}


@app.post("/portal/login")
@limiter.limit("8/minute")
async def portal_login(creds: PortalCredentials, request: Request):
    if creds.cookies:
        client = PortalClient(creds.cookies)
        att_html, marks_html = await asyncio.gather(
            client.get_attendance_html(),
            client.get_marks_html()
        )
        if att_html is None:
            raise HTTPException(status_code=401, detail={"type": "SESSION_EXPIRED"})
        courses, monthly = PortalAttendanceService.parse(att_html)
        marks = PortalMarksService.parse(marks_html) if marks_html else []
        res = {
            "success": True,
            "isPortal": True,
            "attendance": courses,
            "monthly": monthly,
            "cookies": {c.name: c.value for c in client.client.cookies.jar},
        }
        if marks:
            res["marks"] = marks
        return res

    session = _portal_captcha_sessions.pop(creds.cdigest, None) if creds.cdigest else None
    if not session:
        raise HTTPException(status_code=401, detail="captcha required")
    if not creds.captcha:
        _portal_captcha_sessions[creds.cdigest] = session
        raise HTTPException(status_code=401, detail="captcha required")

    try:
        netid = (creds.username or "").strip().split("@")[0]
        res = await session.login(netid, creds.password or "", creds.captcha, telemetry=creds.telemetry)
    except Exception as e:
        print(f"{get_now()}\n  -> [API] ERROR in /portal/login: {e}", flush=True)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not res.get("ok"):
        reason = res.get("reason", "login_failed")
        msg = {
            "wrong_captcha": "wrong captcha, try the new one",
            "invalid_credentials": "invalid credentials, check your netid/password",
            "session_expired": "session expired, refresh the captcha and retry",
        }.get(reason, "login failed")
        raise HTTPException(status_code=401, detail=msg)

    client = PortalClient(res["cookies"])
    att_html, marks_html = await asyncio.gather(
        client.get_attendance_html(),
        client.get_marks_html()
    )
    courses, monthly = PortalAttendanceService.parse(att_html) if att_html else ([], [])
    marks = PortalMarksService.parse(marks_html) if marks_html else []
    out = {
        "success": True,
        "isPortal": True,
        "attendance": courses,
        "monthly": monthly,
        "cookies": {c.name: c.value for c in client.client.cookies.jar},
    }
    if marks:
        out["marks"] = marks
    return out


@app.post("/portal/refresh")
@limiter.limit("8/minute")
async def portal_refresh(creds: PortalCredentials, request: Request):
    if not creds.cookies:
        raise HTTPException(status_code=401, detail={"type": "SESSION_EXPIRED"})
    client = PortalClient(creds.cookies)
    await client.keepalive()
    att_html, marks_html = await asyncio.gather(
        client.get_attendance_html(),
        client.get_marks_html()
    )
    if att_html is None:
        raise HTTPException(status_code=401, detail={"type": "SESSION_EXPIRED"})
    courses, monthly = PortalAttendanceService.parse(att_html)
    marks = PortalMarksService.parse(marks_html) if marks_html else []
    res = {
        "success": True,
        "isPortal": True,
        "attendance": courses,
        "monthly": monthly,
        "cookies": {c.name: c.value for c in client.client.cookies.jar},
    }
    if marks:
        res["marks"] = marks
    return res
