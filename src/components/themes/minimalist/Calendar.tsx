"use client";
import React, { useState, useMemo, useEffect, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Target, Calendar } from "lucide-react";

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

const MinimalCalendar = () => {
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const buildDummyData = () => {
      const data = [];
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      let doCounter = 1;

      for (let m = month - 1; m <= month + 1; m++) {
        const daysInM = new Date(year, m + 1, 0).getDate();
        for (let d = 1; d <= daysInM; d++) {
          const dateObj = new Date(year, m, d);
          const dateStr = dateObj.toDateString();
          const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

          if (m === month && d === 12) {
            data.push({
              dateStr,
              order: String(doCounter),
              type: "exam",
              description: "CT-1: Machine Learning",
            });
            doCounter = doCounter === 5 ? 1 : doCounter + 1;
          } else if (m === month && d === 15) {
            data.push({
              dateStr,
              order: String(doCounter),
              type: "exam",
              description: "CT-1: Operating Systems",
            });
            doCounter = doCounter === 5 ? 1 : doCounter + 1;
          } else if (m === month && d === 20) {
            data.push({
              dateStr,
              order: "-",
              type: "holiday",
              description: "Public Holiday",
            });
          } else if (!isWeekend) {
            data.push({
              dateStr,
              order: String(doCounter),
              type: "regular",
              description: "Regular Classes",
            });
            doCounter = doCounter === 5 ? 1 : doCounter + 1;
          }
        }
      }
      return data;
    };

    setCalendarData(buildDummyData());
  }, []);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    if (navigator.vibrate) navigator.vibrate(2);
  }, []);

  const eventsMap = useMemo(() => {
    const map: any = {};
    calendarData.forEach((item: any) => {
      map[item.dateStr] = item;
    });
    return map;
  }, [calendarData]);

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const handlePrevMonth = () =>
    setViewMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1),
    );
  const handleNextMonth = () =>
    setViewMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1),
    );

  const goToToday = () => {
    const now = new Date();
    setViewMonth(now);
    setSelectedDate(now);
  };

  const viewYear = viewMonth.getFullYear();
  const viewMonthIndex = viewMonth.getMonth();
  const todayZero = new Date();
  todayZero.setHours(0, 0, 0, 0);

  const currentEvent: any = useMemo(
    () => eventsMap[selectedDate.toDateString()],
    [selectedDate, eventsMap],
  );

  const hasOrder =
    currentEvent?.order &&
    currentEvent.order !== "-" &&
    currentEvent.order !== "";
  const isExam =
    currentEvent?.type === "exam" ||
    currentEvent?.description?.toLowerCase().includes("test");

  const dayOfWeek = selectedDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isHoliday =
    currentEvent?.type === "holiday" || (isWeekend && !hasOrder);

  const theme = useMemo(() => {
    if (isExam)
      return {
        bg: "#8b5cf6",
        text: "text-white",
        border: "border-transparent",
        accent: "bg-white/20 text-white",
      };
    if (isHoliday)
      return {
        bg: "#FF4D4D",
        text: "text-white",
        border: "border-transparent",
        accent: "bg-white/20 text-white",
      };
    if (hasOrder)
      return {
        bg: "#ceff1c",
        text: "text-[#111111]",
        border: "border-transparent",
        accent: "bg-[#111111]/10 text-[#111111]",
      };
    return {
      bg: "#ffffff",
      text: "text-[#111111]",
      border: "border-[#111111]/10",
      accent: "bg-[#F7F7F7] text-[#111111]",
    };
  }, [hasOrder, isHoliday, isExam]);

  const display = useMemo(() => {
    const dayNum = String(selectedDate.getDate()).padStart(2, "0");
    const weekday = selectedDate
      .toLocaleString("en-US", { weekday: "long" })
      .toLowerCase();
    const month = selectedDate
      .toLocaleString("en-US", { month: "short" })
      .toLowerCase();
    const dateStr = `${month} ${dayNum}`;

    if (hasOrder) {
      if (isExam) {
        const parts = (currentEvent.description || "Test Scheduled").split(":");
        return {
          pill: weekday,
          label: "day order • exam",
          bigText: String(currentEvent.order).padStart(2, "0"),
          infoMain: parts[0]?.trim() || "Test",
          infoSub: parts[1]?.trim() || dateStr,
        };
      }
      return {
        pill: weekday,
        label: "day order",
        bigText: String(currentEvent.order).padStart(2, "0"),
        infoMain: dateStr,
        infoSub: currentEvent.description || "Regular Classes",
      };
    } else if (isExam) {
      const parts = (currentEvent.description || "Test Scheduled").split(":");
      return {
        pill: weekday,
        label: "examination",
        bigText: dayNum,
        infoMain: parts[0]?.trim() || "Test",
        infoSub: parts[1]?.trim() || dateStr,
      };
    } else if (isHoliday) {
      return {
        pill: weekday,
        label: "holiday",
        bigText: dayNum,
        infoMain: dateStr,
        infoSub: currentEvent?.description || "Take a break",
      };
    } else {
      return {
        pill: weekday,
        label: "date",
        bigText: dayNum,
        infoMain: dateStr,
        infoSub: "No schedule",
      };
    }
  }, [selectedDate, hasOrder, isHoliday, isExam, currentEvent]);

  const gridData = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonthIndex);
    const startOffset = getFirstDayOfMonth(viewYear, viewMonthIndex);
    const slots = [];

    for (let i = 0; i < startOffset; i++)
      slots.push({ type: "padding", key: `prev-${i}` });

    for (let d = 1; d <= daysInMonth; d++) {
      const currentDayDate = new Date(viewYear, viewMonthIndex, d);
      const event = eventsMap[currentDayDate.toDateString()];
      const isSelected =
        currentDayDate.toDateString() === selectedDate.toDateString();
      const isToday =
        currentDayDate.toDateString() === new Date().toDateString();
      const isPast = currentDayDate < todayZero;
      const dDayOfWeek = currentDayDate.getDay();
      const dIsWeekend = dDayOfWeek === 0 || dDayOfWeek === 6;
      const dayOrder = event?.order && event.order !== "-" ? event.order : null;
      const isDayHoliday =
        event?.type === "holiday" || (dIsWeekend && !dayOrder);
      const isDayExam =
        event?.type === "exam" ||
        event?.description?.toLowerCase().includes("test");

      slots.push({
        type: "day",
        day: d,
        key: `day-${d}`,
        dateObj: currentDayDate,
        isSelected,
        isToday,
        isPast,
        isDayHoliday,
        dayOrder,
        isDayExam,
      });
    }
    return slots;
  }, [viewMonth, viewMonthIndex, viewYear, eventsMap, selectedDate, todayZero]);

  const monthTitle = useMemo(() => {
    const m = viewMonth.toLocaleString("default", { month: "long" });
    return `${m} ${viewYear}`;
  }, [viewMonth, viewYear]);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700;800;900&display=swap');

          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `,
        }}
      />

      <div className="absolute inset-0 bg-[#F7F7F7] overflow-hidden flex flex-col">
        <div className="h-full w-full overflow-y-auto no-scrollbar px-5 pt-8 pb-[100px] flex flex-col gap-6 relative z-10">
          <motion.div
            animate={{ backgroundColor: theme.bg }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`w-full rounded-[32px] p-6 flex flex-col shadow-sm shrink-0 border-[1.5px] ${theme.border} justify-between`}
          >
            <div className="self-start">
              <div
                className={`px-4 py-2 rounded-full flex items-center gap-2 ${theme.accent}`}
              >
                <Calendar size={16} className={theme.text} />
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
                  className={`text-[32px] font-black uppercase tracking-widest leading-none mb-2 ${theme.text} break-words`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {display.infoMain}
                </span>
                <span
                  className={`text-[20px] font-bold lowercase tracking-wide leading-snug ${theme.text} opacity-90`}
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  {display.infoSub}
                </span>
              </div>
            </div>
          </motion.div>

          <div className="flex-1 bg-white border-[1.5px] border-[#111111]/10 rounded-[32px] p-5 flex flex-col shadow-sm shrink-0">
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
          </div>
        </div>

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
