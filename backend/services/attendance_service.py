from bs4 import BeautifulSoup
from utils.text import TextUtils

class AttendanceService:
    @staticmethod
    def parse_attendance(html_content):
        courses = []
        if not html_content: return courses
        soup = BeautifulSoup(html_content, 'html.parser')
        tables = soup.find_all('table')
        attn_table = None
        for table in tables:
            if "attn" in table.get_text().lower(): attn_table = table; break
        if attn_table:
            rows = attn_table.find_all('tr')[1:]
            for row in rows:
                cols = row.find_all('td')
                if len(cols) < 9: continue
                try:
                    category = TextUtils.clean(cols[2].get_text())
                    courses.append({
                        "code": cols[0].get_text(strip=True).split('Regular')[0],
                        "title": cols[1].get_text(strip=True),
                        "category": category,
                        "slot": cols[4].get_text(strip=True),
                        "conducted": int(cols[6].get_text(strip=True)),
                        "absent": int(cols[7].get_text(strip=True)),
                        "percent": float(cols[8].get_text(strip=True))
                    })
                except: pass
        return courses
