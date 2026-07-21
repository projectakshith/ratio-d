import os
import sys
import argparse
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from services.attendance_service import AttendanceService

from services.marks_service import MarksService
from services.profile_service import ProfileService
from core.academia_client import AcademiaClient

SNAPSHOT_DIR = Path(__file__).parent / "snapshots"

def run_offline_tests():
    failed = False
    
    att_path = SNAPSHOT_DIR / "attendance_good.html"
    if att_path.exists():
        html = att_path.read_text(encoding="utf-8")
        courses = AttendanceService.parse_attendance(html)
        if not courses:
            print("Offline: Attendance parsing failed.")
            failed = True
        else:
            print(f"Offline: Attendance parsed {len(courses)} records.")
            
        marks = MarksService.parse_test_performance(html)
        if not marks:
            print("Offline: Marks parsing failed.")
            failed = True
        else:
            print(f"Offline: Marks parsed {len(marks)} records.")
            
    prof_path = SNAPSHOT_DIR / "profile_good.html"
    if prof_path.exists():
        html = prof_path.read_text(encoding="utf-8")
        profile = ProfileService.parse_student_profile(html)
        if not profile or profile.get("regNo") == "Unknown":
            print("Offline: Profile parsing failed.")
            failed = True
        else:
            print(f"Offline: Profile parsed for {profile.get('regNo')}.")
            
    if failed:
        sys.exit(1)
    print("All offline tests passed.")

async def run_live_tests():
    username = os.getenv("SRM_TEST_USER")
    password = os.getenv("SRM_TEST_PASS")
    
    if not username or not password:
        print("Missing credentials variables.")
        sys.exit(3)
        
    client = AcademiaClient(username, password)
    
    try:
        print("Attempting login...")
        await client.authenticate()
    except Exception as e:
        print(f"Authentication failed: {str(e)}")
        sys.exit(3)
        
    try:
        profile_html = await client.get_profile_html()
        if not profile_html:
            print("Live: Profile HTML empty.")
            sys.exit(3)
            
        profile = ProfileService.parse_student_profile(profile_html)
        if not profile or profile.get("regNo") == "Unknown":
            SNAPSHOT_DIR.mkdir(exist_ok=True, parents=True)
            (SNAPSHOT_DIR / "latest_failed_profile.html").write_text(profile_html, encoding="utf-8")
            print("Live: Profile layout mismatch.")
            sys.exit(2)
    except Exception as e:
        print(f"Live: Profile check error: {str(e)}")
        sys.exit(3)
        
    try:
        att_html = await client.get_attendance_html()
        if not att_html:
            print("Live: Attendance HTML empty.")
            sys.exit(3)
            
        courses = AttendanceService.parse_attendance(att_html)
        if not courses:
            SNAPSHOT_DIR.mkdir(exist_ok=True, parents=True)
            (SNAPSHOT_DIR / "latest_failed_attendance.html").write_text(att_html, encoding="utf-8")
            print("Live: Attendance layout mismatch.")
            sys.exit(2)
    except Exception as e:
        print(f"Live: Attendance check error: {str(e)}")
        sys.exit(3)
        
    print("Live verification passed.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["offline", "live"], default="offline")
    args = parser.parse_args()
    
    if args.mode == "offline":
        run_offline_tests()
    else:
        import asyncio
        asyncio.run(run_live_tests())
