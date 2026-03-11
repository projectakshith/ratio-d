import re
from bs4 import BeautifulSoup
from utils.text import TextUtils

class AttendanceService:
    @staticmethod
    def parse_attendance(html_content):
        courses = []
        if not html_content: return courses
        soup = BeautifulSoup(html_content, 'html.parser')
        rows = soup.find_all('tr')
        for row in rows:
            cols = row.find_all('td')
            if len(cols) >= 9:
                code_text = cols[0].get_text(strip=True)
                if re.match(r"^[A-Z0-9]{8,12}", code_text):
                    try:
                        category = TextUtils.clean(cols[2].get_text())
                        courses.append({
                            "code": code_text.replace("Regular", "").strip(),
                            "title": cols[1].get_text(strip=True),
                            "category": category,
                            "slot": cols[4].get_text(strip=True),
                            "conducted": int(cols[6].get_text(strip=True)),
                            "absent": int(cols[7].get_text(strip=True)),
                            "percent": float(cols[8].get_text(strip=True))
                        })
                    except: pass
        return courses
