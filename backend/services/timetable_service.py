import re
from bs4 import BeautifulSoup
from utils.text import TextUtils

class TimetableService:
    @staticmethod
    def parse_course_details(html_content):
        if not html_content: return {}
        soup = BeautifulSoup(html_content, 'html.parser')
        mapping = {}
        
        table = None
        for t in soup.find_all('table'):
            if "Course Code" in t.get_text():
                table = t; break
                
        if not table: return mapping

        all_cells = table.find_all('td')
        COL_COUNT = 11 
        
        start_index = 0
        for i, cell in enumerate(all_cells):
            txt = TextUtils.clean(cell.get_text())
            if txt == "1":
                if i+1 < len(all_cells):
                    next_txt = TextUtils.clean(all_cells[i+1].get_text())
                    if re.match(r'^\d+', next_txt) or len(next_txt) > 4: 
                        start_index = i; break
        
        current_idx = start_index
        count = 0
        
        while current_idx + 10 < len(all_cells):
            try:
                cols = all_cells[current_idx : current_idx + COL_COUNT]
                c_code = TextUtils.clean(cols[1].get_text())
                c_name = TextUtils.clean(cols[2].get_text())
                c_faculty = TextUtils.clean(cols[7].get_text())
                c_slot_raw = TextUtils.clean(cols[8].get_text())
                c_room = TextUtils.clean(cols[9].get_text())
                
                if not c_code or len(c_code) < 3: 
                    current_idx += COL_COUNT; continue

                if "Lab Based" in c_faculty: c_faculty = "Unknown"
                
                clean_slots = c_slot_raw.replace('-', ' ').replace('/', ' ').replace(',', ' ').split()
                
                for slot in clean_slots:
                    s = slot.strip()
                    if s:
                        mapping[s] = {"course": c_name, "faculty": c_faculty, "room": c_room}
                
                count += 1
                current_idx += COL_COUNT
            except IndexError: break
        return mapping

    @staticmethod
    def parse_unified_grid(html_content, course_mapping):
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

        for row in rows:
            cols = row.find_all('td')
            if not cols: continue
            day_name = TextUtils.clean(cols[0].get_text())
            if "day" not in day_name.lower() or "order" in day_name.lower(): continue
            
            timetable[day_name] = {}
            data_cells = cols[1:]
            
            for i, cell in enumerate(data_cells):
                if i >= len(time_headers): break
                raw_slot = TextUtils.clean(cell.get_text())
                slot_code = raw_slot.split('/')[0].strip()
                
                if not slot_code or slot_code == "-": continue
                if slot_code not in course_mapping: continue 
                
                details = course_mapping[slot_code]
                
                timetable[day_name][time_headers[i]] = {
                    "slot": slot_code,
                    "course": details['course'], 
                    "faculty": details['faculty'],
                    "room": details['room'],
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
                if len(cols) < 8: continue
                try:
                    courses.append({
                        "code": cols[0].get_text(strip=True).split('Regular')[0],
                        "title": cols[1].get_text(strip=True),
                        "slot": cols[4].get_text(strip=True),
                        "conducted": int(cols[6].get_text(strip=True)),
                        "absent": int(cols[7].get_text(strip=True)),
                        "percent": float(cols[8].get_text(strip=True))
                    })
                except: pass
        return courses