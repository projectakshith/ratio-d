import re
from selectolax.parser import HTMLParser

class PortalAttendanceService:
    @staticmethod
    def parse(html_content):
        courses = []
        monthly = []
        if not html_content:
            return courses, monthly
        
        parser = HTMLParser(html_content)
        for row in parser.css("table tr"):
            cells = [cell.text(strip=True) for cell in row.css("td, th")]
            if not cells:
                continue
            
            first_cell = cells[0]
            if re.match(r"^[A-Z0-9]{6,12}$", first_cell) and len(cells) >= 6:
                code = first_cell
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
            elif re.match(r"^[A-Za-z]{3}-\d{4}$", first_cell) and len(cells) >= 3:
                try:
                    monthly.append({
                        "month": first_cell,
                        "present": int(cells[1]),
                        "absent": int(cells[2]),
                    })
                except ValueError:
                    pass
                    
        courses.sort(key=lambda c: (c["percent"], c["conducted"]))
        return courses, monthly