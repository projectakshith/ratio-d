import re
from bs4 import BeautifulSoup
from utils.text import TextUtils

class TimetableService:
    @staticmethod
    def parse_unified_grid(html_content, course_map):
        if not html_content: return {}
        soup = BeautifulSoup(html_content, 'html.parser')
        grid_table = None
        for table in soup.find_all('table'):
            txt = table.get_text().lower()
            if "day 1" in txt and "08:00" in txt:
                grid_table = table; break
        if not grid_table: return {}
        timetable = {}
        rows = grid_table.find_all('tr')
        time_headers = []
        if rows:
            header_cells = rows[0].find_all(['td', 'th'])
            for cell in header_cells:
                txt = TextUtils.clean(cell.get_text())
                if ":" in txt and "day" not in txt.lower():
                    time_headers.append(txt)
        if not time_headers: return {}
        for row in rows:
            cols = row.find_all('td')
            if not cols: continue
            day_text = TextUtils.clean(cols[0].get_text())
            day_match = re.search(r'Day\s*(\d+)', day_text, re.I)
            if not day_match: continue
            day_name = f"Day {day_match.group(1)}"
            timetable[day_name] = {}
            data_cells = cols[1:]
            for i, cell in enumerate(data_cells):
                if i >= len(time_headers): break
                raw_slot = TextUtils.clean(cell.get_text())
                slot_code = raw_slot.split('/')[0].strip()
                if not slot_code or slot_code == "-": continue
                if slot_code not in course_map: continue 
                details = course_map[slot_code]
                
                timetable[day_name][time_headers[i]] = {
                    "slot": slot_code,
                    "course": details['name'], 
                    "code": details['code'],
                    "type": details['type'],
                    "raw_type": details.get('raw_type'),
                    "room": details.get('room', 'TBA'),
                    "faculty": details.get('faculty', 'TBA'),
                    "time": time_headers[i]
                }
        return timetable

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
