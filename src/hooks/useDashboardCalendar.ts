import { useMemo, useState, useEffect, useRef } from "react";
import calendarDataJson from "@/data/calendar_data.json";
import { parseTimeValues } from "@/utils/academia/academiaLogic";

export function useDashboardCalendar(academia: any, data: any) {
  const todayStr = useMemo(() => {
    const now = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = String(now.getDate()).padStart(2, "0");
    const m = months[now.getMonth()];
    const y = now.getFullYear();
    return `${d} ${m} ${y}`;
  }, []);

  const todayCalendarEntry = useMemo(() => {
    const calData = academia?.calendarData || calendarDataJson || [];
    return calData.find((ev: any) => ev.date === todayStr);
  }, [academia?.calendarData, todayStr]);

  const currentDayOrderStr = todayCalendarEntry?.dayOrder || todayCalendarEntry?.order || data?.dayOrder || "-";
  const currentDayOrder = parseInt(String(currentDayOrderStr)) || 0;

  const isHoliday =
    !currentDayOrderStr ||
    currentDayOrderStr === "-" ||
    currentDayOrderStr === "0" ||
    isNaN(currentDayOrder) ||
    currentDayOrder === 0;

  const [selectedDay, setSelectedDay] = useState(1);
  const [mounted, setMounted] = useState(false);
  const hasInitialized = useRef(false);

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

  const isTodayFinished = useMemo(() => {
    if (isHoliday) return true;
    const scheduleData = academia?.effectiveSchedule || data?.timetable || data?.schedule || {};
    const dayKey = `Day ${currentDayOrder}`;
    const todayData = scheduleData[dayKey];
    if (!todayData) return true;

    let lastEnd = 0;
    Object.keys(todayData).forEach((timeRange) => {
      const endStr = timeRange.split(" - ")[1];
      if (endStr) {
        const endMins = parseTimeValues(endStr);
        if (endMins > lastEnd) lastEnd = endMins;
      }
    });

    const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
    return nowMins >= lastEnd;
  }, [isHoliday, academia?.effectiveSchedule, data?.timetable, data?.schedule, currentDayOrder]);

  const isTomorrowHoliday = useMemo(() => {
    if (!isTodayFinished) return false;

    const calData = academia?.calendarData || calendarDataJson || [];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = String(tomorrow.getDate()).padStart(2, "0");
    const m = months[tomorrow.getMonth()];
    const y = tomorrow.getFullYear();
    const tomorrowStr = `${d} ${m} ${y}`;

    const entry = calData.find((ev: any) => ev.date === tomorrowStr);
    return !entry || entry.order === "-" || entry.order === "0" || entry.description.toLowerCase().includes("holiday");
  }, [academia?.calendarData, isTodayFinished]);

  useEffect(() => {
    if (hasInitialized.current) return;
    const scheduleData =
      academia?.effectiveSchedule || data?.timetable || data?.schedule || {};

    if (isHoliday) {
      setSelectedDay(nextWorkingDayOrder || 1);
    } else {
      const dayKey = `Day ${currentDayOrder}`;
      const todayData = scheduleData[dayKey];

      let lastEnd = 0;
      if (todayData) {
        Object.values(todayData).forEach((item: any) => {
          if (!item) return;
          const timeStr = item.time || "";
          const endStr = timeStr.split("-")[1];
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

  return {
    mounted,
    currentDayOrder,
    isHoliday,
    selectedDay,
    nextWorkingDayOrder,
    isTomorrowHoliday,
    handleDaySwitch,
  };
}
