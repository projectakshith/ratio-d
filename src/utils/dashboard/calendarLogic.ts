import { CalendarEvent, CalendarSlot } from "@/types";

export const getCalendarGrid = (
  year: number,
  month: number,
  eventsMap: Record<string, CalendarEvent>,
  selectedDate: Date,
  todayZero: Date,
) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const slots: CalendarSlot[] = [];

  for (let i = 0; i < startOffset; i++) {
    slots.push({ type: "padding", key: `prev-${i}` });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const currentDayDate = new Date(year, month, d);
    const event = eventsMap[currentDayDate.toDateString()];
    const isSelected =
      currentDayDate.toDateString() === selectedDate.toDateString();
    const isToday = currentDayDate.toDateString() === new Date().toDateString();
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

export const getCalendarDisplay = (
  selectedDate: Date,
  isExam: boolean,
  hasOrder: boolean,
  isHoliday: boolean,
  currentEvent?: CalendarEvent,
) => {
  const dayNum = String(selectedDate.getDate()).padStart(2, "0");
  const weekday = selectedDate
    .toLocaleString("en-US", { weekday: "long" })
    .toLowerCase();
  const month = selectedDate
    .toLocaleString("en-US", { month: "short" })
    .toLowerCase();

  if (isExam) {
    const parts = (currentEvent?.description || "Test Scheduled").split(":");
    return {
      pill: weekday,
      bigText: currentEvent?.order
        ? currentEvent.order.padStart(2, "0")
        : dayNum,
      label: "day order",
      infoMain: parts[0]?.trim() || "Test",
      infoSub:
        parts.slice(1).join(":").trim() ||
        currentEvent?.description ||
        "Exam Day",
    };
  } else if (hasOrder) {
    return {
      pill: weekday,
      bigText: currentEvent?.order.padStart(2, "0") || "",
      label: "day order",
      infoMain: `${month} ${dayNum}`,
      infoSub: "Regular Classes",
    };
  } else if (isHoliday) {
    return {
      pill: weekday,
      label: "holiday",
      bigText: dayNum,
      infoMain: `${month} ${dayNum}`,
      infoSub: currentEvent?.description || "Take a break",
    };
  } else {
    return {
      pill: weekday,
      bigText: dayNum,
      label: "date",
      infoMain: `${month} ${dayNum}`,
      infoSub: "No schedule",
    };
  }
};

export const getCalendarTheme = (
  isExam: boolean,
  isHoliday: boolean,
  hasOrder: boolean,
) => {
  if (isExam)
    return {
      bg: "bg-theme-accent",
      text: "text-theme-bg",
      border: "border-transparent",
      accent: "bg-theme-bg-alpha text-theme-bg",
    };
  if (isHoliday)
    return {
      bg: "bg-theme-secondary",
      text: "text-theme-bg",
      border: "border-transparent",
      accent: "bg-theme-bg-alpha text-theme-bg",
    };
  if (hasOrder)
    return {
      bg: "bg-theme-surface",
      text: "text-theme-text",
      border: "border-theme-subtle",
      accent: "bg-theme-primary text-theme-bg",
    };
  return {
    bg: "bg-theme-surface",
    text: "text-theme-text",
    border: "border-theme-subtle",
    accent: "bg-theme-bg-alpha text-theme-text",
  };
};
