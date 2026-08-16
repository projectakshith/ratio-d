import re
from bs4 import BeautifulSoup

class PortalMarksService:
    @staticmethod
    def parse(html_content):
        marks_data = []
        if not html_content:
            return marks_data
        soup = BeautifulSoup(html_content, "lxml")
        tables = soup.find_all("table")
        for table in tables:
            rows = table.find_all("tr")
            for row in rows:
                cols = row.find_all("td")
                if len(cols) < 3:
                    continue
                code = cols[0].get_text(strip=True)
                if not re.match(r"^[A-Z0-9]{6,12}$", code):
                    continue
                title = cols[1].get_text(strip=True)
                score_str = cols[2].get_text(strip=True)
                
                got_val = None
                max_val = None
                if "/" in score_str:
                    parts = score_str.split("/")
                    try:
                        got_val = float(parts[0].strip())
                        max_val = float(parts[1].strip())
                    except ValueError:
                        pass
                
                marks_data.append({
                    "courseCode": code,
                    "type": "Internal",
                    "performance": score_str if got_val is not None else "N/A",
                    "assessments": [],
                    "totalMarkGot": got_val,
                    "totalMaxMarks": max_val,
                })
        return marks_data
