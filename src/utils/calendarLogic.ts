export const buildEventsMap = (calendarData: any[]) => {
  const map: Record<string, any> = {};
  if (calendarData) {
    calendarData.forEach((item) => {
      const dateObj = new Date(item.date);
      if (!isNaN(dateObj.getTime())) {
        map[dateObj.toDateString()] = item;
      }
    });
  }
  return map;
};

export const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

export const getFirstDayOfMonth = (year: number, month: number) => {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
};

export const getDayInfo = (dateObj: Date, eventsMap: Record<string, any>) => {
  const currentEvent = eventsMap[dateObj.toDateString()];
  const hasOrder =
    currentEvent?.order &&
    currentEvent.order !== "-" &&
    currentEvent.order !== "";
  const isExam = currentEvent?.type === "exam";
  const dayOfWeek = dateObj.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isHoliday =
    currentEvent?.description?.toLowerCase().includes("holiday") ||
    (isWeekend && !hasOrder);

  return { currentEvent, hasOrder, isExam, isWeekend, isHoliday };
};

export const getCalendarTheme = (
  isExam: boolean,
  hasOrder: boolean,
  isHoliday: boolean
) => {
  if (isExam)
    return { bg: "#8b5cf6", text: "text-white", accent: "bg-white" };
  if (hasOrder)
    return { bg: "#ceff1c", text: "text-[#050505]", accent: "bg-[#050505]" };
  if (isHoliday)
    return { bg: "#ff003c", text: "text-white", accent: "bg-white" };
  return { bg: "#ffffff", text: "text-[#050505]", accent: "bg-[#050505]" };
};

export const getDisplayData = (
  selectedDate: Date,
  currentEvent: any,
  isExam: boolean,
  hasOrder: boolean,
  isHoliday: boolean
) => {
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
      bigText: currentEvent?.order
        ? currentEvent.order.padStart(2, "0")
        : dayNum,
      label: "day order",
      infoMain: `${month} ${dayNum}`,
      infoSub: currentEvent?.description || "Exam Day",
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
};

export const getMonthTitle = (viewMonth: Date, viewYear: number) => {
  const m = viewMonth.toLocaleString("default", { month: "long" });
  return (
    m.charAt(0).toUpperCase() + m.slice(1).toLowerCase() + " " + viewYear
  );
};

export const generateGridData = (
  viewYear: number,
  viewMonthIndex: number,
  eventsMap: Record<string, any>,
  selectedDate: Date
) => {
  const daysInMonth = getDaysInMonth(viewYear, viewMonthIndex);
  const startOffset = getFirstDayOfMonth(viewYear, viewMonthIndex);
  const slots = [];
  const todayZero = new Date();
  todayZero.setHours(0, 0, 0, 0);

  for (let i = 0; i < startOffset; i++) {
    slots.push({ type: "padding", key: `prev-${i}` });
  }

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
};