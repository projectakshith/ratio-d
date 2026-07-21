import html
import re
from selectolax.parser import HTMLParser

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
            except Exception:
                pass

        parser = HTMLParser(raw_html)
        hidden = parser.css_first("div.zc-pb-embed-placeholder-content")
        if hidden and "zmlvalue" in hidden.attributes:
            unescaped = html.unescape(hidden.attributes["zmlvalue"])
            return unescaped.replace("\\-", "-").replace("\\/", "/")

        return None