import { MarksRecord, Assessment } from "@/types";

export const gradePoints: Record<string, number> = {
  O: 10,
  "A+": 9,
  A: 8,
  "B+": 7,
  B: 6,
  C: 5,
  U: 0,
  W: 0,
  I: 0,
};

export const getGrade = (score: number) => {
  if (score >= 91) return "O";
  if (score >= 81) return "A+";
  if (score >= 71) return "A";
  if (score >= 61) return "B+";
  if (score >= 51) return "B";
  if (score >= 41) return "C";
  return "U";
};

export const buildCourseMap = (data: any) => {
  const map: Record<string, string> = {};
  if (data?.attendance) {
    data.attendance.forEach((sub: any) => {
      if (sub.code && sub.title) {
        map[sub.code.trim()] = sub.title;
      }
    });
  }
  return map;
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

export const getTheme = (pct: number, max: number, isDark: boolean) => {
  if (max === 0)
    return {
      wrapperBg: isDark ? "bg-white/5" : "bg-[#F7F7F7]/50",
      cardBg: isDark ? "bg-white/5" : "bg-white",
      border: isDark ? "border-white/10" : "border-[#111111]/10",
      text: isDark ? "text-white" : "text-[#111111]",
      subText: isDark ? "text-white/50" : "text-[#111111]/50",
      boxBg: isDark ? "bg-white/5" : "bg-[#F7F7F7]",
      dottedClass: "neutral-dotted",
    };
  if (pct >= 85)
    return {
      wrapperBg: isDark ? "bg-[#F2FFDB]/10" : "bg-[#F2FFDB]/60",
      cardBg: isDark ? "bg-white/5" : "bg-white",
      border: isDark ? "border-[#85a818]/40" : "border-[#85a818]/30",
      text: isDark ? "text-[#85a818]" : "text-[#4d6600]",
      subText: isDark ? "text-[#85a818]/80" : "text-[#4d6600]/60",
      boxBg: isDark ? "bg-[#85a818]/20" : "bg-[#F2FFDB]/40",
      dottedClass: "safe-dotted",
    };
  if (pct >= 60)
    return {
      wrapperBg: isDark ? "bg-[#FFF4E5]/10" : "bg-[#FFF4E5]/70",
      cardBg: isDark ? "bg-white/5" : "bg-white",
      border: isDark ? "border-[#F97316]/40" : "border-[#F97316]/30",
      text: isDark ? "text-[#F97316]" : "text-[#EA580C]",
      subText: isDark ? "text-[#F97316]/80" : "text-[#EA580C]/60",
      boxBg: isDark ? "bg-[#F97316]/20" : "bg-[#FFF4E5]/50",
      dottedClass: "danger-dotted",
    };
  return {
    wrapperBg: isDark ? "bg-[#FFEDED]/10" : "bg-[#FFEDED]/60",
    cardBg: isDark ? "bg-white/5" : "bg-white",
    border: isDark ? "border-[#FF4D4D]/40" : "border-[#FF4D4D]/30",
    text: isDark ? "text-[#FF4D4D]" : "text-[#FF4D4D]",
    subText: isDark ? "text-[#FF4D4D]/80" : "text-[#FF4D4D]/70",
    boxBg: isDark ? "bg-[#FF4D4D]/20" : "bg-[#FFEDED]/50",
    dottedClass: "warning-dotted",
  };
};

export const getMarkColor = (got: number, max: number, isDark: boolean) => {
  if (max === 0) return isDark ? "text-white" : "text-[#111111]";
  const pct = (got / max) * 100;
  if (pct >= 75) return "text-[#85a818]";
  if (pct >= 50) return "text-[#F97316]";
  return "text-[#FF4D4D]";
};

export const getBoxTheme = (
  got: number | null,
  max: number,
  isDark: boolean,
) => {
  if (got === null || max === 0)
    return {
      boxBg: isDark ? "bg-white/5" : "bg-[#F7F7F7]",
      text: isDark ? "text-white/50" : "text-[#111111]/50",
      subText: isDark ? "text-white/40" : "text-[#111111]/40",
      border: isDark ? "border-white/5" : "border-[#111111]/5",
    };
  const pct = (got / max) * 100;
  if (pct >= 75)
    return {
      boxBg: isDark ? "bg-[#F2FFDB]/10" : "bg-[#F2FFDB]/60",
      text: "text-[#85a818]",
      subText: isDark ? "text-[#85a818]/60" : "text-[#4d6600]/60",
      border: "border-[#85a818]/20",
    };
  if (pct >= 50)
    return {
      boxBg: isDark ? "bg-[#FFF4E5]/10" : "bg-[#FFF4E5]/70",
      text: "text-[#F97316]",
      subText: isDark ? "text-[#F97316]/60" : "text-[#EA580C]/60",
      border: "border-[#F97316]/20",
    };
  return {
    boxBg: isDark ? "bg-[#FFEDED]/10" : "bg-[#FFEDED]/60",
    text: "text-[#FF4D4D]",
    subText: "text-[#FF4D4D]/70",
    border: "border-[#FF4D4D]/20",
  };
};

export const processAndSortMarks = (
  rawMarks: any[],
  courseMap: Record<string, string>,
): MarksRecord[] => {
  return rawMarks
    .map((subject: any, index: number) => {
      const assessments: any[] = (subject.assessments || [])
        .map((ass: any) => {
          let title = ass.title || ass.testName || ass.name || "Test";
          if (title.toLowerCase().includes("total")) return null;
          const markStr = String(
            ass.mark ?? ass.score ?? ass.obtained ?? ass.marks ?? "0",
          );
          let got = 0;
          let max = parseFloat(ass.maxMark ?? ass.max ?? ass.total ?? "0") || 0;
          if (markStr.includes("/")) {
            const parts = markStr.split("/");
            got = parseFloat(parts[0]) || 0;
            max = parseFloat(parts[1]) || max;
          } else {
            got = parseFloat(markStr) || 0;
          }
          if (max === 0 || max === 100) {
            const lowerTitle = title.toLowerCase();
            if (lowerTitle.match(/ct[- ]?1|ct[- ]?2|ct[- ]?3|cycle test/)) {
              max = 15;
            } else if (
              lowerTitle.includes("quiz") ||
              lowerTitle.includes("assign")
            ) {
              max = 5;
            }
          }
          return { title, got, max };
        })
        .filter(Boolean);
      const perfString = subject.performance || "N/A";
      const isNA =
        perfString === "N/A" || perfString === "." || perfString === "";
      let got = 0;
      let max = 0;
      if (!isNA && perfString.includes("/")) {
        const parts = perfString.split("/");
        got = parseFloat(parts[0]) || 0;
        max = parseFloat(parts[1]) || 0;
      } else if (!isNA) {
        got = parseFloat(perfString) || 0;
        max = 100;
      }
      if ((isNA || max === 0) && assessments.length > 0) {
        got = assessments.reduce((sum: number, curr: any) => sum + curr.got, 0);
        max = assessments.reduce((sum: number, curr: any) => sum + curr.max, 0);
      }
      const actualIsNA = (isNA || max === 0) && assessments.length === 0;
      const percentage = max > 0 ? (got / max) * 100 : 0;
      const code = subject.courseCode || "";
      const cleanCode = code.trim();
      const title =
        courseMap[cleanCode] ||
        subject.courseTitle ||
        code ||
        "Unknown Subject";
      let status: "cooked" | "danger" | "safe" | "neutral" = "neutral";
      let badge = "pending";
      if (!actualIsNA && max > 0) {
        if (percentage >= 80) {
          status = "safe";
          badge = "outstanding";
        } else if (percentage >= 60) {
          status = "danger";
          badge = "average";
        } else {
          status = "cooked";
          badge = "critical";
        }
      }
      const latestTest =
        assessments.length > 0 ? assessments[assessments.length - 1] : null;
      const type = subject.type || "Theory";
      const isPractical =
        type.toLowerCase() === "practical" ||
        type.toLowerCase() === "lab" ||
        subject.courseCode?.toUpperCase().includes("-P") ||
        (subject.slot || "").toUpperCase().includes("P");
      return {
        id: `${cleanCode}-${type}-${index}`,
        title,
        courseTitle: title,
        code: cleanCode,
        course: title,
        type: isPractical ? "Practical" : "Theory",
        totalGot: got,
        totalMax: max === 0 ? 60 : max,
        percentage,
        isNA: actualIsNA,
        assessments,
        score: got,
        max: max === 0 ? 60 : max,
        testName: latestTest ? latestTest.title : "total",
        displayScore: actualIsNA ? "N/A" : got.toString(),
        status,
        badge,
        isPractical,
      } as any;
    })
    .sort((a: any, b: any) => {
      if (a.isNA && !b.isNA) return 1;
      if (!a.isNA && b.isNA) return -1;
      return b.percentage - a.percentage;
    });
};

export const getActiveSubject = (
  sortedMarks: MarksRecord[],
  selectedId: number | null,
) => {
  if (selectedId === null && sortedMarks.length > 0) return sortedMarks[0];
  return (
    sortedMarks.find((s: MarksRecord) => s.id === selectedId) ||
    sortedMarks[0] ||
    ({} as any)
  );
};

export const getMarksTheme = (status: string) => {
  switch (status) {
    case "safe":
      return { bg: "#ceff1c", text: "text-[#050505]", bar: "bg-[#050505]" };
    case "cooked":
      return { bg: "#ff003c", text: "text-white", bar: "bg-white" };
    case "danger":
      return { bg: "#ffb800", text: "text-[#050505]", bar: "bg-[#050505]" };
    default:
      return { bg: "#f0f0f0", text: "text-[#050505]", bar: "bg-[#050505]" };
  }
};
