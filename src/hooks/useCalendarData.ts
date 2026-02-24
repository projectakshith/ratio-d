import { useState, useMemo, useEffect } from "react";
import calendarDataJson from "../../public/calendar_data.json";
import { CalendarEvent } from "../types";

export const useCalendarData = (calendarDataProp?: CalendarEvent[]) => {
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [introMode, setIntroMode] = useState(true);

  const calendarData =
    calendarDataProp || (calendarDataJson as CalendarEvent[]) || [];

  useEffect(() => {
    const timer = setTimeout(() => setIntroMode(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const eventsMap = useMemo(() => {
    const map: Record<string, CalendarEvent> = {};
    calendarData.forEach((item) => {
      const dateObj = new Date(item.date);
      if (!isNaN(dateObj.getTime())) map[dateObj.toDateString()] = item;
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

  const currentEvent = useMemo(
    () => eventsMap[selectedDate.toDateString()],
    [selectedDate, eventsMap],
  );
  const hasOrder =
    currentEvent?.order &&
    currentEvent.order !== "-" &&
    currentEvent.order !== "";
  const isExam = currentEvent?.type === "exam";

  const dayOfWeek = selectedDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isHoliday =
    currentEvent?.description?.toLowerCase().includes("holiday") ||
    (isWeekend && !hasOrder);

  const theme = useMemo(() => {
    if (isExam) return { bg: "#8b5cf6", text: "text-white" };
    if (hasOrder) return { bg: "#ceff1c", text: "text-[#050505]" };
    if (isHoliday) return { bg: "#ff003c", text: "text-white" };
    return { bg: "#ffffff", text: "text-[#050505]" };
  }, [hasOrder, isHoliday, isExam]);

  const display = useMemo(() => {
    const dayNum = String(selectedDate.getDate()).padStart(2, "0");
    const weekday = selectedDate
      .toLocaleString("en-US", { weekday: "long" })
      .toLowerCase();
    const month = selectedDate
      .toLocaleString("en-US", { month: "short" })
      .toLowerCase();

    if (isExam) {
      return {
        pill: weekday,
        bigText: currentEvent.order
          ? currentEvent.order.padStart(2, "0")
          : dayNum,
        label: "day order",
        infoMain: `${month} ${dayNum}`,
        infoSub: currentEvent.description || "Exam Day",
      };
    } else if (hasOrder) {
      return {
        pill: weekday,
        bigText: currentEvent.order.padStart(2, "0"),
        label: "day order",
        infoMain: `${month} ${dayNum}`,
        infoSub: "Regular Classes",
      };
    } else {
      return {
        pill: weekday,
        bigText: dayNum,
        label: "date",
        infoMain: `${month}`,
        infoSub: isHoliday ? "Holiday" : "No schedule",
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
        event?.description?.toLowerCase().includes("holiday") ||
        (dIsWeekend && !dayOrder);
      const isDayExam = event?.type === "exam";

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
    return (
      m.charAt(0).toUpperCase() + m.slice(1).toLowerCase() + " " + viewYear
    );
  }, [viewMonth, viewYear]);

  return {
    introMode,
    theme,
    display,
    monthTitle,
    handlePrevMonth,
    handleNextMonth,
    goToToday,
    gridData,
    setSelectedDate,
  };
};
