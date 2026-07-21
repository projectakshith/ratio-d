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
                        category = TextUtils.clean(cols[2].text())
                        conducted = 0
                        absent = 0
                        if len(cols) >= 9:
                            try:
                                conducted = int(cols[6].text(strip=True))
                                absent = int(cols[7].text(strip=True))
                            except ValueError:
                                pass
                        elif len(cols) >= 8:
                            try:
                                conducted = int(cols[5].text(strip=True))
                                absent = int(cols[6].text(strip=True))
                            except ValueError:
                                pass

                        percent = float(cols[-1].text(strip=True))
                        courses.append({
                            "code": code_text.replace("Regular", "").strip(),
                            "title": cols[1].text(strip=True),
                            "category": category,
                            "slot": cols[4].text(strip=True),
                            "conducted": conducted,
                            "absent": absent,
                            "percent": percent
                        })
                    except Exception:
                        pass
        return courses
