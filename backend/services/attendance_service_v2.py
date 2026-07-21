import re
from selectolax.parser import HTMLParser
from utils.text import TextUtils

class AttendanceService:
    @staticmethod
    def parse_attendance(html_content):
        courses = []
        if not html_content:
            return courses
        parser = HTMLParser(html_content)
        rows = parser.css("tr")
        for row in rows:
            cols = row.css("td")
            if len(cols) >= 7:
                code_text = cols[0].text(strip=True)
                if re.match(r"^[A-Z0-9]{8,12}", code_text):
                    try:
                        conducted_val = 0
                        absent_val = 0
                        if len(cols) >= 8:
                            try:
                                conducted_val = int(cols[5].text(strip=True))
                                absent_val = int(cols[6].text(strip=True))
                            except ValueError:
                                pass
                        courses.append({
                            "code": code_text.replace("Regular", "").strip(),
                            "title": cols[1].text(strip=True),
                            "category": TextUtils.clean(cols[2].text()),
                            "slot": cols[4].text(strip=True),
                            "conducted": conducted_val,
                            "absent": absent_val,
                            "percent": float(cols[-1].text(strip=True) if len(cols) >= 7 else cols[6].text(strip=True))
                        })
                    except Exception:
                        pass
        return courses
