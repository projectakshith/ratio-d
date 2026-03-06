import { flavorText } from "../shared/flavortext";
import { AttendanceRecord, CalendarEvent, ScheduleData } from "@/types";

export const getEffectiveSchedule = (data: any, schedule: any) => {
  if (schedule) return schedule;
  if (data?.timetable) return data.timetable;
  if (data?.schedule) return data.schedule;
  if (data?.time_table) return data.time_table;
  return {};
};

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
  if (pVal < 75) return "#FF4D4D";
  if (pVal < 85) return "#F97316";
  return "#85a818";
};

export const getBaseAttendance = (
  rawAttendance: any[],
  coursesData?: Record<string, any>,
  slotsData?: Record<string, any>,
) => {
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
      const firstSlot = slot.split(",")[0].trim();
      const slotInfo = slotsData?.[firstSlot];
      let isPractical = false;
      if (slotInfo) {
        isPractical =
          slotInfo.type?.toLowerCase() === "practical" ||
          slotInfo.type?.toLowerCase() === "lab";
      } else {
        isPractical =
          slot.startsWith("P") ||
          slot.startsWith("L") ||
          code.endsWith("-P") ||
          safeTitle.toLowerCase().includes("practical") ||
          safeTitle.toLowerCase().includes("lab");
      }
      return {
        id: `${code}-${isPractical ? "P" : "T"}-${index}`,
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
  const list = flavorText.header?.[category] || ["..."];
  const badge = list[0].toLowerCase();
  let tagline = "you're doing great";
  if (category === "cooked") tagline = "academic comeback needed";
  if (category === "danger") tagline = "treading on thin ice";
  return {
    pct: overallPct,
    badge,
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
    const margin = Math.floor(present / 0.75 - conducted);
    return { val: Math.max(0, margin), label: "margin", safe: true };
  }
  const needed = Math.ceil((0.75 * conducted - present) / 0.25);
  return { val: Math.max(0, needed), label: "recover", safe: false };
};

export const getImpactMap = (
  selectedDates: string[],
  calendarData: CalendarEvent[],
  effectiveSchedule: ScheduleData,
  baseAttendance: any[],
  slotsData?: Record<string, any>,
) => {
  const impact: Record<string, number> = {};
  if (calendarData.length === 0 || Object.keys(effectiveSchedule).length === 0)
    return impact;
  const subjectLookup: Record<string, string[]> = {};
  baseAttendance.forEach((s) => {
    const typeKey = s.isPractical ? "P" : "T";
    const baseCode = s.code.split("-")[0].split(" ")[0].toLowerCase().trim();
    const key = `${baseCode}_${typeKey}`;
    if (!subjectLookup[key]) subjectLookup[key] = [];
    subjectLookup[key].push(s.id);
  });
  const normalizedCalData = calendarData.map((c) => ({
    ...c,
    normDate: parseDateString(c.date),
  }));
  selectedDates.forEach((dateStr) => {
    const dayInfo = normalizedCalData.find((c) => c.normDate === dateStr);
    if (dayInfo) {
      const rawOrder = dayInfo.dayOrder || dayInfo.order;
      if (rawOrder && rawOrder !== "-" && !isNaN(parseInt(rawOrder))) {
        const orderNum = parseInt(rawOrder);
        const dayKey = `Day ${orderNum}`;
        const dayClasses = effectiveSchedule[dayKey];
        if (dayClasses) {
          Object.values(dayClasses).forEach((cls: any) => {
            if (!cls) return;
            const clsCodeFull = (cls.code || cls.courseCode || "")
              .toLowerCase()
              .trim();
            const clsCodeBase = clsCodeFull.split("-")[0].split(" ")[0].trim();
            const clsSlot = (cls.slot || "").toUpperCase();
            let isClsPractical = false;
            if (cls.type) {
              isClsPractical =
                cls.type.toLowerCase() === "practical" ||
                cls.type.toLowerCase() === "lab";
            } else {
              isClsPractical =
                clsCodeFull.includes("-p") ||
                clsSlot.startsWith("P") ||
                clsSlot.startsWith("L") ||
                (cls.course || "").toLowerCase().includes("practical") ||
                (cls.course || "").toLowerCase().includes("lab");
            }
            const typeKey = isClsPractical ? "P" : "T";
            const lookupKey = `${clsCodeBase}_${typeKey}`;
            const targetIds = subjectLookup[lookupKey];
            if (targetIds) {
              targetIds.forEach((id) => {
                impact[id] = (impact[id] || 0) + 1;
              });
            } else {
              const clsName = (cls.course || cls.name || "")
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "");
              const matchedSubjects = baseAttendance.filter((s) => {
                const sName = s.rawTitle
                  .toLowerCase()
                  .replace(/[^a-z0-9]/g, "");
                return (
                  (sName === clsName ||
                    (sName.length > 5 && clsName.includes(sName))) &&
                  s.isPractical === isClsPractical
                );
              });
              matchedSubjects.forEach((s) => {
                impact[s.id] = (impact[s.id] || 0) + 1;
              });
            }
          });
        }
      }
    }
  });
  return impact;
};

export const getProcessedList = (
  baseAttendance: any[],
  predictionImpact: any,
  predType: string,
  predictMode: boolean,
) => {
  const list = baseAttendance.map((subject) => {
    const sessions = predictionImpact[subject.id] || 0;
    const currentPresent = subject.present;
    const currentConducted = subject.conducted;
    const newPresent =
      predType === "attend" ? currentPresent + sessions : currentPresent;
    const newConducted = currentConducted + sessions;
    const newPct = newConducted === 0 ? 0 : (newPresent / newConducted) * 100;
    const newStatus = getStatus(newPct, newConducted, newPresent);
    return {
      ...subject,
      pred: {
        pct: newPct,
        status: newStatus,
        sessionsAffected: sessions > 0,
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
