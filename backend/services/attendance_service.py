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
        for row in parser.css("tr"):
            cols = row.css("td")
            if len(cols) >= 9:
                code_text = cols[0].text(strip=True)
                if re.match(r"^[A-Z0-9]{8,12}", code_text):
                    try:
                        category = TextUtils.clean(cols[2].text())
                        courses.append({
                            "code": code_text.replace("Regular", "").strip(),
                            "title": cols[1].text(strip=True),
                            "category": category,
                            "slot": cols[4].text(strip=True),
                            "conducted": int(cols[6].text(strip=True)),
                            "absent": int(cols[7].text(strip=True)),
                            "percent": float(cols[8].text(strip=True))
                        })
                    except Exception:
                        pass
        return courses
