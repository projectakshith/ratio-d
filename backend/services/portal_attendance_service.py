import re
from bs4 import BeautifulSoup

class PortalAttendanceService:
    @staticmethod
    def parse(html_content):
        courses = []
        monthly = []
        if not html_content:
            return courses, monthly
        soup = BeautifulSoup(html_content, "lxml")
        tables = soup.find_all("table")
        for table in tables:
            rows = table.find_all("tr")
            for row in rows:
                cells = [c.get_text(strip=True) for c in row.find_all(["td", "th"])]
                if not cells:
                    continue
                if re.match(r"^[A-Z0-9]{6,12}$", cells[0]) and len(cells) >= 6:
                    code = cells[0]
                    try:
                        conducted = int(cells[2])
                        present = int(cells[3])
                        absent = int(cells[4])
                        percent = float(cells[5])
                    except ValueError:
                        continue
                    
                    courses.append({
                        "code": code,
                        "title": cells[1],
                        "category": "Theory",
                        "slot": "",
                        "conducted": conducted,
                        "absent": absent,
                        "present": present,
                        "percent": percent,
                        "isPortal": True,
                    })
                elif re.match(r"^[A-Za-z]{3}-\d{4}$", cells[0]) and len(cells) >= 3:
                    try:
                        monthly.append({
                            "month": cells[0],
                            "present": int(cells[1]),
                            "absent": int(cells[2]),
                        })
                    except ValueError:
                        pass
        courses.sort(key=lambda c: (c["percent"], c["conducted"]))
        return courses, monthly