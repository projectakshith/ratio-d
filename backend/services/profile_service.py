import re
from bs4 import BeautifulSoup
from utils.text import TextUtils

class ProfileService:
    @staticmethod
    def parse_student_profile(html_content):
        if not html_content: return {}
        soup = BeautifulSoup(html_content, 'html.parser')
        
        profile = {
            "name": "", "regNo": "Unknown", "batch": "N/A",
            "semester": "N/A", "dept": "N/A", "section": "N/A",
            "mobile": "N/A", "program": "N/A"
        }

        def get_element_by_label(label_text):
            label_node = soup.find(string=lambda text: text and label_text.lower() in text.lower())
            if label_node:
                label_td = label_node.find_parent("td")
                if label_td:
                    value_td = label_td.find_next_sibling("td")
                    if value_td:
                        return value_td.find("strong")
            return None

 
        el = get_element_by_label("Registration Number")
        if el: profile["regNo"] = TextUtils.clean(el.get_text())

 
        el = get_element_by_label("Name")
        if el: profile["name"] = TextUtils.clean(el.get_text())

 
        el = get_element_by_label("Mobile")
        if el: profile["mobile"] = TextUtils.clean(el.get_text())

  
        el = get_element_by_label("Program")
        if el: profile["program"] = TextUtils.clean(el.get_text())

     
        el = get_element_by_label("Semester")
        if el: profile["semester"] = TextUtils.clean(el.get_text())

   
        el = get_element_by_label("Batch")
        if el:
            val = TextUtils.clean(el.get_text())
            profile["batch"] = val

 
        el = get_element_by_label("Department")
        if el:
            full = TextUtils.clean(el.get_text())
            profile["dept"] = full
            font = el.find("font")
            if font:
                section = TextUtils.clean(font.get_text())
                profile["section"] = section
                profile["dept"] = full.replace(section, "").rstrip("-").strip()

        return profile