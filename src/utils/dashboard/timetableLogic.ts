export const parseTimetableTime = (str: string) => {
  if (!str) return 0;
  let [h, m] = str.split(":").map(Number);
  if (h < 8) h += 12;
  return h * 60 + m;
};

export const getAcronym = (name: string) => {
  if (!name) return "";
  const lower = name.toLowerCase().trim();
  if (lower.includes("database")) return "dbms";
  if (lower.includes("object oriented") || lower.includes("oops"))
    return "oops";
  if (
    lower.includes("data structure") ||
    lower.includes("dsa") ||
    lower.includes("daa")
  )
    return "dsa";
  if (lower.includes("machine learning")) return "ml";
  if (lower.includes("operating system")) return "os";
  if (lower.includes("artificial intelligence")) return "ai";
  if (lower.includes("internet of things")) return "iot";
  if (lower.includes("design thinking")) return "dtm";
  if (lower.length <= 4) return lower;

  const skipWords = ["and", "of", "to", "in", "for", "with", "a", "an", "the"];
  const parts = lower.split(/\s+/).filter((w) => !skipWords.includes(w));
  if (parts.length === 1 && parts[0].length <= 5) return parts[0];
  return parts.map((w) => w[0]).join("");
};

export const buildCourseMap = (data: any) => {
  const map: any = {};
  if (data?.attendance) {
    data.attendance.forEach((sub: any) => {
      if (sub.code && sub.title) {
        map[sub.code.trim()] = sub.title;
      }
    });
  }
  return map;
};

export const processSchedule = (
  schedule: any,
  _unusedCustomClasses: any,
  activeDay: number,
  dayOrder: number,
  courseMap: any,
) => {
  const dayClasses = schedule[`Day ${activeDay}`]
    ? Object.values(schedule[`Day ${activeDay}`])
    : [];

  const combined = dayClasses.filter((c: any) => c && c.time);

  const rawItems = combined
    .map((details: any, idx: number) => {
      const timeStr = details.time || "";
      const [startStr, endStr] = timeStr.includes(" - ") ? timeStr.split(" - ") : [timeStr, timeStr];
      const code =
        details.courseCode || details.course || details.code || "N/A";
      const cleanCode = code.split("-")[0].trim();
      const fullName =
        courseMap[cleanCode] ||
        details.courseTitle ||
        details.name ||
        details.course ||
        "Unknown Subject";

      const isLab =
        details.slot?.toUpperCase().includes("P") ||
        details.type?.toLowerCase() === "lab" ||
        details.type?.toLowerCase() === "practical";

      return {
        id: details.id || `sch-${activeDay}-${idx}-${cleanCode}`,
        code: getAcronym(fullName) || cleanCode,
        name: fullName.toLowerCase(),
        time: details.time,
        start: startStr,
        end: endStr,
        minutesStart: parseTimetableTime(startStr),
        minutesEnd: parseTimetableTime(endStr),
        room: details.room || "TBA",
        faculty: details.faculty || "TBA",
        type: isLab ? "lab" : "theory",
        slot: details.slot,
        isCustom: details.isCustom || false,
      };
    })
    .sort((a, b) => a.minutesStart - b.minutesStart);

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isToday = dayOrder === activeDay;

  const finalWithBreaks: any[] = [];

  for (let i = 0; i < rawItems.length; i++) {
    finalWithBreaks.push(rawItems[i]);
    if (i < rawItems.length - 1) {
      const current = rawItems[i];
      const next = rawItems[i + 1];
      if (next.minutesStart > current.minutesEnd) {
        const gapDuration = next.minutesStart - current.minutesEnd;
        let breakTitle = "short break";
        if (gapDuration >= 40) breakTitle = "lunch break";

        finalWithBreaks.push({
          id: `break-${activeDay}-${current.end}-${next.start}`,
          type: "break",
          title: breakTitle,
          time: `${current.end} - ${next.start}`,
        });
      }
    }
  }

  return finalWithBreaks.map((item) => {
    if (item.type === "break") return item;
    return {
      ...item,
      isCurrent:
        isToday &&
        nowMinutes >= item.minutesStart &&
        nowMinutes < item.minutesEnd,
    };
  });
};

export const getDayOverview = (dayClasses: any[]) => {
  const regularClasses = dayClasses.filter((c) => c.type !== "break");
  if (regularClasses.length === 0) return { start: "--", end: "--", count: 0 };
  const start = regularClasses[0].start;
  const end = regularClasses[regularClasses.length - 1].end;
  return { start, end, count: regularClasses.length };
};
