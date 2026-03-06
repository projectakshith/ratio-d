"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, User, Plus, X, ChevronRight } from "lucide-react";
import {
  buildCourseMap,
  processSchedule,
  getDayOverview,
  parseTimetableTime,
} from "@/utils/timetableLogic";
import calendarDataJson from "@/data/calendar_data.json";

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

export default function MinimalTimetable({
  data,
  academia,
  setIsSwipeDisabled,
  startEntrance,
  isDark,
}: any) {
  const [mounted, setMounted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const initialSet = useRef(false);
  const schedule = academia?.effectiveSchedule || {};
  const dayOrderStr = academia?.effectiveDayOrder || data?.dayOrder || "1";
  const dayOrder = parseInt(String(dayOrderStr)) || 1;

  const isHoliday =
    !dayOrderStr ||
    dayOrderStr === "-" ||
    dayOrderStr === "0" ||
    isNaN(parseInt(String(dayOrderStr)));

  const [activeDay, setActiveDay] = useState<number>(1);
  const [isAddingClass, setIsAddingClass] = useState(false);

  useEffect(() => {
    if (setIsSwipeDisabled) {
      setIsSwipeDisabled(isAddingClass);
    }
  }, [isAddingClass, setIsSwipeDisabled]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [newSub, setNewSub] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("08:50");
  const [newType, setNewType] = useState<"theory" | "lab">("theory");

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
    setMounted(true);

    if (
      !initialSet.current &&
      (Object.keys(schedule).length > 0 || isHoliday)
    ) {
      if (isHoliday) {
        setActiveDay(nextWorkingDayOrder || 1);
      } else if (!isNaN(dayOrder) && dayOrder >= 1 && dayOrder <= 5) {
        const todayData = schedule[`Day ${dayOrder}`] || {};
        let lastEnd = 0;
        Object.keys(todayData).forEach((time) => {
          const endStr = time.split("-")[1];
          if (endStr) {
            const endMins = parseTimetableTime(endStr);
            if (endMins > lastEnd) lastEnd = endMins;
          }
        });

        const nowMins = new Date().getHours() * 60 + new Date().getMinutes();

        if (lastEnd > 0 && nowMins >= lastEnd) {
          setActiveDay(
            nextWorkingDayOrder || (dayOrder < 5 ? dayOrder + 1 : 1),
          );
        } else {
          setActiveDay(dayOrder);
        }
      }
      initialSet.current = true;
    }

    const updateCustomClasses = () => {
      const stored = localStorage.getItem("ratio_custom_classes");
      if (stored) {
        try {
          setCustomClasses(JSON.parse(stored));
        } catch (e) {}
      }
    };
    updateCustomClasses();
    window.addEventListener("custom_classes_updated", updateCustomClasses);
    return () =>
      window.removeEventListener("custom_classes_updated", updateCustomClasses);
  }, [dayOrder, schedule, isHoliday, nextWorkingDayOrder]);

  const courseMap = useMemo(() => buildCourseMap(data), [data]);

  const handleAddClass = () => {
    if (!newSub.trim() || !newRoom.trim() || !startTime || !endTime) return;

    const stored = localStorage.getItem("ratio_custom_classes");
    const currentCustoms = stored ? JSON.parse(stored) : {};

    const newClassItem = {
      id: `custom-${Date.now()}`,
      code: newSub,
      courseTitle: newSub,
      course: newSub,
      time: `${startTime} - ${endTime}`,
      room: newRoom,
      faculty: "user added",
      slot: newType === "lab" ? "P1" : "A1",
      type: newType,
      isCustom: true,
    };

    const updated = {
      ...currentCustoms,
      [activeDay]: [...(currentCustoms[activeDay] || []), newClassItem],
    };

    localStorage.setItem("ratio_custom_classes", JSON.stringify(updated));
    window.dispatchEvent(new Event("custom_classes_updated"));

    setNewSub("");
    setNewRoom("");
    setStartTime("08:00");
    setEndTime("08:50");
    setIsAddingClass(false);
    setRefreshKey((prev) => prev + 1);
  };

  const handleDeleteCustom = (day: number, timeStr: string) => {
    const stored = localStorage.getItem("ratio_custom_classes");
    if (!stored) return;
    const currentCustoms = JSON.parse(stored);

    if (currentCustoms[day]) {
      currentCustoms[day] = currentCustoms[day].filter(
        (c: any) => c.time !== timeStr,
      );
      localStorage.setItem(
        "ratio_custom_classes",
        JSON.stringify(currentCustoms),
      );
      window.dispatchEvent(new Event("custom_classes_updated"));
      setRefreshKey((prev) => prev + 1);
    }
  };

  const currentSchedule = useMemo(() => {
    return processSchedule(
      schedule,
      customClasses,
      activeDay,
      dayOrder,
      courseMap,
    );
  }, [schedule, customClasses, activeDay, dayOrder, courseMap, refreshKey]);

  const isViewingToday = String(activeDay) === String(dayOrder) && !isHoliday;
  const nextScheduledDay =
    nextWorkingDayOrder || (dayOrder < 5 ? dayOrder + 1 : 1);
  const isViewingNext =
    String(activeDay) === String(nextScheduledDay) && !isViewingToday;

  useEffect(() => {
    if (mounted && isViewingToday) {
      const timer = setTimeout(() => {
        const currentClassElement = document.getElementById(
          "active-class-indicator",
        );
        if (currentClassElement) {
          currentClassElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [mounted, activeDay, isViewingToday]);

  if (!mounted) return null;
  const overview = getDayOverview(currentSchedule);

  const bgClass = isDark ? "bg-[#111111]" : "bg-[#F7F7F7]";
  const textClass = isDark ? "text-white" : "text-[#111111]";
  const subTextClass = isDark ? "text-white/40" : "text-[#111111]/40";
  const cardBg = isDark ? "bg-white/5" : "bg-white";
  const cardBorder = isDark ? "border-white/10" : "border-[#111111]/5";

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .break-dotted {
            background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='20' ry='20' stroke='%23${isDark ? "ffffff20" : "111111"}' stroke-width='2' stroke-dasharray='6%2c 12' stroke-dashoffset='0' stroke-linecap='round' opacity='0.15'/%3e%3c/svg%3e");
            border-radius: 20px;
          }
        `,
        }}
      />

      <div className={`absolute inset-0 ${bgClass}`}>
        <div
          ref={scrollContainerRef}
          className="h-full w-full overflow-y-auto no-scrollbar px-6 pt-10 pb-[280px] flex flex-col relative z-10"
        >
          {isHoliday && (
            <div
              className={`w-full ${isDark ? "bg-[#85a818]/5 border-[#85a818]/20" : "bg-[#85a818]/10 border-[#85a818]/30"} border-[1.5px] rounded-[16px] p-3 mb-6 flex items-center justify-center gap-2 shrink-0`}
            >
              <span className="text-xl">🌴</span>
              <span
                className={`text-[13px] font-bold ${isDark ? "text-[#85a818]" : "text-[#4d6600]"} lowercase tracking-wide`}
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                holiday today!
              </span>
            </div>
          )}

          <div className="w-full flex flex-col items-center mt-2 mb-8 shrink-0 relative">
            <span
              className={`text-[12px] font-bold lowercase tracking-[0.3em] mb-3 text-center transition-colors ${isViewingToday ? subTextClass : isViewingNext ? "text-[#85a818]" : subTextClass}`}
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {isViewingToday
                ? "current day order"
                : isViewingNext
                  ? "upcoming day order"
                  : "selected day order"}
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-[7.5rem] leading-[0.8] font-black tracking-tighter ${textClass} text-center`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {String(activeDay).padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="flex flex-col mb-8 w-full shrink-0">
            <button
              onClick={() => setIsAddingClass(true)}
              className="w-full relative group active:scale-[0.98] transition-all duration-200"
            >
              <div
                className={`absolute inset-0 ${isDark ? "bg-white" : "bg-[#111111]"} rounded-[24px] translate-y-1.5 transition-transform group-hover:translate-y-2`}
              />
              <div
                className={`relative w-full border-[1.5px] ${isDark ? "border-white bg-[#111111] text-white" : "border-[#111111] bg-white text-[#111111]"} rounded-[24px] p-4 flex items-center justify-between transition-transform group-hover:-translate-y-0.5 group-active:translate-y-1`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full ${isDark ? "bg-white/5" : "bg-[#111111]/5"} flex items-center justify-center`}
                  >
                    <Plus
                      size={20}
                      strokeWidth={2.5}
                      className={isDark ? "text-white" : "text-[#111111]"}
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <span
                      className="text-[14px] font-black uppercase tracking-widest leading-none"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      CUSTOM CLASS
                    </span>
                    <span
                      className={`text-[10px] font-bold lowercase tracking-wider ${isDark ? "text-white/40" : "text-[#111111]/40"} mt-1`}
                      style={{ fontFamily: "'Afacad', sans-serif" }}
                    >
                      add to your schedule
                    </span>
                  </div>
                </div>
                <div
                  className={`w-9 h-9 rounded-full ${isDark ? "bg-white/5 border-white/20" : "bg-[#F7F7F7] border-[#111111]"} border flex items-center justify-center shadow-[2px_2px_0px_${isDark ? "#ffffff" : "#111111"}]`}
                >
                  <ChevronRight
                    size={20}
                    strokeWidth={3}
                    className={isDark ? "text-white" : "text-[#111111]"}
                  />
                </div>
              </div>
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeDay}-${refreshKey}`}
              variants={containerVariants}
              initial="hidden"
              animate={startEntrance ? "show" : "hidden"}
              exit="hidden"
              className="flex flex-col w-full"
            >
              <motion.div
                variants={itemVariants}
                className={`w-full ${isDark ? "bg-[#85a818]/5 border-[#85a818]/20" : "bg-[#F2FFDB] border-[#85a818]/30"} border-[1.5px] rounded-[24px] p-5 mb-8 flex items-center justify-between shadow-sm`}
              >
                <div className="flex flex-col">
                  <span
                    className={`text-[10px] font-bold lowercase tracking-[0.2em] ${isDark ? "text-[#85a818]/60" : "text-[#4d6600]/60"} mb-1`}
                    style={{ fontFamily: "'Afacad', sans-serif" }}
                  >
                    day overview
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-[24px] font-black tracking-tighter ${isDark ? "text-[#85a818]" : "text-[#4d6600]"}`}
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {overview.start}
                    </span>
                    <span
                      className={`text-[14px] font-bold ${isDark ? "text-[#85a818]/40" : "text-[#4d6600]/40"}`}
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      to
                    </span>
                    <span
                      className={`text-[24px] font-black tracking-tighter ${isDark ? "text-[#85a818]" : "text-[#4d6600]"}`}
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {overview.end}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className={`text-[32px] leading-[0.8] font-black ${isDark ? "text-[#85a818]" : "text-[#4d6600]"}`}
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {overview.count}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-[#85a818]/60" : "text-[#4d6600]/60"} mt-1.5`}
                    style={{ fontFamily: "'Afacad', sans-serif" }}
                  >
                    classes
                  </span>
                </div>
              </motion.div>

              <div className="flex flex-col gap-4 w-full relative">
                <div
                  className={`absolute left-[23px] top-6 bottom-6 w-[2px] ${isDark ? "bg-white/5" : "bg-[#111111]/5"} rounded-full z-0`}
                />

                {currentSchedule.map((item) => {
                  if (item.type === "break") {
                    return (
                      <motion.div
                        variants={itemVariants}
                        key={item.id}
                        className="flex items-center gap-4 w-full z-10"
                      >
                        <div className="w-12 flex justify-center shrink-0">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${isDark ? "bg-white/10" : "bg-[#111111]/10"} ring-4 ${isDark ? "ring-[#111111]" : "ring-[#F7F7F7]"}`}
                          />
                        </div>
                        <div className="flex-1 break-dotted p-4 flex items-center justify-between">
                          <span
                            className={`text-[14px] font-bold lowercase tracking-widest ${isDark ? "text-white/20" : "text-[#111111]/40"}`}
                            style={{ fontFamily: "'Afacad', sans-serif" }}
                          >
                            {item.title}
                          </span>
                          <span
                            className={`text-[11px] font-bold tracking-widest ${isDark ? "text-white/20" : "text-[#111111]/40"}`}
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            {item.time}
                          </span>
                        </div>
                      </motion.div>
                    );
                  }

                  const isLab = item.type === "lab";
                  const isActuallyCurrent = item.isCurrent && isViewingToday;

                  const currentTheme = isActuallyCurrent
                    ? isDark
                      ? "bg-white/10 border-white shadow-xl scale-[1.02] transform-gpu"
                      : "bg-[#111111] border-transparent shadow-lg scale-[1.02] transform-gpu"
                    : isLab
                      ? isDark
                        ? "border-[#0EA5E9]/20 bg-[#0EA5E9]/5"
                        : "border-[#0EA5E9]/20 bg-[#E0F2FE]/50"
                      : item.isCustom
                        ? isDark
                          ? "bg-white/5 border-white/10 shadow-sm"
                          : "bg-white border-[#111111]/5 shadow-sm"
                        : `${cardBg} ${cardBorder}`;

                  const textTheme = isActuallyCurrent
                    ? isDark
                      ? "text-white"
                      : "text-white"
                    : textClass;
                  const subTextTheme = isActuallyCurrent
                    ? isDark
                      ? "text-white/60"
                      : "text-white/60"
                    : isLab
                      ? isDark
                        ? "text-[#0ea5e9]/60"
                        : "text-[#111111]/60"
                      : subTextClass;

                  return (
                    <motion.div
                      variants={itemVariants}
                      key={item.id}
                      id={
                        isActuallyCurrent ? "active-class-indicator" : undefined
                      }
                      className="flex items-stretch gap-4 w-full z-10 relative"
                    >
                      <div className="w-12 flex justify-center pt-6 shrink-0 relative">
                        <div
                          className={`w-3.5 h-3.5 rounded-full ring-4 ${isDark ? "ring-[#111111]" : "ring-[#F7F7F7]"} z-10 ${isActuallyCurrent ? "bg-[#85a818] animate-pulse shadow-[0_0_12px_rgba(133,168,24,0.8)]" : isLab ? "bg-[#0EA5E9]" : isDark ? "bg-white/20" : "bg-[#111111]"}`}
                        />
                        {isActuallyCurrent && (
                          <div className="absolute top-6 w-3.5 h-3.5 rounded-full bg-[#85a818] animate-ping opacity-50" />
                        )}
                      </div>

                      <div
                        className={`flex-1 border-[1.5px] rounded-[24px] p-5 flex flex-col transition-all relative ${currentTheme} ${!isActuallyCurrent && "shadow-sm"}`}
                      >
                        {item.isCustom && (
                          <button
                            onClick={() =>
                              handleDeleteCustom(activeDay, item.time)
                            }
                            className={`absolute top-3 right-3 w-8 h-8 ${isDark ? "bg-[#FF4D4D]/5" : "bg-[#FF4D4D]/10"} text-[#FF4D4D] rounded-full flex items-center justify-center hover:bg-[#FF4D4D]/20 active:scale-95 transition-all z-20`}
                          >
                            <X size={16} strokeWidth={2.5} />
                          </button>
                        )}

                        <div className="flex justify-between items-start mb-4 pr-10">
                          <div
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] ${isActuallyCurrent ? (isDark ? "bg-[#111111]/5" : "bg-white/10") : isLab ? (isDark ? "bg-[#0EA5E9]/10" : "bg-[#0EA5E9]/10") : isDark ? "bg-white/5" : "bg-[#F7F7F7]"}`}
                          >
                            <Clock
                              size={12}
                              className={
                                isActuallyCurrent
                                  ? "text-[#85a818]"
                                  : isLab
                                    ? "text-[#0EA5E9]"
                                    : subTextClass
                              }
                            />
                            <span
                              className={`text-[12px] font-bold tracking-widest ${textTheme}`}
                              style={{ fontFamily: "'Montserrat', sans-serif" }}
                            >
                              {item.time}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 ml-auto">
                            {isLab && !isActuallyCurrent && (
                              <span
                                className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#0EA5E9] bg-[#0EA5E9]/10 px-2 py-1 rounded-md shrink-0"
                                style={{ fontFamily: "'Afacad', sans-serif" }}
                              >
                                practical
                              </span>
                            )}
                            {isActuallyCurrent && (
                              <span
                                className={`text-[9px] font-bold uppercase tracking-[0.25em] ${isDark ? "text-[#111111] bg-[#85a818]" : "text-white bg-[#85a818]"} px-2 py-1 rounded-md shrink-0`}
                                style={{ fontFamily: "'Afacad', sans-serif" }}
                              >
                                live
                              </span>
                            )}
                          </div>
                        </div>

                        <span
                          className={`text-[24px] font-black uppercase tracking-widest leading-none mb-1 ${textTheme}`}
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          {item.code}
                        </span>
                        <span
                          className={`text-[14px] font-medium lowercase tracking-wide mb-5 ${subTextTheme}`}
                          style={{ fontFamily: "'Afacad', sans-serif" }}
                        >
                          {item.name}
                        </span>

                        <div
                          className={`flex items-center justify-between pt-4 mt-auto border-t ${isActuallyCurrent ? (isDark ? "border-[#111111]/5" : "border-white/10") : isLab ? "border-[#0EA5E9]/20" : isDark ? "border-white/5" : "border-[#111111]/5"}`}
                        >
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <MapPin
                                size={12}
                                className={
                                  isActuallyCurrent
                                    ? isDark
                                      ? "text-white/40"
                                      : "text-white/40"
                                    : isLab
                                      ? "text-[#0EA5E9]/50"
                                      : subTextClass
                                }
                              />
                              <span
                                className={`text-[11px] font-bold uppercase tracking-wider ${textTheme}`}
                                style={{
                                  fontFamily: "'Montserrat', sans-serif",
                                }}
                              >
                                {item.room}
                              </span>
                            </div>
                            <div
                              className={`w-1 h-1 rounded-full ${isActuallyCurrent ? (isDark ? "bg-white/20" : "bg-white/20") : isLab ? "bg-[#0EA5E9]/30" : isDark ? "bg-white/10" : "bg-[#111111]/20"}`}
                            />
                            <div className="flex items-center gap-1.5">
                              <User
                                size={12}
                                className={
                                  isActuallyCurrent
                                    ? isDark
                                      ? "text-white/40"
                                      : "text-white/40"
                                    : isLab
                                      ? "text-[#0EA5E9]/50"
                                      : subTextClass
                                }
                              />
                              <span
                                className={`text-[11px] font-bold lowercase tracking-wider ${isActuallyCurrent ? (isDark ? "text-white/80" : "text-white/80") : isLab ? textClass : subTextClass}`}
                                style={{ fontFamily: "'Afacad', sans-serif" }}
                              >
                                {item.faculty}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div
          className={`fixed bottom-[85px] left-1/2 -translate-x-1/2 ${isDark ? "bg-white/10" : "bg-[#111111]/95"} backdrop-blur-md p-1.5 pr-2 rounded-full flex items-center gap-1 z-40 shadow-[0_8px_32px_rgba(0,0,0,0.3)] border ${isDark ? "border-white/20" : "border-white/10"}`}
        >
          <span
            className={`text-[11px] font-bold ${isDark ? "text-white/60" : "text-white/40"} ml-3 mr-1 tracking-widest`}
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            DO
          </span>
          <div
            className={`w-[1.5px] h-5 ${isDark ? "bg-white/20" : "bg-white/20"} mx-1 rounded-full`}
          />
          {[1, 2, 3, 4, 5].map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${
                activeDay === day
                  ? "bg-[#85a818] text-white scale-105 shadow-[0_0_12px_rgba(133,168,24,0.4)]"
                  : `bg-transparent ${isDark ? "text-white/60" : "text-white/40"} hover:text-white hover:bg-white/10`
              }`}
            >
              <span
                className="text-[16px] font-black"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {day}
              </span>
            </button>
          ))}
        </div>

        <div
          className={`absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t ${isDark ? "from-[#111111] via-[#111111]/80" : "from-[#F7F7F7] via-[#F7F7F7]/80"} to-transparent px-6 pb-[30px] z-20 flex justify-between items-end pointer-events-none`}
        >
          {"timetable".split("").map((char, i) => (
            <span
              key={i}
              className={`text-[3.2rem] leading-[0.75] lowercase ${textClass}`}
              style={{ fontFamily: "'Afacad', sans-serif", fontWeight: 400 }}
            >
              {char}
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isAddingClass && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            className={`fixed inset-0 ${isDark ? "bg-[#111111]" : "bg-white"} z-[60] flex flex-col px-6 pt-10 pb-6 overflow-hidden`}
          >
            <div className="flex justify-between items-start w-full shrink-0 mb-10">
              <div className="flex flex-col">
                <span
                  className={`text-[32px] leading-[1] font-black uppercase tracking-[0.15em] ${isDark ? "text-white" : "text-[#111111]"}`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  ADD CLASS
                </span>
                <span
                  className="text-[10px] font-bold lowercase tracking-[0.2em] text-[#85a818] mt-1.5"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  custom schedule mapping
                </span>
              </div>
              <button
                onClick={() => setIsAddingClass(false)}
                className={`w-10 h-10 rounded-full ${isDark ? "bg-white/10 text-white" : "bg-[#111111]/5 text-[#111111]"} flex items-center justify-center active:scale-95 transition-all shrink-0`}
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex flex-col gap-6 flex-1 w-full">
              <div className="flex flex-col gap-2">
                <span
                  className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? "text-white/50" : "text-[#111111]/50"} pl-1`}
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  Subject Code
                </span>
                <input
                  type="text"
                  placeholder="e.g. DTM"
                  value={newSub}
                  onChange={(e) => setNewSub(e.target.value)}
                  className={`w-full ${isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" : "bg-[#111111]/5 border-[#111111]/10 text-[#111111] placeholder:text-[#111111]/20"} border rounded-[16px] px-4 py-4 text-[16px] font-bold uppercase tracking-widest outline-none focus:border-[#85a818]/50 transition-colors`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span
                  className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? "text-white/50" : "text-[#111111]/50"} pl-1`}
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  Room / Hall
                </span>
                <input
                  type="text"
                  placeholder="e.g. UB304"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className={`w-full ${isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" : "bg-[#111111]/5 border-[#111111]/10 text-[#111111] placeholder:text-[#111111]/20"} border rounded-[16px] px-4 py-4 text-[16px] font-bold uppercase tracking-widest outline-none focus:border-[#85a818]/50 transition-colors`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-2">
                  <span
                    className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? "text-white/50" : "text-[#111111]/50"} pl-1`}
                    style={{ fontFamily: "'Afacad', sans-serif" }}
                  >
                    Start Time
                  </span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={`w-full ${isDark ? "bg-white/5 border-white/10 text-white [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" : "bg-[#111111]/5 border-[#111111]/10 text-[#111111]"} border rounded-[16px] px-4 py-4 text-[16px] font-bold outline-none focus:border-[#85a818]/50 transition-colors`}
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <span
                    className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? "text-white/50" : "text-[#111111]/50"} pl-1`}
                    style={{ fontFamily: "'Afacad', sans-serif" }}
                  >
                    End Time
                  </span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={`w-full ${isDark ? "bg-white/5 border-white/10 text-white [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" : "bg-[#111111]/5 border-[#111111]/10 text-[#111111]"} border rounded-[16px] px-4 py-4 text-[16px] font-bold outline-none focus:border-[#85a818]/50 transition-colors`}
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <span
                  className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? "text-white/50" : "text-[#111111]/50"} pl-1 mb-1`}
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  Class Type
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => setNewType("theory")}
                    className={`flex-1 py-4 rounded-[16px] text-[13px] font-bold uppercase tracking-widest transition-all ${newType === "theory" ? (isDark ? "bg-white text-[#111111]" : "bg-[#111111] text-white") : isDark ? "bg-white/5 text-white/50 border border-white/10" : "bg-[#111111]/5 text-[#111111]/50 border border-black/5"}`}
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Theory
                  </button>
                  <button
                    onClick={() => setNewType("lab")}
                    className={`flex-1 py-4 rounded-[16px] text-[13px] font-bold uppercase tracking-widest transition-all ${newType === "lab" ? "bg-[#0EA5E9] text-white" : isDark ? "bg-white/5 text-white/50 border border-white/10" : "bg-[#111111]/5 text-[#111111]/50 border border-black/5"}`}
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Practical
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleAddClass}
              className="w-full bg-[#85a818] text-white py-5 rounded-[20px] text-[15px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(133,168,24,0.3)] active:scale-[0.98] transition-all mt-auto shrink-0"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              add to schedule
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
