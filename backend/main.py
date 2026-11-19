import base64
import time
import asyncio
import os
import json
import hmac
import hashlib
import secrets
from contextlib import asynccontextmanager
import httpx
import uvicorn
from core.academia_client import AcademiaClient
from core.portal_client import PortalClient, PortalSession
from core.deduplicator import portal_flight, academia_flight
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from models.schemas import Credentials, LoginCredentials, PortalCredentials
from services.marks_service import MarksService
from services.profile_service import ProfileService
from services.course_service import CourseService
from services.attendance_service import AttendanceService
from services.timetable_service import TimetableService
from services.portal_attendance_service import PortalAttendanceService
from services.portal_marks_service import PortalMarksService
from services.portal_timetable_service import PortalTimetableService
from services.portal_profile_service import PortalProfileService
from dotenv import load_dotenv
from slowapi.errors import RateLimitExceeded
from utils.logging_config import (
    setup_logging,
    set_request_context,
    api_logger,
    portal_logger,
    ocr_logger,
    auth_logger,
)
from utils.rate_limit import limiter, extract_user_id
from utils.stats import metrics

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.local"))

setup_logging()

TINYOCR_URL = os.getenv("TINYOCR_URL", "http://127.0.0.1:8080")
TINYOCR_API_KEY = os.getenv("TINYOCR_API_KEY", "")
MAX_OCR_ATTEMPTS = 4

def print_banner(server_url: str, ocr_url: str):
    width = 38
    lines = [
        "ratio'd",
        f"server: {server_url}",
        f"ocr:    {ocr_url}",
        "",
        "endpoints:",
        "  /portal/refresh",
        "  /portal/login",
        "  /portal/captcha",
        "  /refresh",
        "  /login",
        "  /captcha/solve",
        "  /stats",
    ]
    border_top = f"\033[90m┌{'─' * (width + 4)}┐\033[0m"
    border_bot = f"\033[90m└{'─' * (width + 4)}┘\033[0m"
    print(border_top)
    for l in lines:
        if l == "ratio'd":
            pad = width - len(l)
            print(f"\033[90m│\033[0m  \033[36m{l}\033[0m{' ' * pad}  \033[90m│\033[0m")
        else:
            pad = width - len(l)
            print(f"\033[90m│\033[0m  {l}{' ' * pad}  \033[90m│\033[0m")
    print(border_bot)

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(timeout=10.0)
    server_url = f"http://{os.getenv('HOST', '127.0.0.1')}:{os.getenv('PORT', '8000')}"
    print_banner(server_url, TINYOCR_URL)
    yield
    await app.state.http_client.aclose()

_ocr_client: httpx.AsyncClient | None = None

async def _get_ocr_client() -> httpx.AsyncClient:
    global _ocr_client
    if _ocr_client is None or _ocr_client.is_closed:
        headers = {}
        if TINYOCR_API_KEY:
            headers["x-api-key"] = TINYOCR_API_KEY
        _ocr_client = httpx.AsyncClient(
            base_url=TINYOCR_URL, headers=headers, timeout=3.0
        )
    return _ocr_client

async def solve_captcha_ocr_bytes(image_bytes: bytes) -> tuple[bool, str, int]:
    try:
        ocr = await _get_ocr_client()
        resp = await ocr.post(
            "/predict",
            content=image_bytes,
            headers={"content-type": "image/png"},
        )
        if resp.status_code == 200:
            data = resp.json()
            metrics.record_ocr(True)
            return True, data.get("text", ""), 200
        else:
            metrics.record_ocr(False)
            err_detail = ""
            try:
                err_detail = resp.json().get("error", resp.text)
            except Exception:
                err_detail = resp.text
            return False, f"TinyOCR error ({resp.status_code}): {err_detail}", resp.status_code
    except Exception as e:
        return False, f"TinyOCR request failed: {str(e)}", 503

async def solve_captcha_ocr(image_url: str) -> str | None:
    try:
        async with httpx.AsyncClient(timeout=5.0) as dl:
            img_resp = await dl.get(image_url)
            if img_resp.status_code != 200:
                ocr_logger.warning(f"Failed to download captcha image (HTTP {img_resp.status_code})")
                return None
            image_bytes = img_resp.content
        ok, text, _ = await solve_captcha_ocr_bytes(image_bytes)
        return text if ok else None
    except Exception as e:
        ocr_logger.error(f"TinyOCR error: {e}")
        return None

_docs_enabled = os.getenv("ENV") == "development"
app = FastAPI(
    lifespan=lifespan,
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
    openapi_url="/openapi.json" if _docs_enabled else None,
)
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "stop spamming blud"}
    )

_dev_origins = ["http://localhost:3000", "http://localhost:3001", "http://localhost:9002", "http://localhost:9001", "http://localhost:9000"]

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

app.add_middleware(GZipMiddleware, minimum_size=1000)

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
async def context_and_security_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)

    req_id = secrets.token_hex(4)
    request.state.request_id = req_id

    body = await request.body()
    async def receive():
        return {"type": "http.request", "body": body}
    request._receive = receive

    user_id = extract_user_id(body) or "anon"
    request.state.user_id = user_id
    client_ip = request.headers.get("CF-Connecting-IP") or (request.client.host if request.client else "-")
    set_request_context(user_id, client_ip, req_id)

    if os.getenv("ENV") != "development" and request.url.path != "/feedback":
        sig = request.headers.get("X-Ratio-Sig", "")
        if not verify_request(sig, body):
            api_logger.warning(f"Forbidden request to {request.url.path}")
            return PlainTextResponse(status_code=403, content="forbidden")

    start = time.perf_counter()
    metrics.start_request()
    try:
        response = await call_next(request)
        duration_s = time.perf_counter() - start
        metrics.record_request(user_id, response.status_code, duration_s * 1000.0)
        api_logger.info(f"{request.method} {request.url.path} {response.status_code} ({duration_s:.1f}s)")
        response.headers["X-Request-ID"] = req_id
        return response
    except Exception as e:
        duration_s = time.perf_counter() - start
        metrics.record_request(user_id, 500, duration_s * 1000.0)
        api_logger.error(f"{request.method} {request.url.path} 500 error ({duration_s:.1f}s): {e}")
        raise

@app.get("/stats")
async def get_stats():
    return metrics.get_summary()

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

@app.post("/captcha/solve")
@limiter.limit("15/minute")
async def solve_captcha_endpoint(request: Request):
    image_bytes = None
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        try:
            body = await request.json()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON body")
        raw_img = body.get("image") or body.get("image_b64")
        img_url = body.get("image_url")

        if raw_img:
            if "," in raw_img:
                raw_img = raw_img.split(",", 1)[1]
            try:
                image_bytes = base64.b64decode(raw_img)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid base64 image: {e}")
        elif img_url:
            async with httpx.AsyncClient(timeout=5.0) as dl:
                img_resp = await dl.get(img_url)
                if img_resp.status_code != 200:
                    raise HTTPException(status_code=400, detail=f"Failed to fetch image from URL (HTTP {img_resp.status_code})")
                image_bytes = img_resp.content
    else:
        image_bytes = await request.body()

    if not image_bytes:
        raise HTTPException(status_code=400, detail="No image provided. Pass { image: 'data:image/png;base64,...' } or raw bytes.")

    ok, text, code = await solve_captcha_ocr_bytes(image_bytes)
    img_b64_out = f"data:image/png;base64,{base64.b64encode(image_bytes).decode()}"

    if not ok:
        return JSONResponse(
            status_code=code if code in [400, 413, 429, 503, 504] else 500,
            content={
                "success": False,
                "error": text,
                "image": img_b64_out,
                "text": ""
            }
        )

    return {
        "success": True,
        "text": text,
        "image": img_b64_out
    }

@app.get("/pyq-proxy")
async def pyq_proxy(course_code: str = ""):
    if not course_code:
        raise HTTPException(status_code=400, detail="Missing course_code")
    clean_code = course_code.strip().upper()
    url = f"https://api.clueless.am/search?query={clean_code}"
    async with httpx.AsyncClient(timeout=8.0) as client:
        try:
            res = await client.get(url)
            return JSONResponse(status_code=res.status_code, content=res.json())
        except Exception as e:
            api_logger.error(f"PYQ Proxy Error: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch from PYQ API")

async def _execute_academia_refresh(creds: Credentials):
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
            auth_logger.info("Session invalid, re-authenticating...")
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
            auth_logger.error("Site returned no data after re-auth")
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
        api_logger.error(f"Network error in /refresh: {err_msg}")
        raise HTTPException(status_code=503, detail="Academia server is unreachable. Please try again later.")
    except HTTPException as e:
        raise e
    except Exception as e:
        err_msg = str(e)
        api_logger.error(f"Error in /refresh: {err_msg}")
        try:
            err_data = json.loads(err_msg)
            if isinstance(err_data, dict) and err_data.get("type") == "CAPTCHA_REQUIRED":
                raise HTTPException(status_code=401, detail=err_data)
        except Exception:
            pass
        raise HTTPException(status_code=500, detail="Something went wrong while fetching data.")

@app.post("/refresh")
@limiter.limit("10/minute")
async def refresh_data(creds: Credentials, request: Request):
    if creds.username:
        key = f"academia:{creds.username.split('@')[0].strip().lower()}"
        return await academia_flight.execute(key, _execute_academia_refresh, creds)
    return await _execute_academia_refresh(creds)

@app.post("/login")
@limiter.limit("5/minute")
async def login(creds: LoginCredentials, request: Request):
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
            auth_logger.info("Re-authenticating...")
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
            api_logger.info("Authenticated successfully, profile not yet ready")
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
        api_logger.error(f"Network error in /login: {err_msg}")
        raise HTTPException(status_code=503, detail="Academia server is unreachable. Please try again later.")
    except HTTPException as e:
        raise e
    except Exception as e:
        err_msg = str(e)
        api_logger.error(f"Error in /login: {err_msg}")
        try:
            err_data = json.loads(err_msg)
            if isinstance(err_data, dict) and err_data.get("type") == "CAPTCHA_REQUIRED":
                raise HTTPException(status_code=401, detail=err_data)
        except Exception:
            pass
        raise HTTPException(status_code=401, detail="Invalid Credentials")

_portal_captcha_sessions = {}

@app.post("/portal/captcha")
@limiter.limit("15/minute")
async def portal_captcha(request: Request):
    session = PortalSession()
    try:
        info = await session.load_captcha()
    except Exception as e:
        portal_logger.error(f"Error loading captcha: {e}")
        raise HTTPException(status_code=503, detail="Portal unavailable right now.")
    sid = secrets.token_hex(8)
    _portal_captcha_sessions[sid] = session
    if len(_portal_captcha_sessions) > 50:
        keys_to_remove = list(_portal_captcha_sessions.keys())[:15]
        for k in keys_to_remove:
            old_sess = _portal_captcha_sessions.pop(k, None)
            if old_sess and hasattr(old_sess, "client"):
                try:
                    asyncio.create_task(old_sess.client.aclose())
                except Exception:
                    pass
    return {
        "session": sid,
        "cdigest": sid,
        "image": info.get("captcha_image"),
        "captcha_image": info.get("captcha_image"),
        **info
    }

@app.post("/portal/login")
@limiter.limit("5/minute")
async def portal_login(creds: PortalCredentials, request: Request):
    if creds.cookies:
        client = PortalClient(creds.cookies)
        results = await asyncio.gather(
            client.get_attendance_html(),
            client.get_marks_data(),
            client.get_timetable_html(),
            client.get_profile_html(),
            return_exceptions=True
        )
        att_html = results[0] if not isinstance(results[0], Exception) else None
        marks = results[1] if not isinstance(results[1], Exception) else []
        tt_html = results[2] if not isinstance(results[2], Exception) else None
        prof_html = results[3] if not isinstance(results[3], Exception) else None

        if att_html is None:
            raise HTTPException(status_code=401, detail={"type": "SESSION_EXPIRED"})
        courses, monthly = await asyncio.to_thread(PortalAttendanceService.parse, att_html)
        schedule, course_map = PortalTimetableService.parse(tt_html) if tt_html else ({}, {})
        profile = PortalProfileService.parse(prof_html) if prof_html else None
        res = {
            "success": True,
            "isPortal": True,
            "attendance": courses,
            "monthly": monthly,
            "cookies": {c.name: c.value for c in client.client.cookies.jar},
        }
        if marks:
            res["marks"] = marks
        if schedule:
            res["schedule"] = schedule
        if course_map:
            res["courses"] = course_map
        if profile:
            res["profile"] = profile
        return res

    session = _portal_captcha_sessions.pop(creds.cdigest, None) if creds.cdigest else None
    if not session:
        session = PortalSession()
        try:
            await session.load_captcha()
        except Exception:
            raise HTTPException(status_code=503, detail="Portal unavailable right now.")

    netid = (creds.username or "").strip().split("@")[0]
    password = creds.password or ""
    captcha_val = creds.captcha
    ocr_attempts = 0
    login_res = None

    if not captcha_val:
        while ocr_attempts < 4:
            ocr_attempts += 1
            try:
                if not hasattr(session, "captcha_bytes") or not session.captcha_bytes:
                    await session.load_captcha()
                ok, solved, _ = await solve_captcha_ocr_bytes(session.captcha_bytes)
                if not ok or not solved:
                    ocr_logger.warning("OCR failed to predict captcha")
                    break
                ocr_logger.info(f"predicted: '{solved}'")
                res = await session.login(netid, password, solved, telemetry=creds.telemetry)
                if res.get("ok"):
                    portal_logger.info(f"Login successful ('{solved}')")
                    captcha_val = solved
                    login_res = res
                    break
                
                if res.get("reason") in ["invalid_credentials", "account_locked"]:
                    portal_logger.warning(f"Login failed: {res.get('message')}")
                    login_res = res
                    break
                elif res.get("reason") == "wrong_captcha":
                    ocr_logger.warning(f"Attempt {ocr_attempts}/4 wrong captcha ('{solved}')")
                    session = PortalSession()
                    await session.load_captcha()
                else:
                    login_res = res
                    break
            except (httpx.HTTPError, httpx.RequestError) as e:
                portal_logger.error(f"Portal connection error: {e}")
                raise HTTPException(status_code=503, detail="Student Portal is unreachable or timing out. Please try again later.")
            except Exception as e:
                portal_logger.error(f"Portal login error: {e}")
                break

    if not login_res and captcha_val:
        try:
            login_res = await session.login(netid, password, captcha_val, telemetry=creds.telemetry)
        except (httpx.ConnectTimeout, httpx.ConnectError, httpx.ReadTimeout, httpx.ReadError) as e:
            portal_logger.error(f"Connection error in /portal/login: {e}")
            raise HTTPException(status_code=503, detail="Student Portal is unreachable or timing out. Please try again later.")
        except Exception as e:
            portal_logger.error(f"Error in /portal/login: {e}")
            raise HTTPException(status_code=401, detail={"type": "INVALID_CREDENTIALS", "message": "Invalid credentials"})

    if not login_res or not login_res.get("ok"):
        reason = login_res.get("reason", "wrong_captcha") if login_res else "wrong_captcha"
        msg = login_res.get("message") if login_res else None

        fresh_session = PortalSession()
        fresh_info = {}
        try:
            fresh_info = await fresh_session.load_captcha()
        except Exception:
            pass
        new_sid = secrets.token_hex(8)
        _portal_captcha_sessions[new_sid] = fresh_session

        if reason == "wrong_captcha":
            raise HTTPException(status_code=401, detail={
                "type": "WRONG_CAPTCHA",
                "message": msg or "Invalid captcha. Please enter the new one.",
                "cdigest": new_sid,
                "image": fresh_info.get("captcha_image"),
                "captcha_image": fresh_info.get("captcha_image")
            })
        elif reason == "account_locked":
            raise HTTPException(status_code=401, detail={
                "type": "ACCOUNT_LOCKED",
                "message": msg or "Your Student Portal account has been locked due to too many failed attempts.",
            })
        elif reason == "invalid_credentials":
            raise HTTPException(status_code=401, detail={
                "type": "INVALID_CREDENTIALS",
                "message": msg or "Invalid login credentials. Make sure you are using your Student Portal password!",
                "cdigest": new_sid,
                "image": fresh_info.get("captcha_image"),
                "captcha_image": fresh_info.get("captcha_image")
            })
        else:
            raise HTTPException(status_code=401, detail={
                "type": reason.upper(),
                "message": msg or "Login failed.",
                "cdigest": new_sid,
                "image": fresh_info.get("captcha_image"),
                "captcha_image": fresh_info.get("captcha_image")
            })

    client = PortalClient(login_res["cookies"])
    try:
        results = await asyncio.gather(
            client.get_attendance_html(),
            client.get_marks_data(),
            client.get_timetable_html(),
            client.get_profile_html(),
            return_exceptions=True
        )
        att_html = results[0] if not isinstance(results[0], Exception) else None
        marks = results[1] if not isinstance(results[1], Exception) else []
        tt_html = results[2] if not isinstance(results[2], Exception) else None
        prof_html = results[3] if not isinstance(results[3], Exception) else None
    except Exception as e:
        portal_logger.error(f"Error fetching details after login: {e}")
        att_html, marks, tt_html, prof_html = None, [], None, None
    courses, monthly = await asyncio.to_thread(PortalAttendanceService.parse, att_html) if att_html else ([], [])
    if courses and marks:
        mark_codes = {m.get("courseCode", "").strip().lower() for m in marks}
        for c in courses:
            c_code = c.get("code", "").strip()
            if c_code.lower() not in mark_codes:
                marks.append({
                    "courseCode": c_code,
                    "title": c.get("title", ""),
                    "type": "Internal",
                    "performance": "N/A",
                    "assessments": [],
                    "totalMarkGot": None,
                    "totalMaxMarks": None
                })
    schedule, course_map = PortalTimetableService.parse(tt_html) if tt_html else ({}, {})
    profile = PortalProfileService.parse(prof_html) if prof_html else None
    out = {
        "success": True,
        "isPortal": True,
        "attendance": courses,
        "monthly": monthly,
        "cookies": {c.name: c.value for c in client.client.cookies.jar},
    }
    if marks:
        out["marks"] = marks
    if schedule:
        out["schedule"] = schedule
    if course_map:
        out["courses"] = course_map
    if profile:
        out["profile"] = profile
    return out

async def _execute_portal_refresh(creds: PortalCredentials):
    if not creds.cookies and not (creds.username and creds.password):
        raise HTTPException(status_code=401, detail={"type": "SESSION_EXPIRED"})
    client = PortalClient(creds.cookies)
    att_html, marks, tt_html = None, [], None
    if creds.cookies:
        results = await asyncio.gather(
            client.get_attendance_html(),
            client.get_marks_data(),
            client.get_timetable_html(),
            return_exceptions=True
        )
        att_html = results[0] if not isinstance(results[0], Exception) else None
        marks = results[1] if not isinstance(results[1], Exception) else []
        tt_html = results[2] if not isinstance(results[2], Exception) else None
    if att_html is None:
        if creds.username and creds.password:
            portal_logger.info("Session expired, re-authenticating...")
            netid = (creds.username or "").strip().split("@")[0]
            password = creds.password or ""
            ocr_attempts = 0
            reauth_success = False

            while ocr_attempts < 4:
                ocr_attempts += 1
                session = PortalSession()
                try:
                    await session.load_captcha()
                    ok, solved, _ = await solve_captcha_ocr_bytes(session.captcha_bytes)
                    if not ok or not solved:
                        await session.client.aclose()
                        break
                    ocr_logger.info(f"predicted: '{solved}'")
                    res = await session.login(netid, password, solved)
                    if res.get("ok"):
                        portal_logger.info(f"Re-auth successful ('{solved}')")
                        reauth_success = True
                        client = PortalClient(res["cookies"])
                        results = await asyncio.gather(
                            client.get_attendance_html(),
                            client.get_marks_data(),
                            client.get_timetable_html(),
                            return_exceptions=True
                        )
                        att_html = results[0] if not isinstance(results[0], Exception) else None
                        marks = results[1] if not isinstance(results[1], Exception) else []
                        tt_html = results[2] if not isinstance(results[2], Exception) else None
                        await session.client.aclose()
                        break
                    elif res.get("reason") in ["invalid_credentials", "account_locked"]:
                        portal_logger.warning(f"Re-auth aborted: {res.get('message')}")
                        await session.client.aclose()
                        break
                    else:
                        ocr_logger.warning(f"Re-auth attempt {ocr_attempts}/4 wrong captcha ('{solved}')")
                        await session.client.aclose()
                except (httpx.ConnectError, httpx.ConnectTimeout, httpx.NetworkError, httpx.RemoteProtocolError) as e:
                    portal_logger.warning(f"Connection dropped ({e}), retrying attempt...")
                    try:
                        await session.client.aclose()
                    except Exception:
                        pass
                    await asyncio.sleep(0.3)
                    continue
                except Exception as e:
                    portal_logger.error(f"Re-auth error: {e}")
                    try:
                        await session.client.aclose()
                    except Exception:
                        pass

            if not reauth_success:
                portal_logger.error("Re-auth failed after 4 attempts")

    if att_html is None:
        raise HTTPException(status_code=401, detail={"type": "SESSION_EXPIRED"})
    courses, monthly = await asyncio.to_thread(PortalAttendanceService.parse, att_html)
    schedule, course_map = PortalTimetableService.parse(tt_html) if tt_html else ({}, {})
    if courses and marks:
        mark_codes = {m.get("courseCode", "").strip().lower() for m in marks}
        for c in courses:
            c_code = c.get("code", "").strip()
            if c_code.lower() not in mark_codes:
                marks.append({
                    "courseCode": c_code,
                    "title": c.get("title", ""),
                    "type": "Internal",
                    "performance": "N/A",
                    "assessments": [],
                    "totalMarkGot": None,
                    "totalMaxMarks": None
                })
    res = {
        "success": True,
        "isPortal": True,
        "attendance": courses,
        "monthly": monthly,
        "cookies": {c.name: c.value for c in client.client.cookies.jar},
    }
    if marks:
        res["marks"] = marks
    if schedule:
        res["schedule"] = schedule
    if course_map:
        res["courses"] = course_map
    return res

@app.post("/portal/refresh")
@limiter.limit("15/minute")
async def portal_refresh(creds: PortalCredentials, request: Request):
    if creds.username:
        key = f"portal:{creds.username.split('@')[0].strip().lower()}"
        return await portal_flight.execute(key, _execute_portal_refresh, creds)
    return await _execute_portal_refresh(creds)

_announcements_history = {
    "latest": {"id": None, "text": "", "image_url": None, "files": [], "created_at": None},
    "history": [],
    "last_fetched": 0
}

@app.get("/api/announcements")
async def get_announcements():
    now = time.time()
    if now - _announcements_history["last_fetched"] < 30 and _announcements_history["latest"]["id"] is not None:
        return _announcements_history

    bot_token = os.getenv("DISCORD_BOT_TOKEN", "")
    channel_id = os.getenv("DISCORD_CHANNEL_ID", "")
    if not bot_token or not channel_id:
        return _announcements_history

    headers = {"Authorization": f"Bot {bot_token}"}
    url = f"https://discord.com/api/v10/channels/{channel_id}/messages?limit=10"
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(url, headers=headers, timeout=5.0)
            if res.status_code == 200:
                msgs = res.json()
                if msgs and isinstance(msgs, list) and len(msgs) > 0:
                    history = []
                    for msg in msgs:
                        content = msg.get("content", "")
                        attachments = msg.get("attachments", [])
                        image_url = None
                        files = []
                        for att in attachments:
                            att_url = att.get("url", "")
                            content_type = att.get("content_type", "")
                            if content_type and "image" in content_type:
                                image_url = att_url
                            else:
                                files.append({"name": att.get("filename", "file"), "url": att_url})
                        history.append({
                            "id": msg.get("id"),
                            "text": content,
                            "image_url": image_url,
                            "files": files,
                            "created_at": msg.get("timestamp")
                        })
                    _announcements_history["latest"] = history[0]
                    _announcements_history["history"] = history
                    _announcements_history["last_fetched"] = now
    except Exception:
        pass

    return _announcements_history
