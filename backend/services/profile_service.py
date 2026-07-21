from selectolax.parser import HTMLParser
from utils.text import TextUtils

class ProfileService:
    @staticmethod
    def parse_student_profile(html_content):
        if not html_content:
            return {}
        parser = HTMLParser(html_content)
        profile = {
            "name": "", "regNo": "Unknown", "batch": "N/A",
            "semester": "N/A", "dept": "N/A", "section": "N/A",
            "mobile": "N/A", "program": "N/A"
        }

        def get_element_by_label(label_text):
            target_label = label_text.lower()
            for td in parser.css("td"):
                txt = td.text()
                if txt and target_label in txt.lower():
                    next_node = td.next
                    while next_node:
                        if next_node.tag == "td":
                            strong = next_node.css_first("strong")
                            if strong:
                                return strong
                            return next_node
                        next_node = next_node.next
            return None

        el = get_element_by_label("Registration Number")
        if el: profile["regNo"] = TextUtils.clean(el.text())

        el = get_element_by_label("Name")
        if el: profile["name"] = TextUtils.clean(el.text())

        el = get_element_by_label("Mobile")
        if el: profile["mobile"] = TextUtils.clean(el.text())

        el = get_element_by_label("Program")
        if el: profile["program"] = TextUtils.clean(el.text())

        el = get_element_by_label("Semester")
        if el: profile["semester"] = TextUtils.clean(el.text())

        el = get_element_by_label("Batch")
        if el:
            val = TextUtils.clean(el.text())
            profile["batch"] = val

        el = get_element_by_label("Department")
        if el:
            full = TextUtils.clean(el.text())
            profile["dept"] = full
            font = el.css_first("font")
            if font:
                section = TextUtils.clean(font.text())
                profile["section"] = section
                profile["dept"] = full.replace(section, "").rstrip("-").strip()

        return profile