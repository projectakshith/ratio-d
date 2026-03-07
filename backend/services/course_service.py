import re
from bs4 import BeautifulSoup
from utils.text import TextUtils

class CourseService:
    @staticmethod
    def get_course_map(html_content):
        if not html_content: return {}
        soup = BeautifulSoup(html_content, 'html.parser')
        course_map = {}
        table = None
        for t in soup.find_all('table'):
            if "Course Code" in t.get_text():
                table = t; break
        if not table: return {}
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
        while current_idx + 10 < len(all_cells):
            try:
                cols = all_cells[current_idx : current_idx + COL_COUNT]
                c_code = TextUtils.clean(cols[1].get_text())
                c_name = TextUtils.clean(cols[2].get_text())
                c_credits = TextUtils.clean(cols[3].get_text())
                c_type_raw = TextUtils.clean(cols[6].get_text())
                c_faculty = TextUtils.clean(cols[7].get_text())
                c_slot_raw = TextUtils.clean(cols[8].get_text())
                c_room = TextUtils.clean(cols[9].get_text())
                if not c_code or len(c_code) < 3: 
                    current_idx += COL_COUNT; continue
                if "Lab Based" in c_faculty: c_faculty = "Unknown"
                
                course_data = {
                    "code": c_code,
                    "name": c_name,
                    "credits": c_credits,
                    "raw_type": c_type_raw,
                    "faculty": c_faculty,
                    "room": c_room,
                    "slot": c_slot_raw
                }
                
                clean_slots = [s.strip() for s in c_slot_raw.replace('-', ' ').replace('/', ' ').replace(',', ' ').replace('+', ' ').split() if s.strip()]
                for s in clean_slots:
                    if s.strip():
                        is_prac_slot = s.upper().startswith('P') or s.upper().startswith('L') or s.upper() == "LAB"
                        final_data = course_data.copy()
                        final_data["type"] = "Practical" if is_prac_slot else "Theory"
                        course_map[s.strip()] = final_data
                current_idx += COL_COUNT
            except IndexError: break
        return course_map
