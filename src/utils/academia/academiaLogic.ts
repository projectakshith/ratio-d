export const parseTimeValues = (timeStr: string): number => {
  if (!timeStr) return 0;
  const cleanStr = timeStr.replace(/[^\d:]/g, "");
  let [h, m] = cleanStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return 0;
  if (h < 7) h += 12;
  return h * 60 + m;
};

export const getScheduleStatus = (schedule: any, activeDayOrder: string) => {
  const targetDay =
    activeDayOrder && activeDayOrder !== "-" ? activeDayOrder : "1";
  const dayKey = `Day ${targetDay}`;
  const todaySchedule = schedule?.[dayKey];

  if (!todaySchedule)
    return { status: "free", nextClass: null, currentClass: null };

  const now = new Date();
  const currentTimeVal = now.getHours() * 60 + now.getMinutes();

  const sortedSlots = Object.entries(todaySchedule)
    .map(([timeRange, details]: [string, any]) => {
      const [startStr, endStr] = timeRange.split(" - ");
      return {
        ...details,
        time: timeRange,
        startMinutes: parseTimeValues(startStr),
        endMinutes: parseTimeValues(endStr),
      };
    })
    .sort((a, b) => a.startMinutes - b.startMinutes);

  let currentClass = null;
  let nextClass = null;

  for (const slot of sortedSlots) {
    if (
      currentTimeVal >= slot.startMinutes &&
      currentTimeVal < slot.endMinutes
    ) {
      currentClass = slot;
    } else if (currentTimeVal < slot.startMinutes && !nextClass) {
      nextClass = slot;
    }
  }

  return { status: currentClass ? "busy" : "free", nextClass, currentClass };
};

export const calculateOverallAttendance = (attendance: any[]) => {
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
};

export const getCriticalAttendance = (attendance: any[]) => {
  if (!attendance) return [];
  return attendance
    .map((subj) => {
      const present = subj.conducted - subj.absent;
      const percent =
        subj.conducted === 0 ? 0 : (present / subj.conducted) * 100;
      const req = Math.ceil(3 * subj.conducted - 4 * present);
      const displayTitle = subj.title || subj.course || "Subject";
      return {
        ...subj,
        percent,
        required: req > 0 ? req : 0,
        displayName: displayTitle,
      };
    })
    .filter((subj) => subj.percent < 75);
};
