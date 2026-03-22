import re
from bs4 import BeautifulSoup
from utils.text import TextUtils

class MarksService:
    @staticmethod
    def parse_test_performance(html_content):
        performance_data = []
        if not html_content:
            return performance_data
        soup = BeautifulSoup(html_content, "html.parser")
        rows = soup.find_all("tr")
        for row in rows:
            cols = row.find_all("td")
            if len(cols) < 3:
                continue
            c_code = TextUtils.clean(cols[0].get_text())
            if not re.match(r"^[A-Z0-9]{8,12}$", c_code):
                continue
            c_type = TextUtils.clean(cols[1].get_text())
            perf_cell = cols[2]
            assessments = []
            total_got = 0.0
            total_marks = 0.0
            has_valid_marks = False
            nested_table = perf_cell.find("table")
            if nested_table:
                for td in nested_table.find_all("td"):
                    parts = list(td.stripped_strings)
                    if len(parts) >= 2:
                        header = parts[0]
                        got_val = parts[1]
                        title = header
                        max_val = "0"
                        if "/" in header:
                            h_parts = header.split("/")
                            title = h_parts[0]
                            max_val = h_parts[1]
                        assessments.append({
                            "title": title.strip(),
                            "marks": got_val.strip(),
                            "total": max_val.strip(),
                        })
                        try:
                            total_got += float(got_val)
                            total_marks += float(max_val)
                            has_valid_marks = True
                        except ValueError:
                            pass
            perf_summary = f"{total_got:g}/{total_marks:g}" if has_valid_marks else "N/A"
            performance_data.append({
                "courseCode": c_code,
                "type": c_type,
                "performance": perf_summary,
                "assessments": assessments,
                "totalMarkGot": total_got if has_valid_marks else None,
                "totalMaxMarks": total_marks if has_valid_marks else None,
            })
        return performance_data
