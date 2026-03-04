from urllib.parse import urljoin

from core.config import BASE_URL, URLS
from core.decoder import HTMLDecoder
from core.session import SessionHandler


class AcademiaClient:
    def __init__(self, username, password, cookies=None):
        self.username = username
        self.password = password
        self.session_handler = SessionHandler(cookies)

    def authenticate(self):
        return self.session_handler.login(self.username, self.password)

    def get_page(self, url_key, suffix=""):
        full_url = urljoin(BASE_URL, URLS[url_key] + suffix)
        print(f"  -> [NETWORK] GET {URLS[url_key]}{suffix}")
        response = self.session_handler.session.get(full_url, allow_redirects=False)

        if response.status_code in [301, 302] or "signin" in response.url:
            print(f"  -> [NETWORK] WARNING: Redirected to login. Session is dead.")
            return None

        return HTMLDecoder.smart_extract(response.text)

    def get_profile_html(self):
        return self.get_page("profile")

    def get_attendance_html(self):
        return self.get_page("attendance")

    def get_grid_html(self, batch):
        return self.get_page("grid_base", f"_{batch}")

    def get_planner_html(self):
        return self.get_page("planner")
