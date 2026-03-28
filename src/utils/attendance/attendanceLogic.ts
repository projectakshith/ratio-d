import { flavorText } from "../shared/flavortext";
import { CalendarEvent, ScheduleData } from "@/types";

export const getEffectiveSchedule = (data: any, schedule: any) => {
  if (schedule) return schedule;
  if (data?.timetable) return data.timetable;
  if (data?.schedule) return data.schedule;
  if (data?.time_table) return data.time_table;
  return {};
};

const norm = (str: string) =>
  (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

export const getAcronym = (name: string) => {
  if (!name) return "";
  const skipWords = ["and", "of", "to", "in", "for", "with", "a", "an", "the"];
  return name
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 0 && !skipWords.includes(word))
    .map((word) => word[0])
    .join("")
    .toLowerCase();
};

export const getPercentColor = (percent: string) => {
  const pVal = parseFloat(percent);
  if (pVal < 75) return "var(--theme-secondary)";
  if (pVal < 85) return "var(--theme-accent)";
  return "var(--theme-highlight)";
};

export const getBaseAttendance = (rawAttendance: any[]) => {
  return rawAttendance
    .map((subject, index) => {
      const pct = parseFloat(subject?.percent || "0");
      const category = pct < 75 ? "cooked" : pct >= 85 ? "safe" : "danger";
      const list = flavorText.header?.[category] ||
        flavorText.header?.danger || ["..."];
      const stableBadge = list[Math.floor(index % list.length)].toLowerCase();
      const safeTitle =
        subject.title || subject.courseTitle || "Unknown Subject";
      const slot = (subject.slot || "").toUpperCase();
      const code = String(subject?.code || "").trim();

      const attCategory =
        (subject.category || "").trim() ||
        (slot.startsWith("P") || slot.startsWith("L") ? "Practical" : "Theory");
      const isPractical = attCategory.toLowerCase() === "practical";

      return {
        id: `${norm(code)}_${norm(attCategory)}_${index}`,
        title: safeTitle,
        rawTitle: safeTitle,
        code: code,
        percentage: String(subject?.percent || "0"),
        conducted: parseInt(subject?.conducted || "0"),
        present:
          parseInt(subject?.conducted || "0") -
          parseInt(subject?.absent || "0"),
        badge: category,
        tagline: stableBadge,
        slot: slot,
        isPractical: isPractical,
        type: attCategory,
      };
    })
    .sort((a, b) => parseFloat(a.percentage) - parseFloat(b.percentage));
};

export const getOverallStats = (baseAttendance: any[]) => {
  if (baseAttendance.length === 0)
    return { pct: 0, badge: "safe", tagline: "all good", color: "#ceff1c" };
  let totalConducted = 0;
  let totalPresent = 0;
  baseAttendance.forEach((s) => {
    totalConducted += s.conducted;
    totalPresent += s.present;
  });
  const overallPct =
    totalConducted === 0 ? 0 : (totalPresent / totalConducted) * 100;
  const category =
    overallPct < 75 ? "cooked" : overallPct >= 85 ? "safe" : "danger";
  let tagline = "you're doing great";
  if (category === "cooked") tagline = "academic comeback needed";
  if (category === "danger") tagline = "treading on thin ice";
  return {
    pct: overallPct,
    badge: category,
    tagline,
    color: category === "safe" ? "#ceff1c" : "#ff003c",
  };
};

const parseDateString = (str: string) => {
  if (!str) return null;
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const getStatus = (pct: number, conducted: number, present: number) => {
  if (pct >= 75) {
    const margin = Math.floor((present - 0.75 * conducted) / 0.75);
    return { val: Math.max(0, margin), label: "margin", safe: true };
  }
  
  let needed = 0;
  while (((present + needed) / (conducted + needed)) * 100 < 75) {
    needed++;
  }
  return { val: needed, label: "recover", safe: false };
};

const parseTimeValues = (timeStr: string): number => {
  if (!timeStr) return 0;
  const cleanStr = timeStr.replace(/[^\d:]/g, "");
  let [h, m] = cleanStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return 0;
  if (h < 7) h += 12;
  return h * 60 + m;
};

const calculateSessions = (timeRange: string) => {
  if (!timeRange || !timeRange.includes("-")) return 1;
  try {
    const [startStr, endStr] = timeRange.split("-").map((s) => s.trim());
    const startMins = parseTimeValues(startStr);
    const endMins = parseTimeValues(endStr);
    const diff = endMins - startMins;
    if (diff <= 0) return 1;
    return Math.max(1, Math.round(diff / 50));
  } catch {
    return 1;
  }
};

export const getImpactMap = (
  selectedDates: string[],
  calendarData: CalendarEvent[],
  effectiveSchedule: ScheduleData,
  baseAttendance: any[],
  predictAction: "leave" | "attend" | "od",
) => {
  const impact: Record<string, { conducted: number; present: number }> = {};
  if (calendarData.length === 0 || Object.keys(effectiveSchedule).length === 0)
    return impact;

  const normalizedCalData = calendarData.map((c) => ({
    ...c,
    normDate: parseDateString(c.date),
  }));

  const todayStr = parseDateString(new Date().toISOString());
  if (!todayStr) return impact;

  let datesToSimulate: string[] = selectedDates;

  if (predictAction === "leave" && selectedDates.length > 0) {
    const sortedSelected = [...selectedDates].sort();
    const lastDateStr = sortedSelected[sortedSelected.length - 1];
    const start = new Date(todayStr);
    const end = new Date(lastDateStr);
    datesToSimulate = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dStr = parseDateString(d.toISOString());
      if (dStr) datesToSimulate.push(dStr);
    }
  }

  datesToSimulate.forEach((dateStr) => {
    const dayInfo = normalizedCalData.find((c) => c.normDate === dateStr);
    if (dayInfo) {
      const rawOrder = dayInfo.dayOrder || dayInfo.order;
      if (rawOrder && rawOrder !== "-" && !isNaN(parseInt(rawOrder))) {
        const orderNum = parseInt(rawOrder);
        const dayClasses =
          effectiveSchedule[`Day ${orderNum}`] ||
          effectiveSchedule[`day ${orderNum}`] ||
          effectiveSchedule[String(orderNum)];
        if (dayClasses) {
          const isSelectedDate = selectedDates.includes(dateStr);
          const isAttendAction = predictAction === "attend";
          const isODAction = predictAction === "od";

          Object.entries(dayClasses).forEach(
            ([timeRange, cls]: [string, any]) => {
              if (!cls) return;
              const clsCode = norm(cls.code || "");
              const clsType = (cls.type || cls.category || "Theory").trim().toLowerCase();
              const sessionWeight = calculateSessions(timeRange);

              let targetSubject = baseAttendance.find((s) => {
                const sCode = norm(s.code);
                return (sCode === clsCode || clsCode.includes(sCode) || sCode.includes(clsCode)) && s.type.toLowerCase() === clsType;
              });

              if (!targetSubject) {
                targetSubject = baseAttendance.find((s) => {
                  const sCode = norm(s.code);
                  return sCode === clsCode || clsCode.includes(sCode) || sCode.includes(clsCode);
                });
              }

              if (targetSubject) {
                if (!impact[targetSubject.id]) {
                  impact[targetSubject.id] = { conducted: 0, present: 0 };
                }

                if (isODAction) {
                  impact[targetSubject.id].conducted -= sessionWeight;
                } else {
                  impact[targetSubject.id].conducted += sessionWeight;
                  if (isAttendAction) {
                    impact[targetSubject.id].present += sessionWeight;
                  } else {
                    if (!isSelectedDate) {
                      impact[targetSubject.id].present += sessionWeight;
                    }
                  }
                }
              }
            },
          );
        }
      }
    }
  });
  return impact;
};

export const getRecoveryDate = (
  subject: any,
  calendarData: any[],
  effectiveSchedule: any,
  selectedDates: string[] = [],
  predictAction: string = "leave"
) => {
  if (!subject) return null;
  
  let currentPresent = subject.present;
  let currentConducted = subject.conducted;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (predictAction === "od" && selectedDates.length > 0) {
    const normalizedCalData = calendarData.map((c) => ({
      ...c,
      normDate: parseDateString(c.date),
    }));

    selectedDates.forEach((dateStr) => {
      const dObj = new Date(dateStr);
      if (dObj < today) {
        const dayInfo = normalizedCalData.find((c) => c.normDate === dateStr);
        if (dayInfo) {
          const rawOrder = dayInfo.dayOrder || dayInfo.order;
          if (rawOrder && rawOrder !== "-" && !isNaN(parseInt(rawOrder))) {
            const orderNum = parseInt(rawOrder);
            const dayClasses = effectiveSchedule[`Day ${orderNum}`] || effectiveSchedule[`day ${orderNum}`] || effectiveSchedule[String(orderNum)];
            if (dayClasses) {
              Object.entries(dayClasses).forEach(([timeRange, cls]: [string, any]) => {
                if (!cls) return;
                const clsCode = norm(cls.code || "");
                const clsType = (cls.type || cls.category || "Theory").trim().toLowerCase();
                const sCode = norm(subject.code);
                if ((sCode === clsCode || clsCode.includes(sCode) || sCode.includes(clsCode)) && subject.type.toLowerCase() === clsType) {
                  const weight = calculateSessions(timeRange);
                  currentConducted -= weight;
                }
              });
            }
          }
        }
      }
    });
  }
  
  const sortedCal = [...calendarData]
    .map(c => ({ ...c, dObj: new Date(c.date), norm: parseDateString(c.date) }))
    .filter(c => c.dObj >= today)
    .sort((a, b) => a.dObj.getTime() - b.dObj.getTime());

  for (const day of sortedCal) {
    if ((currentPresent / currentConducted) * 100 >= 75) {
      return day.date;
    }

    const rawOrder = day.dayOrder || day.order;
    if (rawOrder && rawOrder !== "-" && !isNaN(parseInt(rawOrder))) {
      const orderNum = parseInt(rawOrder);
      const dayClasses =
        effectiveSchedule[`Day ${orderNum}`] ||
        effectiveSchedule[`day ${orderNum}`] ||
        effectiveSchedule[String(orderNum)];
        
      if (dayClasses) {
        const isSelectedDate = selectedDates.includes(day.norm || "");
        Object.entries(dayClasses).forEach(([timeRange, cls]: [string, any]) => {
          if (!cls) return;
          const clsCode = norm(cls.code || "");
          const clsType = (cls.type || cls.category || "Theory").trim().toLowerCase();
          const sCode = norm(subject.code);
          
          if ((sCode === clsCode || clsCode.includes(sCode) || sCode.includes(clsCode)) && 
              subject.type.toLowerCase() === clsType) {
            const weight = calculateSessions(timeRange);
            currentConducted += weight;
            if (predictAction === "attend" && isSelectedDate) currentPresent += weight;
            else if (predictAction === "leave" && isSelectedDate) currentPresent += 0;
            else if (predictAction === "od" && isSelectedDate) {
               currentConducted -= weight;
            } else {
              currentPresent += weight;
            }
          }
        });
      }
    }
    
    if (sortedCal.indexOf(day) > 150) break;
  }
  
  return null;
};

export const getProcessedList = (
  baseAttendance: any[],
  predictionImpact: Record<string, { conducted: number; present: number }>,
  predictMode: boolean,
) => {
  const list = baseAttendance.map((subject) => {
    const imp = predictionImpact[subject.id] || { conducted: 0, present: 0 };
    const currentPresent = subject.present;
    const currentConducted = subject.conducted;

    const newPresent = currentPresent + imp.present;
    const newConducted = currentConducted + imp.conducted;

    const newPct = newConducted === 0 ? 0 : (newPresent / newConducted) * 100;
    const newStatus = getStatus(newPct, newConducted, newPresent);

    return {
      ...subject,
      pred: {
        pct: newPct,
        status: newStatus,
        sessionsAffected: imp.conducted > 0,
      },
    };
  });

  if (predictMode) {
    return list.sort((a, b) => {
      const scoreA = !a.pred.status.safe
        ? a.pred.status.val + 1000
        : -a.pred.status.val;
      const scoreB = !b.pred.status.safe
        ? b.pred.status.val + 1000
        : -b.pred.status.val;
      return scoreB - scoreA;
    });
  }
  return list.sort(
    (a, b) => parseFloat(a.percentage) - parseFloat(b.percentage),
  );
};
