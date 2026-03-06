import time
import requests
import uvicorn
from core.academia_client import AcademiaClient
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models.schemas import Credentials
from services.calendar_service import CalendarService
from services.marks_service import MarksService
from services.profile_service import ProfileService
from services.timetable_service import TimetableService

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/refresh")
def refresh_data(creds: Credentials):
    start_total = time.time()
    print(f"\n{'=' * 50}")
    print(f"[API] Incoming REFRESH request for: {creds.username}")
    try:
        client = AcademiaClient(creds.username, creds.password, creds.cookies)
        if not creds.cookies:
            print("[API] No cookies. Executing hard login...")
            client.authenticate()
        else:
            print("[API] Cached cookies received. Fast refresh...")
        t0 = time.time()
        print("[SCRAPER] Fetching Attendance & Marks only...")
        att_html = client.get_attendance_html()
        if not att_html:
            print("[AUTH] Session dead. Re-authenticating...")
            client.authenticate()
            att_html = client.get_attendance_html()
        if not att_html:
            raise HTTPException(status_code=401, detail="Invalid Credentials")
        print(f"[SCRAPER] Attendance fetched in {time.time() - t0:.2f}s")
        t0 = time.time()
        attendance = TimetableService.parse_attendance(att_html)
        marks = MarksService.parse_test_performance(att_html)
        print(f"[PARSER] Parsing completed in {time.time() - t0:.2f}s")
        current_cookies = requests.utils.dict_from_cookiejar(
            client.session_handler.session.cookies
        )
        print(f"[API] Refresh Success! Total time: {time.time() - start_total:.2f}s")
        print(f"{'=' * 50}\n")
        return {
            "success": True,
            "attendance": attendance,
            "marks": marks,
            "cookies": current_cookies,
        }
    except Exception as e:
        print(f"[ERROR] Refresh failed: {str(e)}")
        raise HTTPException(status_code=401, detail=str(e))

@app.post("/login")
def login(creds: Credentials):
    start_total = time.time()
    print(f"\n{'=' * 50}")
    print(f"[API] Incoming login request for: {creds.username}")
    try:
        client = AcademiaClient(creds.username, creds.password, creds.cookies)
        if not creds.cookies:
            print("[API] No cookies. Initial login...")
            client.authenticate()
        else:
            print("[API] Resuming session...")
        t0 = time.time()
        print("[SCRAPER] Fetching Profile...")
        profile_html = client.get_profile_html()
        if not profile_html or profile_html == "CONCURRENT_ERROR":
            print("[AUTH] Session error. Re-authenticating...")
            client.authenticate()
            profile_html = client.get_profile_html()
        if not profile_html:
            raise HTTPException(status_code=401, detail="Invalid Credentials")
        print(f"[SCRAPER] Profile fetched in {time.time() - t0:.2f}s")
        t0 = time.time()
        profile = ProfileService.parse_student_profile(profile_html)
        course_data = TimetableService.parse_course_details(profile_html)
        course_map = course_data.get("slots", {})
        courses = course_data.get("courses", {})
        print(f"[PARSER] Profile & Courses parsed in {time.time() - t0:.2f}s")
        t0 = time.time()
        print("[SCRAPER] Fetching Attendance & Marks...")
        att_html = client.get_attendance_html()
        print(f"[SCRAPER] Attendance fetched in {time.time() - t0:.2f}s")
        t0 = time.time()
        attendance = TimetableService.parse_attendance(att_html)
        marks = MarksService.parse_test_performance(att_html)
        print(f"[PARSER] Attendance & Marks parsed in {time.time() - t0:.2f}s")
        t0 = time.time()
        print("[SCRAPER] Fetching Timetable...")
        user_batch_string = str(profile.get("batch", "1")).lower()
        formatted_batch = "Batch_1" if "1" in user_batch_string else "batch_2"
        schedule = {}
        grid_html = client.get_grid_html(formatted_batch)
        if grid_html:
            schedule = TimetableService.parse_unified_grid(grid_html, course_map)
        print(f"[SCRAPER] Schedule parsed in {time.time() - t0:.2f}s")
        calendar = []
        day_order = "-"
        current_cookies = requests.utils.dict_from_cookiejar(
            client.session_handler.session.cookies
        )
        print(f"[API] Success! Execution time: {time.time() - start_total:.2f}s")
        print(f"{'=' * 50}\n")
        return {
            "success": True,
            "profile": profile,
            "attendance": attendance,
            "marks": marks,
            "schedule": schedule,
            "calendar": calendar,
            "dayOrder": day_order,
            "courses": courses,
            "slots": course_map,
            "cookies": current_cookies,
        }
    except Exception as e:
        print(f"[ERROR] Login failed: {str(e)}")
        raise HTTPException(status_code=401, detail=str(e))
