from datetime import datetime
from selectolax.parser import HTMLParser

class CalendarService:
    @staticmethod
    def parse_calendar(html_content):
        cal = []
        day_order = "-"
        if not html_content:
            return cal, day_order

        parser = HTMLParser(html_content)
        now = datetime.now()
        current_day_num = str(now.day)
        current_month_label = now.strftime("%b '%y")

        tbl = None
        for t in parser.css("table"):
            if "Dt" in t.text():
                tbl = t
                break

        if tbl:
            rows = tbl.css("tr")
            if rows:
                month_block_index = -1
                header_cells = rows[0].css("td, th")
                block_count = 0
                for cell in header_cells:
                    cell_text = cell.text(strip=True)
                    if current_month_label in cell_text:
                        month_block_index = block_count
                        break
                    block_count += 1

                for r in rows:
                    cells = r.css("td")
                    if not cells:
                        continue

                    for block_idx in range(len(cells) // 4):
                        start_i = block_idx * 4
                        dt_txt = cells[start_i].text(strip=True)
                        if not dt_txt.isdigit():
                            continue

                        day_val = cells[start_i + 1].text(strip=True)
                        desc_val = cells[start_i + 2].text(strip=True)
                        do_val = cells[start_i + 3].text(strip=True)

                        cal.append({
                            "date": dt_txt,
                            "day": day_val,
                            "description": desc_val,
                            "dayOrder": do_val
                        })

                        if block_idx == month_block_index and dt_txt == current_day_num:
                            day_order = do_val if do_val else "-"

        return cal, day_order