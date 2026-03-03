export const parseTimetableTime = (str: string) => {
  if (!str) return 0;
  let [h, m] = str.split(":").map(Number);
  if (h < 8) h += 12;
  return h * 60 + m;
};

export const getAcronym = (name: string) => {
  if (!name) return "";
  const lowerName = name.toLowerCase().trim();
  if (lowerName.includes("internet of things")) return "iot";
  if (lowerName.includes("design thinking")) return "dtm";
  const skipWords = ["and", "of", "to", "in", "for", "with", "a", "an", "the"];
  const parts = lowerName.split(/\s+/).filter((w) => !skipWords.includes(w));
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
  customClasses: Record<number, any[]>,
  activeDay: number,
  dayOrder: number,
  courseMap: any,
) => {
  const baseClasses = schedule[`Day ${activeDay}`]
    ? Object.values(schedule[`Day ${activeDay}`])
    : [];
  const cClasses = customClasses[activeDay] || [];

  const combined = [...baseClasses, ...cClasses].filter(
    (c: any) => c && c.time,
  );

  const rawItems = combined
    .map((details: any) => {
      const [startStr, endStr] = details.time.split(" - ");
      const code =
        details.courseCode || details.course || details.code || "N/A";
      const cleanCode = code.split("-")[0].trim();
      const fullName =
        courseMap[cleanCode] ||
        details.courseTitle ||
        details.name ||
        details.course ||
        "Unknown Subject";

      const isLab = details.slot?.toUpperCase().includes("P");

      return {
        id: details.id || Math.random().toString(36).substring(2, 9),
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
      };
    })
    .sort((a, b) => a.minutesStart - b.minutesStart);

  const mergedItems: any[] = [];
  rawItems.forEach((item) => {
    const lastItem = mergedItems[mergedItems.length - 1];
    if (
      lastItem &&
      lastItem.name === item.name &&
      lastItem.room === item.room &&
      lastItem.minutesEnd === item.minutesStart
    ) {
      lastItem.end = item.end;
      lastItem.time = `${lastItem.start} - ${item.end}`;
      lastItem.minutesEnd = item.minutesEnd;
    } else {
      mergedItems.push({ ...item });
    }
  });

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isToday = dayOrder === activeDay;

  const finalWithBreaks: any[] = [];
  for (let i = 0; i < mergedItems.length; i++) {
    finalWithBreaks.push(mergedItems[i]);
    if (i < mergedItems.length - 1) {
      const current = mergedItems[i];
      const next = mergedItems[i + 1];
      if (next.minutesStart > current.minutesEnd) {
        const gapDuration = next.minutesStart - current.minutesEnd;
        let breakTitle = "short break";
        if (gapDuration >= 40) breakTitle = "lunch break";

        finalWithBreaks.push({
          id: `break-${i}`,
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
