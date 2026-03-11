import html
import re

from bs4 import BeautifulSoup

class HTMLDecoder:
    @staticmethod
    def smart_extract(raw_html):
        if not raw_html:
            return None

        if "concurrent" in raw_html.lower() and "terminate" in raw_html.lower():
            return "CONCURRENT_ERROR"

        match = re.search(r"pageSanitizer\.sanitize\('(.+?)'\)", raw_html)
        if match:
            try:
                extracted = match.group(1).encode("utf-8").decode("unicode_escape")
                return extracted.replace("\\-", "-").replace("\\/", "/")
            except:
                pass

        soup = BeautifulSoup(raw_html, "html.parser")
        hidden = soup.find("div", class_="zc-pb-embed-placeholder-content")
        if hidden and hidden.has_attr("zmlvalue"):
            unescaped = html.unescape(hidden["zmlvalue"])
            return unescaped.replace("\\-", "-").replace("\\/", "/")

        return None