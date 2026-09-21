import re
from selectolax.parser import HTMLParser

class PortalMarksService:
    @staticmethod
    def parse_main(html_content):
        subjects = []
        if not html_content:
            return subjects
        parser = HTMLParser(html_content)
        for row in parser.css("table tr"):
            cols = row.css("td")
            if len(cols) < 3:
                continue
            code = cols[0].text().strip()
            if not re.match(r"^[A-Z0-9]{6,12}$", code):
                continue
            title = cols[1].text().strip()
            score_str = cols[2].text().strip()

            got_val = None
            max_val = None
            if "/" in score_str:
                parts = score_str.split("/")
                try:
                    got_val = float(parts[0].strip())
                    max_val = float(parts[1].strip())
                except ValueError:
                    pass

            subject_id = None
            status = "2"
            btn = row.css_first("button[onclick]") or row.css_first("a[onclick]")
            if btn:
                onclick_text = btn.attributes.get("onclick", "")
                m = re.search(r"funViewComponentWiseMarks\s*\(\s*['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]+)['\"]\s*,\s*([0-9]+)\s*\)", onclick_text)
                if m:
                    subject_id = m.group(1)
                    status = m.group(4)

            subjects.append({
                "courseCode": code,
                "title": title,
                "type": "Internal",
                "performance": score_str if got_val is not None else "N/A",
                "assessments": [],
                "totalMarkGot": got_val,
                "totalMaxMarks": max_val,
                "subjectId": subject_id,
                "status": status
            })
        return subjects

    @staticmethod
    def parse_inner(inner_html):
        assessments = []
        if not inner_html:
            return assessments
        parser = HTMLParser(inner_html)
        for row in parser.css("table tbody tr"):
            cols = row.css("td")
            if len(cols) >= 3:
                date_entered = cols[0].text().strip()
                component_name = cols[1].text().strip()
                mark_str = cols[2].text().strip()

                got_val = "0"
                max_val = "0"
                if "/" in mark_str:
                    parts = mark_str.split("/")
                    got_val = parts[0].strip()
                    max_val = parts[1].strip()

                assessments.append({
                    "title": component_name,
                    "marks": got_val,
                    "total": max_val,
                    "date": date_entered
                })
        return assessments

    @staticmethod
    def parse(html_content):
        return PortalMarksService.parse_main(html_content)
