import os
import sys
import subprocess
import httpx
import shutil
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

SNAPSHOT_DIR = Path(__file__).parent / "snapshots"
SERVICES_DIR = Path(__file__).parent.parent / "services"

def call_gemini(api_key, prompt):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={api_key}"
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
        "model": "llama-3.3-70b-versatile",
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

def run_verification():
    verify_script = Path(__file__).parent / "verify.py"
    result = subprocess.run([sys.executable, str(verify_script), "--mode", "offline"], capture_output=True, text=True)
    return result.returncode == 0, result.stdout + "\n" + result.stderr

def ask_llm(prompt):
    gemini_key = os.getenv("GEMINI_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")
    errors = []
    
    if gemini_key:
        try:
            return call_gemini(gemini_key, prompt)
        except Exception as e:
            errors.append(f"Gemini failed: {str(e)}")
            
    if groq_key:
        try:
            return call_groq(groq_key, prompt)
        except Exception as e:
            errors.append(f"Groq failed: {str(e)}")
            
    raise Exception("All LLM APIs failed. Errors: " + "; ".join(errors))

def repair_file(service_name, snapshot_name):
    service_path = SERVICES_DIR / service_name
    snapshot_path = SNAPSHOT_DIR / snapshot_name
    
    if not service_path.exists() or not snapshot_path.exists():
        return False
        
    print(f"Starting repair loop for {service_name}...")
    
    failed_html = snapshot_path.read_text(encoding="utf-8")
    original_code = service_path.read_text(encoding="utf-8")
    current_code = original_code
    
    attempts = 3
    error_feedback = ""
    
    for attempt in range(attempts):
        print(f"Repair attempt {attempt + 1}/{attempts}...")
        
        prompt = f"""
        The web scraper parser has broken because the target website layout changed.
        
        CURRENT PARSER CODE ({service_name}):
        ```python
        {current_code}
        ```
        
        NEW TARGET HTML ({snapshot_name}):
        ```html
        {failed_html}
        ```
        """
        
        if error_feedback:
            prompt += f"""
            
            YOUR PREVIOUS CODE ATTEMPT FAILED THE OFFLINE VERIFICATION TESTS WITH THIS ERROR:
            ```
            {error_feedback}
            ```
            
            Please analyze this error log, review the new HTML, and correct the parser code to resolve the failure.
            """
            
        prompt += """
        
        INSTRUCTIONS:
        Rewrite the parsing functions in the parser code to correctly extract the fields from the new HTML.
        Keep the exact same import statements, class names, function names, and return schemas.
        Return ONLY the raw python file content. Do not include markdown code block formatting.
        """
        
        try:
            raw_response = ask_llm(prompt)
            cleaned_code = clean_response(raw_response)
            service_path.write_text(cleaned_code, encoding="utf-8")
            
            success, log = run_verification()
            if success:
                print(f"Success! {service_name} passed verification on attempt {attempt + 1}.")
                return True
            else:
                print(f"Verification failed on attempt {attempt + 1}.")
                current_code = cleaned_code
                error_feedback = log
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {str(e)}")
            error_feedback = str(e)
            
    print(f"Failed to repair {service_name} after {attempts} attempts. Restoring original code.")
    service_path.write_text(original_code, encoding="utf-8")
    return False

def main():
    mapping = {
        "latest_failed_profile.html": ["profile_service.py"],
        "latest_failed_attendance.html": ["attendance_service_v2.py", "marks_service.py"]
    }
    
    for failed_name, services in mapping.items():
        failed_path = SNAPSHOT_DIR / failed_name
        if failed_path.exists():
            if failed_name == "latest_failed_profile.html":
                shutil.copy(failed_path, SNAPSHOT_DIR / "profile_good.html")
            elif failed_name == "latest_failed_attendance.html":
                shutil.copy(failed_path, SNAPSHOT_DIR / "attendance_good.html")
                
    repaired = False
    for snapshot_name, services in mapping.items():
        snapshot_path = SNAPSHOT_DIR / snapshot_name
        if snapshot_path.exists():
            for service_name in services:
                if repair_file(service_name, snapshot_name):
                    repaired = True
                    
    if not repaired:
        print("No repairs succeeded.")
        sys.exit(1)
    else:
        print("All repairs completed and verified successfully.")
        sys.exit(0)

if __name__ == "__main__":
    main()
