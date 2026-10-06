export const getDashboardDisplayedDate = (
  calendarData: any[],
  selectedDay: number,
  currentDayOrder: number,
  isHoliday: boolean,
  todayValue = new Date(),
) => {
  const today = new Date(todayValue);
  today.setHours(0, 0, 0, 0);
  if (!isHoliday && selectedDay === currentDayOrder) return today;

  return calendarData
    .filter((event) => {
      const date = new Date(event.date);
      const order = Number(event.dayOrder || event.day_order || event.order);
      date.setHours(0, 0, 0, 0);
      return date >= today && order === selectedDay;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]?.date || null;
};
