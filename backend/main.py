import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from core.academia_client import AcademiaClient
from models.schemas import Credentials
from services.profile_service import ProfileService
from services.timetable_service import TimetableService
from services.calendar_service import CalendarService

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/login")
def login(creds: Credentials):
    print(f"\n[API] Login Request for {creds.username}")
    try:

        client = AcademiaClient(creds.username, creds.password)
        client.authenticate()

        profile_html = client.get_profile_html()
        if not profile_html: raise Exception("Failed to load profile HTML.")

        profile = ProfileService.parse_student_profile(profile_html)
        

        course_map = TimetableService.parse_course_details(profile_html)

        att_html = client.get_attendance_html()
        att = TimetableService.parse_attendance(att_html)

        grid_html = client.get_grid_html(profile.get('batch', '1'))
        
        schedule = {}
        if grid_html:
            schedule = TimetableService.parse_unified_grid(grid_html, course_map)
        else:
            print("[API ERROR] Could not retrieve Grid HTML from any URL.")

        cal_html = client.get_planner_html()
        calendar, day_order = CalendarService.parse_calendar(cal_html)

        print("[API] Success.")
        
        return {
            "success": True, 
            "profile": profile, 
            "attendance": att, 
            "schedule": schedule, 
            "calendar": calendar, 
            "dayOrder": day_order
        }

    except Exception as e:
        print(f"[API ERROR] {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=401, detail=str(e))
