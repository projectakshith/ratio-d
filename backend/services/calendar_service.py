from bs4 import BeautifulSoup

class CalendarService:
    @staticmethod
    def parse_calendar(html_content):
        cal = []
        day_order = "-"
        if not html_content: return cal, day_order
        
        soup = BeautifulSoup(html_content, 'html.parser')
        tbl = None
        for t in soup.find_all('table'):
            if "Date" in t.get_text() and "Day" in t.get_text(): tbl = t; break
        
        if tbl:
            for r in tbl.find_all('tr')[1:]:
                c = r.find_all('td')
                if len(c) >= 3:
                    try:
                        do = c[3].get_text(strip=True) if len(c)>3 else "-"
                        if do != "-" and day_order == "-": day_order = do
                        cal.append({ 
                            "date": c[0].get_text(strip=True), 
                            "day": c[1].get_text(strip=True), 
                            "description": c[2].get_text(strip=True), 
                            "dayOrder": do 
                        })
                    except: pass
        return cal, day_order