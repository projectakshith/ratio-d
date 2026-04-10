import { ScheduleData, ScheduleSlot, CalendarEvent } from "@/types";
import { parseTimetableTime, getAcronym } from "./timetableLogic";

export const getDashboardSchedule = (
  schedule: ScheduleData,
  customClasses: Record<number, any[]>,
  selectedDay: number,
  currentDayOrder: string | number,
  courseMap: Record<string, string>
) => {
  const dayToUse = selectedDay || Number(currentDayOrder);
  const dayKey = `Day ${dayToUse}`;
  
  const baseSlots = schedule[dayKey] ? Object.values(schedule[dayKey]) : [];
  const customSlots = customClasses[dayToUse] || [];
  
  const allSlots = [...baseSlots, ...customSlots].filter(s => s && s.time);
  
  const processed = allSlots.map((s: any) => {
    const code = (s.courseCode || s.code || "").split("-")[0].trim();
    const name = courseMap[code] || s.courseTitle || s.name || s.course || "Unknown";
    return {
      ...s,
      name,
      acronym: getAcronym(name),
      startTime: parseTimetableTime(s.time.split("-")[0].trim()),
      endTime: parseTimetableTime(s.time.split("-")[1]?.trim() || s.time.split("-")[0].trim())
    };
  }).sort((a, b) => a.startTime - b.startTime);

  return {
    standardGrid: processed,
    extraGrid: []
  };
};

export const getStatusLogic = (
  schedule: ScheduleData,
  customClasses: Record<number, any[]>,
  todayOrder: string | number,
  currentDayOrder: string | number,
  courseMap: Record<string, string>,
  isHoliday: boolean,
  calendarData: CalendarEvent[],
  rawCalendar: any[]
) => {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  
  const dayKey = `Day ${todayOrder}`;
  const daySlots = schedule[dayKey] ? Object.values(schedule[dayKey]) : [];
  const customSlots = customClasses[Number(todayOrder)] || [];
  
  const allSlots = [...daySlots, ...customSlots].filter(s => s && s.time).map((s: any) => {
    const code = (s.courseCode || s.code || "").split("-")[0].trim();
    const name = courseMap[code] || s.courseTitle || s.name || s.course || "Unknown";
    return {
      ...s,
      name,
      startTime: parseTimetableTime(s.time.split("-")[0].trim()),
      endTime: parseTimetableTime(s.time.split("-")[1]?.trim() || s.time.split("-")[0].trim())
    };
  }).sort((a, b) => a.startTime - b.startTime);

  let currentClass = null;
  let nextClass = null;

  if (!isHoliday) {
    currentClass = allSlots.find(s => nowMins >= s.startTime && nowMins < s.endTime) || null;
    nextClass = allSlots.find(s => s.startTime > nowMins) || null;
  }

  return {
    currentClass,
    nextClass,
    realDayToTrack: todayOrder
  };
};
