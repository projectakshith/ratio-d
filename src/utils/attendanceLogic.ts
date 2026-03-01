import { flavorText } from "./flavortext";

export const getEffectiveSchedule = (data: any, schedule: any) => {
  if (schedule) return schedule;
  if (data?.timetable) return data.timetable;
  if (data?.schedule) return data.schedule;
  if (data?.time_table) return data.time_table;
  return {};
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

      return {
        id: index,
        title: safeTitle,
        rawTitle: safeTitle,
        code: String(subject?.code || ""),
        percentage: String(subject?.percent || "0"),
        conducted: parseInt(subject?.conducted || "4"),
        present:
          parseInt(subject?.conducted || "0") -
          parseInt(subject?.absent || "0"),
        badge: category,
        tagline: stableBadge,
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

  const color = category === "safe" ? "#ceff1c" : "#ff003c";

  return { pct: overallPct, badge, tagline, color };
};

export const formatDateKey = (date: Date) => {
  const dayStr = String(date.getDate()).padStart(2, "0");
  const monthStr = date.toLocaleString("en-US", { month: "short" });
  const yearStr = date.getFullYear();
  return `${dayStr} ${monthStr} ${yearStr}`;
};

export const getStatus = (pct: number, conducted: number, present: number) => {
  if (pct >= 75) {
    const margin = Math.floor(present / 0.75 - conducted);
    return {
      val: Math.max(0, margin),
      label: "margin",
      safe: true,
      textColor: "text-[#050505]",
      lineColor: "bg-[#050505]",
    };
  }
  const needed = Math.ceil((0.75 * conducted - present) / 0.25);
  return {
    val: Math.max(0, needed),
    label: "recover",
    safe: false,
    textColor: "text-[#050505]",
    lineColor: "bg-white",
  };
};

export const getImpactMap = (
  selectedDates: string[],
  calendarData: any[],
  effectiveSchedule: any,
  baseAttendance: any[]
) => {
  const impact: any = {};
  if (calendarData.length === 0) return impact;
  if (Object.keys(effectiveSchedule).length === 0) return impact;

  selectedDates.forEach((dateStr) => {
    const dayInfo = calendarData.find((c) => {
      if (!c.date) return false;

      const cDate = new Date(c.date);
      const targetDate = new Date(dateStr);

      return (
        cDate.getDate() === targetDate.getDate() &&
        cDate.getMonth() === targetDate.getMonth() &&
        cDate.getFullYear() === targetDate.getFullYear()
      );
    });

    if (
      dayInfo &&
      dayInfo.order &&
      dayInfo.order !== "-" &&
      !isNaN(parseInt(dayInfo.order))
    ) {
      const dayOrderKey = `Day ${parseInt(dayInfo.order)}`;
      const dayClasses =
        effectiveSchedule[dayOrderKey] ||
        effectiveSchedule[`Day ${dayInfo.order}`];

      if (dayClasses) {
        Object.values(dayClasses).forEach((cls: any) => {
          if (!cls.course) return;

          const matchedSubject = baseAttendance.find((s) => {
            const sCode = (s.code || "").toLowerCase().trim();
            const cCode = (cls.code || "").toLowerCase().trim();

            if (sCode && cCode && sCode === cCode) return true;

            const sName = s.rawTitle
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "");
            const cName = cls.course
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "");

            return (
              sName === cName ||
              (sName.length > 4 &&
                cName.length > 4 &&
                sName.includes(cName))
            );
          });

          if (matchedSubject) {
            impact[matchedSubject.code] =
              (impact[matchedSubject.code] || 0) + 1;
          }
        });
      }
    }
  });
  return impact;
};

export const getProcessedList = (
  baseAttendance: any[],
  predictionImpact: any,
  predType: string,
  predictMode: boolean
) => {
  const list = baseAttendance.map((subject) => {
    const sessions = predictionImpact[subject.code] || 0;
    const currentPresent = subject.present;
    const currentConducted = subject.conducted;

    const newPresent =
      predType === "attend" ? currentPresent + sessions : currentPresent;
    const newConducted = currentConducted + sessions;
    const newPct =
      newConducted === 0 ? 0 : (newPresent / newConducted) * 100;

    const currentStatus = getStatus(
      parseFloat(subject.percentage),
      currentConducted,
      currentPresent
    );
    const newStatus = getStatus(newPct, newConducted, newPresent);

    return {
      ...subject,
      pred: {
        pct: newPct,
        status: newStatus,
        currentStatus: currentStatus,
        diffVal: newStatus.val - currentStatus.val,
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
    (a, b) => parseFloat(a.percentage) - parseFloat(b.percentage)
  );
};