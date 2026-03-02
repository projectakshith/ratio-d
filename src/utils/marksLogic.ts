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

      return {
        id: index,
        title,
        code: cleanCode,
        type: subject.type || "Theory",
        totalGot: got,
        totalMax: max === 0 ? 60 : max,
        percentage,
        isNA: actualIsNA,
        assessments,
      };
    })
    .sort((a: any, b: any) => {
      if (a.isNA && !b.isNA) return 1;
      if (!a.isNA && b.isNA) return -1;
      return b.percentage - a.percentage;
    });
};
