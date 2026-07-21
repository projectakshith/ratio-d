import httpx
import json
from urllib.parse import urljoin
from selectolax.parser import HTMLParser
from core.config import BASE_URL, LOGIN_URL, HEADERS

class SessionHandler:
    def __init__(self, cookies=None):
        self.client = httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=30.0)
        if cookies:
            print("  -> [SESSION] Injected existing cookies from frontend.", flush=True)
            self.client.cookies.update(cookies)

    async def force_logout_sessions(self, html_content):
        print("  -> [SESSION] Parsing Concurrent Sessions Page...", flush=True)
        parser = HTMLParser(html_content)
        forms = parser.css("form")
        terminate_form = None

        for form in forms:
            if "terminate" in form.text().lower() or form.css_first("input[value='Terminate All Sessions']"):
                terminate_form = form
                break
        if not terminate_form and forms:
            terminate_form = forms[0]

        if terminate_form:
            action_url = terminate_form.attributes.get("action", "")
            if not action_url.startswith("http"):
                action_url = urljoin(BASE_URL, action_url)

            data = {}
            for inp in terminate_form.css("input"):
                name = inp.attributes.get("name")
                if name:
                    data[name] = inp.attributes.get("value", "")

            submit_btn = terminate_form.css_first("button") or terminate_form.css_first("input[type='submit']")
            if submit_btn and "name" in submit_btn.attributes:
                data[submit_btn.attributes["name"]] = submit_btn.attributes.get("value", "")

            try:
                print("  -> [SESSION] Terminating ghost sessions...", flush=True)
                r = await self.client.post(action_url, data=data)
                if r.status_code == 200:
                    print("  -> [SESSION] Ghost sessions terminated successfully.", flush=True)
                    return True
            except Exception:
                pass
        return False

    async def login(self, username, password, captcha=None, cdigest=None):
        print(f"  -> [SESSION] Executing hard login for {username}...", flush=True)
        if hasattr(self, "client") and self.client:
            await self.client.aclose()
        self.client = httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=30.0)

        payload = {
            'username': username, 'password': password, 'client_portal': 'true',
            'portal': '10002227248', 'servicename': 'ZohoCreator',
            'serviceurl': 'https://academia.srmist.edu.in/', 'is_ajax': 'true',
            'grant_type': 'password', 'service_language': 'en'
        }

        if captcha and cdigest:
            payload['captcha'] = captcha
            payload['cdigest'] = cdigest

        r = await self.client.post(LOGIN_URL, data=payload)
        res_data = r.json()

        if "captcha" in res_data:
            c_info = res_data["captcha"]
            img_url = f"https://academia.srmist.edu.in/accounts/captcha/images/{c_info['digest']}"
            img_res = await self.client.get(img_url)
            import base64
            b64_img = base64.b64encode(img_res.content).decode('utf-8')
            raise Exception(json.dumps({
                "type": "CAPTCHA_REQUIRED",
                "cdigest": c_info['digest'],
                "image": f"data:image/jpeg;base64,{b64_img}",
                "message": "Security check required. Please enter CAPTCHA."
            }))

        if "error" in res_data or res_data.get("status") == "error" or res_data.get("STATUS") == "error":
            msg = res_data.get("message") or res_data.get("msg") or "Invalid Credentials"
            if "invalid" in msg.lower() or "password" in msg.lower():
                raise Exception(json.dumps({"type": "INVALID_CREDENTIALS", "message": msg}))
            raise Exception(msg)

        data_block = res_data.get("data") if isinstance(res_data.get("data"), dict) else {}
        token = res_data.get("token") or data_block.get("access_token") or data_block.get("token")

        if not token:
            print(f"  -> [SESSION] Zoho Login Error Payload: {res_data}", flush=True)
            msg = res_data.get("message") or res_data.get("msg") or res_data.get("error") or data_block.get("message") or "Invalid credentials or CAPTCHA required"
            if isinstance(msg, str) and ("invalid" in msg.lower() or "password" in msg.lower()):
                raise Exception(json.dumps({"type": "INVALID_CREDENTIALS", "message": msg}))
            raise Exception(f"No token returned from Zoho: {msg}")



        token_url = f"https://academia.srmist.edu.in/srm_university/academia-academic-services/page/My_Attendance?servicename=ZohoCreator&token={token}"
        portal_res = await self.client.get(token_url)

        if "concurrent" in portal_res.text.lower() and "terminate" in portal_res.text.lower():
            success = await self.force_logout_sessions(portal_res.text)
            if success:
                r_retry = await self.client.post(LOGIN_URL, data=payload)
                retry_data = r_retry.json()
                retry_block = retry_data.get("data") if isinstance(retry_data.get("data"), dict) else {}
                new_token = retry_data.get("token") or retry_block.get("access_token")
                if new_token:
                    t_url = f"https://academia.srmist.edu.in/srm_university/academia-academic-services/page/My_Attendance?servicename=ZohoCreator&token={new_token}"
                    await self.client.get(t_url)


        return True
