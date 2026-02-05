from bs4 import BeautifulSoup
from utils.text import TextUtils

class CalendarService:
    @staticmethod
    def parse_calendar(html_content):
        cal = []
        day_order = "-"
        if not html_content: 
            return cal, day_order
        
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Look for the table containing 'Dt' and 'Day' as seen in the 2025-26 planner
        tbl = None
        for t in soup.find_all('table'):
            header_text = t.get_text()
            if "Dt" in header_text and "Day" in header_text:
                tbl = t
                break
        
        if tbl:
            # The planner is often organized with Dt, Day, Description, DO repeated 
            # for multiple months in the same row.
            rows = tbl.find_all('tr')
            for r in rows:
                cells = r.find_all('td')
                # Process cells in groups of 4 (Dt, Day, Description, DO)
                for i in range(0, len(cells), 4):
                    try:
                        if i + 3 < len(cells):
                            date_val = TextUtils.clean(cells[i].get_text())
                            day_val = TextUtils.clean(cells[i+1].get_text())
                            desc_val = TextUtils.clean(cells[i+2].get_text())
                            do_val = TextUtils.clean(cells[i+3].get_text())
                            
                            # Only add if there is a valid date (numeric)
                            if date_val.isdigit():
                                if do_val != "-" and day_order == "-":
                                    day_order = do_val
                                    
                                cal.append({ 
                                    "date": date_val, 
                                    "day": day_val, 
                                    "description": desc_val, 
                                    "dayOrder": do_val 
                                })
                    except Exception:
                        continue
                        
        return cal, day_order