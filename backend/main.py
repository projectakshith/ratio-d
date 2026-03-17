import time
import asyncio
from datetime import datetime
import httpx
import uvicorn
from core.academia_client import AcademiaClient
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models.schemas import Credentials
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

@app.get("/version")
async def get_version():
    return {"version": "0.1.0"}

@app.post("/refresh")
async def refresh_data(creds: Credentials):
    start_total = time.time()
    print(f"\n[API] Incoming REFRESH request for: {creds.username}", flush=True)
    try:
        client = AcademiaClient(creds.username, creds.password, creds.cookies)
        if not creds.cookies:
            await client.authenticate()
        
        att_html = await client.get_attendance_html()
        if not att_html or att_html == "CONCURRENT_ERROR":
            print(f"{get_now()}\n  -> [AUTH] Session invalid or concurrent error. Re-authenticating...", flush=True)
            await client.authenticate()
            att_html = await client.get_attendance_html()
        
        if not att_html:
            print(f"{get_now()}\n  -> [AUTH] FAILED: Could not retrieve data after re-auth.", flush=True)
            raise HTTPException(status_code=401, detail="Invalid Credentials")
            
        attendance = AttendanceService.parse_attendance(att_html)
        marks = MarksService.parse_test_performance(att_html)
        
        current_cookies = {k: v for k, v in client.session_handler.client.cookies.items()}
        print(f"[API] Refresh completed in {time.time() - start_total:.2f}s", flush=True)
        return {
            "success": True,
            "attendance": attendance,
            "marks": marks,
            "cookies": current_cookies,
        }
    except Exception as e:
        print(f"{get_now()}\n  -> [API] ERROR in /refresh: {str(e)}", flush=True)
        raise HTTPException(status_code=401, detail=str(e))

@app.post("/login")
async def login(creds: Credentials):
    start_total = time.time()
    print(f"\n[API] Incoming login request for: {creds.username}", flush=True)
    try:
        client = AcademiaClient(creds.username, creds.password, creds.cookies)
        if not creds.cookies:
            await client.authenticate()
            
        profile_html = await client.get_profile_html()
        if not profile_html or profile_html == "CONCURRENT_ERROR":
            print(f"{get_now()}\n  -> [AUTH] Re-authenticating...", flush=True)
            await client.authenticate()
            profile_html = await client.get_profile_html()
            
        if not profile_html:
            print(f"{get_now()}\n  -> [AUTH] FAILED: Could not retrieve profile.", flush=True)
            raise HTTPException(status_code=401, detail="Invalid Credentials")
            
        profile = ProfileService.parse_student_profile(profile_html)
        course_map = CourseService.get_course_map(profile_html)
        
        user_batch_string = str(profile.get("batch", "1")).lower()
        formatted_batch = "Batch_1" if "1" in user_batch_string else "batch_2"
        
        att_task = client.get_attendance_html()
        grid_task = client.get_grid_html(formatted_batch)
        
        att_html, grid_html = await asyncio.gather(att_task, grid_task)
        
        attendance = AttendanceService.parse_attendance(att_html)
        marks = MarksService.parse_test_performance(att_html)
        
        schedule = {}
        if grid_html:
            schedule = TimetableService.parse_unified_grid(grid_html, course_map)
            
        current_cookies = {k: v for k, v in client.session_handler.client.cookies.items()}
        print(f"[API] Login completed in {time.time() - start_total:.2f}s", flush=True)
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
        print(f"{get_now()}\n  -> [API] ERROR in /login: {str(e)}", flush=True)
        raise HTTPException(status_code=401, detail=str(e))
