import re
from selectolax.parser import HTMLParser
from utils.text import TextUtils

class PortalTimetableService:
    @staticmethod
    def parse(html_content):
        if not html_content:
            return {}, {}
        
        parser = HTMLParser(html_content)
        courses_map = {}
        
        for table in parser.css("table"):
            headers = [TextUtils.clean(th.text(strip=True)).lower() for th in table.css("th")]
            if any("course code" in h for h in headers) and any("assigned faculty" in h or "faculty" in h for h in headers):
                rows = table.css("tbody tr") if table.css("tbody tr") else table.css("tr")
                for row in rows:
                    cols = [TextUtils.clean(td.text(separator=' ', strip=True)) for td in row.css("td")]
                    if len(cols) >= 5:
                        c_code = cols[0]
                        c_name = cols[1]
                        c_credits = cols[2]
                        c_slot = cols[3]
                        c_faculty = cols[4]
                        
                        building = cols[5] if len(cols) > 5 else ""
                        floor = cols[6] if len(cols) > 6 else ""
                        raw_room = cols[7] if len(cols) > 7 else ""
                        clean_room = re.split(r'[,/]|(?:\s+(?:Drafting|Lab|Room|Hall))', raw_room, flags=re.I)[0].strip() if raw_room else ""
                        
                        b_str = building.strip()
                        m_abbr = re.search(r'\(([^)]+)\)', b_str)
                        if m_abbr:
                            b_abbr = m_abbr.group(1).strip().upper()
                        elif b_str:
                            b_abbr = "".join(w[0].upper() for w in re.split(r'[\s-]+', b_str) if w and w[0].isalnum())
                        else:
                            b_abbr = ""
                            
                        if clean_room and b_abbr:
                            full_room = clean_room if clean_room.upper().startswith(b_abbr) else f"{b_abbr} {clean_room}"
                        elif clean_room:
                            full_room = clean_room
                        elif b_abbr:
                            full_room = b_abbr
                        else:
                            full_room = "TBA"
                        
                        is_lab = (
                            c_code.endswith('L') or c_code.endswith('P') or 
                            "lab" in c_name.lower() or "practical" in c_name.lower() or
                            any(s.strip().upper().startswith('P') for s in c_slot.split(','))
                        )
                        
                        course_info = {
                            "code": c_code,
                            "name": c_name,
                            "title": c_name,
                            "credits": c_credits,
                            "slot": c_slot,
                            "faculty": c_faculty if c_faculty else "TBA",
                            "room": full_room,
                            "building": building,
                            "floor": floor,
                            "room_name": clean_room,
                            "type": "Practical" if is_lab else "Theory",
                            "raw_type": "Practical" if is_lab else "Theory"
                        }
                        
                        if c_code not in courses_map:
                            courses_map[c_code] = course_info
                        else:
                            existing = courses_map[c_code]
                            if c_slot and c_slot not in existing["slot"]:
                                existing["slot"] += f", {c_slot}"
                            if full_room != "TBA" and existing["room"] == "TBA":
                                existing["room"] = full_room

        schedule = {}
        subject_tab = parser.css_first("#subjectTab") or parser.body or parser
        grid_table = None
        for table in subject_tab.css("table"):
            txt = table.text().lower()
            if "from" in txt or "day 1" in txt or "08:00" in txt:
                grid_table = table
                break
                
        if grid_table:
            time_headers = []
            thead = grid_table.css_first("thead")
            if thead:
                for tr in thead.css("tr"):
                    row_times = []
                    for th in tr.css("th, td"):
                        raw = th.text(separator=' ', strip=True)
                        cleaned = re.sub(r'\s+', ' ', raw)
                        m = re.search(r'(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})', cleaned)
                        if m:
                            row_times.append(f"{m.group(1)} - {m.group(2)}")
                    if row_times:
                        time_headers = row_times
                        break
            
            tbody = grid_table.css_first("tbody") or grid_table
            for tr in tbody.css("tr"):
                tds = tr.css("td")
                if not tds:
                    continue
                day_text = TextUtils.clean(tds[0].text(strip=True))
                day_match = re.search(r'Day\s*(\d+)', day_text, re.I)
                if not day_match:
                    continue
                day_name = f"Day {day_match.group(1)}"
                schedule[day_name] = {}
                
                for i, td in enumerate(tds[1:]):
                    if i >= len(time_headers):
                        break
                    time_slot = time_headers[i]
                    raw_val = TextUtils.clean(td.text(strip=True))
                    if not raw_val or raw_val in ["-", "--", ""]:
                        continue
                    code = raw_val.strip()
                    details = courses_map.get(code, {
                        "code": code,
                        "name": code,
                        "title": code,
                        "type": "Theory",
                        "raw_type": "Theory",
                        "faculty": "TBA",
                        "room": "TBA",
                        "slot": "",
                        "credits": ""
                    })
                    schedule[day_name][time_slot] = {
                        "code": code,
                        "course": details["name"],
                        "courseCode": code,
                        "courseTitle": details["name"],
                        "name": details["name"],
                        "slot": details.get("slot", ""),
                        "type": details.get("type", "Theory"),
                        "raw_type": details.get("raw_type", "Theory"),
                        "room": details.get("room", "TBA"),
                        "faculty": details.get("faculty", "TBA"),
                        "time": time_slot,
                        "credits": details.get("credits", "")
                    }
                    
        return schedule, courses_map
