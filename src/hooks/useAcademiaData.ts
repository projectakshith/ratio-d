import { useState, useEffect, useMemo, useCallback } from "react";
import { sendNotification } from "@/utils/shared/notifs";
import calendarDataJson from "@/data/calendar_data.json";
import {
  getScheduleStatus,
  calculateOverallAttendance,
  getCriticalAttendance,
} from "@/utils/academia/academiaLogic";
import {
  AcademiaData,
  CalendarEvent,
  ScheduleData,
  ScheduleSlot,
} from "@/types";

const EMPTY_SCHEDULE: ScheduleData = {};

export const useAcademiaData = (data: AcademiaData | null) => {
  const initialSchedule = useMemo(() => data?.schedule || EMPTY_SCHEDULE, [data?.schedule]);
  const [schedule, setSchedule] = useState<ScheduleData>(initialSchedule);
  const [timeStatus, setTimeStatus] = useState<{
    nextClass: ScheduleSlot | null;
    currentClass: ScheduleSlot | null;
  }>({ nextClass: null, currentClass: null });

  const calendarData = useMemo(() => 
    (calendarDataJson || []) as CalendarEvent[], 
    []
  );
  const todayDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const todayEntry = calendarData.find((item) => item.date === todayDate);
  const effectiveDayOrder =
    todayEntry && todayEntry.order !== "-"
      ? todayEntry.order
      : data?.dayOrder || "1";

  const mergeSchedule = useCallback(() => {
    try {
      const stored = localStorage.getItem("ratio_custom_classes");
      const mergedSchedule: ScheduleData = JSON.parse(
        JSON.stringify(initialSchedule),
      );

      if (stored) {
        const customClasses: Record<string, ScheduleSlot[]> =
          JSON.parse(stored);
        Object.keys(customClasses).forEach((dayNum) => {
          const dayKey = `Day ${dayNum}`;
          if (!mergedSchedule[dayKey]) mergedSchedule[dayKey] = {};
          customClasses[dayNum].forEach((cls) => {
            mergedSchedule[dayKey][cls.time] = { ...cls };
          });
        });
      }
      
      const isSame = JSON.stringify(mergedSchedule) === JSON.stringify(schedule);
      if (!isSame) {
        setSchedule(mergedSchedule);
      }
    } catch {
    }
  }, [initialSchedule, schedule]);

  useEffect(() => {
    mergeSchedule();
    window.addEventListener("custom_classes_updated", mergeSchedule);
    return () =>
      window.removeEventListener("custom_classes_updated", mergeSchedule);
  }, [mergeSchedule]);

  useEffect(() => {
    const updateStatus = () => {
      if (schedule && Object.keys(schedule).length > 0) {
        const newStatus = getScheduleStatus(schedule, effectiveDayOrder);
        if (JSON.stringify(newStatus) !== JSON.stringify(timeStatus)) {
          setTimeStatus(newStatus);
        }
      }
    };
    updateStatus();
    const interval = setInterval(updateStatus, 60000);
    return () => clearInterval(interval);
  }, [schedule, effectiveDayOrder, timeStatus]);

  const overallAttendance = useMemo(() => {
    return calculateOverallAttendance(data?.attendance || []);
  }, [data?.attendance]);

  const criticalAttendance = useMemo(() => {
    return getCriticalAttendance(data?.attendance || []);
  }, [data?.attendance]);

  const triggerTestClass = useCallback(() => {
    sendNotification(
      "Test Class Incoming",
      "Your test class starts now in Room 101",
      "test-tag",
    );
  }, []);

  return useMemo(() => ({
    timeStatus,
    overallAttendance,
    criticalAttendance,
    effectiveDayOrder,
    effectiveSchedule: schedule,
    calendarData,
    triggerTestClass,
  }), [timeStatus, overallAttendance, criticalAttendance, effectiveDayOrder, schedule, calendarData, triggerTestClass]);
};
