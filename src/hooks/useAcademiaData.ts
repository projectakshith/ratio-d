import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { sendNotification } from "@/utils/notifs";
import calendarDataJson from "@/data/calendar_data.json";
import { AcademiaData, CalendarEvent, ScheduleData, ScheduleSlot } from "@/types";

export const parseTimeValues = (timeStr: string): number => {
  if (!timeStr) return 0;
  const cleanStr = timeStr.replace(/[^\d:]/g, "");
  let [h, m] = cleanStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return 0;
  if (h < 7) h += 12;
  return h * 60 + m;
};

export const getScheduleStatus = (
  schedule: ScheduleData,
  activeDayOrder: string,
) => {
  const targetDay =
    activeDayOrder && activeDayOrder !== "-" ? activeDayOrder : "1";
  const dayKey = `Day ${targetDay}`;
  const todaySchedule = schedule?.[dayKey];

  if (!todaySchedule)
    return { status: "free", nextClass: null, currentClass: null };

  const now = new Date();
  const currentTimeVal = now.getHours() * 60 + now.getMinutes();

  const sortedSlots = Object.entries(todaySchedule)
    .map(([timeRange, details]) => {
      const [startStr, endStr] = timeRange.split(" - ");
      return {
        ...details,
        time: timeRange,
        startMinutes: parseTimeValues(startStr),
        endMinutes: parseTimeValues(endStr),
      };
    })
    .sort((a, b) => (a.startMinutes || 0) - (b.startMinutes || 0));

  let currentClass: ScheduleSlot | null = null;
  let nextClass: ScheduleSlot | null = null;

  for (const slot of sortedSlots) {
    const start = slot.startMinutes || 0;
    const end = slot.endMinutes || 0;
    if (currentTimeVal >= start && currentTimeVal < end) {
      currentClass = slot;
    } else if (currentTimeVal < start && !nextClass) {
      nextClass = slot;
    }
  }

  return { status: currentClass ? "busy" : "free", nextClass, currentClass };
};

export const useAcademiaData = (data: AcademiaData) => {
  const initialSchedule = data?.schedule || {};
  const [schedule, setSchedule] = useState<ScheduleData>(initialSchedule);
  const [timeStatus, setTimeStatus] = useState<{
    nextClass: ScheduleSlot | null;
    currentClass: ScheduleSlot | null;
  }>({ nextClass: null, currentClass: null });

  const calendarData = (calendarDataJson || []) as CalendarEvent[];
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
      setSchedule(mergedSchedule);
    } catch (e) {}
  }, [initialSchedule]);

  useEffect(() => {
    mergeSchedule();
    window.addEventListener("custom_classes_updated", mergeSchedule);
    return () => window.removeEventListener("custom_classes_updated", mergeSchedule);
  }, [mergeSchedule]);

  useEffect(() => {
    const updateStatus = () => {
      if (schedule) setTimeStatus(getScheduleStatus(schedule, effectiveDayOrder));
    };
    updateStatus();
    const interval = setInterval(updateStatus, 60000);
    return () => clearInterval(interval);
  }, [schedule, effectiveDayOrder]);

  const overallAttendance = useMemo(() => {
    if (!data?.attendance || data.attendance.length === 0) return 0;
    const totalC = data.attendance.reduce((acc, curr) => acc + curr.conducted, 0);
    const totalA = data.attendance.reduce((acc, curr) => acc + curr.absent, 0);
    return totalC === 0 ? 0 : Math.round(((totalC - totalA) / totalC) * 100);
  }, [data?.attendance]);

  const criticalAttendance = useMemo(() => {
    if (!data?.attendance) return [];
    return data.attendance
      .map((subj) => {
        const present = subj.conducted - subj.absent;
        const percent = subj.conducted === 0 ? 0 : (present / subj.conducted) * 100;
        const req = Math.ceil(3 * subj.conducted - 4 * present);
        return { ...subj, percent, required: req > 0 ? req : 0, displayName: subj.title || subj.course || "Subject" };
      })
      .filter((subj) => subj.percent < 75);
  }, [data?.attendance]);

  const triggerTestClass = useCallback(() => {
    sendNotification("Test Class Incoming", "Your test class starts now in Room 101", "test-tag");
  }, []);

  return {
    timeStatus,
    overallAttendance,
    criticalAttendance,
    effectiveDayOrder,
    effectiveSchedule: schedule,
    calendarData,
    triggerTestClass,
  };
  };