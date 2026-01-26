import requests
import json
from urllib.parse import urljoin
from bs4 import BeautifulSoup

from core.config import BASE_URL, LOGIN_URL, URLS, HEADERS
from utils.cookies import CookieManager

class SessionHandler:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)

    def force_logout_sessions(self, html_content):
        print("[AUTO-FIX] Parsing Concurrent Sessions Page...")
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

            print(f"[AUTO-FIX] Sending Terminate Request to {action_url}...")
            try:
                r = self.session.post(action_url, data=data)
                if r.status_code == 200:
                    print("[AUTO-FIX] Sessions Terminated. Retrying Login...")
                    return True
            except Exception as e:
                print(f"[AUTO-FIX] Failed to terminate: {e}")
                
        return False

    def login(self, username, password):
        cached_cookies = CookieManager.load_cookies(username)
        if cached_cookies:
            print(f"[CACHE] Loading cookies for {username}...")
            self.session.cookies.update(cached_cookies)
            try:
                r = self.session.get(urljoin(BASE_URL, URLS["profile"]), allow_redirects=False)
                if r.status_code == 200 and "signin" not in r.url:
                    print("[CACHE] Cookies Valid.")
                    return True
            except:
                pass
            print("[CACHE] Cookies Invalid/Expired.")

        print(f"[LOGIN] Authenticating {username}...")
        # Reset session for fresh login
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        
        payload = {
            'username': username, 'password': password, 'client_portal': 'true',
            'portal': '10002227248', 'servicename': 'ZohoCreator',
            'serviceurl': 'https://academia.srmist.edu.in/', 'is_ajax': 'true',
            'grant_type': 'password', 'service_language': 'en'
        }

        r = self.session.post(LOGIN_URL, data=payload)
        
        if "concurrent" in r.text.lower():
            if self.force_logout_sessions(r.text):
                return self.login(username, password)  

        try:
            data = json.loads(r.text)
            if 'data' in data and 'access_token' in data['data']:
                token = data['data']['access_token']
                redirect_url = data['data']['oauthorize_uri']
                final_auth_url = f"{redirect_url}&access_token={token}"
                
                print(f"[LOGIN] Finalizing Auth...")
                self.session.get(final_auth_url)
                
                if 'JSESSIONID' in self.session.cookies:
                    CookieManager.save_cookies(username, self.session.cookies)
                    return True
                else:
                    raise Exception("No JSESSIONID cookie received.")
        except Exception as e:
            print(f"[LOGIN FAIL] {e}")
            raise e
        
        raise Exception("Login Failed (Unknown Response)")