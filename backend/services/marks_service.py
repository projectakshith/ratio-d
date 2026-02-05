from bs4 import BeautifulSoup
from utils.text import TextUtils

class MarksService:
    @staticmethod
    def parse_test_performance(html_content):
        performance_data = []
        if not html_content:
            return performance_data
            
        soup = BeautifulSoup(html_content, 'html.parser')
        
 
        target_table = None
        for table in soup.find_all('table'):
            if "Test Performance" in table.get_text():
                target_table = table
                break
                
        if target_table:
            rows = target_table.find_all('tr')[1:]
            for row in rows:
                cols = row.find_all('td')
                if len(cols) >= 3:
                    course_code = TextUtils.clean(cols[0].get_text())
                    course_type = TextUtils.clean(cols[1].get_text())
                    performance = TextUtils.clean(cols[2].get_text())
                    
                    if course_code:
                        performance_data.append({
                            "courseCode": course_code,
                            "type": course_type,
                            "performance": performance if (performance and performance != ".") else "N/A"
                        })
                        
        return performance_data