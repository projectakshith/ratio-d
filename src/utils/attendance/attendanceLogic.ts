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

export const getBaseAttendance = (rawAttendance: any[]) => {
  return rawAttendance
    .map((subject, index) => {
      const pct = parseFloat(subject?.percent || "0");
      const category = pct < 75 ? "cooked" : pct >= 85 ? "safe" : "danger";
      const list =
        flavorText.header?.[category] || flavorText.header?.danger || ["..."];
      const stableBadge = list[Math.floor(index % list.length)].toLowerCase();
      const safeTitle =
        subject.title || subject.courseTitle || "Unknown Subject";
      const slot = (subject.slot || "").toUpperCase();

      return {
        id: index,
        title: safeTitle,
        rawTitle: safeTitle,
        code: String(subject?.code || ""),
        percentage: String(subject?.percent || "0"),
        conducted: parseInt(subject?.conducted || "0"),
        present:
          parseInt(subject?.conducted || "0") -
          parseInt(subject?.absent || "0"),
        badge: category,
        tagline: stableBadge,
        slot: slot,
        isPractical:
          slot.includes("LAB") ||
          slot.includes("P") ||
          safeTitle.toLowerCase().includes("practical") ||
          safeTitle.toLowerCase().includes("lab"),
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
) => {
  const impact: Record<string, number> = {};
  if (calendarData.length === 0 || Object.keys(effectiveSchedule).length === 0)
    return impact;

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
        const dayClasses = effectiveSchedule[`Day ${orderNum}`];

        if (dayClasses) {
          Object.values(dayClasses).forEach((cls: any) => {
            if (!cls.course) return;

            const clsName = cls.course.toLowerCase();
            const clsCodeRaw = (cls.code || cls.courseCode || "")
              .toLowerCase()
              .trim();
            const clsCodeClean = clsCodeRaw.split("-")[0].split(" ")[0].trim();
            const clsSlot = (cls.slot || "").toUpperCase().trim();

            const isClsPractical =
              clsSlot.includes("LAB") ||
              clsSlot.includes("P") ||
              clsName.includes("practical") ||
              clsName.includes("lab");

            const matchedSubjects = baseAttendance.filter((s) => {
              const sCodeRaw = (s.code || "").toLowerCase().trim();
              const sCodeClean = sCodeRaw.split("-")[0].split(" ")[0].trim();
              const sName = s.rawTitle.toLowerCase();

              if (sCodeClean === clsCodeClean) {
                return isClsPractical === s.isPractical;
              }

              const sNameClean = sName.replace(/[^a-z0-9]/g, "");
              const cNameClean = clsName.replace(/[^a-z0-9]/g, "");

              if (
                sNameClean === cNameClean ||
                (sNameClean.length > 4 &&
                  cNameClean.length > 4 &&
                  sNameClean.includes(cNameClean))
              ) {
                return isClsPractical === s.isPractical;
              }

              return false;
            });

            matchedSubjects.forEach((matchedSubject) => {
              impact[matchedSubject.code] =
                (impact[matchedSubject.code] || 0) + 1;
            });
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
    const sessions = predictionImpact[subject.code] || 0;
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
