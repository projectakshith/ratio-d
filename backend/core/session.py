import httpx
import json
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from core.config import BASE_URL, LOGIN_URL, HEADERS

class SessionHandler:
    def __init__(self, cookies=None):
        self.client = httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=30.0)
        if cookies:
            print("  -> [SESSION] Injected existing cookies from frontend.", flush=True)
            self.client.cookies.update(cookies)

    async def force_logout_sessions(self, html_content):
        print("  -> [SESSION] Parsing Concurrent Sessions Page...", flush=True)
        soup = BeautifulSoup(html_content, 'html.parser')
        forms = soup.find_all('form')
        terminate_form = None
        
        for form in forms:
            if "terminate" in form.get_text().lower() or form.find('input', {'value': 'Terminate All Sessions'}):
                terminate_form = form
                break
        if not terminate_form and forms:
            terminate_form = forms[0]

        if terminate_form:
            action_url = terminate_form.get('action')
            if not action_url.startswith('http'):
                action_url = urljoin(BASE_URL, action_url)
            
            data = {}
            for inp in terminate_form.find_all('input'):
                if inp.get('name'):
                    data[inp.get('name')] = inp.get('value', '')
            
            submit_btn = terminate_form.find('button') or terminate_form.find('input', type='submit')
            if submit_btn and submit_btn.get('name'):
                data[submit_btn.get('name')] = submit_btn.get('value', '')

            try:
                print("  -> [SESSION] Terminating ghost sessions...", flush=True)
                r = await self.client.post(action_url, data=data)
                if r.status_code == 200:
                    print("  -> [SESSION] Ghost sessions terminated successfully.", flush=True)
                    return True
            except:
                pass
        return False

    async def login(self, username, password, captcha=None, cdigest=None):
        print(f"  -> [SESSION] Executing hard login for {username}...", flush=True)
        self.client = httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=30.0)
        
        payload = {
            'username': username, 'password': password, 'client_portal': 'true',
            'portal': '10002227248', 'servicename': 'ZohoCreator',
            'serviceurl': 'https://academia.srmist.edu.in/', 'is_ajax': 'true',
            'grant_type': 'password', 'service_language': 'en'
        }
        
        if cdigest:
            payload['cdigest'] = cdigest
        if captcha:
            payload['captcha'] = captcha

        r = await self.client.post(LOGIN_URL, data=payload)
        
        if "concurrent" in r.text.lower():
            print("  -> [SESSION] Concurrent session limit reached!", flush=True)
            if await self.force_logout_sessions(r.text):
                print("  -> [SESSION] Retrying hard login...", flush=True)
                return await self.login(username, password, captcha, cdigest)  

        try:
            data = json.loads(r.text)
            
            if data.get('status') == 'fail':
                code = data.get('code')
                if code in ['HIP_REQUIRED', 'HIP_FAILED']:
                    cdig = data.get('cdigest')
                    msg = data.get('message', 'Captcha required')
                    if cdig:
                        print(f"  -> [SESSION] CAPTCHA required ({code}).", flush=True)
                        raise Exception(json.dumps({
                            "type": "CAPTCHA_REQUIRED",
                            "message": msg,
                            "cdigest": cdig,
                            "image": f"https://academia.srmist.edu.in/accounts/p/40-10002227248/webclient/v1/captcha/{cdig}?darkmode=false"
                        }))
                if 'error' in data:
                    raise Exception(data['error'].get('msg', 'Login failed'))

            if 'data' in data and 'access_token' in data['data']:
                token = data['data']['access_token']
                redirect_url = data['data']['oauthorize_uri']
                final_auth_url = f"{redirect_url}&access_token={token}"
                
                print("  -> [SESSION] Access Token received. Exchanging for JSESSIONID...", flush=True)
                r = await self.client.get(final_auth_url)
                
                if any(c.name == 'JSESSIONID' for c in self.client.cookies.jar):
                    print("  -> [SESSION] SUCCESS: New cookies established.", flush=True)
                    return True
                else:
                    print("  -> [SESSION] ERROR: JSESSIONID not found.", flush=True)
                    raise Exception("No JSESSIONID received")
            else:
                print("  -> [SESSION] ERROR: Invalid credentials.", flush=True)
                raise Exception("Invalid credentials")
        except Exception as e:
            raise e
