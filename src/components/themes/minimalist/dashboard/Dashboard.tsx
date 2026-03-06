"use client";
import React, { useEffect, useState, useMemo, useRef } from "react";
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
  parseTimeValues,
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
  const [mounted, setMounted] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startX = useRef(0);

  useEffect(() => {
    if (setIsSwipeDisabled) {
      setIsSwipeDisabled(isAlertsOpen);
    }
  }, [isAlertsOpen, setIsSwipeDisabled]);

  const [showExtraSlots, setShowExtraSlots] = useState(false);
  const [customClasses, setCustomClasses] = useState<Record<number, any[]>>({});

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

  const currentDayOrderStr =
    academia?.effectiveDayOrder || data?.dayOrder || "1";
  const currentDayOrder = parseInt(String(currentDayOrderStr)) || 1;

  const isHoliday =
    !currentDayOrderStr ||
    currentDayOrderStr === "-" ||
    currentDayOrderStr === "0" ||
    isNaN(parseInt(String(currentDayOrderStr)));

  const [selectedDay, setSelectedDay] = useState(1);

  const nextWorkingDayOrder = useMemo(() => {
    const calData = academia?.calendarData || calendarDataJson || [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const futureDays = calData
      .filter((ev: any) => {
        const evDate = new Date(ev.date);
        evDate.setHours(0, 0, 0, 0);
        return evDate > now;
      })
      .sort(
        (a: any, b: any) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

    for (const ev of futureDays) {
      const dOrder = parseInt(ev.dayOrder || ev.day_order || ev.order);
      if (!isNaN(dOrder) && dOrder >= 1 && dOrder <= 5) {
        return dOrder;
      }
    }
    return null;
  }, [academia?.calendarData]);

  const isTomorrowHoliday = useMemo(() => {
    const calData = academia?.calendarData || calendarDataJson || [];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const d = String(tomorrow.getDate()).padStart(2, "0");
    const m = months[tomorrow.getMonth()];
    const y = tomorrow.getFullYear();
    const tomorrowStr = `${d} ${m} ${y}`;

    const entry = calData.find((ev: any) => ev.date === tomorrowStr);
    return (
      !entry ||
      entry.order === "-" ||
      entry.order === "0" ||
      entry.description.toLowerCase().includes("holiday")
    );
  }, [academia?.calendarData]);

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    const scheduleData =
      academia?.effectiveSchedule || data?.timetable || data?.schedule || {};

    if (isHoliday) {
      setSelectedDay(nextWorkingDayOrder || 1);
    } else {
      const variants = [`Day ${currentDayOrder}`, String(currentDayOrder)];
      let todayData = null;
      for (const v of variants) {
        if (scheduleData[v]) {
          todayData = scheduleData[v];
          break;
        }
      }

      let lastEnd = 0;
      if (todayData) {
        Object.values(todayData).forEach((timeStr: any) => {
          const endStr = timeStr?.time?.split("-")[1] || timeStr?.split("-")[1];
          if (endStr) {
            const endMins = parseTimeValues(endStr);
            if (endMins > lastEnd) lastEnd = endMins;
          }
        });
      }

      const nowMins = new Date().getHours() * 60 + new Date().getMinutes();

      if (lastEnd > 0 && nowMins >= lastEnd) {
        setSelectedDay(
          nextWorkingDayOrder ||
            (currentDayOrder < 5 ? currentDayOrder + 1 : 1),
        );
      } else {
        setSelectedDay(currentDayOrder);
      }
    }

    setMounted(true);
    hasInitialized.current = true;

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
  }, [
    currentDayOrder,
    isHoliday,
    nextWorkingDayOrder,
    academia?.effectiveSchedule,
    data?.timetable,
    data?.schedule,
  ]);

  const handleDaySwitch = (dir: "prev" | "next") => {
    setSelectedDay((prev) =>
      dir === "prev" ? (prev > 1 ? prev - 1 : 5) : prev < 5 ? prev + 1 : 1,
    );
  };

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

      // Calculate hours scheduled today for this subject
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

      // Predict if classes were attended today
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
    }, [data?.attendance, nextClass, currentClass]);

  const attendanceCategory =
    alertPctNum < 75 ? "cooked" : alertPctNum >= 85 ? "safe" : "danger";
  const attStyles = {
    safe: {
      bg: isDark ? "bg-[#F2FFDB]/10" : "bg-[#F2FFDB]",
      border: isDark ? "border-[#85a818]/40" : "border-[#85a818]/30",
      text: isDark ? "text-[#85a818]" : "text-[#4d6600]",
      iconBg: isDark ? "bg-[#85a818]/20" : "bg-[#85a818]/10",
      subText: isDark ? "text-[#85a818]/80" : "text-[#4d6600]/70",
      arrow: isDark ? "text-[#85a818]/40" : "text-[#4d6600]/30",
    },
    danger: {
      bg: isDark ? "bg-[#FFF4E5]/10" : "bg-[#FFF4E5]",
      border: isDark ? "border-[#F97316]/40" : "border-[#F97316]/30",
      text: isDark ? "text-[#F97316]" : "text-[#EA580C]",
      iconBg: isDark ? "bg-[#EA580C]/20" : "bg-[#EA580C]/10",
      subText: isDark ? "text-[#F97316]/80" : "text-[#EA580C]/70",
      arrow: isDark ? "text-[#F97316]/60" : "text-[#EA580C]/50",
    },
    cooked: {
      bg: isDark ? "bg-[#FFEDED]/10" : "bg-[#FFEDED]",
      border: isDark ? "border-[#FF4D4D]/40" : "border-[#FF4D4D]/30",
      text: isDark ? "text-[#FF4D4D]" : "text-[#FF4D4D]",
      iconBg: isDark ? "bg-[#FF4D4D]/20" : "bg-[#FF4D4D]/10",
      subText: isDark ? "text-[#FF4D4D]/80" : "text-[#FF4D4D]/70",
      arrow: isDark ? "text-[#FF4D4D]/60" : "text-[#FF4D4D]/50",
    },
  }[attendanceCategory];

  const overallPct = calculateOverallAttendance(data?.attendance || []);
  const sortedMarks = processAndSortMarks(data?.marks || [], courseMap);
  const latestMark = sortedMarks.length > 0 ? sortedMarks[0] : null;

  const exams = useMemo(() => {
    const calData = academia?.calendarData || calendarDataJson || [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return calData
      .filter((ev: any) => {
        const d = new Date(ev.date);
        d.setHours(0, 0, 0, 0);
        return d >= now && ev.type === "exam" && isTargetAudience;
      })
      .sort(
        (a: any, b: any) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      )
      .slice(0, 2)
      .map((ev: any, i: number) => ({
        id: `exam-${i}`,
        title: "Assessment",
        desc: ev.description,
        type: "exam",
        date: ev.date,
      }));
  }, [academia?.calendarData, isTargetAudience]);

  const upcomingBreaks = useMemo(() => {
    const calData = academia?.calendarData || calendarDataJson || [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return calData
      .filter((ev: any) => {
        const d = new Date(ev.date);
        d.setHours(0, 0, 0, 0);
        return (
          d.getTime() > now.getTime() &&
          ev.description.toLowerCase().includes("holiday")
        );
      })
      .sort(
        (a: any, b: any) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      )
      .slice(0, 2)
      .map((ev: any, i: number) => ({
        id: `holiday-${i}`,
        title: "Upcoming Break",
        desc: ev.description,
        type: "holiday",
        date: ev.date,
      }));
  }, [academia?.calendarData]);

  const allAlerts = useMemo(
    () => [...exams, ...upcomingBreaks],
    [exams, upcomingBreaks],
  );

  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);

  useEffect(() => {
    if (allAlerts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAlertIndex((prev) => (prev + 1) % allAlerts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [allAlerts]);

  const handleTouchStart = (e: any) => {
    if (window.scrollY <= 0 && !isAlertsOpen) {
      startY.current = e.touches[0].clientY;
      startX.current = e.touches[0].clientX;
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: any) => {
    if (!isDragging || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const diffY = currentY - startY.current;
    const diffX = currentX - startX.current;
    if (Math.abs(diffX) > Math.abs(diffY)) return;
    if (window.scrollY <= 0 && diffY > 0) {
      if (e.cancelable) e.preventDefault();
      setPullY(Math.pow(diffY, 0.8));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (pullY > 80) {
      setIsRefreshing(true);
      setPullY(80);
      if (navigator.vibrate) navigator.vibrate(20);
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } else {
      setPullY(0);
    }
  };

  const nextScheduledDay =
    nextWorkingDayOrder || (currentDayOrder < 5 ? currentDayOrder + 1 : 1);
  const isViewingNext =
    String(selectedDay) === String(nextScheduledDay) &&
    String(selectedDay) !== String(currentDayOrder);

  const displayGrid = showExtraSlots
    ? [...standardGrid, ...extraGrid]
    : standardGrid;

  const bgClass = isDark ? "bg-[#111111]" : "bg-[#F7F7F7]";
  const textClass = isDark ? "text-white" : "text-[#111111]";
  const subTextClass = isDark ? "text-white/40" : "text-[#111111]/40";
  const focusSubTextClass = isDark ? "text-white/50" : "text-[#111111]/50";

  if (!mounted) return null;

  return (
    <div
      className={`relative w-full min-h-screen ${bgClass} overflow-x-hidden`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .custom-dotted {
            background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='14' ry='14' stroke='%23${isDark ? "ffffff20" : "11111150"}' stroke-width='2' stroke-dasharray='4%2c 8' stroke-dashoffset='0' stroke-linecap='round' opacity='0.15'/%3e%3c/svg%3e");
            border-radius: 14px;
          }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `,
        }}
      />

      <div
        className="fixed top-0 left-0 w-full flex justify-center pt-8 z-0 transition-opacity duration-300 pointer-events-none"
        style={{
          opacity: Math.min(pullY / 60, 1),
          transform: `translateY(${pullY * 0.3}px)`,
        }}
      >
        <Loader
          className={`w-6 h-6 ${isDark ? "text-white/40" : "text-black/40"}`}
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
              className="w-[50px] h-[50px] rounded-[16px] overflow-hidden active:scale-95 transition-all mt-3 shadow-[4px_4px_10px_rgba(0,0,0,0.15)] dark:shadow-[4px_4px_10px_rgba(0,0,0,0.4)] bg-transparent border-none"
            >
              <img
                src="/image.png"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </button>
            <div className="flex flex-col items-end">
              <span
                className={`text-[16px] font-semibold lowercase tracking-widest ${isDark ? "text-white/50" : "text-[#111111]/50"} mb-[-4px]`}
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                sup!
              </span>
              <span
                className={`text-[25px] leading-none font-medium lowercase tracking-tight ${textClass}`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {userName}
              </span>
            </div>
          </motion.div>

          {isHoliday && (
            <motion.div
              variants={itemVariants}
              className={`w-full ${isDark ? "bg-[#85a818]/5 border-[#85a818]/20" : "bg-[#85a818]/10 border-[#85a818]/30"} border-[1.5px] rounded-[16px] p-3 mb-4 flex items-center gap-3 shrink-0`}
            >
              <span className="text-xl">🌴</span>
              <span
                className={`text-[13px] font-bold ${isDark ? "text-[#85a818]" : "text-[#4d6600]"} lowercase tracking-wide`}
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                holiday today! viewing upcoming classes.
              </span>
            </motion.div>
          )}

          {!isHoliday && isTomorrowHoliday && (
            <motion.div
              variants={itemVariants}
              className={`w-full ${isDark ? "bg-[#85a818]/5 border-[#85a818]/20" : "bg-[#85a818]/10 border-[#85a818]/30"} border-[1.5px] rounded-[16px] p-3 mb-4 flex items-center gap-3 shrink-0`}
            >
              <span className="text-xl">😉</span>
              <span
                className={`text-[13px] font-bold ${isDark ? "text-[#85a818]" : "text-[#4d6600]"} lowercase tracking-wide`}
                style={{ fontFamily: "'Afacad', sans-serif" }}
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
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Day Order {selectedDay}
                {String(selectedDay) === String(currentDayOrder) ? (
                  <span>• today</span>
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
                  className={`${isDark ? "bg-white/10 text-white/50" : "bg-[#111111]/5 text-[#111111]/50"} px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest active:scale-95 transition-all`}
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  {showExtraSlots ? "hide extra" : `+${extraGrid.length} extra`}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDaySwitch("prev")}
                className="active:scale-75 transition-transform"
              >
                <ChevronLeft size={18} className={subTextClass} />
              </button>
              <button
                onClick={() => handleDaySwitch("next")}
                className="active:scale-75 transition-transform"
              >
                <ChevronRight size={18} className={subTextClass} />
              </button>
            </div>
          </motion.div>

          <ScheduleGrid
            displayGrid={displayGrid}
            isDark={isDark}
            selectedDay={selectedDay}
            currentDayOrder={currentDayOrder}
            isHoliday={isHoliday}
          />

          <motion.div
            variants={itemVariants}
            className="flex flex-col mb-8 shrink-0 w-full"
          >
            <div className="flex items-center gap-3 mb-2 w-full">
              <span
                className={`text-[14px] font-bold lowercase tracking-[0.25em] ${focusSubTextClass} whitespace-nowrap`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {focusLabel}
              </span>
              <div
                className={`flex-1 h-[1.5px] ${isDark ? "bg-white/10" : "bg-[#111111]/15"} rounded-full`}
              />
              <span
                className={`text-[13px] font-black uppercase tracking-[0.2em] ${textClass} whitespace-nowrap`}
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                {focusClass?.room || "FREE"}
              </span>
            </div>

            <div className="flex flex-col max-w-full">
              <span
                className={`text-[4.5rem] leading-[0.85] font-black tracking-tighter lowercase ${textClass} truncate pt-3`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {displayCourseWords[0]}
              </span>
              <div className="flex items-baseline gap-3 w-full pb-3">
                <span
                  className={`text-[4.5rem] leading-[0.85] font-black tracking-tighter lowercase ${textClass} truncate flex-1 min-w-0`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {displayCourseWords.slice(1).join(" ")}
                </span>
                <span
                  className={`text-[1.25rem] font-bold uppercase tracking-widest ${subTextClass} shrink-0`}
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  {displayTiming}
                </span>
              </div>
            </div>

            <div
              className={`flex items-center justify-between mt-3 w-full ${isDark ? "bg-white/5 border-white/10" : "bg-white border-[#111111]/10"} px-4 py-3 rounded-full border-[1.5px] shadow-sm min-w-0`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${currentClass ? (isDark ? "bg-white animate-pulse" : "bg-[#111111] animate-pulse") : isDark ? "bg-white/20" : "bg-[#111111]/20"}`}
                />
                <span
                  className={`text-[14px] font-bold lowercase ${isDark ? "text-white/70" : "text-[#111111]/70"} truncate`}
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  {currentClass
                    ? "current class • "
                    : isShowingTomorrow
                      ? "first class • "
                      : "status • "}
                  <strong
                    className={`${textClass} font-black uppercase tracking-widest`}
                  >
                    {statusClass
                      ? getAcronym(
                          statusClass.name || statusClass.code || "",
                        ).toUpperCase()
                      : "FREE"}
                  </strong>
                </span>
              </div>
              <span
                className={`text-[12px] font-bold lowercase ${subTextClass} shrink-0 ml-2`}
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                {statusClass
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
              className={`w-full border-[1.5px] rounded-[24px] p-2 pr-5 flex items-center gap-4 shadow-sm transition-all active:scale-[0.98] cursor-pointer ${attStyles.bg} ${attStyles.border}`}
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
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {alertName}
                </span>
                <span
                  className={`text-[13px] font-medium lowercase truncate ${attStyles.subText}`}
                  style={{ fontFamily: "'Afacad', sans-serif" }}
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
              className={`w-full ${isDark ? "bg-[#BBBBBB] text-black" : "bg-[#111111] text-white"} border-[1.5px] ${isDark ? "border-black/5" : "border-black/5"} rounded-[24px] p-2 pr-5 flex items-center gap-4 shadow-sm active:scale-[0.98] transition-transform cursor-pointer`}
            >
              <div
                className={`w-[50px] h-[50px] rounded-[18px] ${isDark ? "bg-black/10" : "bg-white/10"} flex items-center justify-center shrink-0`}
              >
                <Bell
                  size={20}
                  strokeWidth={2.5}
                  className={isDark ? "text-black" : "text-white"}
                />
              </div>
              <div className="flex-1 flex flex-col justify-center min-w-0 py-0.5">
                <span
                  className={`text-[15px] font-bold lowercase leading-tight truncate mb-0.5 ${isDark ? "text-black" : "text-white"}`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  academic alerts
                </span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentAlertIndex}
                    initial={{ opacity: 0, x: 5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    className={`text-[13px] font-medium lowercase ${isDark ? "text-black/60" : "text-white/70"} truncate`}
                    style={{ fontFamily: "'Afacad', sans-serif" }}
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
                className={`${isDark ? "text-black/20" : "text-white/30"} shrink-0`}
              />
            </div>

            <div
              onClick={() => setActiveTab && setActiveTab("marks")}
              className={`w-full ${isDark ? "bg-white/5 border-white/10" : "bg-white border-[#111111]/10"} border-[1.5px] rounded-[24px] p-2 pr-5 flex items-center gap-4 shadow-sm active:scale-[0.98] transition-transform cursor-pointer`}
            >
              <div
                className={`w-[50px] h-[50px] rounded-[18px] ${isDark ? "bg-white/5" : "bg-[#F4F4F4]"} flex items-center justify-center shrink-0`}
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
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  recent marks
                </span>
                <span
                  className={`text-[13px] font-medium lowercase ${subTextClass} truncate`}
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  {latestMark
                    ? `${getAcronym(latestMark.title || latestMark.courseTitle || latestMark.code || "")} • ${latestMark.displayScore}/${latestMark.max}`
                    : "no recent tests"}
                </span>
              </div>
              <ChevronRight
                size={22}
                strokeWidth={2}
                className={`${isDark ? "text-white/20" : "text-[#111111]/30"} shrink-0`}
              />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      <Alerts
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        isDark={isDark}
        exams={exams}
        upcomingBreaks={upcomingBreaks}
        subTextClass={subTextClass}
        textClass={textClass}
      />
    </div>
  );
}
