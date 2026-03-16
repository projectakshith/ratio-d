"use client";
import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Bell,
  CheckCircle,
  GraduationCap,
  Loader,
} from "lucide-react";
import {
  calculateOverallAttendance,
  getCriticalAttendance,
} from "@/utils/academia/academiaLogic";
import { processAndSortMarks, buildCourseMap } from "@/utils/marks/marksLogic";
import { getAcronym } from "@/utils/dashboard/timetableLogic";
import calendarDataJson from "@/data/calendar_data.json";
import ScheduleGrid from "./ScheduleGrid";
import Alerts from "./Alerts";
import {
  getDashboardSchedule,
  getStatusLogic,
} from "@/utils/dashboard/dashboardLogic";
import { AcademiaData, ScheduleSlot } from "@/types";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useDashboardCalendar } from "@/hooks/useDashboardCalendar";
import { useDashboardAlerts } from "@/hooks/useDashboardAlerts";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: -20, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 450, damping: 30 } as const,
  },
};

export default function Dashboard({
  data,
  academia,
  setActiveTab,
  onOpenSettings,
  isAlertsOpen,
  setIsAlertsOpen,
  setIsSwipeDisabled,
  startEntrance,
  isDark,
}: {
  data: AcademiaData;
  academia: any;
  setActiveTab: (tab: string) => void;
  onOpenSettings: () => void;
  isAlertsOpen: boolean;
  setIsAlertsOpen: (open: boolean) => void;
  setIsSwipeDisabled?: (disabled: boolean) => void;
  startEntrance: boolean;
  isDark: boolean;
}) {
  const {
    pullY,
    isRefreshing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = usePullToRefresh(isAlertsOpen);

  const {
    mounted,
    currentDayOrder,
    isHoliday,
    selectedDay,
    nextWorkingDayOrder,
    isTomorrowHoliday,
    handleDaySwitch,
  } = useDashboardCalendar(academia, data);

  useEffect(() => {
    if (setIsSwipeDisabled) {
      setIsSwipeDisabled(isAlertsOpen);
    }
  }, [isAlertsOpen, setIsSwipeDisabled]);

  const [showExtraSlots, setShowExtraSlots] = useState(false);
  const [customClasses, setCustomClasses] = useState<Record<number, any[]>>({});

  useEffect(() => {
    const fetchCustoms = () => {
      const stored = localStorage.getItem("ratio_custom_classes");
      if (stored) {
        try {
          setCustomClasses(JSON.parse(stored));
        } catch (e) {}
      }
    };
    fetchCustoms();
    window.addEventListener("custom_classes_updated", fetchCustoms);
    return () =>
      window.removeEventListener("custom_classes_updated", fetchCustoms);
  }, []);

  const globalAlias =
    typeof window !== "undefined"
      ? localStorage.getItem("app_alias_name")
      : null;
  const userName = (
    globalAlias ||
    data?.profile?.name?.split(" ")[0] ||
    "student"
  ).toLowerCase();

  const profile = data?.profile || {};
  const isTargetAudience =
    (profile.dept || "")
      .toLowerCase()
      .includes("computer science and engineering") &&
    String(profile.semester) === "4";

  const { exams, upcomingBreaks, allAlerts, currentAlertIndex } =
    useDashboardAlerts(academia, isTargetAudience);

  const courseMap = useMemo(() => buildCourseMap(data), [data]);

  const { standardGrid, extraGrid } = useMemo(() => {
    const scheduleData =
      academia?.effectiveSchedule || data?.timetable || data?.schedule || {};
    return getDashboardSchedule(
      scheduleData,
      customClasses,
      selectedDay,
      currentDayOrder,
      courseMap,
    );
  }, [data, academia, selectedDay, currentDayOrder, customClasses, courseMap]);

  const { currentClass, nextClass, realDayToTrack } = useMemo(() => {
    const scheduleData =
      academia?.effectiveSchedule || data?.timetable || data?.schedule || {};
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
    academia?.effectiveSchedule,
    data?.timetable,
    data?.schedule,
    customClasses,
    currentDayOrder,
    isHoliday,
    nextWorkingDayOrder,
    courseMap,
    academia?.calendarData,
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

  const displayCourseWords = displayCourse.split(" ");
  const displayTiming = focusClass?.time || "--:--";

  const statusClass = (currentClass ||
    nextClass ||
    null) as ScheduleSlot | null;

  const { alertName, alertPctNum, alertPct, alertMargin, alertLabel } =
    useMemo(() => {
      const targetClass = (nextClass || currentClass) as ScheduleSlot | null;
      const critical = getCriticalAttendance(data?.attendance || []);
      let targetSubject =
        critical.length > 0 ? critical[0] : data?.attendance?.[0] || null;

      if (targetClass && data?.attendance) {
        const match = data.attendance.find((a: any) => {
          const cName = (
            targetClass.name ||
            targetClass.courseTitle ||
            targetClass.course ||
            ""
          )
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
          const aName = (a.title || a.course || "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
          return (
            cName === aName || aName.includes(cName) || cName.includes(aName)
          );
        });
        if (match) targetSubject = match;
      }

      const todaySchedule =
        academia?.effectiveSchedule?.[`Day ${currentDayOrder}`] ||
        data?.timetable?.[`Day ${currentDayOrder}`] ||
        {};
      const scheduledHoursToday = Object.values(todaySchedule).filter(
        (slot: any) => {
          if (!targetSubject || !slot) return false;
          const sCode = (slot.courseCode || slot.code || "")
            .split("-")[0]
            .trim()
            .toLowerCase();
          const tCode = (targetSubject.courseCode || targetSubject.code || "")
            .trim()
            .toLowerCase();
          return sCode === tCode;
        },
      ).length;

      const conducted = targetSubject ? targetSubject.conducted : 0;
      const present = targetSubject ? conducted - targetSubject.absent : 0;

      const predictedConducted = conducted + scheduledHoursToday;
      const predictedPresent = present + scheduledHoursToday;
      const pct = conducted > 0 ? (present / conducted) * 100 : 100;
      const predictedPct =
        predictedConducted > 0
          ? (predictedPresent / predictedConducted) * 100
          : 100;

      const isSafe = pct >= 75;

      let margin = 0;
      if (isSafe && conducted > 0) {
        margin = Math.floor(present / 0.75 - conducted);
      } else if (!isSafe && conducted > 0) {
        margin = Math.ceil((0.75 * conducted - present) / 0.25);
      }

      return {
        alertName:
          targetSubject?.title?.toLowerCase() ||
          targetSubject?.course?.toLowerCase() ||
          "attendance",
        alertPctNum: pct,
        alertPct: pct.toFixed(1),
        alertPredictedPct: predictedPct.toFixed(1),
        alertMargin: Math.max(0, margin),
        alertLabel: isSafe ? "margin" : "recover",
        scheduledHoursToday,
      };
    }, [data?.attendance, nextClass, currentClass, currentDayOrder, academia?.effectiveSchedule, data?.timetable]);

  const attendanceCategory =
    alertPctNum < 75 ? "cooked" : alertPctNum >= 85 ? "safe" : "danger";
  const attStyles = {
    safe: {
      bg: "status-boxbg-safe",
      border: "status-border-safe",
      text: "status-text-safe",
      iconBg: "status-bg-safe",
      subText: "status-text-safe",
      arrow: "status-text-safe",
    },
    danger: {
      bg: "status-boxbg-danger",
      border: "status-border-danger",
      text: "status-text-danger",
      iconBg: "status-bg-danger",
      subText: "status-text-danger",
      arrow: "status-text-danger",
    },
    cooked: {
      bg: "status-boxbg-cooked",
      border: "status-border-cooked",
      text: "status-text-cooked",
      iconBg: "status-bg-cooked",
      subText: "status-text-cooked",
      arrow: "status-text-cooked",
    },
  }[attendanceCategory];

  const overallPct = calculateOverallAttendance(data?.attendance || []);
  const sortedMarks = processAndSortMarks(data?.marks || [], courseMap);
  const latestMark = sortedMarks.length > 0 ? sortedMarks[0] : null;

  const nextScheduledDay =
    nextWorkingDayOrder || (currentDayOrder < 5 ? currentDayOrder + 1 : 1);
  const isViewingNext =
    String(selectedDay) === String(nextScheduledDay) &&
    String(selectedDay) !== String(currentDayOrder);

  const displayGrid = showExtraSlots
    ? [...standardGrid, ...extraGrid]
    : standardGrid;

  const bgClass = "bg-theme-bg";
  const textClass = "text-theme-text";
  const subTextClass = "text-theme-muted";
  const focusSubTextClass = "text-theme-muted";

  if (!mounted) return null;

  return (
    <div className={`relative w-full h-full ${bgClass} overflow-hidden`}>
      <div 
        className="absolute inset-0 overflow-y-auto no-scrollbar"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="fixed top-0 left-0 w-full flex justify-center pt-8 z-0 transition-opacity duration-300 pointer-events-none"
          style={{
            opacity: Math.min(pullY / 60, 1),
            transform: `translateY(${pullY * 0.3}px)`,
          }}
        >
          <Loader
            className="w-6 h-6 text-theme-muted"
            style={{
              animation: isRefreshing ? "spin 1s linear infinite" : "none",
              transform: `rotate(${pullY * 2}deg)`,
            }}
          />
        </div>

        <motion.div
          style={{ y: pullY }}
          className={`relative z-10 min-h-screen w-full flex flex-col ${bgClass} ${textClass}`}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={startEntrance ? "show" : "hidden"}
            className="w-full flex flex-col px-6 pt-6 pb-24"
          >
            <motion.div
              variants={itemVariants}
              className="flex justify-between items-center mb-6 shrink-0"
            >
              <button
                onClick={onOpenSettings}
                className="w-[50px] h-[50px] rounded-[16px] overflow-hidden transition-all mt-3 bg-transparent border-none"
              >
                <img
                  src="/image.png"
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </button>
              <div className="flex flex-col items-end">
                <span
                  className="text-[16px] font-semibold lowercase tracking-widest text-theme-muted mb-[-4px]"
                  style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                >
                  sup!
                </span>
                <span
                  className={`text-[25px] leading-none font-medium lowercase tracking-tight ${textClass}`}
                  style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                >
                  {userName}
                </span>
              </div>
            </motion.div>

            {isHoliday && (
              <motion.div
                variants={itemVariants}
                className="w-full status-bg-safe status-border-safe border-[1.5px] rounded-[16px] p-3 mb-4 flex items-center gap-3 shrink-0"
              >
                <span className="text-xl">🌴</span>
                <span
                  className="text-[13px] font-bold status-text-safe lowercase tracking-wide"
                  style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                >
                  holiday today! viewing upcoming classes.
                </span>
              </motion.div>
            )}

            {!isHoliday && isTomorrowHoliday && (
              <motion.div
                variants={itemVariants}
                className="w-full status-bg-safe status-border-safe border-[1.5px] rounded-[16px] p-3 mb-4 flex items-center gap-3 shrink-0"
              >
                <span className="text-xl">😉</span>
                <span
                  className="text-[13px] font-bold status-text-safe lowercase tracking-wide"
                  style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                >
                  holiday tomorrow! enjoy the break.
                </span>
              </motion.div>
            )}

            <motion.div
              variants={itemVariants}
              className="flex items-center justify-between mb-3 px-1 shrink-0"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-[11px] font-bold uppercase tracking-[0.2em] ${subTextClass} flex items-center gap-1.5`}
                  style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                >
                  {`Day Order ${selectedDay}`}
                  {String(selectedDay) === String(currentDayOrder) && !isHoliday ? (
                    <span>• today</span>
                  ) : isHoliday && selectedDay === nextWorkingDayOrder ? (
                    <span className="text-[#85a818] font-black tracking-widest">
                      {" "}
                      • upcoming
                    </span>
                  ) : isViewingNext ? (
                    <span className="text-[#85a818] font-black tracking-widest">
                      {" "}
                      • upcoming
                    </span>
                  ) : (
                    <span> • selected</span>
                  )}
                </span>
                {extraGrid.length > 0 && (
                  <button
                    onClick={() => setShowExtraSlots(!showExtraSlots)}
                    className="bg-theme-surface text-theme-muted px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all"
                    style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                  >
                    {showExtraSlots ? "hide extra" : `+${extraGrid.length} extra`}
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDaySwitch("prev")}
                  className="transition-transform"
                >
                  <ChevronLeft size={18} className={subTextClass} />
                </button>
                <button
                  onClick={() => handleDaySwitch("next")}
                  className="transition-transform"
                >
                  <ChevronRight size={18} className={subTextClass} />
                </button>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <ScheduleGrid
                displayGrid={displayGrid}
                selectedDay={selectedDay}
                currentDayOrder={currentDayOrder}
                isHoliday={isHoliday}
              />
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-col mb-8 shrink-0 w-full"
            >
              <div className="flex items-center gap-3 mb-2 w-full">
                <span
                  className={`text-[14px] font-bold lowercase tracking-[0.25em] ${focusSubTextClass} whitespace-nowrap`}
                  style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                >
                  {focusLabel}
                </span>
                <div
                  className="flex-1 h-[1.5px] bg-theme-border-line rounded-full"
                />
                <span
                  className={`text-[13px] font-black uppercase tracking-[0.2em] ${textClass} whitespace-nowrap`}
                  style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                >
                  {focusClass?.room || "FREE"}
                </span>
              </div>

              <div className="flex flex-col max-w-full">
                <span
                  className={`text-[4.5rem] font-black tracking-tighter lowercase ${textClass} truncate pt-3`}
                  style={{ fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 0.85 }}
                >
                  {displayCourseWords[0]}
                </span>
                <div className="flex items-baseline gap-3 w-full pb-3">
                  <span
                    className={`text-[4.5rem] font-black tracking-tighter lowercase ${textClass} truncate flex-1 min-w-0`}
                    style={{ fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 0.85 }}
                  >
                    {displayCourseWords.slice(1).join(" ")}
                  </span>
                  <span
                    className={`text-[1.25rem] font-bold uppercase tracking-widest ${subTextClass} shrink-0`}
                    style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                  >
                    {displayTiming}
                  </span>
                </div>
              </div>

              <div
                className="flex items-center justify-between mt-3 w-full bg-theme-card border-theme-subtle px-4 py-3 rounded-full border-[1.5px] shadow-sm min-w-0"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${currentClass && !isHoliday ? "bg-theme-text animate-pulse" : "bg-theme-text-20"}`}
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
                      className={`${textClass} font-black uppercase tracking-widest`}
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
                  className={`text-[12px] font-bold lowercase ${subTextClass} shrink-0 ml-2`}
                  style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                >
                  {isHoliday ? "no classes today" : statusClass
                    ? currentClass
                      ? `ends at ${statusClass.time.split("-")[1].trim()}`
                      : `starts at ${statusClass.time.split("-")[0].trim()}`
                    : "check back later"}
                </span>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-3 shrink-0 w-full"
            >
              <div
                onClick={() => setActiveTab && setActiveTab("attendance")}
                className={`w-full border-[1.5px] rounded-[24px] p-2 pr-5 flex items-center gap-4 shadow-sm transition-all cursor-pointer ${attStyles.bg} ${attStyles.border}`}
              >
                <div
                  className={`w-[50px] h-[50px] rounded-[18px] flex items-center justify-center shrink-0 ${attStyles.iconBg}`}
                >
                  <CheckCircle
                    size={20}
                    strokeWidth={2.5}
                    className={attStyles.text}
                  />
                </div>
                <div className="flex-1 flex flex-col justify-center min-w-0 py-0.5">
                  <span
                    className={`text-[15px] font-bold lowercase leading-tight truncate mb-0.5 ${attStyles.text}`}
                    style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                  >
                    {alertName}
                  </span>
                  <span
                    className={`text-[13px] font-medium lowercase truncate ${attStyles.subText}`}
                    style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                  >
                    {alertPct}% • {alertMargin} {alertLabel}
                  </span>
                </div>
                <ChevronRight
                  size={22}
                  strokeWidth={2}
                  className={`shrink-0 ${attStyles.arrow}`}
                />
              </div>

              <div
                onClick={() => setIsAlertsOpen(true)}
                className="w-full bg-theme-emphasis text-theme-bg border-[1.5px] border-black/5 rounded-[24px] p-2 pr-5 flex items-center gap-4 shadow-sm transition-transform cursor-pointer"
              >
                <div
                  className="w-[50px] h-[50px] rounded-[18px] bg-theme-bg-alpha flex items-center justify-center shrink-0"
                >
                  <Bell
                    size={20}
                    strokeWidth={2.5}
                    className="text-theme-bg"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-center min-w-0 py-0.5">
                  <span
                    className="text-[15px] font-bold lowercase leading-tight truncate mb-0.5 text-theme-bg"
                    style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                  >
                    academic alerts
                  </span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={currentAlertIndex}
                      initial={{ opacity: 0, x: 5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      className="text-[13px] font-medium lowercase text-theme-bg-70 truncate"
                      style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                    >
                      {allAlerts[currentAlertIndex]
                        ? `${allAlerts[currentAlertIndex].title}: ${allAlerts[currentAlertIndex].desc.split(" / ")[0].substring(0, 20)}...`
                        : overallPct < 75
                          ? "attendance might be cooked."
                          : "stats looking solid."}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <ChevronRight
                  size={22}
                  strokeWidth={2}
                  className="text-theme-bg-30 shrink-0"
                />
              </div>

              <div
                onClick={() => setActiveTab && setActiveTab("marks")}
                className="w-full bg-theme-card border-theme-subtle border-[1.5px] rounded-[24px] p-2 pr-5 flex items-center gap-4 shadow-sm transition-transform cursor-pointer"
              >
                <div
                  className="w-[50px] h-[50px] rounded-[18px] bg-theme-surface flex items-center justify-center shrink-0"
                >
                  <GraduationCap
                    size={20}
                    strokeWidth={2.5}
                    className={textClass}
                  />
                </div>
                <div className="flex-1 flex flex-col justify-center min-w-0 py-0.5">
                  <span
                    className={`text-[15px] font-bold lowercase leading-tight ${textClass} truncate mb-0.5`}
                    style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                  >
                    recent marks
                  </span>
                  <span
                    className={`text-[13px] font-medium lowercase ${subTextClass} truncate`}
                    style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                  >
                    {latestMark
                      ? `${getAcronym(latestMark.title || latestMark.courseTitle || latestMark.code || "")} • ${latestMark.displayScore}/${latestMark.max}`
                      : "no recent tests"}
                  </span>
                </div>
                <ChevronRight
                  size={22}
                  strokeWidth={2}
                  className="text-theme-subtle shrink-0"
                />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      <Alerts
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        exams={exams}
        upcomingBreaks={upcomingBreaks}
      />
    </div>
  );
}
