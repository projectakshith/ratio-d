export const getDateDisplay = () => {
  const d = new Date();
  return {
    date: d.getDate(),
    month: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
    day: d.toLocaleString('default', { weekday: 'long' }).toUpperCase(),
    year: d.getFullYear()
  };
};

export const parseTimetableTime = (str) => {
  if (!str) return 0;
  let [h, m] = str.split(':').map(Number);
  if (h < 8) h += 12; 
  return h * 60 + m;
};

export const processSchedule = (schedule, activeDayOrder, dayOrderStr) => {
  if (!schedule) return [];
  
  const dayKey = `Day ${activeDayOrder}`;
  const dayData = schedule[dayKey];
  if (!dayData) return [];
  
  const rawItems = Object.values(dayData).map((details) => {
    if (!details || !details.time) return null;

    const [startStr, endStr] = details.time.split(' - ');
    
    return {
      ...details,
      start: startStr,
      end: endStr,
      minutesStart: parseTimetableTime(startStr),
      minutesEnd: parseTimetableTime(endStr),
    };
  }).filter(Boolean).sort((a, b) => a.minutesStart - b.minutesStart);

  const mergedItems = [];
  rawItems.forEach((item) => {
    const lastItem = mergedItems[mergedItems.length - 1];
    
    if (lastItem && 
        lastItem.course === item.course && 
        lastItem.room === item.room &&
        lastItem.minutesEnd === item.minutesStart) { 
      lastItem.end = item.end;
      lastItem.minutesEnd = item.minutesEnd;
      lastItem.slot = `${lastItem.slot} + ${item.slot}`;
    } else {
      mergedItems.push({ ...item });
    }
  });

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isToday = parseInt(dayOrderStr) === activeDayOrder;

  return mergedItems.map(item => ({
    ...item,
    isNow: isToday && nowMinutes >= item.minutesStart && nowMinutes < item.minutesEnd,
    isPast: isToday && nowMinutes >= item.minutesEnd
  }));
};