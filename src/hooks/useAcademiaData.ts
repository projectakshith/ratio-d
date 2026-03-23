import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { sendNotification } from "@/utils/shared/notifs";
import calendarDataJson from "@/data/calendar_data.json";
import {
  getScheduleStatus,
  calculateOverallAttendance,
  getCriticalAttendance,
} from "@/utils/academia/academiaLogic";
import {
  processAndSortMarks,
  buildCourseMap,
} from "@/utils/marks/marksLogic";
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

  const sentMarkers = useRef<Set<string>>(new Set());

  const calendarData = useMemo(() => 
    (calendarDataJson || []) as CalendarEvent[], 
    []
  );

  const courseMap = useMemo(() => buildCourseMap(data), [data]);
  const sortedMarks = useMemo(() => {
    const rawMarks = Array.isArray(data?.marks) ? data.marks : [];
    return processAndSortMarks(rawMarks, courseMap);
  }, [data?.marks, courseMap]);

  const overallMarks = useMemo(() => {
    const validMarks = sortedMarks.filter(m => !m.isNA);
    if (validMarks.length === 0) return 0;
    const totalPct = validMarks.reduce((sum, m) => sum + m.percentage, 0);
    return Math.round(totalPct / validMarks.length);
  }, [sortedMarks]);

  const recentMarks = useMemo(() => {
    return sortedMarks.filter(m => !m.isNA).slice(0, 2);
  }, [sortedMarks]);
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

  useEffect(() => {
    const checkNotifications = () => {
      if (!timeStatus.nextClass) return;
      
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const diff = (timeStatus.nextClass.startMinutes || 0) - currentMins;

      const nextClassName = timeStatus.nextClass.course || "Class";

      if (diff <= 15 && diff > 5 && !sentMarkers.current.has(`${nextClassName}-15`)) {
        sendNotification(
          `Next: ${nextClassName}`,
          `⏳ Starts in ${diff} min`,
          nextClassName,
        );
        sentMarkers.current.add(`${nextClassName}-15`);
      } 
      else if (diff <= 5 && diff >= 0 && !sentMarkers.current.has(`${nextClassName}-5`)) {
        sendNotification(
          `Next: ${nextClassName}`,
          `📍 ${timeStatus.nextClass.room || "No Room"}  •  ⏳ Starts in ${diff} min`,
          nextClassName,
        );
        sentMarkers.current.add(`${nextClassName}-5`);
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, [timeStatus.nextClass]);

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
    overallMarks,
    recentMarks,
    effectiveDayOrder,
    effectiveSchedule: schedule,
    calendarData,
    triggerTestClass,
  }), [timeStatus, overallAttendance, criticalAttendance, overallMarks, recentMarks, effectiveDayOrder, schedule, calendarData, triggerTestClass]);
};
