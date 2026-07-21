import re
from selectolax.parser import HTMLParser
from utils.text import TextUtils

class TimetableService:
    @staticmethod
    def parse_unified_grid(html_content, course_map):
        if not html_content:
            return {}
        parser = HTMLParser(html_content)
        grid_table = None
        for table in parser.css("table"):
            txt = table.text().lower()
            if "day 1" in txt and "08:00" in txt:
                grid_table = table
                break
        if not grid_table:
            return {}
        timetable = {}
        rows = grid_table.css("tr")
        time_headers = []
        if rows:
            header_cells = rows[0].css("td, th")
            for cell in header_cells:
                txt = TextUtils.clean(cell.text())
                if ":" in txt and "day" not in txt.lower():
                    time_headers.append(txt)
        if not time_headers:
            return {}
        for row in rows:
            cols = row.css("td")
            if not cols:
                continue
            day_text = TextUtils.clean(cols[0].text())
            day_match = re.search(r"Day\s*(\d+)", day_text, re.I)
            if not day_match:
                continue
            day_name = f"Day {day_match.group(1)}"
            timetable[day_name] = {}
            data_cells = cols[1:]
            for i, cell in enumerate(data_cells):
                if i >= len(time_headers):
                    break
                raw_slot = TextUtils.clean(cell.text())
                slot_code = raw_slot.split("/")[0].strip()
                if not slot_code or slot_code == "-":
                    continue
                if slot_code not in course_map:
                    continue
                details = course_map[slot_code]

                timetable[day_name][time_headers[i]] = {
                    "slot": slot_code,
                    "course": details["name"],
                    "code": details["code"],
                    "type": details["type"],
                    "raw_type": details.get("raw_type"),
                    "room": details.get("room", "TBA"),
                    "faculty": details.get("faculty", "TBA"),
                    "time": time_headers[i]
                }
        return timetable
