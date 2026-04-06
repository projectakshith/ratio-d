"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  Bell,
  CheckCircle,
  GraduationCap,
  Loader,
  RefreshCw,
} from "lucide-react";
import DesktopSidebar from "../DesktopSidebar";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useAcademiaData } from "@/hooks/useAcademiaData";
import { useDashboardCalendar } from "@/hooks/useDashboardCalendar";
import { useDashboardAlerts } from "@/hooks/useDashboardAlerts";
import { useAppLayout } from "@/context/AppLayoutContext";
import { EncryptionUtils } from "@/utils/shared/Encryption";
import {
  calculateOverallAttendance,
  getCriticalAttendance,
} from "@/utils/academia/academiaLogic";
import { getBaseAttendance, getStatus, matchAttendance } from "@/utils/attendance/attendanceLogic";
import { processAndSortMarks, buildCourseMap } from "@/utils/marks/marksLogic";
import { getAcronym } from "@/utils/dashboard/timetableLogic";
import calendarDataJson from "@/data/calendar_data.json";
import ScheduleGrid from "@/components/themes/minimalist/dashboard/ScheduleGrid";
import {
  getDashboardSchedule,
  getStatusLogic,
} from "@/utils/dashboard/dashboardLogic";
import { ScheduleSlot } from "@/types";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Haptics } from "@/utils/shared/haptics";

export default function DesktopDashboard() {
  const router = useRouter();
  const { userData, customDisplayName, profileSeed, refreshData, isUpdating } = useApp();
  const { onOpenSettings } = useAppLayout();
  const academia = useAcademiaData(userData as any);
  
  const {
    mounted,
    currentDayOrder,
    isHoliday,
    selectedDay,
    nextWorkingDayOrder,
    isTomorrowHoliday,
    handleDaySwitch,
  } = useDashboardCalendar(academia, userData);

  const [showExtraSlots, setShowExtraSlots] = useState(false);
  const [customClasses, setCustomClasses] = useState<Record<number, any[]>>({});

  useEffect(() => {
    const fetchCustoms = () => {
      const stored = localStorage.getItem("ratio_custom_classes");
      if (stored) {
        try {
          setCustomClasses(JSON.parse(stored));
        } catch {}
      }
    };
    fetchCustoms();
    window.addEventListener("custom_classes_updated", fetchCustoms);
    return () => window.removeEventListener("custom_classes_updated", fetchCustoms);
  }, []);

  const handleRefresh = useCallback(async () => {
    const creds = EncryptionUtils.loadDecrypted("ratio_credentials");
    if (creds && userData) {
      await refreshData(creds, userData);
    }
  }, [userData, refreshData]);

  const userName = (
    customDisplayName ||
    userData?.profile?.name?.split(" ")[0] ||
    "student"
  ).toLowerCase();

  const profile = userData?.profile || {};
  const isTargetAudience =
    (profile.dept || "").toLowerCase().includes("computer science and engineering") &&
    String(profile.semester) === "4";

  const { allAlerts, currentAlertIndex } = useDashboardAlerts(academia, isTargetAudience);

  const courseMap = useMemo(() => buildCourseMap(userData as any), [userData]);

  const { standardGrid, extraGrid } = useMemo(() => {
    const scheduleData = academia?.effectiveSchedule || userData?.timetable || userData?.schedule || {};
    return getDashboardSchedule(
      scheduleData,
      customClasses,
      selectedDay,
      currentDayOrder,
      courseMap,
    );
  }, [userData, academia, selectedDay, currentDayOrder, customClasses, courseMap]);

  const { currentClass, nextClass, realDayToTrack } = useMemo(() => {
    const scheduleData = academia?.effectiveSchedule || userData?.timetable || userData?.schedule || {};
    const todayOrder = isHoliday ? nextWorkingDayOrder || 1 : currentDayOrder;
    return getStatusLogic(
      scheduleData,
      customClasses,
      todayOrder,
      currentDayOrder,
      courseMap,
      isHoliday,
      academia?.calendarData || [],
      calendarDataJson,
    );
  }, [academia, userData, customClasses, currentDayOrder, isHoliday, nextWorkingDayOrder, courseMap]);

  const focusClass = (nextClass || null) as ScheduleSlot | null;
  const isShowingTomorrow =
    focusClass &&
    realDayToTrack !== (isHoliday ? nextWorkingDayOrder || 1 : currentDayOrder);
  const focusLabel = focusClass
    ? isShowingTomorrow
      ? isTomorrowHoliday
        ? "next session"
        : "tomorrow's first"
      : "next up"
    : "free time";

  const displayCourse = (
    focusClass?.name ||
    focusClass?.courseTitle ||
    focusClass?.course ||
    "free time"
  ).toLowerCase();

  const statusClass = (currentClass || nextClass || null) as ScheduleSlot | null;

  const { alertName, alertPct, alertMargin, alertLabel, alertPctNum } = useMemo(() => {
    const targetClass = (nextClass || currentClass) as ScheduleSlot | null;
    const baseAttendance = getBaseAttendance(userData?.attendance || []);
    const critical = getCriticalAttendance(userData?.attendance || []);

    let targetSubject = baseAttendance.length > 0 
      ? baseAttendance.find(a => {
          const crit = critical[0];
          if (!crit) return false;
          return (a.code || "").trim().toLowerCase() === (crit.code || crit.courseCode || "").trim().toLowerCase();
        }) || baseAttendance[0]
      : null;

    if (targetClass && baseAttendance.length > 0) {
      const match = matchAttendance(targetClass, baseAttendance);
      if (match) targetSubject = match;
    }

    const pct = targetSubject ? (targetSubject.conducted > 0 ? (targetSubject.present / targetSubject.conducted) * 100 : 100) : 0;
    const status = getStatus(pct, targetSubject?.conducted || 0, targetSubject?.present || 0);

    return {
      alertName: targetSubject?.title?.toLowerCase() || "attendance",
      alertPct: pct.toFixed(1),
      alertPctNum: pct,
      alertMargin: status.val,
      alertLabel: status.label,
    };
  }, [userData, nextClass, currentClass]);

  const attendanceCategory = alertPctNum < 75 ? "cooked" : alertPctNum >= 85 ? "safe" : "danger";
  const attStyles = {
    safe: { bg: "status-boxbg-safe", border: "status-border-safe", text: "status-text-safe", iconBg: "status-bg-safe" },
    danger: { bg: "status-boxbg-danger", border: "status-border-danger", text: "status-text-danger", iconBg: "status-bg-danger" },
    cooked: { bg: "status-boxbg-cooked", border: "status-border-cooked", text: "status-text-cooked", iconBg: "status-bg-cooked" },
  }[attendanceCategory];

  const latestMark = useMemo(() => {
    const sortedMarks = processAndSortMarks(userData?.marks || [], courseMap);
    return sortedMarks.length > 0 ? sortedMarks[0] : null;
  }, [userData, courseMap]);

  const displayGrid = showExtraSlots ? [...standardGrid, ...extraGrid] : standardGrid;

  const nextScheduledDay =
    nextWorkingDayOrder || (currentDayOrder < 5 ? currentDayOrder + 1 : 1);
  const isViewingNext =
    String(selectedDay) === String(nextScheduledDay) &&
    String(selectedDay) !== String(currentDayOrder);

  if (!mounted) return <div className="h-screen w-full bg-black flex items-center justify-center"><Loader className="text-white/20" /></div>;

  return (
    <div 
      className="h-screen w-full flex flex-row p-1.5 font-sans overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: 'color-mix(in srgb, var(--theme-bg), black 12%)' }}
    >
      <div className="flex-1 bg-theme-bg rounded-[24px] relative overflow-hidden flex flex-row border border-theme-border shadow-xl">
        
        {/* Left Section: Welcome & Schedule */}
        <div className="flex-[1.1] flex flex-col p-8 overflow-y-auto no-scrollbar border-r border-theme-border">
          <header className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => { Haptics.selection(); onOpenSettings(); }}
                className="w-14 h-14 rounded-2xl overflow-hidden bg-theme-surface border-none shadow-lg hover:scale-105 transition-transform"
              >
                <UserAvatar seed={profileSeed} className="w-full h-full" />
              </button>
              <div>
                <p className="text-theme-muted text-[10px] font-bold uppercase tracking-[0.3em] mb-0.5" style={{ fontFamily: 'var(--font-afacad)' }}>welcome back</p>
                <h1 className="text-theme-text text-4xl font-black tracking-tighter lowercase" style={{ fontFamily: 'var(--font-montserrat)' }}>{userName}</h1>
              </div>
            </div>
            <button 
              onClick={handleRefresh}
              disabled={isUpdating}
              className="p-3 rounded-2xl bg-theme-surface border border-theme-border text-theme-muted hover:text-theme-text transition-all disabled:opacity-50"
            >
              <RefreshCw size={18} className={isUpdating ? "animate-spin" : ""} />
            </button>
          </header>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span 
                className="text-theme-muted text-[10px] font-bold uppercase tracking-[0.25em] flex items-center gap-1.5"
                style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
              >
                {`Day Order ${selectedDay}`}
                {String(selectedDay) === String(currentDayOrder) && !isHoliday ? (
                  <span>• today</span>
                ) : isHoliday && selectedDay === nextWorkingDayOrder ? (
                  <span className="text-theme-highlight font-black tracking-widest"> • upcoming</span>
                ) : isViewingNext ? (
                  <span className="text-theme-highlight font-black tracking-widest"> • upcoming</span>
                ) : (
                  <span> • selected</span>
                )}
              </span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => handleDaySwitch("prev")} className="p-1.5 text-theme-muted hover:text-theme-text transition-all"><ChevronLeft size={20} /></button>
              <button onClick={() => handleDaySwitch("next")} className="p-1.5 text-theme-muted hover:text-theme-text transition-all"><ChevronRight size={20} /></button>
            </div>
          </div>

          <div className="max-w-md">
            <ScheduleGrid
              displayGrid={displayGrid}
              selectedDay={selectedDay}
              currentDayOrder={currentDayOrder}
              isHoliday={isHoliday}
            />
          </div>

          {extraGrid.length > 0 && (
            <button
              onClick={() => setShowExtraSlots(!showExtraSlots)}
              className="mt-4 text-theme-muted text-[9px] font-black uppercase tracking-[0.2em] hover:text-theme-text transition-colors w-fit px-3 py-1.5 bg-theme-surface rounded-full border border-theme-border"
            >
              {showExtraSlots ? "hide extra" : `+ ${extraGrid.length} extra`}
            </button>
          )}
        </div>

        {/* Right Section: Focus & Widgets */}
        <div className="flex-1 flex flex-col p-8 bg-theme-surface/20">
          <section className="mb-3">
            <div className="flex items-center gap-3 mb-6 px-1">
              <span 
                className="text-theme-muted text-[11px] font-bold lowercase tracking-[0.25em] whitespace-nowrap" 
                style={{ fontFamily: 'var(--font-montserrat)' }}
              >
                {focusLabel}
              </span>
              <div className="flex-1 h-[1.5px] bg-theme-border-line rounded-full" />
              <span className="text-theme-text text-[12px] font-black uppercase tracking-[0.2em] whitespace-nowrap" style={{ fontFamily: 'var(--font-afacad)' }}>
                {focusClass?.room || "FREE"}
              </span>
            </div>
            
            <div className="mb-6 flex flex-col justify-center">
              <div className="flex items-end justify-between gap-6 mb-2">
                <div className="flex-1 overflow-hidden">
                  <h1 
                    className="text-theme-text text-[3.5rem] font-black tracking-tighter leading-[0.92] lowercase line-clamp-2" 
                    style={{ 
                      fontFamily: 'var(--font-montserrat)', 
                      paddingBottom: '0.15em',
                      maxHeight: 'calc(3.5rem * 0.92 * 2)'
                    }}
                  >
                    {displayCourse}
                  </h1>
                </div>
                <span className="text-[1.25rem] font-bold uppercase tracking-widest text-theme-muted mb-4 whitespace-nowrap" style={{ fontFamily: 'var(--font-afacad)' }}>
                  {focusClass?.time || "--:--"}
                </span>
              </div>
              
              <div
                className="flex items-center justify-between w-full bg-theme-card border-theme-subtle px-4 py-3 rounded-full border-[1.5px] shadow-sm min-w-0 mt-4"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${currentClass && !isHoliday ? "bg-theme-text animate-pulse" : "bg-theme-text-20"}`}
                  />
                  <span
                    className="text-[14px] font-bold lowercase text-theme-text-70 truncate"
                    style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                  >
                    {isHoliday ? "holiday • " : currentClass
                      ? "current class • "
                      : isShowingTomorrow
                        ? "first class • "
                        : "status • "}
                    <strong
                      className="text-theme-text font-black uppercase tracking-widest"
                    >
                      {isHoliday ? "CHILL" : statusClass
                        ? getAcronym(
                            statusClass.name || statusClass.code || "",
                          ).toUpperCase()
                        : "FREE"}
                    </strong>
                  </span>
                </div>
                <span
                  className="text-[12px] font-bold lowercase text-theme-muted shrink-0 ml-2"
                  style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                >
                  {isHoliday ? "no classes today" : statusClass
                    ? currentClass
                      ? `ends at ${statusClass.time.split("-")[1]?.trim()}`
                      : `starts at ${statusClass.time.split("-")[0]?.trim()}`
                    : "check back later"}
                </span>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 mt-auto">
            <div
              onClick={() => router.push("/attendance")}
              className={`group w-full border-[1.5px] rounded-[24px] p-4 flex items-center gap-4 shadow-sm transition-all cursor-pointer hover:scale-[1.01] active:scale-98 ${attStyles.bg} ${attStyles.border}`}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${attStyles.iconBg}`}>
                <CheckCircle size={22} strokeWidth={2.5} className={attStyles.text} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[9px] font-bold uppercase tracking-[0.3em] mb-0.5 opacity-60 ${attStyles.text}`} style={{ fontFamily: 'var(--font-afacad)' }}>attendance</p>
                <h3 className={`text-xl font-black lowercase tracking-tight truncate ${attStyles.text}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{alertName}</h3>
                <p className={`text-sm font-medium lowercase ${attStyles.text} opacity-80`} style={{ fontFamily: 'var(--font-afacad)' }}>{alertPct}% • {alertMargin} {alertLabel}</p>
              </div>
              <ChevronRight size={24} className={attStyles.text} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => router.push("/marks")}
                className="bg-theme-card border border-theme-border rounded-[24px] p-4 flex flex-col justify-between shadow-sm hover:scale-[1.01] active:scale-98 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-theme-surface flex items-center justify-center mb-4">
                  <GoldCup size={20} strokeWidth={2.5} className="text-theme-text" />
                </div>
                <div>
                  <p className="text-theme-muted text-[9px] font-bold uppercase tracking-[0.3em] mb-1" style={{ fontFamily: 'var(--font-afacad)' }}>marks</p>
                  <h3 className="text-theme-text text-lg font-black lowercase tracking-tight truncate" style={{ fontFamily: 'var(--font-montserrat)' }}>
                    {latestMark ? getAcronym(latestMark.title || latestMark.code).toUpperCase() : "no marks"}
                  </h3>
                </div>
              </div>

              <div
                onClick={() => router.push("/calendar")}
                className="bg-theme-emphasis text-theme-bg rounded-[24px] p-4 flex flex-col justify-between shadow-sm hover:scale-[1.01] active:scale-98 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-theme-bg/10 flex items-center justify-center mb-4">
                  <Bell size={20} strokeWidth={2.5} className="text-theme-bg" />
                </div>
                <div>
                  <p className="text-theme-bg/60 text-[9px] font-bold uppercase tracking-[0.3em] mb-1" style={{ fontFamily: 'var(--font-afacad)' }}>alerts</p>
                  <h3 className="text-theme-bg text-lg font-black lowercase tracking-tight truncate" style={{ fontFamily: 'var(--font-montserrat)' }}>
                    {allAlerts[currentAlertIndex]?.title.toLowerCase() || "none"}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DesktopSidebar />
    </div>
  );
}

function GoldCup({ size, strokeWidth, className }: { size: number, strokeWidth: number, className: string }) {
  return <GraduationCap size={size} strokeWidth={strokeWidth} className={className} />;
}
