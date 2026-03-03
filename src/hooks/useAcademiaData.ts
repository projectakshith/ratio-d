import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { sendNotification } from "@/utils/notifs";
import calendarDataJson from "@/data/calendar_data.json";
import { AcademiaData, CalendarEvent, ScheduleData } from "@/types";

export const parseTimeValues = (timeStr: string): number => {
  if (!timeStr) return 0;
  const cleanStr = timeStr.replace(/[^\d:]/g, "");
  let [h, m] = cleanStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return 0;
  if (h < 7) h += 12;
  if (h === 12) h = 12;
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

  let currentClass = null;
  let nextClass = null;

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
  const {
    attendance,
    schedule: initialSchedule,
    marks,
    dayOrder: initialDayOrder,
  } = data || {};
  const [schedule, setSchedule] = useState<ScheduleData>(initialSchedule);
  const [timeStatus, setTimeStatus] = useState<{
    nextClass: any;
    currentClass: any;
  }>({ nextClass: null, currentClass: null });
  const lastNotifiedRef = useRef<string | null>(null);

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
      : initialDayOrder || "1";

  useEffect(() => {
    const syncCustomClasses = () => {
      try {
        const stored = localStorage.getItem("ratio_custom_classes");
        let mergedSchedule = JSON.parse(JSON.stringify(initialSchedule || {}));

        if (stored) {
          const customClasses = JSON.parse(stored);
          Object.keys(customClasses).forEach((dayNum) => {
            const dayKey = `Day ${dayNum}`;
            if (!mergedSchedule[dayKey]) mergedSchedule[dayKey] = {};
            customClasses[dayNum].forEach((cls: any) => {
              mergedSchedule[dayKey][cls.time] = { ...cls };
            });
          });
        }
        setSchedule(mergedSchedule);
      } catch (e) {}
    };

    syncCustomClasses();
    window.addEventListener("custom_classes_updated", syncCustomClasses);
    return () =>
      window.removeEventListener("custom_classes_updated", syncCustomClasses);
  }, [initialSchedule]);

  const upcomingAlerts = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return calendarData
      .map((item) => ({ ...item, dateObj: new Date(item.date) }))
      .filter(
        (item) =>
          !isNaN(item.dateObj!.getTime()) &&
          item.dateObj! >= now &&
          item.type === "exam",
      )
      .sort((a, b) => a.dateObj!.getTime() - b.dateObj!.getTime())
      .slice(0, 2);
  }, [calendarData]);

  const checkNotifications = useCallback(() => {
    if (!schedule) return;
    const { nextClass } = getScheduleStatus(schedule, effectiveDayOrder);

    if (nextClass) {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const diff = (nextClass.startMinutes || 0) - currentMins;

      if (
        diff >= 0 &&
        diff <= 15 &&
        lastNotifiedRef.current !== nextClass.course
      ) {
        sendNotification(
          `Next: ${nextClass.course}`,
          `📍 ${nextClass.room} • ⏳ Starts in ${diff} min`,
          nextClass.course,
        );
        lastNotifiedRef.current = nextClass.course;
      }
    }
  }, [schedule, effectiveDayOrder]);

  useEffect(() => {
    const updateStatus = () => {
      if (schedule)
        setTimeStatus(getScheduleStatus(schedule, effectiveDayOrder));
    };
    updateStatus();
    checkNotifications();
    const interval = setInterval(() => {
      updateStatus();
      checkNotifications();
    }, 60000);
    return () => clearInterval(interval);
  }, [schedule, effectiveDayOrder, checkNotifications]);

  const overallAttendance = useMemo(() => {
    if (!attendance || attendance.length === 0) return 0;
    const totalConducted = attendance.reduce(
      (acc, curr) => acc + curr.conducted,
      0,
    );
    const totalAbsent = attendance.reduce((acc, curr) => acc + curr.absent, 0);
    const totalPresent = totalConducted - totalAbsent;
    return totalConducted === 0
      ? 0
      : Math.round((totalPresent / totalConducted) * 100);
  }, [attendance]);

  const criticalAttendance = useMemo(() => {
    if (!attendance) return [];
    return attendance
      .map((subj) => {
        const present = subj.conducted - subj.absent;
        const percent =
          subj.conducted === 0 ? 0 : (present / subj.conducted) * 100;
        const req = Math.ceil(3 * subj.conducted - 4 * present);

        const courseCode =
          subj.code || (subj.course ? subj.course.split(" ")[0] : "");
        const glob: any = typeof window !== "undefined" ? window : {};
        const displayTitle =
          subj.title ||
          (glob.SUBJECT_MAP ? glob.SUBJECT_MAP[courseCode] : undefined) ||
          subj.course ||
          "Subject";

        return {
          ...subj,
          percent,
          required: req > 0 ? req : 0,
          displayName: displayTitle,
        };
      })
      .filter((subj) => subj.percent < 75);
  }, [attendance]);

  const triggerTestClass = () => {
    const now = new Date();
    const future = new Date(now.getTime() + 60000);
    const timeStr = `${String(future.getHours()).padStart(2, "0")}:${String(future.getMinutes()).padStart(2, "0")}`;
    const endStr = `${String(future.getHours() + 1).padStart(2, "0")}:${String(future.getMinutes()).padStart(2, "0")}`;
    const dayKey = `Day ${effectiveDayOrder}`;

    const newSchedule: ScheduleData = {
      ...schedule,
      [dayKey]: {
        ...(schedule?.[dayKey] || {}),
        [`${timeStr} - ${endStr}`]: {
          course: `TEST CLASS ${Math.floor(Math.random() * 100)}`,
          room: "TEST-VENUE",
          faculty: "System",
          slot: "A",
        },
      },
    };
    setSchedule(newSchedule);
    setTimeout(() => {
      setSchedule(initialSchedule);
      lastNotifiedRef.current = null;
    }, 45000);
    alert("Test class injected.");
  };

  return {
    timeStatus,
    upcomingAlerts,
    overallAttendance,
    criticalAttendance,
    overallMarks: 0,
    effectiveDayOrder,
    effectiveSchedule: schedule,
    triggerTestClass,
    calendarData,
  };
};
