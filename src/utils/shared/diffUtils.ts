
export interface DataDiff {
  attendanceChanges: {
    course: string;
    oldPercent: number;
    newPercent: number;
    diff: number;
    oldMargin: number;
    newMargin: number;
    isSafe: boolean;
    isPractical: boolean;
  }[];
  newMarks: {
    course: string;
    test: string;
    score: number;
    max: number;
    isPractical: boolean;
  }[];
}

const normalize = (str: string) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();

const isPracticalLogic = (sub: any) => {
  const type = normalize(sub.type || "");
  const code = normalize(sub.code || sub.courseCode || "");
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

const calculateMargin = (present: number, conducted: number) => {
  if (conducted === 0) return 0;
  const pct = (present / conducted) * 100;
  if (pct >= 75) {
    return Math.floor(present / 0.75 - conducted);
  } else {
    return Math.ceil((0.75 * conducted - present) / 0.25);
  }
};

export function compareData(oldData: any, newData: any): DataDiff | null {
  const diff: DataDiff = {
    attendanceChanges: [],
    newMarks: [],
  };

  if (oldData?.attendance && newData?.attendance) {
    newData.attendance.forEach((newSub: any) => {
      const newCode = normalize(newSub.code || "");
      const newIsPrac = isPracticalLogic(newSub);
      
      const oldSub = oldData.attendance.find((s: any) => 
        normalize(s.code || "") === newCode && isPracticalLogic(s) === newIsPrac
      );
      
      if (oldSub) {
        const oldPct = parseFloat(oldSub.percent || "0");
        const newPct = parseFloat(newSub.percent || "0");
        
        if (Math.abs(newPct - oldPct) > 0.01) {
          const oldPresent = (oldSub.conducted || 0) - (oldSub.absent || 0);
          const newPresent = (newSub.conducted || 0) - (newSub.absent || 0);
          const oldMargin = calculateMargin(oldPresent, oldSub.conducted || 0);
          const newMargin = calculateMargin(newPresent, newSub.conducted || 0);

          diff.attendanceChanges.push({
            course: newSub.title || newSub.course || newSub.code,
            oldPercent: oldPct,
            newPercent: newPct,
            diff: newPct - oldPct,
            oldMargin,
            newMargin,
            isSafe: newPct >= 75,
            isPractical: newIsPrac,
          });
        }
      }
    });
  }

  if (oldData?.marks && newData?.marks) {
    newData.marks.forEach((newSub: any) => {
      const newCode = normalize(newSub.courseCode || "");
      const newIsPrac = isPracticalLogic(newSub);
      
      const oldSub = oldData.marks.find((s: any) => 
        normalize(s.courseCode || "") === newCode && isPracticalLogic(s) === newIsPrac
      );
      
      if (oldSub) {
        const newAss = newSub.assessments || [];
        const oldAss = oldSub.assessments || [];
        
        newAss.forEach((test: any) => {
          const testTitle = normalize(test.title || test.testName || "");
          const matchingOldTest = oldAss.find((o: any) => 
            normalize(o.title || o.testName || "") === testTitle
          );

          const newScore = parseFloat(test.mark || test.obtained || "0");
          const oldScore = matchingOldTest ? parseFloat(matchingOldTest.mark || matchingOldTest.obtained || "0") : -1;

          if (oldScore !== -1 && Math.abs(newScore - oldScore) > 0.01) {
            diff.newMarks.push({
              course: newSub.courseTitle || newSub.courseCode,
              test: test.title || test.testName || "Test",
              score: newScore,
              max: parseFloat(test.maxMark || test.max || "0"),
              isPractical: newIsPrac,
            });
          }
        });
      }
    });
  }

  const hasChanges = diff.attendanceChanges.length > 0 || diff.newMarks.length > 0;
  return hasChanges ? diff : null;
}
