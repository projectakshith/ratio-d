import { AttendanceRecord, MarksRecord } from "@/types";

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
      const oldSub = oldData.attendance.find((s: any) => s.code === newSub.code);
      if (oldSub) {
        const oldPct = parseFloat(oldSub.percent);
        const newPct = parseFloat(newSub.percent);
        if (newPct !== oldPct) {
          const oldPresent = oldSub.conducted - oldSub.absent;
          const newPresent = newSub.conducted - newSub.absent;
          const oldMargin = calculateMargin(oldPresent, oldSub.conducted);
          const newMargin = calculateMargin(newPresent, newSub.conducted);
          const isPractical = 
            oldSub.type?.toLowerCase() === "practical" || 
            oldSub.type?.toLowerCase() === "lab" ||
            oldSub.courseCode?.toUpperCase().includes("-P") ||
            (oldSub.slot || "").toUpperCase().includes("P");

          diff.attendanceChanges.push({
            course: newSub.title || newSub.course || newSub.code,
            oldPercent: oldPct,
            newPercent: newPct,
            diff: newPct - oldPct,
            oldMargin,
            newMargin,
            isSafe: newPct >= 75,
            isPractical,
          });
        }
      }
    });
  }

  if (oldData?.marks && newData?.marks) {
    newData.marks.forEach((newSub: any) => {
      const oldSub = oldData.marks.find((s: any) => s.courseCode === newSub.courseCode);
      if (oldSub) {
        const newAss = newSub.assessments || [];
        const oldAss = oldSub.assessments || [];
        
        if (newAss.length > oldAss.length) {
          const isPractical = 
            newSub.type?.toLowerCase() === "practical" || 
            newSub.type?.toLowerCase() === "lab" ||
            newSub.courseCode?.toUpperCase().includes("-P");

          const addedTests = newAss.slice(oldAss.length);
          addedTests.forEach((test: any) => {
            diff.newMarks.push({
              course: newSub.courseTitle || newSub.courseCode,
              test: test.title || test.testName || "Test",
              score: parseFloat(test.mark || test.obtained || "0"),
              max: parseFloat(test.maxMark || test.max || "0"),
              isPractical,
            });
          });
        }
      }
    });
  }

  const hasChanges = diff.attendanceChanges.length > 0 || diff.newMarks.length > 0;
  return hasChanges ? diff : null;
}
