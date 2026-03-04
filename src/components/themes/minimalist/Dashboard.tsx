"use client";
import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Bell,
  CheckCircle,
  GraduationCap,
  X,
  Plus,
  Lock,
} from "lucide-react";
import {
  calculateOverallAttendance,
  getCriticalAttendance,
  parseTimeValues,
} from "@/utils/academiaLogic";
import { processAndSortMarks, buildCourseMap } from "@/utils/marksLogic";
import { getAcronym, processSchedule } from "@/utils/timetableLogic";
import calendarDataJson from "@/data/calendar_data.json";

const sectionFade = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function MinimalHomepage({
  data,
  academia,
  setActiveTab,
  onOpenSettings,
  isAlertsOpen,
  setIsAlertsOpen,
  setIsSwipeDisabled,
}: any) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (setIsSwipeDisabled) {
      setIsSwipeDisabled(isAlertsOpen);
    }
  }, [isAlertsOpen, setIsSwipeDisabled]);
  const [newNote, setNewNote] = useState("");
  const [showExtraSlots, setShowExtraSlots] = useState(false);

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
    (profile.dept || "").toLowerCase().includes("computer science and engineering") && 
    (String(profile.semester) === "4");

  const currentDayOrder = academia?.effectiveDayOrder || data?.dayOrder || "1";

  const isHoliday =
    !currentDayOrder ||
    currentDayOrder === "-" ||
    currentDayOrder === "0" ||
    isNaN(parseInt(currentDayOrder));

  const [selectedDay, setSelectedDay] = useState(1);
  const [customClasses, setCustomClasses] = useState<Record<number, any[]>>({});

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

  useEffect(() => {
    const parsedOrder = parseInt(currentDayOrder);

    if (isHoliday) {
      setSelectedDay(nextWorkingDayOrder || 1);
    } else {
      const order = isNaN(parsedOrder) ? 1 : parsedOrder;
      const scheduleData =
        academia?.effectiveSchedule || data?.timetable || data?.schedule || {};
      const todayData = scheduleData[`Day ${order}`] || {};

      let lastEnd = 0;
      Object.values(todayData).forEach((timeStr: any) => {
        const endStr = timeStr?.time?.split("-")[1] || timeStr?.split("-")[1];
        if (endStr) {
          const endMins = parseTimeValues(endStr);
          if (endMins > lastEnd) lastEnd = endMins;
        }
      });

      const nowMins = new Date().getHours() * 60 + new Date().getMinutes();

      if (lastEnd > 0 && nowMins >= lastEnd) {
        setSelectedDay(nextWorkingDayOrder || (order < 5 ? order + 1 : 1));
      } else {
        setSelectedDay(order);
      }
    }

    setMounted(true);

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

    const processedDay = processSchedule(
      scheduleData,
      customClasses,
      selectedDay,
      parseInt(currentDayOrder) || 1,
      courseMap,
    );

    const targetStarts = [480, 530, 580, 635, 690, 745, 800, 855, 905, 955];
    const std = Array(10)
      .fill(null)
      .map((_, i) => ({ id: `std-empty-${i}`, active: false }));
    const ext: any[] = [];

    processedDay.forEach((cls: any, i: number) => {
      if (cls.type === "break") return;

      let closestIdx = -1;
      let minDiff = 9999;

      for (let j = 0; j < 10; j++) {
        const diff = Math.abs(cls.minutesStart - targetStarts[j]);
        if (diff <= 35 && diff < minDiff) {
          closestIdx = j;
          minDiff = diff;
        }
      }

      const mappedCls = {
        ...cls,
        sub: cls.code,
        active: true,
        isPractical: cls.type === "lab",
      };

      if (closestIdx !== -1 && !std[closestIdx].active) {
        std[closestIdx] = {
          ...std[closestIdx],
          ...mappedCls,
          id: `std-active-${closestIdx}`,
        };
      } else {
        ext.push({ ...mappedCls, id: `ext-${cls.time}-${i}` });
      }
    });

    return { standardGrid: std, extraGrid: ext };
  }, [data, academia, selectedDay, currentDayOrder, customClasses, courseMap]);

  const isViewingToday =
    String(selectedDay) === String(currentDayOrder) && !isHoliday;

  const { currentClass, nextClass } = useMemo(() => {
    const scheduleData =
      academia?.effectiveSchedule || data?.timetable || data?.schedule || {};
    const processedDay = processSchedule(
      scheduleData,
      customClasses,
      selectedDay,
      parseInt(currentDayOrder) || 1,
      courseMap,
    );
    const nowMins = new Date().getHours() * 60 + new Date().getMinutes();

    let curr = null;
    let nxt = null;

    if (isViewingToday) {
      for (const cls of processedDay) {
        if (cls.type === "break") continue;
        if (nowMins >= cls.minutesStart && nowMins < cls.minutesEnd) {
          curr = cls;
        } else if (cls.minutesStart > nowMins && !nxt) {
          nxt = cls;
        }
      }
    } else {
      const activeClasses = processedDay.filter((c: any) => c.type !== "break");
      if (activeClasses.length > 0) {
        nxt = activeClasses[0];
      }
    }

    return { currentClass: curr, nextClass: nxt };
  }, [
    data,
    academia,
    selectedDay,
    currentDayOrder,
    customClasses,
    courseMap,
    isViewingToday,
  ]);

  const isLastClassActive = currentClass && !nextClass && isViewingToday;
  const focusClass = isLastClassActive ? currentClass : nextClass || null;

  let focusLabel = "next up";
  if (isViewingToday && isLastClassActive) focusLabel = "happening now";
  if (!isViewingToday) focusLabel = "first class";

  const displayCourse = (
    focusClass?.name ||
    focusClass?.courseTitle ||
    focusClass?.course ||
    (isViewingToday ? "done for the day" : "free time")
  ).toLowerCase();

  const displayCourseWords = displayCourse.split(" ");
  const displayTiming = focusClass?.time || "--:--";

  const { alertName, alertPctNum, alertPct, alertMargin, alertLabel } =
    useMemo(() => {
      const targetClass = nextClass || currentClass;
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

      const conducted = targetSubject ? targetSubject.conducted : 0;
      const present = targetSubject ? conducted - targetSubject.absent : 0;
      const pct = conducted > 0 ? (present / conducted) * 100 : 100;
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
        alertMargin: Math.max(0, margin),
        alertLabel: isSafe ? "margin" : "recover",
      };
    }, [data?.attendance, nextClass, currentClass]);

  const attendanceCategory =
    alertPctNum < 75 ? "cooked" : alertPctNum >= 85 ? "safe" : "danger";
  const attStyles = {
    safe: {
      bg: "bg-[#F2FFDB]",
      border: "border-[#85a818]/30",
      text: "text-[#4d6600]",
      iconBg: "bg-[#85a818]/10",
      subText: "text-[#4d6600]/70",
      arrow: "text-[#4d6600]/30",
    },
    danger: {
      bg: "bg-[#FFF4E5]",
      border: "border-[#F97316]/30",
      text: "text-[#EA580C]",
      iconBg: "bg-[#EA580C]/10",
      subText: "text-[#EA580C]/70",
      arrow: "text-[#EA580C]/50",
    },
    cooked: {
      bg: "bg-[#FFEDED]",
      border: "border-[#FF4D4D]/30",
      text: "text-[#FF4D4D]",
      iconBg: "bg-[#FF4D4D]/10",
      subText: "text-[#FF4D4D]/70",
      arrow: "text-[#FF4D4D]/50",
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
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
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
        return d.getTime() > now.getTime() && ev.description.toLowerCase().includes("holiday");
      })
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 2)
      .map((ev: any, i: number) => ({
        id: `holiday-${i}`,
        title: "Upcoming Break",
        desc: ev.description,
        type: "holiday",
        date: ev.date,
      }));
  }, [academia?.calendarData]);

  const allAlerts = useMemo(() => [...exams, ...upcomingBreaks], [exams, upcomingBreaks]);

  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);

  useEffect(() => {
    if (allAlerts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAlertIndex((prev) => (prev + 1) % allAlerts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [allAlerts]);

  const [personalNotes, setPersonalNotes] = useState<any[]>([]);

  useEffect(() => {
    const savedPrivate = localStorage.getItem("ratio_private_notes");
    if (savedPrivate) {
      try {
        setPersonalNotes(JSON.parse(savedPrivate));
      } catch (e) {}
    }
  }, []);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const newNoteObj = { id: Date.now(), text: newNote, date: "just now" };
    const updatedNotes = [newNoteObj, ...personalNotes];
    setPersonalNotes(updatedNotes);
    localStorage.setItem("ratio_private_notes", JSON.stringify(updatedNotes));
    setNewNote("");
  };

  const renderSlot = (slot: any, index: number) => {
    if (!slot.active) {
      return (
        <div
          key={slot.id}
          className="aspect-square bg-[#EFEFEF]/50 custom-dotted"
        />
      );
    }

    let boxClass = "bg-white border-[#111111]/20";
    let topText = "text-[#111111]/50";
    let midText = "text-[#111111]";
    let botText = "text-[#111111]/70";

    if (slot.isCurrent && isViewingToday) {
      boxClass =
        "bg-[#111111] border-[#111111] shadow-[0_6px_16px_rgba(0,0,0,0.2)] scale-105 z-10";
      topText = "text-white/80";
      midText = "text-white";
      botText = "text-white/80";
    } else if (slot.isPractical) {
      boxClass = "bg-[#e0f2fe] border-[#bae6fd]";
      topText = "text-[#111111]/50";
      midText = "text-[#111111]";
      botText = "text-[#111111]/70";
    }

    return (
      <div
        key={`${slot.id}-${index}`}
        className={`aspect-square rounded-[14px] border-[1.5px] flex flex-col items-center justify-center gap-[4px] p-1 transition-all ${boxClass}`}
      >
        <span
          className={`text-[10px] font-bold uppercase tracking-widest leading-none text-center ${topText}`}
          style={{ fontFamily: "'Afacad', sans-serif" }}
        >
          {slot.room}
        </span>
        <span
          className={`text-[17px] font-black uppercase tracking-wider leading-none ${midText}`}
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {slot.sub}
        </span>
        <span
          className={`text-[10.5px] font-bold tracking-tight leading-none text-center ${botText}`}
          style={{ fontFamily: "'Afacad', sans-serif" }}
        >
          {slot.time}
        </span>
      </div>
    );
  };

  if (!mounted) return null;

  const displayGrid = showExtraSlots
    ? [...standardGrid, ...extraGrid]
    : standardGrid;

  const currentAlert = allAlerts[currentAlertIndex];

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .custom-dotted {
            background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='14' ry='14' stroke='%2311111150' stroke-width='2' stroke-dasharray='4%2c 8' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e");
            border-radius: 14px;
          }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `,
        }}
      />

      <div className="min-h-screen w-full flex flex-col bg-[#F7F7F7] text-[#111111] px-6 pt-6 pb-24 overflow-x-hidden">
        <motion.div
          variants={sectionFade}
          initial="hidden"
          animate="show"
          className="flex justify-between items-center mb-6 shrink-0"
        >
          <button
            onClick={onOpenSettings}
            className="w-[50px] h-[50px] rounded-[16px] bg-transparent flex items-center justify-center overflow-hidden active:scale-95 transition-transform"
          >
            <img
              src="/image.png"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </button>
          <div className="flex flex-col items-end">
            <span
              className="text-[16px] font-semibold lowercase tracking-widest text-[#111111]/50 mb-[-4px]"
              style={{ fontFamily: "'Afacad', sans-serif" }}
            >
              sup!
            </span>
            <span
              className="text-[25px] leading-none font-medium lowercase tracking-tight text-[#111111]"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {userName}
            </span>
          </div>
        </motion.div>

        {isHoliday && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="w-full bg-[#85a818]/10 border-[1.5px] border-[#85a818]/30 rounded-[16px] p-3 mb-4 flex items-center gap-3 shrink-0"
          >
            <span className="text-xl">🌴</span>
            <span
              className="text-[13px] font-bold text-[#4d6600] lowercase tracking-wide"
              style={{ fontFamily: "'Afacad', sans-serif" }}
            >
              holiday today! viewing upcoming classes.
            </span>
          </motion.div>
        )}

        <motion.div
          variants={sectionFade}
          initial="hidden"
          animate="show"
          className="flex items-center justify-between mb-3 px-1 shrink-0"
        >
          <div className="flex items-center gap-3">
            <span
              className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#111111]/40 flex items-center gap-1.5"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Day Order {selectedDay}
              {isViewingToday ? (
                <span>• today</span>
              ) : (
                <span className="text-[#85a818] font-black tracking-widest">
                  {" "}
                  • upcoming
                </span>
              )}
            </span>
            {extraGrid.length > 0 && (
              <button
                onClick={() => setShowExtraSlots(!showExtraSlots)}
                className="bg-[#111111]/5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest text-[#111111]/50 active:scale-95 transition-all"
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
              <ChevronLeft size={18} className="text-[#111111]/40" />
            </button>
            <button
              onClick={() => handleDaySwitch("next")}
              className="active:scale-75 transition-transform"
            >
              <ChevronRight size={18} className="text-[#111111]/40" />
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-5 gap-[8px] mb-8 shrink-0 transition-all">
          {displayGrid.map((slot, i) => renderSlot(slot, i))}
        </div>

        <motion.div
          variants={sectionFade}
          initial="hidden"
          animate="show"
          className="flex flex-col mb-8 shrink-0 w-full"
        >
          <div className="flex items-center gap-3 mb-2 w-full">
            <span
              className="text-[14px] font-bold lowercase tracking-[0.25em] text-[#111111]/50 whitespace-nowrap"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {focusLabel}
            </span>
            <div className="flex-1 h-[1.5px] bg-[#111111]/15 rounded-full" />
            <span
              className="text-[13px] font-black uppercase tracking-[0.2em] text-[#111111] whitespace-nowrap"
              style={{ fontFamily: "'Afacad', sans-serif" }}
            >
              DO {String(selectedDay).padStart(2, "0")}
            </span>
          </div>

          <div className="flex flex-col max-w-full">
            <span
              className="text-[4.5rem] leading-[0.85] font-black tracking-tighter lowercase text-[#111111] truncate pt-3"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {displayCourseWords[0]}
            </span>
            <div className="flex items-baseline gap-3 w-full pb-3">
              <span
                className="text-[4.5rem] leading-[0.85] font-black tracking-tighter lowercase text-[#111111] truncate flex-1 min-w-0"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {displayCourseWords.slice(1).join(" ")}
              </span>
              <span
                className="text-[1.25rem] font-bold uppercase tracking-widest text-[#111111]/40 shrink-0"
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                {displayTiming}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 w-full bg-white px-4 py-3 rounded-full border-[1.5px] border-[#111111]/10 shadow-sm min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${isViewingToday && currentClass ? "bg-[#111111] animate-pulse" : "bg-[#111111]/20"}`}
              />
              <span
                className="text-[14px] font-bold lowercase text-[#111111]/70 truncate"
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                {isViewingToday && currentClass
                  ? "current class • "
                  : "first class • "}
                <strong className="text-[#111111] font-black uppercase tracking-widest">
                  {focusClass
                    ? getAcronym(
                        focusClass.name ||
                          focusClass.courseTitle ||
                          focusClass.course ||
                          focusClass.code,
                      ).toUpperCase()
                    : "FREE"}
                </strong>
              </span>
            </div>
            <span
              className="text-[12px] font-bold lowercase text-[#111111]/40 shrink-0 ml-2"
              style={{ fontFamily: "'Afacad', sans-serif" }}
            >
              {focusClass
                ? isViewingToday && currentClass
                  ? `ends at ${focusClass.time.split("-")[1].trim()}`
                  : `starts at ${focusClass.time.split("-")[0].trim()}`
                : "check back later"}
            </span>
          </div>
        </motion.div>

        <motion.div
          variants={sectionFade}
          initial="hidden"
          animate="show"
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
            className="w-full bg-[#111111] text-white border-[1.5px] border-[#111111] rounded-[24px] p-2 pr-5 flex items-center gap-4 shadow-md active:scale-[0.98] transition-transform cursor-pointer"
          >
            <div className="w-[50px] h-[50px] rounded-[18px] bg-white/10 flex items-center justify-center shrink-0">
              <Bell size={20} strokeWidth={2.5} className="text-white" />
            </div>
            <div className="flex-1 flex flex-col justify-center min-w-0 py-0.5">
              <span
                className="text-[15px] font-bold lowercase leading-tight truncate mb-0.5 text-white"
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
                  className="text-[13px] font-medium lowercase text-white/70 truncate"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  {currentAlert
                    ? `${currentAlert.title}: ${currentAlert.desc.split(' / ')[0].substring(0, 20)}...`
                    : overallPct < 75
                      ? "attendance might be cooked."
                      : "stats looking solid."}
                </motion.span>
              </AnimatePresence>
            </div>
            <ChevronRight
              size={22}
              strokeWidth={2}
              className="text-white/30 shrink-0"
            />
          </div>

          <div
            onClick={() => setActiveTab && setActiveTab("marks")}
            className="w-full bg-white border-[1.5px] border-[#111111]/10 rounded-[24px] p-2 pr-5 flex items-center gap-4 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
          >
            <div className="w-[50px] h-[50px] rounded-[18px] bg-[#F4F4F4] flex items-center justify-center shrink-0">
              <GraduationCap
                size={20}
                strokeWidth={2.5}
                className="text-[#111111]"
              />
            </div>
            <div className="flex-1 flex flex-col justify-center min-w-0 py-0.5">
              <span
                className="text-[15px] font-bold lowercase leading-tight text-[#111111] truncate mb-0.5"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                recent marks
              </span>
              <span
                className="text-[13px] font-medium lowercase text-[#111111]/50 truncate"
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                {latestMark
                  ? `${getAcronym(latestMark.title || latestMark.courseTitle || latestMark.code)} • ${latestMark.displayScore}/${latestMark.max}`
                  : "no recent tests"}
              </span>
            </div>
            <ChevronRight
              size={22}
              strokeWidth={2}
              className="text-[#111111]/30 shrink-0"
            />
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isAlertsOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            drag="y"
            dragDirectionLock
            dragConstraints={{ top: 0, bottom: 500 }}
            dragElastic={{ top: 0, bottom: 0.8 }}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                setIsAlertsOpen(false);
              }
            }}
            className="fixed inset-0 bg-[#111111] z-[60] flex flex-col px-6 pt-10 pb-6 overflow-hidden"
          >
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 shrink-0" />
            <div className="flex justify-between items-start w-full shrink-0 mb-6">
              <div className="flex flex-col">
                <span
                  className="text-[32px] leading-[1] font-black uppercase tracking-[0.15em] text-white"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  ALERTS
                </span>
                <span
                  className="text-[10px] font-bold lowercase tracking-[0.2em] text-[#85a818] mt-1.5"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  official & personal
                </span>
              </div>
              <button
                onClick={() => setIsAlertsOpen(false)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-95 transition-all shrink-0"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-10 pb-4">
              <div className="flex flex-col gap-3 mt-4">
                <div className="flex items-center gap-3 w-full">
                  <span
                    className="text-[11px] font-bold lowercase tracking-[0.2em] text-[#85a818] whitespace-nowrap"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    my private notes
                  </span>
                  <div className="flex-1 h-[1.5px] bg-[#85a818]/20 rounded-full" />
                </div>

                {personalNotes.length === 0 ? (
                  <div className="w-full flex flex-col items-center justify-center py-6 gap-2 opacity-30">
                    <div className="w-full h-px bg-white/20 rounded-full" />
                    <div className="w-3/4 h-px bg-white/20 rounded-full" />
                    <div className="w-1/2 h-px bg-white/20 rounded-full" />
                  </div>
                ) : (
                  personalNotes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-white/5 border-[1.5px] border-white/10 rounded-[20px] p-4 flex flex-col"
                    >
                      <span
                        className="text-[15px] font-bold text-white/80 lowercase leading-snug mb-3"
                        style={{ fontFamily: "'Afacad', sans-serif" }}
                      >
                        {note.text}
                      </span>
                      <span
                        className="text-[10px] font-bold tracking-widest uppercase text-white/30"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {note.date}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 w-full">
                  <span
                    className="text-[11px] font-bold lowercase tracking-[0.25em] text-[#8b5cf6] whitespace-nowrap"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    assessments
                  </span>
                  <div className="flex-1 h-[1.5px] bg-[#8b5cf6]/20 rounded-full" />
                </div>

                {exams.length === 0 ? (
                  <div className="w-full flex flex-col items-center justify-center py-6 gap-2 opacity-30">
                    <div className="w-full h-px bg-white/20 rounded-full" />
                    <div className="w-3/4 h-px bg-white/20 rounded-full" />
                    <div className="w-1/2 h-px bg-white/20 rounded-full" />
                  </div>
                ) : (
                  exams.map((alert) => (
                    <div
                      key={alert.id}
                      className="bg-[#8b5cf6]/5 border border-[#8b5cf6]/30 rounded-[20px] p-5 flex flex-col relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[100px] bg-[#8b5cf6]/10 pointer-events-none" />
                      <div className="flex items-center gap-3 mb-4 z-10">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0 bg-[#8b5cf6] text-white" style={{ fontFamily: "'Afacad', sans-serif" }}>exam</span>
                        <span className="text-[12px] font-bold text-white/50 tracking-wider uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>{alert.date}</span>
                      </div>
                      <span className="text-[20px] font-black tracking-wide text-white leading-tight mb-4 z-10" style={{ fontFamily: "'Montserrat', sans-serif" }}>{alert.title}</span>
                      <div className="flex flex-col gap-2.5 z-10">
                        {alert.desc.split(" / ").map((sub: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
                            {alert.desc.includes("/") && <div className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-[#8b5cf6]" />}
                            <span className="text-[15px] font-bold text-white/90 lowercase leading-snug" style={{ fontFamily: "'Afacad', sans-serif" }}>{sub.trim()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 w-full">
                  <span
                    className="text-[11px] font-bold lowercase tracking-[0.25em] text-[#FF4D4D] whitespace-nowrap"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    upcoming breaks
                  </span>
                  <div className="flex-1 h-[1.5px] bg-[#FF4D4D]/20 rounded-full" />
                </div>

                {upcomingBreaks.length === 0 ? (
                  <div className="w-full flex flex-col items-center justify-center py-6 gap-2 opacity-30">
                    <div className="w-full h-px bg-white/20 rounded-full" />
                    <div className="w-3/4 h-px bg-white/20 rounded-full" />
                    <div className="w-1/2 h-px bg-white/20 rounded-full" />
                  </div>
                ) : (
                  upcomingBreaks.map((alert) => (
                    <div
                      key={alert.id}
                      className="bg-[#FF4D4D]/5 border border-[#FF4D4D]/30 rounded-[20px] p-5 flex flex-col relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[100px] bg-[#FF4D4D]/10 pointer-events-none" />
                      <div className="flex items-center gap-3 mb-4 z-10">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0 bg-[#FF4D4D] text-white" style={{ fontFamily: "'Afacad', sans-serif" }}>holiday</span>
                        <span className="text-[12px] font-bold text-white/50 tracking-wider uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>{alert.date}</span>
                      </div>
                      <span className="text-[20px] font-black tracking-wide text-white leading-tight mb-4 z-10" style={{ fontFamily: "'Montserrat', sans-serif" }}>{alert.title}</span>
                      <div className="flex flex-col gap-2.5 z-10">
                        {alert.desc.split(" / ").map((sub: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
                            {alert.desc.includes("/") && <div className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-[#FF4D4D]" />}
                            <span className="text-[15px] font-bold text-white/90 lowercase leading-snug" style={{ fontFamily: "'Afacad', sans-serif" }}>{sub.trim()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-auto shrink-0 pt-4 bg-[#111111]">
              <div className="flex items-center gap-2 p-1.5 rounded-[20px] border-[1.5px] bg-white/10 border-transparent transition-colors">
                <div className="w-10 h-10 rounded-[14px] flex items-center justify-center bg-white/10 text-white/60 shrink-0">
                  <Lock size={18} strokeWidth={2.5} />
                </div>

                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                  placeholder="add a private note..."
                  className="flex-1 bg-transparent text-white outline-none px-2 text-[14px] font-bold placeholder:font-medium placeholder:text-white/30 lowercase"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                />

                <button
                  onClick={handleAddNote}
                  className="w-10 h-10 rounded-[14px] flex items-center justify-center active:scale-95 transition-all shrink-0 bg-white text-[#111111]"
                >
                  <Plus size={20} strokeWidth={3} />
                </button>
              </div>
              <div className="flex justify-center mt-2">
                <span
                  className="text-[10px] font-bold tracking-[0.1em] lowercase text-white/30"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  note will only be visible to you
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
