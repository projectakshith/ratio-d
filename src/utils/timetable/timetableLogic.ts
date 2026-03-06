import { ScheduleData, ScheduleSlot } from "@/types";
import { parseTimetableTime } from "../dashboard/timetableLogic";

export const getInitialActiveDay = (
  schedule: ScheduleData,
  isHoliday: boolean,
  dayOrder: number,
  nextWorkingDayOrder: number | null,
) => {
  if (isHoliday) {
    return nextWorkingDayOrder || 1;
  } else if (!isNaN(dayOrder) && dayOrder >= 1 && dayOrder <= 5) {
    const todayData = schedule[`Day ${dayOrder}`] || {};
    let lastEnd = 0;
    Object.keys(todayData).forEach((time) => {
      const endStr = time.split("-")[1];
      if (endStr) {
        const endMins = parseTimetableTime(endStr);
        if (endMins > lastEnd) lastEnd = endMins;
      }
    });

    const nowMins = new Date().getHours() * 60 + new Date().getMinutes();

    if (lastEnd > 0 && nowMins >= lastEnd) {
      return nextWorkingDayOrder || (dayOrder < 5 ? dayOrder + 1 : 1);
    } else {
      return dayOrder;
    }
  }
  return 1;
};

export const handleAddClassLogic = (
  newSub: string,
  newRoom: string,
  startTime: string,
  endTime: string,
  newType: "theory" | "lab",
  activeDay: number,
) => {
  if (!newSub.trim() || !newRoom.trim() || !startTime || !endTime) return null;

  const stored = localStorage.getItem("ratio_custom_classes");
  const currentCustoms: Record<number, any[]> = stored ? JSON.parse(stored) : {};

  const newClassItem = {
    id: `custom-${Date.now()}`,
    code: newSub,
    courseTitle: newSub,
    course: newSub,
    time: `${startTime} - ${endTime}`,
    room: newRoom,
    faculty: "user added",
    slot: newType === "lab" ? "P1" : "A1",
    type: newType,
    isCustom: true,
  };

  const updated = {
    ...currentCustoms,
    [activeDay]: [...(currentCustoms[activeDay] || []), newClassItem],
  };

  localStorage.setItem("ratio_custom_classes", JSON.stringify(updated));
  window.dispatchEvent(new Event("custom_classes_updated"));
  return true;
};

export const handleDeleteCustomLogic = (day: number, timeStr: string) => {
  const stored = localStorage.getItem("ratio_custom_classes");
  if (!stored) return;
  const currentCustoms = JSON.parse(stored);

  if (currentCustoms[day]) {
    currentCustoms[day] = currentCustoms[day].filter(
      (c: any) => c.time !== timeStr,
    );
    localStorage.setItem(
      "ratio_custom_classes",
      JSON.stringify(currentCustoms),
    );
    window.dispatchEvent(new Event("custom_classes_updated"));
    return true;
  }
  return false;
};
