import uvicorn
from core.academia_client import AcademiaClient
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models.schemas import Credentials
from services.calendar_service import CalendarService
from services.marks_service import MarksService  # New Service
from services.profile_service import ProfileService
from services.timetable_service import TimetableService

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
        if not profile_html:
            raise HTTPException(status_code=500, detail="Failed to load profile HTML.")

        profile = ProfileService.parse_student_profile(profile_html)
        course_map = TimetableService.parse_course_details(profile_html)

        att_html = client.get_attendance_html()

        attendance = TimetableService.parse_attendance(att_html)

        marks = MarksService.parse_test_performance(att_html)

        grid_html = client.get_grid_html(profile.get("batch", "1"))
        schedule = {}
        if grid_html:
            schedule = TimetableService.parse_unified_grid(grid_html, course_map)
        else:
            print("[API ERROR] Could not retrieve Grid HTML.")

        cal_html = client.get_planner_html()
        calendar, day_order = CalendarService.parse_calendar(cal_html)

        print("[API] Success.")

        return {
            "success": True,
            "profile": profile,
            "attendance": attendance,
            "marks": marks,
            "schedule": schedule,
            "calendar": calendar,
            "dayOrder": day_order,
        }

    except Exception as e:
        print(f"[API ERROR] {e}")
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=401, detail=str(e))
        
    


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

