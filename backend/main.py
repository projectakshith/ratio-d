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
            print("[API] No cookies. Executing hard login for refresh...")
            client.authenticate()
        else:
            print("[API] Cached cookies received. Attempting fast refresh...")

        t0 = time.time()
        print("[SCRAPER] Fetching Attendance & Marks only...")
        att_html = client.get_attendance_html()

        if not att_html:
            print(f"[AUTH] Session dead for {creds.username}! Re-authenticating...")
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
        print(f"[ERROR] Exception caught during refresh: {str(e)}")
        print(f"{'=' * 50}\n")
        raise HTTPException(status_code=401, detail=str(e))


@app.post("/login")
def login(creds: Credentials):
    start_total = time.time()
    print(f"\n{'=' * 50}")
    print(f"[API] Incoming request for: {creds.username}")

    try:
        client = AcademiaClient(creds.username, creds.password, creds.cookies)

        if not creds.cookies:
            print("[API] No cookies received. Executing initial authentication...")
            t_auth = time.time()
            client.authenticate()
            print(f"[AUTH] Initial authentication took {time.time() - t_auth:.2f}s")
        else:
            print("[API] Cached cookies received. Attempting fast resume...")

        t0 = time.time()
        print("[SCRAPER] Fetching Profile...")
        profile_html = client.get_profile_html()

        if not profile_html or profile_html == "CONCURRENT_ERROR":
            print(f"[AUTH] Session dead or concurrent error for {creds.username}!")
            print("[AUTH] Triggering silent background re-authentication...")
            t_auth = time.time()
            client.authenticate()
            print(f"[AUTH] Re-authentication took {time.time() - t_auth:.2f}s")

            print("[SCRAPER] Retrying Profile fetch...")
            profile_html = client.get_profile_html()

        if not profile_html:
            print("[ERROR] Login completely failed. Invalid Credentials.")
            raise HTTPException(status_code=401, detail="Invalid Credentials")

        print(f"[SCRAPER] Profile fetched in {time.time() - t0:.2f}s")

        t0 = time.time()
        print("[PARSER] Parsing Profile & Course Map...")
        profile = ProfileService.parse_student_profile(profile_html)
        course_data = TimetableService.parse_course_details(profile_html)
        course_map = course_data.get("slots", {})
        courses = course_data.get("courses", {})
        print(f"[PARSER] Parsing completed in {time.time() - t0:.2f}s")

        t0 = time.time()
        print("[SCRAPER] Fetching Attendance & Marks...")
        att_html = client.get_attendance_html()
        print(f"[SCRAPER] Attendance fetched in {time.time() - t0:.2f}s")

        t0 = time.time()
        print("[PARSER] Parsing Attendance & Marks...")
        attendance = TimetableService.parse_attendance(att_html)
        marks = MarksService.parse_test_performance(att_html)
        print(f"[PARSER] Parsing completed in {time.time() - t0:.2f}s")

        t0 = time.time()
        print("[SCRAPER] Fetching Timetable Grid...")

        user_batch_string = str(profile.get("batch", "1")).lower()

        if "1" in user_batch_string:
            formatted_batch = "Batch_1"
        elif "2" in user_batch_string:
            formatted_batch = "batch_2"
        else:
            formatted_batch = "Batch_1"

        schedule = {}
        grid_html = client.get_grid_html(formatted_batch)

        if grid_html:
            schedule = TimetableService.parse_unified_grid(grid_html, course_map)

        print(f"[SCRAPER] Timetable fetched and parsed in {time.time() - t0:.2f}s")

        print("[API] Calendar is currently not fetched.")
        calendar = []
        day_order = "-"

        current_cookies = requests.utils.dict_from_cookiejar(
            client.session_handler.session.cookies
        )

        print(f"[API] Success! Total execution time: {time.time() - start_total:.2f}s")
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
            "cookies": current_cookies,
        }

    except Exception as e:
        print(f"[ERROR] Exception caught: {str(e)}")
        print(f"{'=' * 50}\n")
        raise HTTPException(status_code=401, detail=str(e))
