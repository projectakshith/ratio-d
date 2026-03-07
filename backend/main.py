import time
from datetime import datetime
import requests
import uvicorn
from core.academia_client import AcademiaClient
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from models.schemas import Credentials
from services.calendar_service import CalendarService
from services.marks_service import MarksService
from services.profile_service import ProfileService
from services.course_service import CourseService
from services.attendance_service import AttendanceService
from services.timetable_service import TimetableService

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_now():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3] + " IST"

@app.post("/refresh")
def refresh_data(creds: Credentials):
    start_total = time.time()
    print(f"\n[API] Incoming REFRESH request for: {creds.username}")
    try:
        client = AcademiaClient(creds.username, creds.password, creds.cookies)
        if not creds.cookies:
            client.authenticate()
        
        att_html = client.get_attendance_html()
        if not att_html or att_html == "CONCURRENT_ERROR":
            print(f"{get_now()}\n  -> [AUTH] Re-authenticating...")
            client.authenticate()
            att_html = client.get_attendance_html()
        
        if not att_html:
            raise HTTPException(status_code=401, detail="Invalid Credentials")
            
        attendance = AttendanceService.parse_attendance(att_html)
        marks = MarksService.parse_test_performance(att_html)
        
        current_cookies = requests.utils.dict_from_cookiejar(
            client.session_handler.session.cookies
        )
        return {
            "success": True,
            "attendance": attendance,
            "marks": marks,
            "cookies": current_cookies,
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.post("/login")
def login(creds: Credentials):
    start_total = time.time()
    print(f"\n[API] Incoming login request for: {creds.username}")
    try:
        client = AcademiaClient(creds.username, creds.password, creds.cookies)
        if not creds.cookies:
            client.authenticate()
            
        profile_html = client.get_profile_html()
        if not profile_html or profile_html == "CONCURRENT_ERROR":
            client.authenticate()
            profile_html = client.get_profile_html()
            
        if not profile_html:
            raise HTTPException(status_code=401, detail="Invalid Credentials")
            
        profile = ProfileService.parse_student_profile(profile_html)
        course_map = CourseService.get_course_map(profile_html)
        
        att_html = client.get_attendance_html()
        attendance = AttendanceService.parse_attendance(att_html)
        marks = MarksService.parse_test_performance(att_html)
        
        user_batch_string = str(profile.get("batch", "1")).lower()
        formatted_batch = "Batch_1" if "1" in user_batch_string else "batch_2"
        
        schedule = {}
        grid_html = client.get_grid_html(formatted_batch)
        if grid_html:
            schedule = TimetableService.parse_unified_grid(grid_html, course_map)
            
        current_cookies = requests.utils.dict_from_cookiejar(
            client.session_handler.session.cookies
        )
        return {
            "success": True,
            "profile": profile,
            "attendance": attendance,
            "marks": marks,
            "schedule": schedule,
            "courses": course_map,
            "cookies": current_cookies,
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
