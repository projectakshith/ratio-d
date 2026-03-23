import { MarksRecord } from "@/types";

export const gradePoints: Record<string, number> = {
  O: 10,
  "A+": 9,
  A: 8,
  "B+": 7,
  B: 6,
  C: 5,
  F: 0,
  U: 0,
  W: 0,
  I: 0,
};

export const getGrade = (score: number) => {
  if (score >= 91) return "O";
  if (score >= 81) return "A+";
  if (score >= 71) return "A";
  if (score >= 61) return "B+";
  if (score >= 56) return "B";
  if (score >= 50) return "C";
  return "F";
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

export const isPracticalLogic = (sub: any) => {
  const normalize = (str: string) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
  const type = normalize(sub.type || "");
  const code = normalize(sub.code || sub.courseCode || sub.id || "");
  const slot = normalize(sub.slot || "");
  const title = normalize(sub.title || sub.course || sub.courseTitle || "");
  
  return (
    type.includes("practical") || 
    type.includes("lab") || 
    code.includes("-p") || 
    slot.includes("p") ||
    title.includes("lab") ||
    title.includes("practical") ||
    (slot.length > 0 && slot.toUpperCase().includes("LAB"))
  );
};

export const getTheme = (pct: number, max: number) => {
  if (max === 0 || pct > 50)
    return {
      wrapperBg: "status-bg-safe",
      cardBg: "bg-theme-surface",
      border: "status-border-safe",
      text: "status-text-safe",
      subText: "status-text-safe opacity-80",
      boxBg: "status-boxbg-safe",
      dottedClass: "safe-dotted",
    };
  return {
    wrapperBg: "status-bg-cooked",
    cardBg: "bg-theme-surface",
    border: "status-border-cooked",
    text: "status-text-cooked",
    subText: "status-text-cooked opacity-80",
    boxBg: "status-boxbg-cooked",
    dottedClass: "warning-dotted",
  };
};

export const getMarkColor = (got: number, max: number) => {
  if (max === 0) return "text-theme-text";
  const pct = (got / max) * 100;
  if (pct > 50) return "status-text-safe";
  return "status-text-cooked";
};

export const getBoxTheme = (
  got: number | null,
  max: number,
) => {
  if (got === null || max === 0)
    return {
      boxBg: "bg-theme-surface",
      text: "text-theme-muted",
      subText: "text-theme-subtle",
      border: "border-theme-border",
    };
  const pct = (got / max) * 100;
  if (pct > 50)
    return {
      boxBg: "status-boxbg-safe",
      text: "status-text-safe",
      subText: "status-text-safe opacity-60",
      border: "status-border-safe",
    };
  return {
    boxBg: "status-boxbg-cooked",
    text: "status-text-cooked",
    subText: "status-text-cooked opacity-70",
    border: "status-border-cooked",
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

      const assessmentGot = assessments.reduce((sum: number, curr: any) => sum + curr.got, 0);
      const assessmentMax = assessments.reduce((sum: number, curr: any) => sum + curr.max, 0);

      if (!isNA && perfString.includes("/")) {
        const parts = perfString.split("/");
        got = parseFloat(parts[0]) || 0;
        max = parseFloat(parts[1]) || 0;
      } else if (!isNA) {
        got = parseFloat(perfString) || 0;
        max = 100;
      }

      if (assessmentMax > 0 && (assessmentMax > max || max === 100)) {
        got = assessmentGot;
        max = assessmentMax;
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
      
      const shortName = getAcronym(title);
      
      let status: "cooked" | "danger" | "safe" | "neutral" = "neutral";
      let badge = "pending";
      if (!actualIsNA && max > 0) {
        if (percentage > 50) {
          status = "safe";
          badge = "safe";
        } else {
          status = "cooked";
          badge = "critical";
        }
      }
      const latestTest =
        assessments.length > 0 ? assessments[assessments.length - 1] : null;
      const type = subject.type || "Theory";
      const isPractical = isPracticalLogic(subject);
      return {
        id: `${cleanCode}-${type}-${index}`,
        title,
        courseTitle: title,
        code: cleanCode,
        course: title,
        shortName,
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
      return {
        bg: "var(--theme-highlight)",
        text: "text-theme-bg",
        bar: "bg-theme-bg",
      };
    case "cooked":
      return {
        bg: "var(--theme-secondary)",
        text: "text-theme-bg",
        bar: "bg-theme-bg",
      };
    case "danger":
      return {
        bg: "var(--theme-highlight)",
        text: "text-theme-bg",
        bar: "bg-theme-bg",
      };
    default:
      return {
        bg: "var(--theme-surface, #f0f0f0)",
        text: "text-theme-text",
        bar: "bg-theme-text",
      };
  }
};
