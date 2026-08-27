import base64
import json
import random
import re
import time

import httpx
import asyncio
from services.portal_marks_service import PortalMarksService

LOGIN_URL = "https://sp.srmist.edu.in/srmiststudentportal/students/loginManager/youLogin.jsp"
BASE_URL = "https://sp.srmist.edu.in/srmiststudentportal"
HRD_URL = BASE_URL + "/students/template/HRDSystem.jsp"
ATT_URL = BASE_URL + "/students/report/studentAttendanceDetails.jsp"
MARKS_URL = BASE_URL + "/students/report/studentInternalMarkDetails.jsp"
INNER_MARKS_URL = BASE_URL + "/students/report/studentInternalMarkDetailsInner.jsp"
LOGIN_SERVLET = BASE_URL + "/LoginServlet"
FP_TOKEN_URL = BASE_URL + "/fpToken"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    "Referer": "https://sp.srmist.edu.in/",
}

_shared_transport = httpx.AsyncHTTPTransport(
    retries=1,
    limits=httpx.Limits(max_keepalive_connections=50, max_connections=200)
)


def canvas_hash():
    seed = random.randint(0, 0x7FFFFFFF)
    return format(seed, "06x")


def telemetry_payload():
    now = int(time.time() * 1000)
    start = now - random.randint(3000, 8000)
    return {
        "startTime": start,
        "currentDomain": "sp.srmist.edu.in",
        "timezoneOffset": -330,
        "screenWidth": 1366,
        "screenHeight": 768,
        "colorDepth": 24,
        "devicePixelRatio": 1,
        "platform": "Linux x86_64",
        "userAgent": HEADERS["User-Agent"],
        "language": "en-US",
        "hardwareConcurrency": 8,
        "deviceMemory": 8,
        "touchSupport": False,
        "webdriver": False,
        "mouseClicks": random.randint(2, 6),
        "mouseMovements": random.randint(5, 20),
        "keystrokeCount": 0,
        "typingSpeedMs": 0,
        "canvasHash": canvas_hash(),
        "submitTime": now,
        "timeOnPageMs": now - start,
    }


class PortalSession:
    def __init__(self):
        self.client = httpx.AsyncClient(transport=_shared_transport, headers=HEADERS, follow_redirects=True, timeout=30.0)
        self.nonce = None
        self.login_form_fields = {}
        self.captcha_page = None
        self.exposed_captcha_text = None
        self.domain_field_name = None
        self.captcha_field_name = None
        self.random_delimiter = None
        self.load_ms = None

    async def load_captcha(self):
        r = await self.client.get(LOGIN_URL)
        text = r.text
        m = re.search(r"window\.SECURE_CONFIG\s*=\s*\{[^}]*?nonce\s*:\s*'([^']+)'", text)
        self.nonce = m.group(1) if m else None
        if not self.nonce:
            m = re.search(r"window\.SECURE_CONFIG\s*=\s*window\.SECURE_CONFIG\s*\|\|\s*\{\};\s*window\.SECURE_CONFIG\.nonce\s*=\s*'([^']+)'", text)
            self.nonce = m.group(1) if m else None
        if not self.nonce:
            m = re.search(r'id="fpNonce"\s*value="([^"]+)"', text)
            self.nonce = m.group(1) if m else None
        df = re.search(r'domainFieldName\s*=\s*[\'"]([^\'"]+)[\'"]', text)
        cf = re.search(r'captchaFieldName\s*=\s*[\'"]([^\'"]+)[\'"]', text)
        self.domain_field_name = df.group(1) if df else "dtoken_x"
        self.captcha_field_name = cf.group(1) if cf else "cptoken_x"
        m = re.search(r'"captchaText"\s*:\s*"([^"]+)"', text) or re.search(r"captchaText\s*=\s*'([^']+)'", text)
        self.exposed_captcha_text = m.group(1) if m else ""
        m = re.search(r"randomDelimiter\s*=\s*'([^']+)'", text)
        self.random_delimiter = m.group(1) if m else "0000"
        fields = {}
        for inp in re.finditer(r"<input[^>]*name=['\"]([^'\"]+)['\"][^>]*>", text):
            fields[inp.group(1)] = ""
        self.login_form_fields = fields
        m = re.search(r"SCaptchaServlet[^'\" ]*", text)
        captcha_url = None
        if m:
            seg = m.group(0)
            captcha_url = BASE_URL + "/" + seg if not seg.startswith("/") else "https://sp.srmist.edu.in" + seg
        img_b64 = None
        if captcha_url:
            proof = base64.b64encode(f"{self.nonce}:sp.srmist.edu.in".encode()).decode()
            cr = await self.client.get(captcha_url, headers={
                "X-Domain-Proof": proof,
                "Accept": "image/png, image/jpeg, image/svg+xml, image/*",
                "Referer": "https://sp.srmist.edu.in/srmiststudentportal/students/loginManager/youLogin.jsp",
            })
            if cr.status_code == 200:
                img_b64 = base64.b64encode(cr.content).decode()
                self.captcha_bytes = cr.content
        self.captcha_page = text
        self.load_ms = int(time.time() * 1000)
        return {
            "captcha_image": f"data:image/png;base64,{img_b64}" if img_b64 else None,
            "captcha_text_exposed": self.exposed_captcha_text,
            "captcha_required": True,
        }

    async def get_login_page(self):
        r = await self.client.get(LOGIN_URL)
        return r.text if r.status_code == 200 else None

    async def login(self, username, password, captcha, telemetry=None):
        if not self.captcha_page:
            await self.load_captcha()
        now_ms = int(time.time() * 1000)
        elapsed_sec = max(0, int((now_ms - (self.load_ms or now_ms)) / 1000))
        dtoken = base64.b64encode("sp.srmist.edu.in"[::-1].encode()).decode()
        trap_payload = str(elapsed_sec) + (self.random_delimiter or "0000") + "3"
        cptoken = base64.b64encode(trap_payload.encode()).decode()
        fp_payload = base64.b64encode(json.dumps(
            {"fp": "", "nonce": self.nonce, "ts": now_ms}).encode()).decode()
        payload = telemetry if telemetry else base64.b64encode(json.dumps(telemetry_payload()).encode()).decode()
        fp_body = dict(self.login_form_fields)
        fp_body.update({
            "username": username,
            "password": password,
            "captcha": captcha,
            "fpPayload": fp_payload,
            "fpToken": "",
            "recaptchaToken": "",
            "telemetryPayload": payload,
        })
        fp_body[self.domain_field_name] = dtoken
        fp_body[self.captcha_field_name] = cptoken
        resp = await self.client.post(LOGIN_SERVLET, data=fp_body)
        body = resp.text or ""
        if "logout.jsp" in resp.url.path or "attendance" in resp.url.path.lower():
            html = body
        else:
            html = await self.get_attendance_html()
        if html is None:
            reason = self.classify_failure(resp.url.path, body)
            return {"ok": False, "reason": reason}
        return {"ok": True, "cookies": {c.name: c.value for c in self.client.cookies.jar}}

    @staticmethod
    def classify_failure(path, body):
        blob = body.lower()
        if "invalid captcha" in blob or "enter valid captcha" in blob or "valid captcha" in blob:
            return "wrong_captcha"
        if "invalid username" in blob or "invalid password" in blob or "invalid credentials" in blob or "username or password" in blob:
            return "invalid_credentials"
        if "session" in blob and ("expire" in blob or "timeout" in blob):
            return "session_expired"
        return "login_failed"

    async def get_attendance_html(self):
        r = await self.client.get(ATT_URL)
        if r.status_code != 200 or "login_form" in r.text or "theGR8LoginLoader" in r.text:
            return None
        return r.text


    async def get_marks_html(self):
        try:
            r = await self.client.get(MARKS_URL)
            if r.status_code == 200 and "table" in r.text.lower():
                return r.text
        except Exception as e:
            print(f"  -> [PORTAL] Network error fetching marks: {e}", flush=True)
        return None

class PortalClient:
    def __init__(self, cookies=None):
        self.client = httpx.AsyncClient(transport=_shared_transport, headers=HEADERS, follow_redirects=True, timeout=30.0)
        if cookies:
            self.client.cookies.update(cookies)

    async def keepalive(self):
        try:
            await self.client.get(HRD_URL)
        except httpx.HTTPError:
            pass

    async def get_attendance_html(self):
        try:
            r = await self.client.get(ATT_URL)
            if r.status_code != 200 or "login_form" in r.text or "theGR8LoginLoader" in r.text:
                return None
            return r.text
        except Exception as e:
            print(f"  -> [PORTAL] Network error fetching attendance: {e}", flush=True)
            return None

    async def get_marks_html(self):
        try:
            r = await self.client.get(MARKS_URL)
            if r.status_code == 200 and "table" in r.text.lower():
                return r.text
        except Exception:
            pass
        return None

    async def get_marks_data(self):
        try:
            r = await self.client.get(MARKS_URL)
            if r.status_code != 200 or "table" not in r.text.lower():
                return []
            
            subjects = PortalMarksService.parse_main(r.text)
            if not subjects:
                return []

            async def fetch_inner(subj):
                if not subj.get("subjectId"):
                    return
                payload = {
                    "iden": "1",
                    "hdnSubjectId": subj["subjectId"],
                    "status": subj.get("status", "2")
                }
                try:
                    r_inner = await self.client.post(INNER_MARKS_URL, data=payload)
                    if r_inner.status_code == 200:
                        subj["assessments"] = PortalMarksService.parse_inner(r_inner.text)
                except Exception:
                    pass

            await asyncio.gather(*[fetch_inner(s) for s in subjects])

            for s in subjects:
                s.pop("subjectId", None)
                s.pop("status", None)

            return subjects
        except Exception as e:
            print(f"  -> [PORTAL] Error fetching marks data: {e}", flush=True)
            return []