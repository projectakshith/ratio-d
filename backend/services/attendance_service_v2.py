import re
from bs4 import BeautifulSoup
from utils.text import TextUtils

class AttendanceService:
    @staticmethod
    def parse_attendance(html_content):
        courses = []
        if not html_content: return courses
        soup = BeautifulSoup(html_content, 'lxml')
        rows = soup.find_all('tr')
        for row in rows:
            cols = row.find_all('td')
            if len(cols) >= 7:
                code_text = cols[0].get_text(strip=True)
                if re.match(r"^[A-Z0-9]{8,12}", code_text):
                    try:
                        courses.append({
                            "code": code_text.replace("Regular", "").strip(),
                            "title": cols[1].get_text(strip=True),
                            "category": TextUtils.clean(cols[2].get_text()),
                            "slot": cols[4].get_text(strip=True),
                            "conducted": 0,
                            "absent": 0,
                            "percent": float(cols[6].get_text(strip=True))
                        })
                    except: pass
        return courses
