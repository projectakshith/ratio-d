import requests
import json
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from core.config import BASE_URL, LOGIN_URL, HEADERS

class SessionHandler:
    def __init__(self, cookies=None):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        if cookies:
            print("  -> [SESSION] Injected existing cookies from frontend.")
            self.session.cookies.update(cookies)

    def force_logout_sessions(self, html_content):
        print("  -> [SESSION] Parsing Concurrent Sessions Page...")
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
                print("  -> [SESSION] Terminating ghost sessions...")
                r = self.session.post(action_url, data=data)
                if r.status_code == 200:
                    print("  -> [SESSION] Ghost sessions terminated successfully.")
                    return True
            except:
                pass
        return False

    def login(self, username, password):
        print(f"  -> [SESSION] Executing hard login for {username}...")
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
            print("  -> [SESSION] Concurrent session limit reached!")
            if self.force_logout_sessions(r.text):
                print("  -> [SESSION] Retrying hard login...")
                return self.login(username, password)  

        try:
            data = json.loads(r.text)
            if 'data' in data and 'access_token' in data['data']:
                token = data['data']['access_token']
                redirect_url = data['data']['oauthorize_uri']
                final_auth_url = f"{redirect_url}&access_token={token}"
                
                print("  -> [SESSION] Access Token received. Exchanging for JSESSIONID...")
                self.session.get(final_auth_url)
                
                if 'JSESSIONID' in self.session.cookies:
                    print("  -> [SESSION] SUCCESS: New cookies established.")
                    return True
                else:
                    print("  -> [SESSION] ERROR: JSESSIONID not found.")
                    raise Exception("No JSESSIONID received")
            else:
                print("  -> [SESSION] ERROR: Invalid credentials.")
                raise Exception("Invalid credentials")
        except Exception as e:
            raise e