"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Clock,
  User,
  Plus,
  X,
  ChevronRight,
  Layers,
} from "lucide-react";
import {
  buildCourseMap,
  processSchedule,
  getDayOverview,
} from "@/utils/dashboard/timetableLogic";
import {
  getInitialActiveDay,
  handleAddClassLogic,
  handleDeleteCustomLogic,
} from "@/utils/timetable/timetableLogic";
import calendarDataJson from "@/data/calendar_data.json";
import CustomClass from "./CustomClass";
import { AcademiaData, ScheduleSlot, CalendarEvent } from "@/types";

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

export default function Timetable({
  data,
  academia,
  setIsSwipeDisabled,
  startEntrance,
  isDark,
}: {
  data: AcademiaData;
  academia: any;
  setIsSwipeDisabled?: (disabled: boolean) => void;
  startEntrance: boolean;
  isDark: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const initialSet = useRef(false);
  const schedule =
    academia?.effectiveSchedule || data?.timetable || data?.schedule || {};

  const todayStr = useMemo(() => {
    const now = new Date();
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
    const d = String(now.getDate()).padStart(2, "0");
    const m = months[now.getMonth()];
    const y = now.getFullYear();
    return `${d} ${m} ${y}`;
  }, []);

  const todayEntry = useMemo(() => {
    const calData = academia?.calendarData || calendarDataJson || [];
    return calData.find((ev: any) => ev.date === todayStr);
  }, [academia?.calendarData, todayStr]);

  const dayOrderStr =
    todayEntry?.dayOrder || todayEntry?.order || data?.dayOrder || "0";
  const dayOrder = parseInt(String(dayOrderStr)) || 0;

  const isHoliday = dayOrder === 0;

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
    return 1;
  }, [academia?.calendarData]);

  useEffect(() => {
    setMounted(true);

    if (
      !initialSet.current &&
      (Object.keys(schedule).length > 0 || isHoliday)
    ) {
      setActiveDay(
        getInitialActiveDay(schedule, isHoliday, dayOrder, nextWorkingDayOrder),
      );
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
    const success = handleAddClassLogic(
      newSub,
      newRoom,
      startTime,
      endTime,
      newType,
      activeDay,
    );
    if (success) {
      setNewSub("");
      setNewRoom("");
      setStartTime("08:00");
      setEndTime("08:50");
      setIsAddingClass(false);
      setRefreshKey((prev) => prev + 1);
    }
  };

  const handleDeleteCustom = (day: number, timeStr: string) => {
    const success = handleDeleteCustomLogic(day, timeStr);
    if (success) {
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
  const nextScheduledDay = isHoliday
    ? nextWorkingDayOrder
    : dayOrder < 5
      ? dayOrder + 1
      : 1;
  const isViewingNext =
    String(activeDay) === String(nextScheduledDay) &&
    (isHoliday || !isViewingToday);

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

  const bgClass = "bg-theme-bg";
  const textClass = "text-theme-text";
  const subTextClass = "text-theme-muted";

  return (
    <>
      <div className={`absolute inset-0 ${bgClass}`}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          ref={scrollContainerRef}
          className="h-full w-full overflow-y-auto no-scrollbar px-6 pt-10 pb-[280px] flex flex-col relative z-10"
        >
          {isHoliday && (
            <motion.div
              variants={itemVariants}
              className="w-full status-bg-safe status-border-safe border-[1.5px] rounded-[16px] p-3 mb-6 flex items-center justify-center gap-2 shrink-0"
            >
              <span className="text-xl">🌴</span>
              <span
                className="text-[13px] font-bold status-text-safe lowercase tracking-wide"
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                holiday today! viewing upcoming track.
              </span>
            </motion.div>
          )}

          <motion.div
            variants={itemVariants}
            className="w-full flex flex-col items-center mt-2 mb-8 shrink-0 relative"
          >
            <span
              className={`text-[12px] font-bold lowercase tracking-[0.3em] mb-3 text-center transition-colors ${isViewingToday ? subTextClass : isViewingNext ? "text-theme-highlight" : subTextClass}`}
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
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex flex-col mb-8 w-full shrink-0"
          >
            <button
              onClick={() => setIsAddingClass(true)}
              className="w-full relative group active:scale-[0.98] transition-all duration-200"
            >
              <div className="absolute inset-0 bg-theme-text rounded-[24px] translate-y-1.5 transition-transform group-hover:translate-y-2" />
              <div className="relative w-full border-[1.5px] border-theme-text bg-theme-bg text-theme-text rounded-[24px] p-4 flex items-center justify-between transition-transform group-hover:-translate-y-0.5 group-active:translate-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-theme-text-8 flex items-center justify-center">
                    <Plus
                      size={20}
                      strokeWidth={2.5}
                      className="text-theme-text"
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
                      className="text-[10px] font-bold lowercase tracking-wider text-theme-muted mt-1"
                      style={{ fontFamily: "'Afacad', sans-serif" }}
                    >
                      add to your schedule
                    </span>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-theme-card border-theme-border border flex items-center justify-center shadow-[2px_2px_0px_var(--theme-text)]">
                  <ChevronRight
                    size={20}
                    strokeWidth={3}
                    className="text-theme-text"
                  />
                </div>
              </div>
            </button>
          </motion.div>

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
                className="w-full status-bg-safe status-border-safe border-[1.5px] rounded-[24px] p-5 mb-8 flex items-center justify-between shadow-sm"
              >
                <div className="flex flex-col">
                  <span
                    className="text-[10px] font-bold lowercase tracking-[0.2em] text-theme-highlight opacity-60 mb-1"
                    style={{ fontFamily: "'Afacad', sans-serif" }}
                  >
                    day overview
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-[24px] font-black tracking-tighter text-theme-highlight"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {overview.start}
                    </span>
                    <span
                      className="text-[14px] font-bold text-theme-highlight opacity-40"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      to
                    </span>
                    <span
                      className="text-[24px] font-black tracking-tighter text-theme-highlight"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {overview.end}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className="text-[32px] leading-[0.8] font-black text-theme-highlight"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {overview.count}
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest text-theme-highlight opacity-60 mt-1.5"
                    style={{ fontFamily: "'Afacad', sans-serif" }}
                  >
                    classes
                  </span>
                </div>
              </motion.div>

              <div className="flex flex-col gap-4 w-full relative">
                <div className="absolute left-[23px] top-6 bottom-6 w-[2px] bg-theme-text-5 rounded-full z-0" />

                {currentSchedule.map((item) => {
                  if (item.type === "break") {
                    return (
                      <motion.div
                        variants={itemVariants}
                        key={item.id}
                        className="flex items-center gap-4 w-full z-10"
                      >
                        <div className="w-12 flex justify-center shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-theme-text-10 ring-4 ring-[var(--theme-bg)]" />
                        </div>
                        <div className="flex-1 break-dotted p-4 flex items-center justify-between">
                          <span
                            className="text-[14px] font-bold lowercase tracking-widest text-theme-faint"
                            style={{ fontFamily: "'Afacad', sans-serif" }}
                          >
                            {item.title}
                          </span>
                          <span
                            className="text-[11px] font-bold tracking-widest text-theme-faint"
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
                    ? "bg-theme-highlight border-theme-highlight shadow-[0_0_20px_var(--theme-highlight)] scale-[1.02] transform-gpu"
                    : isLab
                      ? "border-[#0EA5E9]/20 bg-[#0EA5E9]/05 backdrop-blur-sm"
                      : "bg-theme-surface border-theme-border";

                  const textTheme = isActuallyCurrent
                    ? "text-theme-bg font-black"
                    : textClass;
                  const subTextTheme = isActuallyCurrent
                    ? "text-theme-bg font-bold"
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
                          className={`w-3.5 h-3.5 rounded-full ring-4 ring-[var(--theme-bg)] z-10 ${isActuallyCurrent ? "bg-theme-highlight animate-pulse shadow-[0_0_12px_var(--theme-highlight)]" : isLab ? "bg-[#0EA5E9]" : "bg-theme-text-20"}`}
                        />
                        {isActuallyCurrent && (
                          <div className="absolute top-6 w-3.5 h-3.5 rounded-full bg-theme-highlight animate-ping opacity-50" />
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
                            className="absolute top-3 right-3 w-8 h-8 bg-theme-secondary/10 text-theme-secondary rounded-full flex items-center justify-center hover:bg-theme-secondary/20 active:scale-95 transition-all z-20"
                          >
                            <X size={16} strokeWidth={2.5} />
                          </button>
                        )}

                        <div className="flex justify-between items-start mb-4 pr-10">
                          <div
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] ${isActuallyCurrent ? "bg-theme-bg/20" : isLab ? "bg-theme-primary/10" : "bg-theme-bg/40"}`}
                          >
                            <Clock
                              size={12}
                              className={
                                isActuallyCurrent
                                  ? "text-theme-bg"
                                  : subTextClass
                              }
                            />
                            <span
                              className={`text-[12px] font-bold tracking-widest ${isActuallyCurrent ? "text-theme-bg" : textTheme}`}
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
                                className={`text-[9px] font-bold uppercase tracking-[0.25em] text-theme-highlight bg-theme-bg px-2 py-1 rounded-md shrink-0`}
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
                          className={`flex items-center justify-between pt-4 mt-auto border-t ${isActuallyCurrent ? "border-theme-bg/10" : isLab ? "border-[#0EA5E9]/20" : "border-theme-border"}`}
                        >
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <MapPin
                                size={12}
                                className={
                                  isActuallyCurrent
                                    ? "text-theme-bg"
                                    : subTextClass
                                }
                              />
                              <span
                                className={`text-[11px] font-bold uppercase tracking-wider ${isActuallyCurrent ? "text-theme-bg" : textTheme}`}
                                style={{
                                  fontFamily: "'Montserrat', sans-serif",
                                }}
                              >
                                {item.room}
                              </span>
                            </div>
                            <div
                              className={`w-1 h-1 rounded-full ${isActuallyCurrent ? "bg-theme-bg/30" : isLab ? "bg-[#0EA5E9]/30" : "bg-theme-border"}`}
                            />
                            <div className="flex items-center gap-1.5">
                              <User
                                size={12}
                                className={
                                  isActuallyCurrent
                                    ? "text-theme-bg"
                                    : subTextClass
                                }
                              />
                              <span
                                className={`text-[11px] font-bold lowercase tracking-wider ${isActuallyCurrent ? "text-theme-bg" : subTextClass}`}
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
        </motion.div>

        <div className="fixed bottom-[85px] left-1/2 -translate-x-1/2 bg-theme-accent/30 backdrop-blur-xl p-1.5 pr-2 rounded-full flex items-center gap-1 z-40 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <span
            className="text-[11px] font-bold text-theme-accent ml-3 mr-1 tracking-widest"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            DO
          </span>
          <div className="w-[1.5px] h-5 bg-theme-accent/40 mx-1 rounded-full" />
          {[1, 2, 3, 4, 5].map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${
                activeDay === day
                  ? "bg-theme-emphasis text-theme-bg scale-105 shadow-[0_0_15px_var(--theme-text)]"
                  : "bg-transparent text-theme-text/40 hover:text-theme-text hover:bg-theme-text/10"
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

        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[var(--theme-bg)] via-[var(--theme-bg)]/80 to-transparent px-6 pb-[30px] z-20 flex justify-between items-end pointer-events-none"
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
        </motion.div>
      </div>

      <CustomClass
        isOpen={isAddingClass}
        onClose={() => setIsAddingClass(false)}
        newSub={newSub}
        setNewSub={setNewSub}
        newRoom={newRoom}
        setNewRoom={setNewRoom}
        startTime={startTime}
        setStartTime={setStartTime}
        endTime={endTime}
        setEndTime={setEndTime}
        newType={newType}
        setNewType={setNewType}
        handleAddClass={handleAddClass}
      />
    </>
  );
}
