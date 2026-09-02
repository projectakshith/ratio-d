"use client";
import React, { useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Target, Calendar } from "lucide-react";
import { useCalendarData } from "@/hooks/useCalendarData";
import calendarDataJson from "@/data/calendar_data.json";

const CalendarDay = memo(
  ({ item, onClick }: { item: any; onClick: (date: Date) => void }) => {
    let bg = "bg-transparent";
    let dateColor = "text-black/30";
    let orderColor = "text-black/20";
    let scaleClass = "scale-100";
    let shadowClass = "";

    if (item.isSelected) {
      bg = item.isDayExam ? "bg-[#8b5cf6]" : "bg-[#050505]";
      dateColor = "text-white";
      orderColor = "text-white/60";
      scaleClass = "scale-105";
      shadowClass = "shadow-lg z-10";
    } else if (item.isDayExam) {
      bg = "bg-[#8b5cf6]/20";
      dateColor = "text-[#8b5cf6]";
      orderColor = "text-[#8b5cf6]";
    } else if (item.isToday) {
      bg = "bg-[#ceff1c]/20";
    } else if (item.isDayHoliday) {
      bg = "bg-[#ff003c]/5";
      dateColor = "text-[#ff003c]";
      orderColor = "text-[#ff003c]/30";
    } else if (item.dayOrder) {
      bg = "bg-white border border-black/5";
      dateColor = "text-black/30";
      orderColor = "text-black/20";
    }

    const fadeClass =
      item.isPast && !item.isSelected && !item.isToday ? "opacity-40" : "";

    return (
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => item.dateObj && onClick(item.dateObj)}
        className={`aspect-square w-full rounded-xl flex flex-col items-center justify-center relative ${bg} ${fadeClass} ${scaleClass} ${shadowClass}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute top-1.5 left-2 flex items-center justify-center pointer-events-none">
          {item.dayOrder ? (
            <span
              className={`text-[10px] font-bold ${orderColor}`}
              style={{ fontFamily: "Aonic" }}
            >
              {item.dayOrder}
            </span>
          ) : item.isDayHoliday ? (
            <span
              className={`text-[10px] font-bold ${orderColor}`}
              style={{ fontFamily: "Aonic" }}
            ></span>
          ) : null}
        </div>

        <div className="flex items-center justify-center pt-4">
          <span
            className={`text-xl font-black ${dateColor}`}
            style={{ fontFamily: "Aonic" }}
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
      prev.item.dateObj?.getTime() === next.item.dateObj?.getTime()
    );
  },
);
CalendarDay.displayName = "CalendarDay";

const CalendarPage = ({ calendarData, academia, data }: any) => {
  const activeData = useMemo(() => {
    return (academia?.calendarData?.length > 0)
      ? academia.calendarData
      : (calendarData || calendarDataJson || []);
  }, [academia?.calendarData, calendarData]);

  const profile = useMemo(() => data?.profile || {}, [data?.profile]);
  const isTargetAudience = useMemo(
    () =>
      (profile.dept || "")
        .toLowerCase()
        .includes("computer science and engineering") &&
      String(profile.semester) === "4",
    [profile],
  );

  const {
    introMode,
    theme,
    display,
    monthTitle,
    handlePrevMonth,
    handleNextMonth,
    goToToday,
    gridData,
    handleDateClick,
  } = useCalendarData(activeData, isTargetAudience);

  const brutalistTheme = useMemo(() => {
    if (display.label === "day order" && (display.infoSub?.toLowerCase().includes("exam") || display.infoMain?.toLowerCase().includes("exam"))) {
      return { bg: "#8b5cf6", text: "text-white", pillBorder: "border-white/30", pillBg: "bg-white/20" };
    }
    if (display.label === "day order") {
      return { bg: "#ceff1c", text: "text-[#050505]", pillBorder: "border-black/10", pillBg: "bg-black/10" };
    }
    if (display.label === "holiday") {
      return { bg: "#ff003c", text: "text-white", pillBorder: "border-white/30", pillBg: "bg-white/20" };
    }
    return { bg: "#050505", text: "text-white", pillBorder: "border-white/30", pillBg: "bg-white/20" };
  }, [display]);

  return (
    <div className="h-full w-full flex flex-col bg-[#f5f6fc] text-[#050505] font-sans relative overflow-hidden touch-pan-y">
      <motion.div
        className="w-full relative z-20 shadow-xl overflow-hidden flex flex-col shrink-0"
        initial={false}
        animate={{ height: "28%", backgroundColor: brutalistTheme.bg }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col h-full p-5 pb-1 relative z-20">
          <div className="self-start mb-auto pt-2">
            <div
              className={`px-3 py-1 ${brutalistTheme.pillBg} backdrop-blur-md rounded-full border ${brutalistTheme.pillBorder} flex items-center gap-2 shadow-sm`}
            >
              <Calendar size={12} className={brutalistTheme.text} />
              <span
                className={`text-[11px] font-bold lowercase tracking-wide ${brutalistTheme.text}`}
                style={{ fontFamily: "Aonic" }}
              >
                {display.pill}
              </span>
            </div>
          </div>
          <div className="flex items-end w-full gap-2">
            <div className="flex flex-col shrink-0">
              <div className="mb-3">
                <span
                  className={`text-[13px] font-bold lowercase tracking-wide opacity-50 block ml-1 ${brutalistTheme.text}`}
                  style={{ fontFamily: "Aonic" }}
                >
                  {display.label}
                </span>
              </div>
              <span
                className={`text-[7rem] leading-[0.8] font-black tracking-tighter ${brutalistTheme.text}`}
                style={{ fontFamily: "Urbanosta" }}
              >
                {display.bigText}
              </span>
            </div>
            <div className="flex flex-col justify-end pb-4 flex-1 min-w-0 pl-3">
              <span
                className={`text-2xl font-bold lowercase leading-none mb-1 ${brutalistTheme.text}`}
                style={{ fontFamily: "Aonic" }}
              >
                {display.infoMain}
              </span>
              <span
                className={`text-lg font-bold leading-5 ${brutalistTheme.text} opacity-90 break-words line-clamp-3`}
                style={{ fontFamily: "Aonic" }}
              >
                {display.infoSub}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 flex flex-col pb-40 pt-6 px-4 z-10">
        <div className="flex justify-between items-center mb-6 px-1 relative">
          <div
            className="absolute left-1/2 -translate-x-1/2 font-black text-xl tracking-tight text-[#050505]"
            style={{ fontFamily: "Aonic" }}
          >
            {monthTitle}
          </div>
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-black/5 rounded-full transition-colors text-[#050505] z-10"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-1 z-10">
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-black/5 rounded-full transition-colors text-[#050505]"
            >
              <ChevronRight size={24} />
            </button>
            <button
              onClick={goToToday}
              className="p-2 hover:bg-black/5 rounded-full transition-colors text-[#050505] opacity-60 hover:opacity-100"
            >
              <Target size={20} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 text-center mb-3">
          {["m", "t", "w", "t", "f", "s", "s"].map((d, i) => (
            <span
              key={i}
              className="text-[10px] font-black text-black/30 font-mono uppercase tracking-widest"
            >
              {d}
            </span>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-7 gap-2 gap-y-3 justify-items-center">
            {gridData.map((item: any) => {
              if (item.type === "padding")
                return <div key={item.key} className="w-full" />;
              return (
                <CalendarDay
                  key={item.key}
                  item={item}
                  onClick={handleDateClick}
                />
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {introMode && (
          <motion.div
            key="introOverlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col justify-end items-start p-8 pb-[60%] z-50 bg-[#050505]"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <h1
                className="text-6xl font-black lowercase tracking-tighter text-white mb-2"
                style={{ fontFamily: "Aonic" }}
              >
                calendar
              </h1>
              <p
                className="text-xl font-bold lowercase text-white/80 leading-tight max-w-[80%]"
                style={{ fontFamily: "Aonic" }}
              >
                schedule & orders
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarPage;
