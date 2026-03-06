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

export const processAndSortMarks = (rawMarks: any[], courseMap: any) => {
  return rawMarks
    .map((subject: any, index: number) => {
      const assessments = (subject.assessments || [])
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

      return {
        id: index,
        title,
        courseTitle: title,
        code: cleanCode,
        type: subject.type || "Theory",
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
      };
    })
    .sort((a: any, b: any) => {
      if (a.isNA && !b.isNA) return 1;
      if (!a.isNA && b.isNA) return -1;
      return b.percentage - a.percentage;
    });
};

export const getActiveSubject = (sortedMarks: any[], selectedId: any) => {
  if (selectedId === null && sortedMarks.length > 0) return sortedMarks[0];
  return (
    sortedMarks.find((s: any) => s.id === selectedId) || sortedMarks[0] || {}
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
