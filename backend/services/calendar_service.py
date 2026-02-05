from bs4 import BeautifulSoup
from datetime import datetime

class CalendarService:
    @staticmethod
    def parse_calendar(html_content):
        cal = []
        day_order = "-"
        if not html_content: 
            return cal, day_order
        
        soup = BeautifulSoup(html_content, 'html.parser')
        
 
        now = datetime.now()
        current_day_num = str(now.day)
        current_month_label = now.strftime("%b '%y")  
        
        tbl = None
        for t in soup.find_all('table'):
            if "Dt" in t.get_text():
                tbl = t
                break
        
        if tbl:
            rows = tbl.find_all('tr')
 
            month_block_index = -1
            header_cells = rows[0].find_all(['td', 'th'])
            
            block_count = 0
            for cell in header_cells:
                cell_text = cell.get_text(strip=True)
                if current_month_label in cell_text:
                    month_block_index = block_count
                    break
              
                block_count += 1

          
            for r in rows:
                cells = r.find_all('td')
                if not cells: continue
                
        
                for block_idx in range(len(cells) // 4):
                    start_i = block_idx * 4
                    
                    dt_txt = cells[start_i].get_text(strip=True)
                    if not dt_txt.isdigit():
                        continue
                        
                    day_val = cells[start_i + 1].get_text(strip=True)
                    desc_val = cells[start_i + 2].get_text(strip=True)
                    do_val = cells[start_i + 3].get_text(strip=True)
                    
            
                    cal.append({
                        "date": dt_txt,
                        "day": day_val,
                        "description": desc_val,
                        "dayOrder": do_val
                    })

                  
                    if block_idx == month_block_index and dt_txt == current_day_num:
                        day_order = do_val if do_val else "-"

        return cal, day_order