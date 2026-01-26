from urllib.parse import urljoin
from core.config import BASE_URL, URLS
from core.session import SessionHandler
from core.decoder import HTMLDecoder

class AcademiaClient:
    def __init__(self, username, password):
        self.username = username
        self.password = password
        self.session_handler = SessionHandler()

    def authenticate(self):
        return self.session_handler.login(self.username, self.password)

    def get_page(self, url_key, suffix=""):
        full_url = urljoin(BASE_URL, URLS[url_key] + suffix)
        response = self.session_handler.session.get(full_url)
        return HTMLDecoder.smart_extract(response.text)

    def get_profile_html(self):
        html = self.get_page("profile")
        if html == "CONCURRENT_ERROR":
             print("[WARN] Session issue detected during fetch. Re-authenticating...")
             self.authenticate()
             html = self.get_page("profile")
        return html

    def get_attendance_html(self):
        return self.get_page("attendance")

    def get_grid_html(self, batch):
        html = self.get_page("grid_base", f"_Batch_{batch}")
        if not html or "No Data" in html:
            html = self.get_page("grid_base", f"_batch_{batch}")
        return html

    def get_planner_html(self):
        return self.get_page("planner")