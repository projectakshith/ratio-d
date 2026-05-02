"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Bell,
  CheckCircle,
  GraduationCap,
  Loader,
  RefreshCw,
} from "lucide-react";
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
import {
  getBaseAttendance,
  getStatus,
  matchAttendance,
} from "@/utils/attendance/attendanceLogic";
import { processAndSortMarks, buildCourseMap } from "@/utils/marks/marksLogic";
import { getAcronym } from "@/utils/dashboard/timetableLogic";
import { flavorText } from "@/utils/shared/flavortext";
import calendarDataJson from "@/data/calendar_data.json";
import ScheduleGrid from "@/components/themes/minimalist/dashboard/ScheduleGrid";
import {
  getDashboardSchedule,
  getStatusLogic,
} from "@/utils/dashboard/dashboardLogic";
import { ScheduleSlot, StudentProfile } from "@/types";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Haptics } from "@/utils/shared/haptics";

export default function DesktopDashboard() {
  const router = useRouter();
  const { userData, customDisplayName, profileSeed, refreshData, isUpdating } =
    useApp();
  const { onOpenSettings } = useAppLayout();
  const academia = useAcademiaData(userData as any);

  const {
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
    return () =>
      window.removeEventListener("custom_classes_updated", fetchCustoms);
  }, []);

  const handleRefresh = useCallback(async () => {
    const creds = await EncryptionUtils.loadDecrypted("ratio_credentials");
    if (creds && userData) {
      await refreshData(creds, userData);
    }
  }, [userData, refreshData]);

  const userName = (
    customDisplayName ||
    userData?.profile?.name?.split(" ")[0] ||
    "student"
  ).toLowerCase();

  const welcomeText = useMemo(() => {
    const list = flavorText.welcomes || ["welcome back."];
    return list[Math.floor(Math.random() * list.length)];
  }, []);

  const asciiArt = useMemo(() => {
    const list = (flavorText as any).ascii || ["(¬‿¬)"];
    return list[Math.floor(Math.random() * list.length)];
  }, []);

  const profile = (userData?.profile || {}) as StudentProfile;
  const isTargetAudience =
    (profile.dept || "")
      .toLowerCase()
      .includes("computer science and engineering") &&
    String(profile.semester) === "4";

  const { allAlerts, currentAlertIndex } = useDashboardAlerts(
    academia,
    isTargetAudience,
  );

  const courseMap = useMemo(() => buildCourseMap(userData as any), [userData]);

  const { standardGrid, extraGrid } = useMemo(() => {
    const scheduleData =
      academia?.effectiveSchedule ||
      userData?.timetable ||
      userData?.schedule ||
      {};
    return getDashboardSchedule(
      scheduleData,
      customClasses,
      selectedDay,
      currentDayOrder,
      courseMap,
    );
  }, [
    userData,
    academia,
    selectedDay,
    currentDayOrder,
    customClasses,
    courseMap,
  ]);

  const { currentClass, nextClass, realDayToTrack } = useMemo(() => {
    const scheduleData =
      academia?.effectiveSchedule ||
      userData?.timetable ||
      userData?.schedule ||
      {};
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
  }, [
    academia,
    userData,
    customClasses,
    currentDayOrder,
    isHoliday,
    nextWorkingDayOrder,
    courseMap,
  ]);

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

  const statusClass = (currentClass ||
    nextClass ||
    null) as ScheduleSlot | null;

  const { alertName, alertPct, alertMargin, alertLabel, alertPctNum } =
    useMemo(() => {
      const baseAttendance = getBaseAttendance(userData?.attendance || []);
      const targetClass = (nextClass || currentClass) as ScheduleSlot | null;

      let targetSubject = baseAttendance.length > 0 ? baseAttendance[0] : null;

      if (targetClass && baseAttendance.length > 0) {
        const matched = matchAttendance(targetClass, baseAttendance);
        if (matched) targetSubject = matched;
      }

      const { val, label } = getStatus(
        parseFloat(targetSubject?.percentage || "0"),
        targetSubject?.conducted || 0,
        targetSubject?.present || 0,
      );

      return {
        alertName: (targetSubject?.title || "attendance").toLowerCase(),
        alertPct: targetSubject?.percentage || "0",
        alertPctNum: parseFloat(targetSubject?.percentage || "0"),
        alertMargin: val,
        alertLabel: label,
      };
    }, [userData, currentClass, nextClass]);

  const attStyles = useMemo(() => {
    if (alertPctNum < 75)
      return {
        bg: "status-boxbg-cooked",
        border: "status-border-cooked",
        text: "status-text-cooked",
        iconBg: "status-bg-cooked",
        arrow: "status-text-cooked",
      };
    if (alertPctNum < 85)
      return {
        bg: "status-boxbg-danger",
        border: "status-border-danger",
        text: "status-text-danger",
        iconBg: "status-bg-danger",
        arrow: "status-text-danger",
      };
    return {
      bg: "status-boxbg-safe",
      border: "status-border-safe",
      text: "status-text-safe",
      iconBg: "status-bg-safe",
      arrow: "status-text-safe",
    };
  }, [alertPctNum]);

  const latestMark = useMemo(() => {
    const allMarks = processAndSortMarks(userData?.marks || [], courseMap);
    return allMarks.filter((m) => !m.isNA)[0];
  }, [userData, courseMap]);

  const isViewingNext =
    String(selectedDay) === String(nextWorkingDayOrder) &&
    String(selectedDay) !== String(currentDayOrder);

  const row2 = useMemo(() => {
    const base = standardGrid.slice(5, 10);
    return showExtraSlots ? [...base, ...extraGrid] : base;
  }, [standardGrid, extraGrid, showExtraSlots]);

  const row1 = useMemo(() => {
    const base = standardGrid.slice(0, 5);
    if (showExtraSlots && row2.length > 5) {
      const extras = Array(row2.length - 5).fill({ active: false });
      return [...base, ...extras];
    }
    return base;
  }, [standardGrid, showExtraSlots, row2.length]);

  return (
    <>
      <div className="flex-1 flex flex-row overflow-hidden relative h-full">
        <motion.div
          initial={{ width: 520 }}
          animate={{ width: showExtraSlots ? 750 : 520 }}
          transition={{ type: "spring", damping: 25, stiffness: 120 }}
          className="shrink-0 flex flex-col p-6 overflow-y-auto no-scrollbar border-r border-theme-border h-full"
        >
          <header className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  Haptics.selection();
                  onOpenSettings();
                }}
                className="w-12 h-12 rounded-2xl overflow-hidden bg-theme-surface border-none shadow-lg hover:scale-105 transition-transform"
              >
                <UserAvatar seed={profileSeed} className="w-full h-full" />
              </button>
              <div>
                <p
                  className="text-theme-muted text-[9px] font-bold uppercase tracking-[0.3em] mb-0.5"
                  style={{ fontFamily: "var(--font-afacad)" }}
                >
                  welcome back
                </p>
                <h1
                  className="text-theme-text text-3xl font-black tracking-tighter lowercase"
                  style={{ fontFamily: "var(--font-montserrat)" }}
                >
                  {userName}
                </h1>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isUpdating}
              className="p-2.5 rounded-2xl bg-theme-surface border border-theme-border text-theme-muted hover:text-theme-text transition-all disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={isUpdating ? "animate-spin" : ""}
              />
            </button>
          </header>

          <div className="flex-1 flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`w-full border-[1.5px] rounded-[20px] p-3.5 mt-4 mb-8 flex items-center justify-between gap-3 shrink-0 ${
                isHoliday
                  ? "status-bg-safe status-border-safe"
                  : "bg-theme-surface/30 border border-theme-border"
              }`}
            >
              <div className="flex items-center gap-3">
                {isHoliday && (
                  <span className="shrink-0" style={{ fontSize: "14px" }}>
                    😎
                  </span>
                )}
                <span
                  className={`text-[11px] font-bold lowercase tracking-wide ${isHoliday ? "status-text-safe" : "text-theme-muted"}`}
                  style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                >
                  {isHoliday
                    ? "holiday today! viewing upcoming classes."
                    : welcomeText}
                </span>
              </div>
              <span
                className={`shrink-0 ${isHoliday ? "text-[10px] font-black status-text-safe font-mono tracking-tighter opacity-80" : "text-[10px] font-black opacity-60 font-mono tracking-tighter"}`}
              >
                {asciiArt}
              </span>
            </motion.div>

            <div className="flex items-center justify-between mb-3 shrink-0 px-1">
              <div className="flex items-center gap-3">
                <span
                  className="text-theme-muted text-[9px] font-bold uppercase tracking-[0.25em] flex items-center gap-1.5"
                  style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                >
                  {`Day Order ${selectedDay}`}
                  {String(selectedDay) === String(currentDayOrder) &&
                  !isHoliday ? (
                    <span>• today</span>
                  ) : isHoliday && selectedDay === nextWorkingDayOrder ? (
                    <span className="text-theme-highlight font-black tracking-widest">
                      {" "}
                      • upcoming
                    </span>
                  ) : isViewingNext ? (
                    <span className="text-theme-highlight font-black tracking-widest">
                      {" "}
                      • upcoming
                    </span>
                  ) : (
                    <span> • selected</span>
                  )}
                </span>
                {extraGrid.length > 0 && (
                  <button
                    onClick={() => {
                      Haptics.selection();
                      setShowExtraSlots(!showExtraSlots);
                    }}
                    className="bg-theme-surface text-theme-muted px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest transition-all border border-theme-border"
                    style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                  >
                    {showExtraSlots
                      ? "hide extra"
                      : `+${extraGrid.length} extra`}
                  </button>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleDaySwitch("prev")}
                  className="p-1 text-theme-muted hover:text-theme-text transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => handleDaySwitch("next")}
                  className="p-1 text-theme-muted hover:text-theme-text transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div
              className="flex flex-col gap-1 mb-6 cursor-pointer shrink-0"
              onClick={() => router.push("/timetable")}
            >
              <motion.div
                key={`${selectedDay}-r1-${showExtraSlots}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ScheduleGrid
                  displayGrid={row1}
                  selectedDay={selectedDay}
                  currentDayOrder={currentDayOrder}
                  isHoliday={isHoliday}
                  cols={row1.length}
                  isExpanded={showExtraSlots}
                />
              </motion.div>
              <motion.div
                key={`${selectedDay}-r2-${showExtraSlots}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ScheduleGrid
                  displayGrid={row2}
                  selectedDay={selectedDay}
                  currentDayOrder={currentDayOrder}
                  isHoliday={isHoliday}
                  cols={row2.length}
                  isExpanded={showExtraSlots}
                />
              </motion.div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-0 max-w-full shrink-0 mt-auto">
              <div className="bg-theme-surface/30 border border-theme-border rounded-[20px] p-3.5 flex flex-col justify-between">
                <span
                  className="text-theme-muted text-[7px] font-bold uppercase tracking-[0.2em] mb-2"
                  style={{ fontFamily: "var(--font-afacad)" }}
                >
                  starts
                </span>
                <h4
                  className="text-theme-text text-[14px] font-black tracking-tight"
                  style={{ fontFamily: "var(--font-montserrat)" }}
                >
                  {(standardGrid.find((s) => s.active) as any)?.time?.split("-")[0] ||
                    "--:--"}
                </h4>
              </div>
              <div className="bg-theme-surface/30 border border-theme-border rounded-[20px] p-3.5 flex flex-col justify-between">
                <span
                  className="text-theme-muted text-[7px] font-bold uppercase tracking-[0.2em] mb-2"
                  style={{ fontFamily: "var(--font-afacad)" }}
                >
                  ends
                </span>
                <h4
                  className="text-theme-text text-[14px] font-black tracking-tight"
                  style={{ fontFamily: "var(--font-montserrat)" }}
                >
                  {([...standardGrid]
                    .reverse()
                    .find((s) => s.active) as any)
                    ?.time?.split("-")[1] || "--:--"}
                </h4>
              </div>
              <div className="bg-theme-surface/30 border border-theme-border rounded-[20px] p-3.5 flex flex-col justify-between">
                <span
                  className="text-theme-muted text-[7px] font-bold uppercase tracking-[0.2em] mb-2"
                  style={{ fontFamily: "var(--font-afacad)" }}
                >
                  total
                </span>
                <h4
                  className="text-theme-text text-[14px] font-black tracking-tight"
                  style={{ fontFamily: "var(--font-montserrat)" }}
                >
                  {standardGrid.filter((s) => s.active).length +
                    extraGrid.length}
                </h4>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex-1 flex flex-col p-6 bg-theme-surface/20 relative gap-5 min-w-0 h-full">
          <section className="mb-0 flex flex-col gap-6">
            <div className="flex items-center gap-3 px-1">
              <span
                className="text-theme-muted text-[10px] font-bold lowercase tracking-[0.25em] whitespace-nowrap"
                style={{ fontFamily: "var(--font-montserrat)" }}
              >
                {focusLabel}
              </span>
              <div
                className="flex-1 h-[1.5px] rounded-full"
                style={{ backgroundColor: "var(--theme-text)", opacity: 0.1 }}
              />
              <span
                className="text-theme-text text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap"
                style={{ fontFamily: "var(--font-afacad)" }}
              >
                {focusClass?.room || "FREE"}
              </span>
            </div>

            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-end justify-between gap-6 mb-3 min-w-0">
                <div className="flex-1 min-w-0">
                  <h1
                    className="text-theme-text text-[2.8rem] font-black tracking-tighter leading-[0.92] lowercase line-clamp-2 overflow-hidden text-ellipsis"
                    style={{
                      fontFamily: "var(--font-montserrat)",
                      paddingBottom: "0.05em",
                    }}
                  >
                    {displayCourse}
                  </h1>
                </div>
                <span
                  className="text-[1.1rem] font-bold uppercase tracking-widest text-theme-muted whitespace-nowrap shrink-0 pb-1"
                  style={{ fontFamily: "var(--font-afacad)" }}
                >
                  {focusClass?.time || "--:--"}
                </span>
              </div>

              <div className="flex items-center justify-between w-full bg-theme-card border-theme-subtle px-3.5 py-2.5 rounded-full border-[1.5px] shadow-sm min-w-0 mt-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className={`h-2 rounded-full shrink-0 ${currentClass && !isHoliday ? "bg-theme-text animate-pulse" : "bg-theme-text-20"}`}
                    style={{ width: "8px", height: "8px" }}
                  />
                  <span
                    className="block text-[13px] font-bold lowercase text-theme-text-70 truncate"
                    style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                  >
                    {isHoliday
                      ? "holiday • "
                      : currentClass
                        ? "current class • "
                        : isShowingTomorrow
                          ? "first class • "
                          : "status • "}
                    <strong className="text-theme-text font-black uppercase tracking-widest">
                      {isHoliday
                        ? "CHILL"
                        : statusClass
                          ? getAcronym(
                              statusClass.name || statusClass.code || "",
                            ).toUpperCase()
                          : "FREE"}
                    </strong>
                  </span>
                </div>
                <span
                  className="text-[11px] font-bold lowercase text-theme-muted shrink-0 ml-2"
                  style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                >
                  {isHoliday
                    ? "no classes today"
                    : statusClass
                      ? currentClass
                        ? `ends at ${statusClass.time.split("-")[1]?.trim()}`
                        : `starts at ${statusClass.time.split("-")[0]?.trim()}`
                      : "check back later"}
                </span>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-3 mt-auto">
            <div
              onClick={() => router.push("/attendance")}
              className={`group w-full border-[1.5px] rounded-[24px] py-4 px-3.5 flex items-center gap-4 shadow-sm transition-all cursor-pointer hover:scale-[1.01] active:scale-98 ${attStyles.bg} ${attStyles.border}`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${attStyles.iconBg}`}
              >
                <CheckCircle
                  size={20}
                  strokeWidth={2.5}
                  className={attStyles.text}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-[8px] font-bold uppercase tracking-[0.3em] mb-0.5 opacity-60 ${attStyles.text}`}
                  style={{ fontFamily: "var(--font-afacad)" }}
                >
                  attendance
                </p>
                <h3
                  className={`text-lg font-black lowercase tracking-tight truncate ${attStyles.text}`}
                  style={{ fontFamily: "var(--font-montserrat)" }}
                >
                  {alertName}
                </h3>
                <p
                  className={`text-[12px] font-medium lowercase ${attStyles.text} opacity-80`}
                  style={{ fontFamily: "var(--font-afacad)" }}
                >
                  {alertPct}% • {alertMargin} {alertLabel}
                </p>
              </div>
              <ChevronRight size={20} className={attStyles.text} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => router.push("/marks")}
                className="bg-theme-card border border-theme-border rounded-[24px] p-5 min-h-[155px] flex flex-col justify-between shadow-sm hover:scale-[1.01] active:scale-98 transition-all cursor-pointer min-w-0 overflow-hidden"
              >
                <div className="w-10 h-10 rounded-xl bg-theme-surface flex items-center justify-center">
                  <GraduationCap
                    size={18}
                    strokeWidth={2.5}
                    className="text-theme-text"
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className="text-theme-muted text-[8px] font-bold uppercase tracking-[0.3em] mb-0.5"
                    style={{ fontFamily: "var(--font-afacad)" }}
                  >
                    Marks
                  </p>
                  <h3
                    className="text-theme-text text-[16px] font-black lowercase tracking-tight truncate"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    {latestMark
                      ? (
                          latestMark.courseTitle ||
                          latestMark.title ||
                          ""
                        ).toLowerCase()
                      : "no marks"}
                  </h3>
                  <p
                    className="text-[10px] font-medium text-theme-muted lowercase"
                    style={{ fontFamily: "var(--font-afacad)" }}
                  >
                    {latestMark
                      ? `${latestMark.totalGot}/${latestMark.totalMax} • ${Math.round(latestMark.percentage || 0)}% total internals`
                      : "checking for new records"}
                  </p>
                </div>
              </div>

              <div
                onClick={() => router.push("/calendar")}
                className="bg-theme-emphasis text-theme-bg rounded-[24px] p-5 min-h-[155px] flex flex-col justify-between shadow-sm hover:scale-[1.01] active:scale-98 transition-all cursor-pointer min-w-0 overflow-hidden"
              >
                <div className="w-10 h-10 rounded-xl bg-theme-bg/10 flex items-center justify-center">
                  <Bell size={18} strokeWidth={2.5} className="text-theme-bg" />
                </div>
                <div className="min-w-0">
                  <p
                    className="text-theme-bg/60 text-[8px] font-bold uppercase tracking-[0.3em] mb-0.5"
                    style={{ fontFamily: "var(--font-afacad)" }}
                  >
                    active alerts
                  </p>
                  <h3
                    className="text-theme-bg text-[16px] font-black lowercase tracking-tight truncate"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    {allAlerts[currentAlertIndex]?.desc.toLowerCase() ||
                      "no active alerts"}
                  </h3>
                  <p
                    className="text-[10px] font-medium text-theme-bg/80 lowercase truncate"
                    style={{ fontFamily: "var(--font-afacad)" }}
                  >
                    {allAlerts[currentAlertIndex]?.date || "all clear for now"}{" "}
                    • {allAlerts[currentAlertIndex]?.title.toLowerCase()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
