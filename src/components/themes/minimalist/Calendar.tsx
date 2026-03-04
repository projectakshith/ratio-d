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
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 350, damping: 25 },
  },
};

const CalendarDay = memo(
  ({ item, onClick }: { item: any; onClick: (date: Date) => void }) => {
    let bg = "bg-transparent";
    let border = "border-[1.5px] border-transparent";
    let text = "text-[#111111]";
    let dateColor = "text-[#111111]/30";
    let orderColor = "text-[#111111]/30";
    let scaleClass = "scale-100";
    let shadowClass = "";

    if (item.isSelected) {
      bg = item.isDayExam
        ? "bg-[#8b5cf6]"
        : item.isDayHoliday
          ? "bg-[#FF4D4D]"
          : "bg-[#111111]";
      text =
        item.isDayExam || item.isDayHoliday || !item.isDayHoliday
          ? "text-white"
          : "text-[#111111]";
      dateColor = text;
      orderColor = "text-white/70";
      scaleClass = "scale-105";
      shadowClass = item.isDayExam
        ? "shadow-[0_8px_16px_rgba(139,92,246,0.3)] z-10"
        : item.isDayHoliday
          ? "shadow-[0_8px_16px_rgba(255,77,77,0.3)] z-10"
          : "shadow-[0_8px_16px_rgba(17,17,17,0.2)] z-10";
      border = "border-transparent";
    } else if (item.isDayExam) {
      bg = "bg-[#8b5cf6]/10";
      border = "border-[#8b5cf6]/30";
      dateColor = "text-[#8b5cf6]";
      orderColor = "text-[#8b5cf6]/60";
    } else if (item.isToday) {
      border = "border-[#111111]";
      dateColor = "text-[#111111]";
      orderColor = "text-[#111111]/50";
    } else if (item.isDayHoliday) {
      bg = "bg-[#FFEDED]/60";
      border = "border-[#FF4D4D]/20";
      dateColor = "text-[#FF4D4D]";
      orderColor = "text-[#FF4D4D]/50";
    } else if (item.dayOrder) {
      bg = "bg-white";
      border = "border-[#111111]/10";
      dateColor = "text-[#111111]";
      orderColor = "text-[#111111]/50";
    }

    const fadeClass =
      item.isPast && !item.isSelected && !item.isToday ? "opacity-40" : "";

    return (
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onClick(item.dateObj)}
        className={`aspect-square w-full rounded-[14px] flex flex-col items-center justify-center relative transition-colors ${bg} ${border} ${fadeClass} ${scaleClass} ${shadowClass}`}
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
              className={`w-1.5 h-1.5 rounded-full ${item.isSelected ? "bg-white" : "bg-[#FF4D4D]"}`}
            />
          ) : (
            <span />
          )}
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
  (prev, next) => {
    return (
      prev.item.isSelected === next.item.isSelected &&
      prev.item.isToday === next.item.isToday &&
      prev.item.dayOrder === next.item.dayOrder &&
      prev.item.dateObj.getTime() === next.item.dateObj.getTime()
    );
  },
);
CalendarDay.displayName = "CalendarDay";

const MinimalCalendar = ({ data, academia }: any) => {
  const [mounted, setMounted] = useState(false);
  const activeData = academia?.calendarData || data?.calendarData || [];

  const profile = data?.profile || {};
  const isTargetAudience = useMemo(() => {
    return (profile.dept || "").toLowerCase().includes("computer science and engineering") && 
           (String(profile.semester) === "4");
  }, [profile]);

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

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `,
        }}
      />

      <div className="absolute inset-0 bg-[#F7F7F7] overflow-hidden flex flex-col">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="h-full w-full overflow-y-auto no-scrollbar px-5 pt-8 pb-[100px] flex flex-col gap-6 relative z-10"
        >
          <motion.div
            variants={itemVariants}
            animate={{ backgroundColor: theme.bg }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`w-full rounded-[32px] p-6 flex flex-col shadow-sm shrink-0 border-[1.5px] ${theme.border} justify-between`}
          >
            <div className="self-start">
              <div
                className={`px-4 py-2 rounded-full flex items-center gap-2 ${theme.accent}`}
              >
                <CalendarIcon size={16} className={theme.text} />
                <span
                  className={`text-[14px] font-bold uppercase tracking-widest ${theme.text}`}
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  {display.pill}
                </span>
              </div>
            </div>

            <div className="flex items-end w-full gap-5 mt-8">
              <div className="flex flex-col shrink-0">
                <span
                  className={`text-[13px] font-bold uppercase tracking-[0.2em] ${theme.text} opacity-70 mb-2 ml-1`}
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  {display.label}
                </span>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-[7rem] leading-[0.75] font-black tracking-tighter ${theme.text}`}
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {display.bigText}
                  </span>
                </div>
              </div>

              <div className="flex flex-col justify-end pb-1.5 flex-1 min-w-0 pl-2">
                <span
                  className={`text-[32px] font-black uppercase tracking-widest leading-none mb-3 ${theme.text} break-words`}
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
                        className={`text-[16px] font-bold lowercase tracking-wide leading-snug ${theme.text} opacity-90 flex items-start gap-2`}
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
            className="flex-1 bg-white border-[1.5px] border-[#111111]/10 rounded-[32px] p-5 flex flex-col shadow-sm shrink-0"
          >
            <div className="flex justify-between items-center mb-6 w-full shrink-0">
              <span
                className="text-[20px] font-black uppercase tracking-widest text-[#111111] ml-2"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {monthTitle}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="w-10 h-10 bg-[#F7F7F7] rounded-full flex items-center justify-center text-[#111111] active:scale-95 transition-all hover:bg-[#111111]/5"
                >
                  <ChevronLeft size={20} strokeWidth={2.5} />
                </button>
                <button
                  onClick={goToToday}
                  className="w-10 h-10 bg-[#111111] rounded-full flex items-center justify-center text-white active:scale-95 transition-all hover:bg-[#111111]/90"
                >
                  <Target size={18} strokeWidth={2.5} />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="w-10 h-10 bg-[#F7F7F7] rounded-full flex items-center justify-center text-[#111111] active:scale-95 transition-all hover:bg-[#111111]/5"
                >
                  <ChevronRight size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4 shrink-0">
              {["m", "t", "w", "t", "f", "s", "s"].map((d, i) => (
                <div
                  key={i}
                  className="text-center text-[12px] font-bold text-[#111111]/40 uppercase tracking-widest"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2 gap-y-3 content-start">
              {gridData.map((item: any) => {
                if (item.type === "padding")
                  return (
                    <div key={item.key} className="w-full aspect-square" />
                  );
                return (
                  <CalendarDay
                    key={item.key}
                    item={item}
                    onClick={handleDateClick}
                  />
                );
              })}
            </div>
          </motion.div>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#F7F7F7] via-[#F7F7F7] to-transparent px-6 pt-24 pb-[30px] z-0 flex justify-between items-end pointer-events-none">
          {"calendar".split("").map((char, i) => (
            <span
              key={i}
              className="text-[3.2rem] leading-[0.75] lowercase text-[#111111]"
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

export default MinimalCalendar;
