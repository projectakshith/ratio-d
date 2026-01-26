import re
import html
from bs4 import BeautifulSoup

class HTMLDecoder:
    @staticmethod
    def smart_extract(raw_html):
        if not raw_html:
            return None
        
        if "concurrent" in raw_html.lower() and "terminate" in raw_html.lower():
            print("[DECODER] Detected 'Concurrent Sessions' Error Page.")
            return "CONCURRENT_ERROR"
            
        if "signin" in raw_html.lower() or "session expired" in raw_html.lower():
            print("[DECODER] Detected 'Session Expired' Page.")
            return None

        match = re.search(r"pageSanitizer\.sanitize\('(.+?)'\)", raw_html)
        if match:
            try:
                return match.group(1).encode('utf-8').decode('unicode_escape')
            except:
                pass

        soup = BeautifulSoup(raw_html, 'html.parser')
        hidden = soup.find('div', class_='zc-pb-embed-placeholder-content')
        if hidden and hidden.has_attr('zmlvalue'):
            return html.unescape(hidden['zmlvalue'])
            
        return None