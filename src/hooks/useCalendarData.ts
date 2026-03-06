import { useState, useMemo, useEffect, useCallback } from "react";
import calendarDataJson from "@/data/calendar_data.json";
import {
  getCalendarGrid,
  getCalendarDisplay,
  getCalendarTheme,
} from "@/utils/dashboard/calendarLogic";
import { CalendarEvent } from "@/types";

export const useCalendarData = (
  calendarDataProp?: CalendarEvent[],
  isTargetAudience: boolean = false,
) => {
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [introMode, setIntroMode] = useState(true);

  const calendarData =
    (calendarDataProp?.length
      ? calendarDataProp
      : (calendarDataJson as CalendarEvent[])) || [];

  useEffect(() => {
    const timer = setTimeout(() => setIntroMode(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    if (navigator.vibrate) navigator.vibrate(2);
  }, []);

  const eventsMap = useMemo(() => {
    const map: Record<string, CalendarEvent> = {};
    calendarData.forEach((item) => {
      const dateObj = new Date(item.date);
      if (!isNaN(dateObj.getTime())) {
        if (item.type === "exam" && !isTargetAudience) {
          map[dateObj.toDateString()] = { ...item, type: "regular" };
        } else {
          map[dateObj.toDateString()] = item;
        }
      }
    });
    return map;
  }, [calendarData, isTargetAudience]);

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
  const hasOrder = !!(
    currentEvent?.order &&
    currentEvent.order !== "-" &&
    currentEvent.order !== ""
  );
  const isExam = currentEvent?.type === "exam";

  const dayOfWeek = selectedDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isHoliday = !!(
    currentEvent?.description?.toLowerCase().includes("holiday") ||
    (isWeekend && !hasOrder)
  );

  const theme = useMemo(
    () => getCalendarTheme(isExam, isHoliday, hasOrder),
    [isExam, isHoliday, hasOrder],
  );

  const display = useMemo(
    () =>
      getCalendarDisplay(selectedDate, isExam, hasOrder, isHoliday, currentEvent),
    [selectedDate, isExam, hasOrder, isHoliday, currentEvent],
  );

  const gridData = useMemo(() => {
    return getCalendarGrid(
      viewYear,
      viewMonthIndex,
      eventsMap,
      selectedDate,
      todayZero,
    );
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
    handleDateClick,
  };
};
