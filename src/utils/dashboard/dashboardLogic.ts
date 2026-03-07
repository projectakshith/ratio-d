import { ScheduleData, ScheduleSlot } from "@/types";
import { processSchedule } from "./timetableLogic";

export const getDashboardSchedule = (
  scheduleData: ScheduleData,
  customClasses: Record<number, any[]>,
  selectedDay: number,
  currentDayOrder: number,
  courseMap: Record<string, string>,
) => {
  const processedDay = processSchedule(
    scheduleData,
    customClasses,
    selectedDay,
    currentDayOrder,
    courseMap,
  );
  const targetStarts = [480, 530, 580, 635, 690, 745, 800, 855, 905, 955];
  const std = Array(10)
    .fill(null)
    .map((_, i) => ({ id: `std-empty-${i}`, active: false }));
  const ext: any[] = [];
  processedDay.forEach((cls: any, i: number) => {
    if (cls.type === "break") return;
    let closestIdx = -1;
    let minDiff = 9999;
    for (let j = 0; j < 10; j++) {
      const diff = Math.abs(cls.minutesStart - targetStarts[j]);
      if (diff <= 35 && diff < minDiff) {
        closestIdx = j;
        minDiff = diff;
      }
    }
    const mappedCls = {
      ...cls,
      sub: cls.code,
      active: true,
      isPractical: cls.type === "lab" || cls.type === "practical",
    };
    if (closestIdx !== -1 && !std[closestIdx].active) {
      std[closestIdx] = {
        ...std[closestIdx],
        ...mappedCls,
        id: `std-active-${closestIdx}`,
      };
    } else {
      ext.push({ ...mappedCls, id: `ext-${cls.time}-${i}` });
    }
  });
  return { standardGrid: std, extraGrid: ext };
};

export const getStatusLogic = (
  scheduleData: ScheduleData,
  customClasses: Record<number, any[]>,
  todayOrder: number,
  currentDayOrder: number,
  courseMap: Record<string, string>,
  isHoliday: boolean,
  calendarData: any[],
  calendarDataJson: any[],
) => {
  const isFutureTrack = isHoliday || todayOrder !== currentDayOrder;
  const processedToday = processSchedule(
    scheduleData,
    customClasses,
    todayOrder,
    currentDayOrder,
    courseMap,
  );
  const now = new Date();
  const nowMins = isFutureTrack ? 0 : now.getHours() * 60 + now.getMinutes();
  const activeToday = processedToday.filter((c: any) => c.type !== "break");
  let curr: ScheduleSlot | null = null;
  let nxt: ScheduleSlot | null = null;
  for (const cls of activeToday) {
    const start = cls.minutesStart || 0;
    const end = cls.minutesEnd || 0;
    if (!isFutureTrack && nowMins >= start && nowMins < end) {
      curr = cls;
    } else if (start > nowMins && !nxt) {
      nxt = cls;
    }
  }
  let trackedDay = todayOrder;
  if (!nxt && !isHoliday) {
    const calData = calendarData.length > 0 ? calendarData : calendarDataJson || [];
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const futureWorkingDays = calData
      .filter((ev: any) => {
        const evDate = new Date(ev.date);
        evDate.setHours(0, 0, 0, 0);
        const dOrder = parseInt(ev.dayOrder || ev.day_order || ev.order);
        return evDate > todayDate && !isNaN(dOrder) && dOrder >= 1 && dOrder <= 5;
      })
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (futureWorkingDays.length > 0) {
      const nextWorkingDay = parseInt(futureWorkingDays[0].dayOrder || futureWorkingDays[0].day_order || futureWorkingDays[0].order);
      const processedNext = processSchedule(scheduleData, customClasses, nextWorkingDay, currentDayOrder, courseMap);
      const activeNext = processedNext.filter((c: any) => c.type !== "break");
      if (activeNext.length > 0) {
        nxt = activeNext[0];
        trackedDay = nextWorkingDay;
      }
    }
  }
  return {
    currentClass: curr,
    nextClass: nxt,
    isLastClass: !!(curr && !nxt),
    realDayToTrack: trackedDay,
  };
};
