"use client";
import React, { useState, useEffect, memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Target,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useCalendarData } from "@/hooks/useCalendarData";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
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

const CalendarDay = memo(
  ({
    item,
    onClick,
  }: {
    item: any;
    onClick: (date: Date) => void;
  }) => {
    let bg = "bg-transparent";
    let border = "border-[1.5px] border-transparent";
    let dateColor = "text-theme-subtle";
    let orderColor = "text-theme-subtle";
    let scaleClass = "scale-100";
    let shadowClass = "";

    if (item.isSelected) {
      bg = item.isDayExam
        ? "bg-[#8b5cf6]"
        : item.isDayHoliday
          ? "bg-[#FF4D4D]"
          : "bg-theme-text";
      dateColor = "text-theme-bg";
      orderColor = "text-theme-bg-70";
      scaleClass = "scale-105";
      shadowClass = item.isDayExam
        ? "shadow-[0_8px_16px_rgba(139,92,246,0.3)] z-10"
        : item.isDayHoliday
          ? "shadow-[0_8px_16px_rgba(255,77,77,0.3)] z-10"
          : "shadow-[0_8px_16px_rgba(0,0,0,0.15)] z-10";
      border = "border-transparent";
    } else if (item.isDayExam) {
      bg = "bg-[#8b5cf6]/10";
      border = "border-[#8b5cf6]/30";
      dateColor = "text-[#8b5cf6]";
      orderColor = "text-[#8b5cf6]/60";
    } else if (item.isToday) {
      border = "border-theme-text";
      dateColor = "text-theme-text";
      orderColor = "text-theme-muted";
    } else if (item.isDayHoliday) {
      bg = "bg-[#FF4D4D]/10";
      border = "border-[#FF4D4D]/20";
      dateColor = "text-[#FF4D4D]";
      orderColor = "text-[#FF4D4D]/50";
    } else if (item.dayOrder) {
      bg = "bg-theme-surface";
      border = "border-theme-subtle";
      dateColor = "text-theme-text";
      orderColor = "text-theme-muted";
    }

    return (
      <motion.button
        variants={itemVariants}
        whileTap={{ scale: 0.9 }}
        onClick={() => item.dateObj && onClick(item.dateObj)}
        className={`aspect-square w-full rounded-[14px] flex flex-col items-center justify-center relative transition-colors ${bg} ${border} ${item.isPast && !item.isSelected && !item.isToday ? "opacity-40" : ""} ${scaleClass} ${shadowClass}`}
      >
        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-start justify-between pointer-events-none">
          {item.dayOrder ? (
            <span
              className={`text-[10px] font-bold uppercase tracking-widest leading-none ${orderColor}`}
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {item.dayOrder}
            </span>
          ) : item.isDayHoliday ? (
            <div
              className={`w-1.5 h-1.5 rounded-full ${item.isSelected ? "bg-theme-bg" : "bg-[#FF4D4D]"}`}
            />
          ) : null}
        </div>
        <div className="flex items-center justify-center mt-2.5">
          <span
            className={`text-[20px] font-black ${dateColor}`}
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {item.day}
          </span>
        </div>
      </motion.button>
    );
  },
  (prev, next) =>
    prev.item.isSelected === next.item.isSelected &&
    prev.item.isToday === next.item.isToday &&
    prev.item.dayOrder === next.item.dayOrder &&
    prev.item.dateObj?.getTime() === next.item.dateObj?.getTime(),
);
CalendarDay.displayName = "CalendarDay";

const Calendar = ({ data, academia }: any) => {
  const [mounted, setMounted] = useState(false);
  const activeData = academia?.calendarData || data?.calendarData || [];
  const profile = data?.profile || {};
  const isTargetAudience = useMemo(
    () =>
      (profile.dept || "")
        .toLowerCase()
        .includes("computer science and engineering") &&
      String(profile.semester) === "4",
    [profile],
  );
  const {
    theme,
    display,
    monthTitle,
    handlePrevMonth,
    handleNextMonth,
    goToToday,
    gridData,
    handleDateClick,
  } = useCalendarData(activeData, isTargetAudience);

  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  const header = theme;

  return (
    <>
      <div
        className="absolute inset-0 bg-theme-bg overflow-hidden flex flex-col"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="h-full w-full overflow-y-auto no-scrollbar px-5 pt-8 pb-[100px] flex flex-col gap-6 relative z-10"
        >
          <motion.div
            variants={itemVariants}
            animate={{ backgroundColor: header.bg }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`w-full rounded-[32px] p-6 flex flex-col shadow-sm shrink-0 border-[1.5px] ${header.border} justify-between`}
          >
            <div className="self-start">
              <div
                className={`px-4 py-2 rounded-full flex items-center gap-2 ${header.accent}`}
              >
                <CalendarIcon size={16} className={header.text} />
                <span
                  className={`text-[14px] font-bold uppercase tracking-widest ${header.text}`}
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  {display.pill}
                </span>
              </div>
            </div>
            <div className="flex items-end w-full gap-5 mt-8">
              <div className="flex flex-col shrink-0">
                <span
                  className={`text-[13px] font-bold uppercase tracking-[0.2em] ${header.text} opacity-70 mb-2 ml-1`}
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  {display.label}
                </span>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-[7rem] leading-[0.75] font-black tracking-tighter ${header.text}`}
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {display.bigText}
                  </span>
                </div>
              </div>
              <div className="flex flex-col justify-end pb-1.5 flex-1 min-w-0 pl-2">
                <span
                  className={`text-[32px] font-black uppercase tracking-widest leading-none mb-3 ${header.text} break-words`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {display.infoMain}
                </span>
                <div className="flex flex-col gap-1.5">
                  {display.infoSub
                    .split(" / ")
                    .map((sub: string, idx: number) => (
                      <span
                        key={idx}
                        className={`text-[16px] font-bold lowercase tracking-wide leading-snug ${header.text} opacity-90 flex items-start gap-2`}
                        style={{ fontFamily: "'Afacad', sans-serif" }}
                      >
                        {display.infoSub.includes("/") && (
                          <span className="mt-2 w-1 h-1 rounded-full bg-current opacity-50 shrink-0" />
                        )}
                        {sub.trim()}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
            variants={itemVariants}
            className="flex-1 bg-theme-surface border-theme-subtle border-[1.5px] rounded-[32px] p-5 flex flex-col shadow-sm shrink-0"
          >
            <div className="flex justify-between items-center mb-6 w-full shrink-0">
              <span
                className="text-[20px] font-black uppercase tracking-widest text-theme-text ml-2"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {monthTitle}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="w-10 h-10 bg-theme-card rounded-full flex items-center justify-center text-theme-text active:scale-95 transition-all"
                >
                  <ChevronLeft size={20} strokeWidth={2.5} />
                </button>
                <button
                  onClick={goToToday}
                  className="w-10 h-10 bg-theme-text text-theme-bg rounded-full flex items-center justify-center active:scale-95 transition-all hover:opacity-90"
                >
                  <Target size={18} strokeWidth={2.5} />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="w-10 h-10 bg-theme-card rounded-full flex items-center justify-center text-theme-text active:scale-95 transition-all"
                >
                  <ChevronRight size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-4 shrink-0">
              {["m", "t", "w", "t", "f", "s", "s"].map((d, i) => (
                <div
                  key={i}
                  className="text-center text-[12px] font-bold text-theme-muted uppercase tracking-widest"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 gap-y-3 content-start">
              {gridData.map((item: any) =>
                item.type === "padding" ? (
                  <div key={item.key} className="w-full aspect-square" />
                ) : (
                  <CalendarDay
                    key={item.key}
                    item={item}
                    onClick={handleDateClick}
                  />
                ),
              )}
            </div>
          </motion.div>
        </motion.div>
        <div
          className="absolute bottom-0 left-0 right-0 h-48 z-20 pointer-events-none"
          style={{ background: 'linear-gradient(to top, var(--theme-bg) 0%, color-mix(in srgb, var(--theme-bg) 80%, transparent) 60%, transparent 100%)' }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 px-6 pb-[30px] z-30 flex justify-between items-end pointer-events-none"
        >
          {"calendar".split("").map((char, i) => (
            <span
              key={i}
              className="text-[3.2rem] leading-[0.75] lowercase text-theme-text"
              style={{ fontFamily: "'Afacad', sans-serif", fontWeight: 400 }}
            >
              {char}
            </span>
          ))}
        </div>
      </div>
    </>
  );
};

export default Calendar;
