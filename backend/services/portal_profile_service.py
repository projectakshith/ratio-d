import re
from selectolax.parser import HTMLParser
from utils.text import TextUtils

class PortalProfileService:
    @staticmethod
    def parse(html_content):
        if not html_content:
            return {}
        
        parser = HTMLParser(html_content)
        profile = {
            "name": "",
            "regNo": "Unknown",
            "batch": "N/A",
            "semester": "N/A",
            "dept": "N/A",
            "section": "N/A",
            "mobile": "N/A",
            "program": "N/A"
        }
        
        for tr in parser.css("table tr"):
            tds = tr.css("td")
            if len(tds) >= 2:
                label = TextUtils.clean(tds[0].text(strip=True)).lower()
                val = TextUtils.clean(tds[1].text(strip=True))
                if "student name" in label:
                    profile["name"] = val
                elif "register no" in label:
                    profile["regNo"] = val
                elif "institution" in label or "department" in label:
                    profile["dept"] = val
                elif "program" in label:
                    profile["program"] = val
                elif "batch" in label:
                    profile["batch"] = val
                elif "semester" in label:
                    profile["semester"] = val
                elif "section" in label:
                    profile["section"] = val
                elif "student mobile" in label or "mobile" in label:
                    profile["mobile"] = val

        return profile
