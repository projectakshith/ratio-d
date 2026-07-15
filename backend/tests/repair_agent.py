import os
import sys
import httpx
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

SNAPSHOT_DIR = Path(__file__).parent / "snapshots"
SERVICES_DIR = Path(__file__).parent.parent / "services"

def call_gemini(api_key, prompt):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }
    response = httpx.post(url, json=payload, timeout=30.0)
    if response.status_code != 200:
        raise Exception(f"Gemini API returned status {response.status_code}: {response.text}")
    data = response.json()
    return data["candidates"][0]["content"]["parts"][0]["text"]

def call_groq(api_key, prompt):
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.3-70b-specdec",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    }
    response = httpx.post(url, headers=headers, json=payload, timeout=30.0)
    if response.status_code != 200:
        raise Exception(f"Groq API returned status {response.status_code}: {response.text}")
    data = response.json()
    return data["choices"][0]["message"]["content"]

def clean_response(text):
    text = text.strip()
    if text.startswith("```python"):
        text = text[9:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

def repair_file(service_name, snapshot_name):
    service_path = SERVICES_DIR / service_name
    snapshot_path = SNAPSHOT_DIR / snapshot_name
    
    if not service_path.exists() or not snapshot_path.exists():
        return False
        
    print(f"Attempting repair for {service_name} using {snapshot_name}...")
    
    parser_code = service_path.read_text(encoding="utf-8")
    failed_html = snapshot_path.read_text(encoding="utf-8")
    
    prompt = f"""
    The following web scraper parser has broken because the target website layout changed.
    
    PARSER CODE ({service_name}):
    ```python
    {parser_code}
    ```
    
    NEW TARGET HTML ({snapshot_name}):
    ```html
    {failed_html}
    ```
    
    INSTRUCTIONS:
    Analyze the new HTML structure.
    Rewrite the parsing functions in the parser code to correctly extract the fields from the new HTML.
    Keep the exact same import statements, class names, function names, and return schemas.
    Return ONLY the raw python file content. Do not include markdown code block formatting.
    """
    
    gemini_key = os.getenv("GEMINI_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")
    
    repaired_code = None
    errors = []
    
    if gemini_key:
        try:
            print("Calling Gemini API...")
            repaired_code = call_gemini(gemini_key, prompt)
            print("Gemini API call succeeded.")
        except Exception as e:
            errors.append(f"Gemini failed: {str(e)}")
            
    if not repaired_code and groq_key:
        try:
            print("Falling back to Groq API...")
            repaired_code = call_groq(groq_key, prompt)
            print("Groq API call succeeded.")
        except Exception as e:
            errors.append(f"Groq failed: {str(e)}")
            
    if not repaired_code:
        print("All API calls failed:")
        for err in errors:
            print(f"- {err}")
        return False
        
    cleaned_code = clean_response(repaired_code)
    service_path.write_text(cleaned_code, encoding="utf-8")
    print(f"Successfully repaired and wrote {service_name}.")
    return True

def main():
    mapping = {
        "latest_failed_profile.html": ["profile_service.py"],
        "latest_failed_attendance.html": ["attendance_service_v2.py", "marks_service.py"]
    }
    
    repaired = False
    for snapshot_name, services in mapping.items():
        snapshot_path = SNAPSHOT_DIR / snapshot_name
        if snapshot_path.exists():
            for service_name in services:
                if repair_file(service_name, snapshot_name):
                    repaired = True
                    
    if not repaired:
        print("No repairs needed or all repairs failed.")
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()
