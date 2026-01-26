import re

class TextUtils:
    @staticmethod
    def clean(text):
        if not text:
            return ""
        return re.sub(r'\s+', ' ', text).strip()