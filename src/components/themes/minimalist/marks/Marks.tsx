"use client";
import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calculator, ChevronRight } from "lucide-react";
import {
  processAndSortMarks,
  buildCourseMap,
  getAcronym,
  getTheme,
  getMarkColor,
  getBoxTheme,
  gradePoints,
  getGrade,
} from "@/utils/marks/marksLogic";
import Target from "./Target";
import { AcademiaData } from "@/types";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: -20, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 450, damping: 30 } as const,
  },
};

export default function Marks({
  data,
  setIsSwipeDisabled,
  isDark,
}: {
  data: AcademiaData;
  setIsSwipeDisabled?: (disabled: boolean) => void;
  isDark: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [predictMode, setPredictMode] = useState(false);

  useEffect(() => {
    if (setIsSwipeDisabled) {
      setIsSwipeDisabled(predictMode);
    }
  }, [predictMode, setIsSwipeDisabled]);
  const [predSubjectId, setPredSubjectId] = useState<number | null>(null);
  const [expectedMarks, setExpectedMarks] = useState<number>(0);
  const [targetGrade, setTargetGrade] = useState<number>(91);

  useEffect(() => {
    setMounted(true);
  }, []);

  const subjects = useMemo(() => {
    if (!data?.marks || data.marks.length === 0) return [];
    const courseMap = buildCourseMap(data);
    const sorted = processAndSortMarks(data.marks, courseMap);
    return sorted.map((sub: any, i: number) => {
      const typeKey = sub.isPractical ? "Practical" : "Theory";
      const lookupKey = `${sub.code}_${typeKey}`;
      const courseDetails =
        data.courses?.[lookupKey] ||
        data.courses?.[sub.code] ||
        Object.values(data.courses || {}).find((c: any) => c.code === sub.code);

      const credits = courseDetails?.credits
        ? parseFloat(courseDetails.credits)
        : 0;

      let recent: { test: string; text: string } | null = null;
      if (i < 2 && sub.assessments.length > 0) {
        const lastAss = sub.assessments[sub.assessments.length - 1];
        let recTitle = lastAss.title.toLowerCase();
        if (recTitle.match(/ct[- ]?1/)) recTitle = "ft1";
        else if (recTitle.match(/ct[- ]?2/)) recTitle = "ft2";
        else if (recTitle.match(/ct[- ]?3/)) recTitle = "ct3";
        else if (recTitle.includes("quiz")) recTitle = "quiz";
        else if (recTitle.includes("assign")) recTitle = "assign";
        else recTitle = recTitle.substring(0, 5);
        recent = { test: recTitle, text: "updated" };
      }
      const isPrac =
        (sub.type || "").toLowerCase() === "practical" ||
        (sub.type || "").toLowerCase() === "lab" ||
        sub.title.toLowerCase().includes("practical") ||
        sub.title.toLowerCase().includes("lab") ||
        (sub.slot || "").toUpperCase().includes("LAB") ||
        (sub.slot || "").toUpperCase().includes("P");
      return {
        ...sub,
        credits,
        displayCode: getAcronym(sub.title) || sub.code,
        displayName: sub.title.toLowerCase(),
        recent,
        isPractical: isPrac,
        theme: getTheme(sub.percentage, sub.totalMax, isDark),
      };
    });
  }, [data, isDark]);

  useEffect(() => {
    if (subjects.length > 0 && predSubjectId === null)
      setPredSubjectId(subjects[0].id);
  }, [subjects, predSubjectId]);

  const handleExpectedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 0;
    setExpectedMarks(Math.min(maxPossibleExpected, Math.max(0, val)));
  };

  const recentlyUpdated = subjects.filter(
    (s: any, i: number) => i < 2 && s.assessments.length > 0,
  );
  const allMarks = subjects;
  const totalObtained = useMemo(
    () =>
      subjects.reduce(
        (acc: number, sub: any) =>
          acc +
          sub.assessments.reduce((a: number, curr: any) => a + curr.got, 0),
        0,
      ),
    [subjects],
  );
  const maxTotal = useMemo(
    () =>
      subjects.reduce(
        (acc: number, sub: any) =>
          acc +
          sub.assessments.reduce((a: number, curr: any) => a + curr.max, 0),
        0,
      ),
    [subjects],
  );
  const activePredSub = subjects.find((s: any) => s.id === predSubjectId) ||
    subjects[0] || {
      displayCode: "--",
      displayName: "no data",
      totalGot: 0,
      totalMax: 60,
    };
  const currentInternals = activePredSub.totalGot || 0;
  const maxPossibleExpected = Math.max(0, 60 - currentInternals);
  const projectedInternals = currentInternals + expectedMarks;
  const semNeededPercentage = Math.max(0, targetGrade - projectedInternals);
  const semRequiredOutOf75 = Math.ceil((semNeededPercentage / 40) * 75);
  const grades = [
    { label: "O", min: 91 },
    { label: "A+", min: 81 },
    { label: "A", min: 71 },
    { label: "B+", min: 61 },
    { label: "B", min: 51 },
    { label: "C", min: 41 },
  ];
  const predictedGpa = useMemo(() => {
    if (subjects.length === 0) return "0.00";

    let totalPoints = 0;
    let totalCredits = 0;

    subjects.forEach((sub: any) => {
      if (sub.isNA) return;

      const credits = sub.credits || 0;
      if (credits === 0) return;

      let grade;
      if (sub.id === predSubjectId) {
        const gradeObj = grades.find((g) => g.min === targetGrade);
        grade = gradeObj ? gradeObj.label : "O";
      } else {
        grade = getGrade(sub.percentage);
      }

      const points = gradePoints[grade] || 0;
      totalPoints += credits * points;
      totalCredits += credits;
    });

    if (totalCredits === 0) return "0.00";
    return (totalPoints / totalCredits).toFixed(2);
  }, [subjects, predSubjectId, targetGrade, grades]);

  const gpaColor =
    parseFloat(predictedGpa) >= 9.0
      ? "text-[#85a818]"
      : parseFloat(predictedGpa) <= 6.0
        ? "text-[#FF4D4D]"
        : "text-[#F97316]";
  const gpaFlavorText =
    parseFloat(predictedGpa) >= 9.0
      ? "academic weapon"
      : parseFloat(predictedGpa) >= 8.0
        ? "keeping it steady"
        : parseFloat(predictedGpa) >= 7.0
          ? "needs a slight push"
          : "your gpa is in the trenches";

  if (!mounted) return null;

  const bgClass = isDark ? "bg-[#111111]" : "bg-[#F7F7F7]";
  const textClass = isDark ? "text-white" : "text-[#111111]";
  const subTextClass = isDark ? "text-white/40" : "text-[#111111]/40";

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .warning-dotted { background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='24' stroke='%23FF4D4D' stroke-opacity='0.4' stroke-width='3' stroke-dasharray='6%2c 10' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e"); border-radius: 24px; } .safe-dotted { background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='24' stroke='%2385a818' stroke-opacity='0.4' stroke-width='3' stroke-dasharray='6%2c 10' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e"); border-radius: 24px; } .danger-dotted { background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='24' stroke='%23F97316' stroke-opacity='0.4' stroke-width='3' stroke-dasharray='6%2c 10' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e"); border-radius: 24px; } .neutral-dotted { background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='24' stroke='%23${isDark ? "ffffff" : "111111"}' stroke-opacity='${isDark ? "0.1" : "0.15"}' stroke-width='3' stroke-dasharray='6%2c 10' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e"); border-radius: 24px; } .affected-dotted-rect { background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='14' stroke='%230EA5E9' stroke-width='3' stroke-dasharray='6%2c 10' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e"); border-radius: 24px; }`,
        }}
      />
      <div className={`absolute inset-0 ${bgClass}`}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="h-full w-full overflow-y-auto no-scrollbar px-6 pt-10 pb-[220px] flex flex-col relative z-10"
        >
          <motion.div
            variants={itemVariants}
            className="w-full flex flex-col items-center mt-2 mb-12 shrink-0"
          >
            <span
              className={`text-[12px] font-bold lowercase tracking-[0.3em] ${textClass} mb-3`}
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              total marks
            </span>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-[7.5rem] leading-[0.8] font-black tracking-tighter ${getMarkColor(totalObtained, maxTotal, isDark)}`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {Number.isInteger(totalObtained)
                  ? totalObtained
                  : totalObtained.toFixed(1)}
              </span>
              <span
                className={`text-[2.5rem] font-bold ${subTextClass}`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                /{maxTotal > 0 ? maxTotal : "0"}
              </span>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex flex-col mb-8 w-full shrink-0"
          >
            <button
              onClick={() => {
                setPredictMode(true);
                setExpectedMarks(0);
              }}
              className="w-full relative group active:scale-[0.98] transition-all duration-200"
            >
              <div
                className={`absolute inset-0 ${isDark ? "bg-white" : "bg-[#111111]"} rounded-[24px] translate-y-1.5 transition-transform group-hover:translate-y-2`}
              />
              <div
                className={`relative w-full border-[1.5px] ${isDark ? "border-white bg-[#111111] text-white" : "border-[#111111] bg-white text-[#111111]"} rounded-[24px] p-4 flex items-center justify-between transition-transform group-hover:-translate-y-0.5 group-active:translate-y-1`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full ${isDark ? "bg-white/5" : "bg-[#111111]/5"} flex items-center justify-center`}
                  >
                    <Calculator
                      size={20}
                      strokeWidth={2.5}
                      className={isDark ? "text-white" : "text-[#111111]"}
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <span
                      className="text-[14px] font-black uppercase tracking-widest leading-none"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      TARGET
                    </span>
                    <span
                      className={`text-[10px] font-bold lowercase tracking-wider ${isDark ? "text-white/40" : "text-[#111111]/40"} mt-1`}
                      style={{ fontFamily: "'Afacad', sans-serif" }}
                    >
                      predict your future grade
                    </span>
                  </div>
                </div>
                <div
                  className={`w-9 h-9 rounded-full ${isDark ? "bg-white/5 border-white/20" : "bg-[#F7F7F7] border-[#111111]"} flex items-center justify-center shadow-[2px_2px_0px_${isDark ? "#ffffff" : "#111111"}]`}
                >
                  <ChevronRight
                    size={20}
                    strokeWidth={3}
                    className={isDark ? "text-white" : "text-[#111111]"}
                  />
                </div>
              </div>
            </button>
          </motion.div>

          {recentlyUpdated.length > 0 && (
            <motion.div
              variants={itemVariants}
              className={`w-full ${recentlyUpdated.some((s: any) => s.isPractical) ? "affected-dotted-rect" : recentlyUpdated[0].theme.dottedClass} p-5 flex flex-col gap-4 mb-8 shrink-0 ${recentlyUpdated.some((s: any) => s.isPractical) ? (isDark ? "bg-[#0EA5E9]/5" : "bg-[#E0F2FE]/30") : recentlyUpdated[0].theme.wrapperBg}`}
            >
              <div className="flex items-center gap-3 w-full">
                <span
                  className={`text-[12px] font-bold lowercase tracking-[0.25em] whitespace-nowrap ${recentlyUpdated.some((s: any) => s.isPractical) ? "text-[#0EA5E9]" : recentlyUpdated[0].theme.text}`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  recently updated
                </span>
                <div
                  className={`flex-1 h-[1.5px] rounded-full opacity-40 bg-current ${recentlyUpdated.some((s: any) => s.isPractical) ? "text-[#0EA5E9]" : recentlyUpdated[0].theme.text}`}
                />
              </div>
              {recentlyUpdated.map((sub: any) => (
                <div
                  key={sub.id}
                  className={`w-full border-[1.5px] rounded-[24px] p-4 flex flex-col shadow-sm transition-all gap-4 ${isDark ? "bg-white/5" : "bg-white"} ${sub.isPractical ? "border-[#0EA5E9]/30" : sub.theme.border}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <div className="flex flex-col items-center justify-center min-w-[85px] shrink-0 px-1">
                      <span
                        className={`text-[3.2rem] leading-[0.8] font-black tracking-tighter ${isDark && !sub.isPractical ? "text-white" : ""}`}
                        style={{
                          fontFamily: "'Montserrat', sans-serif",
                          color: sub.isPractical ? "#0EA5E9" : undefined,
                        }}
                      >
                        {Number.isInteger(sub.totalGot)
                          ? sub.totalGot
                          : sub.totalGot.toFixed(1)}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest mt-1 text-center ${sub.theme.subText}`}
                        style={{ fontFamily: "'Afacad', sans-serif" }}
                      >
                        out of {sub.totalMax}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col items-end text-right min-w-0 ml-4">
                      <div className="flex items-center gap-2 mb-1">
                        {sub.isPractical && (
                          <span
                            className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#0EA5E9] bg-[#0EA5E9]/10 px-2 py-0.5 rounded-md"
                            style={{ fontFamily: "'Afacad', sans-serif" }}
                          >
                            practical
                          </span>
                        )}
                        <span
                          className={`text-[16px] font-black uppercase tracking-widest leading-[1.1] truncate w-full ${isDark && !sub.isPractical ? "text-white" : ""}`}
                          style={{
                            fontFamily: "'Montserrat', sans-serif",
                            color: sub.isPractical ? "#0EA5E9" : undefined,
                          }}
                        >
                          {sub.displayCode}
                        </span>
                      </div>
                      <span
                        className={`text-[13px] font-medium lowercase tracking-wide leading-[1.1] mt-0.5 truncate w-full ${sub.theme.subText}`}
                        style={{ fontFamily: "'Afacad', sans-serif" }}
                      >
                        {sub.displayName}
                      </span>
                      {sub.recent && (
                        <div
                          className={`border-[1px] px-3 py-1.5 rounded-full mt-2 flex items-center justify-center ${isDark ? "bg-[#85a818]/20 border-[#85a818]/40" : sub.theme.boxBg + " " + sub.theme.border}`}
                        >
                          <span
                            className="text-[9px] uppercase tracking-widest"
                            style={{
                              fontFamily: "'Afacad', sans-serif",
                              color: sub.isPractical
                                ? "#0EA5E9"
                                : isDark
                                  ? "#85a818"
                                  : undefined,
                            }}
                          >
                            <strong className="font-black">
                              {sub.recent.test}
                            </strong>{" "}
                            <span className="opacity-70">
                              {sub.recent.test === "ft1"
                                ? "updated"
                                : sub.recent.text}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 w-full mt-1 overflow-x-auto no-scrollbar pb-1">
                    {sub.assessments.slice(-3).map((box: any, idx: number) => {
                      const boxTheme = getBoxTheme(box.got, box.max, isDark);
                      return (
                        <div
                          key={idx}
                          className={`min-w-[65px] flex-1 rounded-[12px] p-2 flex flex-col items-center justify-center border-[1px] ${boxTheme.boxBg} ${sub.isPractical ? "border-[#0EA5E9]/10" : boxTheme.border}`}
                        >
                          <span
                            className={`text-[12px] font-bold uppercase tracking-widest mb-0.5 ${boxTheme.subText}`}
                            style={{ fontFamily: "'Afacad', sans-serif" }}
                          >
                            {box.title}
                          </span>
                          <div className="flex items-baseline justify-center gap-0.5 w-full">
                            <span
                              className={`text-[18px] font-black leading-none tracking-tighter ${sub.isPractical ? "text-[#0EA5E9]" : boxTheme.text}`}
                              style={{ fontFamily: "'Montserrat', sans-serif" }}
                            >
                              {Number.isInteger(box.got)
                                ? box.got
                                : box.got.toFixed(1)}
                            </span>
                            <span
                              className={`text-[10px] font-bold ${boxTheme.subText}`}
                              style={{ fontFamily: "'Montserrat', sans-serif" }}
                            >
                              /{box.max}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {Array.from({
                      length: Math.max(0, 3 - sub.assessments.length),
                    }).map((_, idx) => (
                      <div
                        key={`fill-${idx}`}
                        className={`min-w-[65px] flex-1 rounded-[12px] p-2 flex flex-col items-center justify-center border-[1px] border-dashed ${isDark ? "border-white/10 bg-white/5" : "border-[#111111]/5 bg-[#F7F7F7]/30"}`}
                      >
                        <span
                          className={`text-[10px] font-bold ${isDark ? "text-white/10" : "text-[#111111]/10"} uppercase tracking-widest`}
                          style={{ fontFamily: "'Afacad', sans-serif" }}
                        >
                          tba
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="w-full flex justify-center mt-1">
                <span
                  className={`text-[11px] font-bold lowercase tracking-widest ${recentlyUpdated.some((s: any) => s.isPractical) ? "text-[#0EA5E9]" : recentlyUpdated[0].theme.text}`}
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  {gpaFlavorText}
                </span>
              </div>
            </motion.div>
          )}

          <motion.div
            variants={containerVariants}
            className="flex flex-col gap-3.5 w-full shrink-0"
          >
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-3 mb-2 w-full px-1"
            >
              <span
                className={`text-[12px] font-bold lowercase tracking-[0.25em] ${subTextClass} whitespace-nowrap`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                all subjects
              </span>
              <div
                className={`flex-1 h-[1.5px] ${isDark ? "bg-white/10" : "bg-[#111111]/10"} rounded-full`}
              />
            </motion.div>
            {allMarks.map((sub: any) => (
              <motion.div
                key={sub.id}
                variants={itemVariants}
                className={`w-full border-[1.5px] rounded-[24px] p-4 flex flex-col shadow-sm gap-4 transition-all ${isDark ? "bg-white/5 border-white/10" : "bg-white border-[#111111]/10"} ${sub.isPractical && !isDark ? "bg-[#E0F2FE]/10 border-[#0EA5E9]/20" : sub.isPractical && isDark ? "bg-[#0EA5E9]/5 border-[#0EA5E9]/30" : ""}`}
              >
                <div className="flex justify-between items-center w-full">
                  <div className="flex flex-col items-center justify-center min-w-[85px] shrink-0 px-1">
                    <span
                      className={`text-[3.2rem] leading-[0.8] font-black tracking-tighter`}
                      style={{
                        fontFamily: "'Montserrat', sans-serif",
                        color: sub.isPractical
                          ? "#0EA5E9"
                          : isDark
                            ? "#ffffff"
                            : "#111111",
                      }}
                    >
                      {Number.isInteger(sub.totalGot)
                        ? sub.totalGot
                        : sub.totalGot.toFixed(1)}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest mt-1 text-center ${sub.isPractical ? "text-[#0EA5E9]/50" : isDark ? "text-white/40" : "text-[#111111]/40"}`}
                      style={{ fontFamily: "'Afacad', sans-serif" }}
                    >
                      out of {sub.totalMax}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col items-end text-right min-w-0 ml-4">
                    <div className="flex items-center gap-2 mb-1">
                      {sub.isPractical && (
                        <span
                          className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#0EA5E9] bg-[#0EA5E9]/10 px-2 py-0.5 rounded-md"
                          style={{ fontFamily: "'Afacad', sans-serif" }}
                        >
                          practical
                        </span>
                      )}
                      <span
                        className={`text-[16px] font-black uppercase tracking-widest leading-none truncate`}
                        style={{
                          fontFamily: "'Montserrat', sans-serif",
                          color: sub.isPractical
                            ? "#0EA5E9"
                            : isDark
                              ? "#ffffff"
                              : "#111111",
                        }}
                      >
                        {sub.displayCode}
                      </span>
                    </div>
                    <span
                      className={`text-[13px] font-medium lowercase tracking-wide leading-[1.1] mt-0.5 truncate w-full ${sub.isPractical ? "text-[#0EA5E9]/60" : isDark ? "text-white/50" : "text-[#111111]/50"}`}
                      style={{ fontFamily: "'Afacad', sans-serif" }}
                    >
                      {sub.displayName}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 w-full mt-1 overflow-x-auto no-scrollbar pb-1">
                  {sub.assessments.slice(-3).map((box: any, idx: number) => {
                    const boxTheme = getBoxTheme(box.got, box.max, isDark);
                    return (
                      <div
                        key={idx}
                        className={`min-w-[65px] flex-1 rounded-[12px] p-2 flex flex-col items-center justify-center border-[1px] ${sub.isPractical ? (isDark ? "bg-[#0EA5E9]/10 border-[#0EA5E9]/20" : "bg-[#E0F2FE]/40 border-[#0EA5E9]/10") : boxTheme.boxBg + " " + boxTheme.border}`}
                      >
                        <span
                          className={`text-[12px] font-bold uppercase tracking-widest mb-0.5 ${sub.isPractical ? "text-[#0EA5E9]/60" : boxTheme.subText}`}
                          style={{ fontFamily: "'Afacad', sans-serif" }}
                        >
                          {box.title}
                        </span>
                        <div className="flex items-baseline justify-center gap-0.5 w-full">
                          <span
                            className={`text-[18px] font-black leading-none tracking-tighter ${sub.isPractical ? "text-[#0EA5E9]" : boxTheme.text}`}
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            {Number.isInteger(box.got)
                              ? box.got
                              : box.got.toFixed(1)}
                          </span>
                          <span
                            className={`text-[10px] font-bold ${sub.isPractical ? "text-[#0EA5E9]/40" : boxTheme.subText}`}
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            /{box.max}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {Array.from({
                    length: Math.max(0, 3 - sub.assessments.length),
                  }).map((_, idx) => (
                    <div
                      key={`fill-${idx}`}
                      className={`min-w-[65px] flex-1 rounded-[12px] p-2 flex flex-col items-center justify-center border-[1px] border-dashed ${isDark ? "border-white/10 bg-white/5" : "border-[#111111]/5 bg-[#F7F7F7]/30"}`}
                    >
                      <span
                        className={`text-[10px] font-bold ${isDark ? "text-white/10" : "text-[#111111]/10"} uppercase tracking-widest`}
                        style={{ fontFamily: "'Afacad', sans-serif" }}
                      >
                        tba
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <div
          className={`absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t ${isDark ? "from-[#111111] via-[#111111]/80" : "from-[#F7F7F7] via-[#F7F7F7]/80"} to-transparent px-6 pb-[30px] z-20 flex justify-between items-end pointer-events-none`}
        >
          {"marks".split("").map((char, i) => (
            <span
              key={i}
              className={`text-[3.2rem] leading-[0.75] lowercase ${textClass}`}
              style={{ fontFamily: "'Afacad', sans-serif", fontWeight: 400 }}
            >
              {char}
            </span>
          ))}
        </div>
      </div>

      <Target
        isOpen={predictMode}
        onClose={() => setPredictMode(false)}
        isDark={isDark}
        activePredSub={activePredSub}
        predictedGpa={predictedGpa}
        gpaColor={gpaColor}
        semRequiredOutOf75={semRequiredOutOf75}
        currentInternals={currentInternals}
        expectedMarks={expectedMarks}
        maxPossibleExpected={maxPossibleExpected}
        handleExpectedChange={handleExpectedChange}
        setExpectedMarks={setExpectedMarks}
        targetGrade={targetGrade}
        setTargetGrade={setTargetGrade}
        grades={grades}
        subjects={subjects}
        predSubjectId={predSubjectId}
        setPredSubjectId={setPredSubjectId}
        textClass={textClass}
      />
    </>
  );
}
