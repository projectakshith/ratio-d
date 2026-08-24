import base64
import time
import asyncio
import os
import json
import hmac
import hashlib
import secrets
import logging
from datetime import datetime
from contextlib import asynccontextmanager
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(timeout=10.0)
    yield
    await app.state.http_client.aclose()


# ── tinyocr captcha auto-solver ──────────────────────────────
TINYOCR_URL = os.getenv("TINYOCR_URL", "http://127.0.0.1:8080")
TINYOCR_API_KEY = os.getenv("TINYOCR_API_KEY", "")
MAX_OCR_ATTEMPTS = 4  # portal locks at 5 wrong captchas; keep 1 for manual

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
    """Send raw image bytes to TinyOCR /predict and return (ok, text_or_error, status_code)."""
    try:
        ocr = await _get_ocr_client()
        resp = await ocr.post(
            "/predict",
            content=image_bytes,
            headers={"content-type": "image/png"},
        )
        if resp.status_code == 200:
            data = resp.json()
            return True, data.get("text", ""), 200
        else:
            err_detail = ""
            try:
                err_detail = resp.json().get("error", resp.text)
            except Exception:
                err_detail = resp.text
            return False, f"TinyOCR error ({resp.status_code}): {err_detail}", resp.status_code
    except Exception as e:
        return False, f"TinyOCR request failed: {str(e)}", 503


async def solve_captcha_ocr(image_url: str) -> str | None:
    """Download captcha image from academia and send to TinyOCR /predict."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as dl:
            img_resp = await dl.get(image_url)
            if img_resp.status_code != 200:
                print(f"  -> [OCR] Failed to download captcha image (HTTP {img_resp.status_code})", flush=True)
                return None
            image_bytes = img_resp.content
        ok, text, _ = await solve_captcha_ocr_bytes(image_bytes)
        return text if ok else None
    except Exception as e:
        print(f"  -> [OCR] TinyOCR error: {e}", flush=True)
        return None


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

@app.post("/captcha/solve")
@limiter.limit("30/minute")
async def solve_captcha_endpoint(request: Request):
    """
    Debug and integration endpoint for TinyOCR captcha prediction.
    Accepts:
      - JSON: { "image": "data:image/png;base64,..." } or { "image_b64": "..." } or { "image_url": "..." }
      - Raw body: image bytes
    Returns:
      { "success": true, "text": "...", "image": "data:image/png;base64,..." }
    """
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
    print(f"[API] Incoming REFRESH request for: {creds.username}", flush=True)
    try:
        if not creds.cookies and not creds.password:
            raise HTTPException(status_code=401, detail={"type": "SESSION_EXPIRED"})

        client = AcademiaClient(creds.username, creds.password, creds.cookies)

        # ── captcha auto-solve for initial auth ──────────────
        captcha_val = creds.captcha
        cdigest_val = creds.cdigest
        ocr_attempts = 0

        if not creds.cookies and os.getenv("MOCK_ACADEMIA") != "true":
            while True:
                try:
                    await client.authenticate(captcha_val, cdigest_val)
                    break
                except Exception as auth_err:
                    err_str = str(auth_err)
                    try:
                        err_data = json.loads(err_str)
                    except Exception:
                        raise auth_err
                    if not isinstance(err_data, dict) or err_data.get("type") != "CAPTCHA_REQUIRED":
                        raise auth_err
                    if creds.captcha and ocr_attempts == 0:
                        raise auth_err

                    ocr_attempts += 1
                    new_cdigest = err_data.get("cdigest")
                    image_url = err_data.get("image")
                    print(f"  -> [OCR] Refresh captcha auto-solve attempt {ocr_attempts}/{MAX_OCR_ATTEMPTS}", flush=True)

                    if ocr_attempts > MAX_OCR_ATTEMPTS or not image_url:
                        err_data["ocr_exhausted"] = True
                        err_data["ocr_attempts"] = ocr_attempts - 1
                        raise Exception(json.dumps(err_data))

                    solved = await solve_captcha_ocr(image_url)
                    if solved is None:
                        err_data["ocr_exhausted"] = True
                        err_data["ocr_attempts"] = ocr_attempts
                        err_data["ocr_unavailable"] = True
                        raise Exception(json.dumps(err_data))

                    print(f"  -> [OCR] Predicted: '{solved}'", flush=True)
                    captcha_val = solved
                    cdigest_val = new_cdigest
                    client = AcademiaClient(creds.username, creds.password, None)
        # ── end captcha auto-solve ───────────────────────────

        if os.getenv("MOCK_ACADEMIA") == "true":
            from pathlib import Path
            att_html = (Path(__file__).parent / "tests" / "snapshots" / "attendance_good.html").read_text(encoding="utf-8")
            profile_html = (Path(__file__).parent / "tests" / "snapshots" / "profile_good.html").read_text(encoding="utf-8")
            g1_html = ""
            g2_html = ""
            session_dead = False
        else:
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
                reauth_captcha = captcha_val
                reauth_cdigest = cdigest_val
                reauth_ocr = 0
                reauth_done = False
                try:
                    while True:
                        try:
                            await client.authenticate(reauth_captcha, reauth_cdigest)
                            reauth_done = True
                            break
                        except Exception as auth_err:
                            err_str = str(auth_err)
                            try:
                                err_data = json.loads(err_str)
                            except Exception:
                                raise auth_err
                            if not isinstance(err_data, dict) or err_data.get("type") != "CAPTCHA_REQUIRED":
                                raise auth_err

                            reauth_ocr += 1
                            new_cdigest = err_data.get("cdigest")
                            image_url = err_data.get("image")
                            print(f"  -> [OCR] Re-auth captcha auto-solve attempt {reauth_ocr}/{MAX_OCR_ATTEMPTS}", flush=True)

                            if reauth_ocr > MAX_OCR_ATTEMPTS or not image_url:
                                print(f"  -> [OCR] Re-auth OCR exhausted after {reauth_ocr - 1} attempts", flush=True)
                                break

                            solved = await solve_captcha_ocr(image_url)
                            if solved is None:
                                print(f"  -> [OCR] TinyOCR unavailable during re-auth", flush=True)
                                break

                            print(f"  -> [OCR] Predicted: '{solved}'", flush=True)
                            reauth_captcha = solved
                            reauth_cdigest = new_cdigest
                            client = AcademiaClient(creds.username, creds.password, None)
                except Exception as e:
                    err_msg = str(e)
                    if "Invalid credentials" in err_msg or "check your username/password" in err_msg.lower():
                        raise HTTPException(status_code=401, detail="Invalid Credentials")
                    raise HTTPException(status_code=503, detail="Academia is temporarily unavailable. Try again.")

                if reauth_done:
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
            if os.getenv("MOCK_ACADEMIA") == "true":
                from pathlib import Path
                grid_html = (Path(__file__).parent / "tests" / "snapshots" / "grid_good.html").read_text(encoding="utf-8")
            else:
                grid_html = g1_html if actual_batch == "1" else g2_html
            if grid_html:
                schedule = TimetableService.parse_unified_grid(grid_html, courses)

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

        # ── captcha auto-solve loop ──────────────────────────
        captcha_val = creds.captcha
        cdigest_val = creds.cdigest
        ocr_attempts = 0
        max_attempts = (MAX_OCR_ATTEMPTS + 1) if creds.gamble else MAX_OCR_ATTEMPTS

        if not creds.cookies and os.getenv("MOCK_ACADEMIA") != "true":
            while True:
                try:
                    await client.authenticate(captcha_val, cdigest_val)
                    break  # authentication succeeded
                except Exception as auth_err:
                    err_str = str(auth_err)
                    try:
                        err_data = json.loads(err_str)
                    except Exception:
                        raise auth_err  # not a JSON/captcha error

                    if not isinstance(err_data, dict) or err_data.get("type") != "CAPTCHA_REQUIRED":
                        raise auth_err

                    if creds.captcha and ocr_attempts == 0:
                        raise auth_err

                    ocr_attempts += 1
                    new_cdigest = err_data.get("cdigest")
                    image_url = err_data.get("image")
                    print(f"  -> [OCR] Captcha required. Auto-solve attempt {ocr_attempts}/{max_attempts}", flush=True)

                    if ocr_attempts > max_attempts or not image_url:
                        err_data["ocr_exhausted"] = True
                        err_data["ocr_attempts"] = ocr_attempts - 1
                        raise Exception(json.dumps(err_data))

                    solved = await solve_captcha_ocr(image_url)
                    if solved is None:
                        err_data["ocr_exhausted"] = True
                        err_data["ocr_attempts"] = ocr_attempts
                        err_data["ocr_unavailable"] = True
                        raise Exception(json.dumps(err_data))

                    print(f"  -> [OCR] Predicted: '{solved}'", flush=True)
                    captcha_val = solved
                    cdigest_val = new_cdigest
                    client = AcademiaClient(creds.username, creds.password, None)
        # ── end captcha auto-solve loop ──────────────────────

        if os.getenv("MOCK_ACADEMIA") == "true":
            from pathlib import Path
            profile_html = (Path(__file__).parent / "tests" / "snapshots" / "profile_good.html").read_text(encoding="utf-8")
            att_html = (Path(__file__).parent / "tests" / "snapshots" / "attendance_good.html").read_text(encoding="utf-8")
            g1_html = ""
            g2_html = ""
        else:
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
                await client.authenticate(captcha_val, cdigest_val)
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
        
        if os.getenv("MOCK_ACADEMIA") == "true":
            grid_html = ""
        else:
            grid_html = g1_html if actual_batch == "1" else g2_html
        
        attendance = AttendanceService.parse_attendance(att_html)
        marks = MarksService.parse_test_performance(att_html)
        
        schedule = {}
        if grid_html:
            schedule = TimetableService.parse_unified_grid(grid_html, course_map)
            
        if os.getenv("MOCK_ACADEMIA") == "true":
            current_cookies = {"mock_cookie": "1234"}
        else:
            current_cookies = {c.name: c.value for c in client.session_handler.client.cookies.jar}

        if ocr_attempts > 0:
            print(f"[API] Login completed in {time.time() - start_total:.2f}s (captcha auto-solved after {ocr_attempts} attempt(s))", flush=True)
        else:
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
