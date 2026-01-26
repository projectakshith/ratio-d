import json
import os
import requests
from core.config import SESSION_FILE

class CookieManager:
    @staticmethod
    def save_cookies(username, cookies):
        data = {}
        if os.path.exists(SESSION_FILE):
            try:
                with open(SESSION_FILE, 'r') as f:
                    data = json.load(f)
            except:
                pass
        data[username] = requests.utils.dict_from_cookiejar(cookies)
        with open(SESSION_FILE, 'w') as f:
            json.dump(data, f)
        print(f"[CACHE] Cookies saved for {username}")

    @staticmethod
    def load_cookies(username):
        if not os.path.exists(SESSION_FILE):
            return None
        try:
            with open(SESSION_FILE, 'r') as f:
                data = json.load(f)
                return data.get(username)
        except:
            return None