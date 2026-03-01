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
      const assessments = subject.assessments || [];
      const latestTest =
        assessments.length > 0 ? assessments[assessments.length - 1] : null;
      const perfString = subject.performance || "N/A";
      const isNA = perfString === "N/A" || perfString === ".";

      let got = 0;
      let max = 0;

      if (!isNA && perfString.includes("/")) {
        const parts = perfString.split("/");
        got = parseFloat(parts[0]);
        max = parseFloat(parts[1]);
      } else if (!isNA) {
        got = parseFloat(perfString);
        max = 100;
      }

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

      if (!isNA && max > 0) {
        if (percentage >= 85) {
          status = "safe";
          badge = "outstanding";
        } else if (percentage >= 70) {
          status = "danger";
          badge = "average";
        } else {
          status = "cooked";
          badge = "critical";
        }
      }

      return {
        id: index,
        title,
        code: cleanCode,
        type: subject.type || "Theory",
        score: got,
        max: max,
        testName: latestTest ? latestTest.title : "total",
        percentage: Math.round(percentage),
        displayScore: isNA ? "N/A" : got.toString(),
        status,
        badge,
        isNA,
        assessments,
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