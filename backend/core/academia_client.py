from urllib.parse import urljoin

from core.config import BASE_URL, URLS
from core.decoder import HTMLDecoder
from core.session import SessionHandler


class AcademiaClient:
    def __init__(self, username, password, cookies=None):
        self.username = username
        self.password = password
        self.session_handler = SessionHandler(cookies)

    async def authenticate(self):
        return await self.session_handler.login(self.username, self.password)

    async def get_page(self, url_key, suffix=""):
        full_url = urljoin(BASE_URL, URLS[url_key] + suffix)
        print(f"  -> [NETWORK] GET {URLS[url_key]}{suffix}", flush=True)
        response = await self.session_handler.client.get(full_url, follow_redirects=False)

        # Fix: Convert response.url to string for httpx compatibility
        if response.status_code in [301, 302] or "signin" in str(response.url):
            print(f"  -> [NETWORK] WARNING: Redirected to login. Session is dead.", flush=True)
            return None

        return HTMLDecoder.smart_extract(response.text)

    async def get_profile_html(self):
        return await self.get_page("profile")

    async def get_attendance_html(self):
        return await self.get_page("attendance")

    async def get_grid_html(self, batch):
        return await self.get_page("grid_base", f"_{batch}")

    async def get_planner_html(self):
        return await self.get_page("planner")
