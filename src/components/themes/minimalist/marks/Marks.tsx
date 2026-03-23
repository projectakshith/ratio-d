"use client";
import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calculator, ChevronRight, Loader } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import {
  processAndSortMarks,
  buildCourseMap,
  getAcronym,
  getTheme,
  getBoxTheme,
  gradePoints,
  getGrade,
} from "@/utils/marks/marksLogic";
import Target from "./Target";
import { AcademiaData } from "@/types";
import { useAppLayout } from "@/context/AppLayoutContext";
import { getRandomRoast } from "@/utils/shared/flavortext";

const BEZIER = [0.34, 0.15, 0.16, 0.96] as const;

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
    transition: { duration: 0.5, ease: BEZIER },
  },
};

const normalize = (str: string) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();

export default function Marks({
  data,
}: {
  data: AcademiaData;
}) {
  const { setIsSwipeDisabled } = useAppLayout();
  const [predictMode, setPredictMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  const {
    pullY,
    isRefreshing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = usePullToRefresh(predictMode);

  useEffect(() => {
    setIsSwipeDisabled(predictMode);
  }, [predictMode, setIsSwipeDisabled]);
  const [predSubjectId, setPredSubjectId] = useState<number | null>(null);
  const [targetGrades, setTargetGrades] = useState<Record<number, number>>({});
  const [expectedMarksMap, setExpectedMarksMap] = useState<Record<number, number>>({});
  const [ignoredSubjectIds, setIgnoredSubjectIds] = useState<number[]>([]);

  const toggleSubjectIgnore = (id: number) => {
    setIgnoredSubjectIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const subjects = useMemo(() => {
    if (!data?.marks || data.marks.length === 0) return [];
    const courseMap = buildCourseMap(data);
    const sorted = processAndSortMarks(data.marks, courseMap);
    return sorted.map((sub: any) => {
      const sStr = sub.slot || "";
      const firstSlot = sStr.split(/[,\s+-]/)[0].trim().toUpperCase();
      let courseDetails = (data.courses as any)?.[firstSlot];

      if (!courseDetails) {
        courseDetails = Object.values(data.courses || {}).find((c: any) => 
          normalize(c.code) === normalize(sub.code) && 
          ((c.type || "").toLowerCase().includes("lab") === sub.isPractical)
        );
      }

      const credits = courseDetails?.credits
        ? parseFloat(courseDetails.credits)
        : 0;

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
        isPractical: isPrac,
        theme: getTheme(sub.percentage, sub.totalMax),
      };
    });
  }, [data]);

  useEffect(() => {
    if (subjects.length > 0 && predSubjectId === null)
      setPredSubjectId(subjects[0].id);
  }, [subjects, predSubjectId]);

  const grades = useMemo(() => [
    { label: "O", min: 91 },
    { label: "A+", min: 81 },
    { label: "A", min: 71 },
    { label: "B+", min: 61 },
    { label: "B", min: 56 },
    { label: "C", min: 50 },
  ], []);

  const activePredSub = subjects.find((s: any) => s.id === predSubjectId) ||
    subjects[0] || {
      displayCode: "--",
      displayName: "no data",
      totalGot: 0,
      totalMax: 60,
    };

  const currentTargetGrade = targetGrades[predSubjectId || -1] || 91;
  const currentExpectedMarks = expectedMarksMap[predSubjectId || -1] || 0;

  const handleExpectedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (predSubjectId === null) return;
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 0;
    const max = Math.max(0, 60 - (activePredSub.totalGot || 0));
    setExpectedMarksMap(prev => ({ ...prev, [predSubjectId]: Math.min(max, Math.max(0, val)) }));
  };

  const setExpectedMarks = (val: number | ((prev: number) => number)) => {
    if (predSubjectId === null) return;
    setExpectedMarksMap(prev => {
      const currentVal = prev[predSubjectId] || 0;
      const newVal = typeof val === "function" ? val(currentVal) : val;
      const max = Math.max(0, 60 - (activePredSub.totalGot || 0));
      return { ...prev, [predSubjectId]: Math.min(max, Math.max(0, newVal)) };
    });
  };

  const setTargetGrade = (val: number) => {
    if (predSubjectId === null) return;
    setTargetGrades(prev => ({ ...prev, [predSubjectId]: val }));
  };

  const attentionRequired = useMemo(() => {
    const valid = subjects.filter((s: any) => !s.isNA && s.totalMax > 0);
    return [...valid]
      .sort((a: any, b: any) => {
        if (a.percentage !== b.percentage) return a.percentage - b.percentage;
        if (a.isPractical !== b.isPractical) return a.isPractical ? 1 : -1;
        return 0;
      })
      .slice(0, 2);
  }, [subjects]);

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
  
  const currentInternals = activePredSub.totalGot || 0;
  const maxPossibleExpected = Math.max(0, 60 - currentInternals);
  const projectedInternals = currentInternals + currentExpectedMarks;
  const semNeededPercentage = Math.max(0, currentTargetGrade - projectedInternals);
  const maxExternal = activePredSub.isPractical ? 40 : 75;
  const semRequiredOutOfMax = Math.ceil((semNeededPercentage / 40) * maxExternal);

  const predictedGpa = useMemo(() => {
    if (subjects.length === 0) return "0.00";

    let totalPoints = 0;
    let totalCredits = 0;

    subjects.forEach((sub: any) => {
      if (sub.isNA || ignoredSubjectIds.includes(sub.id)) return;

      const credits = sub.credits || 0;
      if (credits === 0) return;

      let grade;
      const subTargetGrade = targetGrades[sub.id];
      if (subTargetGrade !== undefined) {
        const gradeObj = grades.find((g) => g.min === subTargetGrade);
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
  }, [subjects, targetGrades, grades, ignoredSubjectIds]);

  const gpaColor =
    parseFloat(predictedGpa) >= 8.5
      ? "status-text-safe"
      : parseFloat(predictedGpa) <= 6.0
        ? "status-text-cooked"
        : "status-text-danger";

  const gpaFlavorText = useMemo(() => {
    const gpa = parseFloat(predictedGpa);
    const category = gpa >= 8.5 ? "safe" : gpa >= 7.0 ? "danger" : "cooked";
    return getRandomRoast(category as any);
  }, [predictedGpa]);

  const attentionFlavorText = useMemo(() => {
    if (attentionRequired.length === 0) return "";
    const avg = attentionRequired.reduce((acc: number, s: any) => acc + s.percentage, 0) / attentionRequired.length;
    const category = avg >= 80 ? "safe" : avg >= 60 ? "danger" : "cooked";
    return getRandomRoast(category as any);
  }, [attentionRequired]);

  if (!mounted) return null;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `.warning-dotted { background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='24' stroke='%23FF4D4D' stroke-opacity='0.4' stroke-width='3' stroke-dasharray='6%2c 10' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e"); border-radius: 24px; } .safe-dotted { background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='24' stroke='%2385a818' stroke-opacity='0.4' stroke-width='3' stroke-dasharray='6%2c 10' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e"); border-radius: 24px; } .danger-dotted { background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='24' stroke='%23F97316' stroke-opacity='0.4' stroke-width='3' stroke-dasharray='6%2c 10' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e"); border-radius: 24px; } .affected-dotted-rect { background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='14' stroke='%230EA5E9' stroke-width='3' stroke-dasharray='6%2c 10' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e"); border-radius: 24px; }`,
        }}
      />
      <div className="absolute inset-0 bg-theme-bg overflow-hidden">
        <div
          className="fixed top-0 left-0 w-full flex justify-center pt-8 z-50 transition-opacity duration-300 pointer-events-none"
          style={{
            opacity: Math.min(pullY / 60, 1),
            transform: `translateY(${pullY * 0.3}px)`,
          }}
        >
          <Loader
            className="w-6 h-6 text-theme-muted"
            style={{
              animation: isRefreshing ? "spin 1s linear infinite" : "none",
              transform: `rotate(${pullY * 2}deg)`,
            }}
          />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{ y: pullY }}
          className="h-full w-full overflow-y-auto no-scrollbar px-6 pt-10 pb-[220px] flex flex-col relative z-10"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <motion.div
            variants={itemVariants}
            className="w-full flex flex-col items-center mt-2 mb-12 shrink-0"
          >
            <span
              className="text-[12px] font-bold lowercase tracking-[0.3em] text-theme-muted mb-3"
              style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
            >
              total marks
            </span>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-[7.5rem] leading-[0.8] font-black tracking-tighter text-theme-text`}
                style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
              >
                {Number.isInteger(totalObtained)
                  ? totalObtained
                  : totalObtained.toFixed(1)}
              </span>
              <span
                className="text-[2.5rem] font-bold text-theme-muted"
                style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
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
              }}
              className="w-full relative group transition-all duration-200"
            >
              <div
                className="absolute inset-0 bg-theme-text rounded-[24px] translate-y-1.5 transition-transform group-hover:translate-y-2"
              />
              <div
                className="relative w-full border-[1.5px] border-theme-text bg-theme-bg text-theme-text rounded-[24px] p-4 flex items-center justify-between transition-transform group-hover:-translate-y-0.5 group-active:translate-y-1"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-theme-surface flex items-center justify-center">
                    <Calculator size={20} strokeWidth={2.5} className="text-theme-text" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span
                      className="text-[14px] font-black uppercase tracking-widest leading-none"
                      style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                    >
                      TARGET
                    </span>
                    <span
                      className="text-[10px] font-bold lowercase tracking-wider text-theme-muted mt-1"
                      style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                    >
                      predict your future grade
                    </span>
                  </div>
                </div>
                <div
                  className="w-9 h-9 rounded-full bg-theme-surface border border-theme-border flex items-center justify-center"
                  style={{ boxShadow: '2px 2px 0px var(--theme-text)' }}
                >
                  <ChevronRight size={20} strokeWidth={3} className="text-theme-text" />
                </div>
              </div>
            </button>
          </motion.div>

          {attentionRequired.length > 0 && (
            <motion.div
              variants={itemVariants}
              className="w-full p-5 flex flex-col gap-4 mb-8 shrink-0 rounded-[32px] border-[2px] border-dashed"
              style={{
                borderColor: attentionRequired.some((s: any) => s.percentage < 75) 
                  ? 'color-mix(in srgb, var(--theme-secondary) 50%, transparent)' 
                  : 'color-mix(in srgb, var(--theme-highlight) 50%, transparent)',
                backgroundColor: attentionRequired.some((s: any) => s.percentage < 75) 
                  ? 'color-mix(in srgb, var(--theme-secondary) 5%, transparent)' 
                  : 'color-mix(in srgb, var(--theme-highlight) 5%, transparent)',
                borderDasharray: '12 16'
              } as any}
            >
              <div className="flex items-center gap-3 w-full">
                <span
                  className={`text-[12px] font-bold lowercase tracking-[0.25em] whitespace-nowrap ${attentionRequired.some((s: any) => s.percentage < 75) ? "text-theme-secondary" : "status-text-safe"}`}
                  style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                >
                  academic emergency
                </span>
                <div
                  className={`flex-1 h-[1.5px] rounded-full opacity-40 bg-current ${attentionRequired.some((s: any) => s.percentage < 75) ? "text-theme-secondary" : "status-text-safe"}`}
                />
              </div>
              {attentionRequired.map((sub: any) => (
                <div
                  key={sub.id}
                  className="w-full border-[1.5px] rounded-[24px] p-4 flex flex-col shadow-sm transition-all gap-4 bg-theme-surface border-theme-border"
                >
                  <div className="flex justify-between items-center w-full">
                    <div className="flex flex-col items-center justify-center min-w-[85px] shrink-0 px-1">
                      <span
                        className={`text-[3.2rem] leading-[0.8] font-black tracking-tighter ${sub.percentage < 75 ? "text-theme-secondary" : "text-theme-text"}`}
                        style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                      >
                        {Number.isInteger(sub.totalGot)
                          ? sub.totalGot
                          : sub.totalGot.toFixed(1)}
                      </span>
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest mt-1 text-center text-theme-secondary"
                        style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                      >
                        out of {sub.totalMax}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col items-end text-right min-w-0 ml-4">
                      <div className="flex items-center gap-2 mb-1 justify-end">
                        {sub.isPractical && (
                          <span
                            className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#0EA5E9] bg-[#0EA5E9]/10 px-2 py-0.5 rounded-md"
                            style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                          >
                            practical
                          </span>
                        )}
                        <span
                          className="text-[16px] font-black uppercase tracking-widest leading-[1.1] truncate text-theme-secondary"
                          style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                        >
                          {sub.displayCode}
                        </span>
                      </div>
                      <span
                        className="text-[13px] font-medium lowercase tracking-wide leading-[1.1] mt-0.5 truncate w-full text-theme-secondary"
                        style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                      >
                        {sub.displayName}
                      </span>
                      <div className="flex mt-2 justify-end">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-theme-text-10 ${sub.percentage < 75 ? "text-theme-secondary" : "text-theme-highlight"}`}
                          style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                        >
                          {sub.credits} credits
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 w-full mt-1">
                    {sub.assessments.map((box: any, idx: number) => {
                      const boxTheme = getBoxTheme(box.got, box.max);
                      return (
                        <div
                          key={idx}
                          className={`min-w-0 flex-1 min-h-[58px] rounded-[12px] p-2 flex flex-col items-center justify-center border-[1.5px] ${boxTheme.boxBg} ${boxTheme.border}`}
                        >
                          <span
                            className={`text-[12px] font-bold uppercase tracking-widest mb-0.5 ${boxTheme.subText}`}
                            style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                          >
                            {box.title}
                          </span>
                          <div className="flex items-baseline justify-center gap-0.5 w-full">
                            <span
                              className={`text-[18px] font-black leading-none tracking-tighter ${boxTheme.text}`}
                              style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                            >
                              {Number.isInteger(box.got)
                                ? box.got
                                : box.got.toFixed(1)}
                            </span>
                            <span
                              className={`text-[10px] font-bold ${boxTheme.subText}`}
                              style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                            >
                              /{box.max}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {Array.from({
                      length: Math.max(0, sub.assessments.length < 3 ? 3 - sub.assessments.length : (3 - (sub.assessments.length % 3)) % 3),
                    }).map((_, idx) => (
                      <div
                        key={`fill-${idx}`}
                        className="min-w-0 flex-1 min-h-[58px] rounded-[12px] p-2 flex flex-col items-center justify-center border-[1.5px] border-dashed border-theme-border bg-theme-surface/50"
                      >
                        <span
                          className="text-[10px] font-bold text-theme-faint uppercase tracking-widest"
                          style={{ fontFamily: "var(--font-afacad), sans-serif" }}
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
                  className={`text-[11px] font-bold lowercase tracking-widest opacity-80 ${attentionRequired.some((s: any) => s.percentage < 75) ? "text-theme-secondary" : "text-theme-highlight"}`}
                  style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                >
                  {attentionFlavorText}
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
                className="text-[12px] font-bold lowercase tracking-[0.25em] text-theme-muted whitespace-nowrap"
                style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
              >
                all subjects
              </span>
              <div
                className="flex-1 h-[1.5px] bg-theme-text-10 rounded-full"
              />
            </motion.div>
            {allMarks.map((sub: any) => (
              <motion.div
                key={sub.id}
                variants={itemVariants}
                className="w-full border-[1.5px] rounded-[24px] p-4 flex flex-col shadow-sm gap-4 transition-all bg-theme-surface border-theme-border"
              >
                <div className="flex justify-between items-center w-full">
                  <div className="flex flex-col items-center justify-center min-w-[85px] shrink-0 px-1">
                    <span
                      className="text-[3.2rem] leading-[0.8] font-black tracking-tighter text-theme-text"
                      style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                    >
                      {Number.isInteger(sub.totalGot)
                        ? sub.totalGot
                        : sub.totalGot.toFixed(1)}
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest mt-1 text-center text-theme-muted"
                      style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                    >
                      out of {sub.totalMax}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col items-end text-right min-w-0 ml-4">
                    <div className="flex items-center gap-2 mb-1 justify-end">
                      {sub.isPractical && (
                        <span
                          className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#0EA5E9] bg-[#0EA5E9]/10 px-2 py-0.5 rounded-md"
                          style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                        >
                          practical
                        </span>
                      )}
                      <span
                        className={`text-[16px] font-black uppercase tracking-widest leading-none ${sub.isPractical ? "text-[#0EA5E9]" : "text-theme-text"}`}
                        style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                      >
                        {sub.displayCode}
                      </span>
                    </div>
                    <span
                      className={`text-[13px] font-medium lowercase tracking-wide leading-[1.1] mt-0.5 truncate w-full ${sub.isPractical ? "text-[#0EA5E9]/70" : "text-theme-muted"}`}
                      style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                    >
                      {sub.displayName}
                    </span>
                    <div className="flex mt-2 justify-end">
                      <span
                        className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-theme-text-10 text-theme-muted"
                        style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                      >
                        {sub.credits} credits
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 w-full mt-1">
                  {sub.assessments.map((box: any, idx: number) => {
                    const boxTheme = getBoxTheme(box.got, box.max);
                      return (
                        <div
                          key={idx}
                          className={`min-w-0 flex-1 min-h-[58px] rounded-[12px] p-2 flex flex-col items-center justify-center border-[1.5px] ${boxTheme.boxBg} ${boxTheme.border}`}
                      >
                        <span
                          className={`text-[12px] font-bold uppercase tracking-widest mb-0.5 ${boxTheme.subText}`}
                          style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                        >
                          {box.title}
                        </span>
                        <div className="flex items-baseline justify-center gap-0.5 w-full">
                          <span
                            className={`text-[18px] font-black leading-none tracking-tighter ${boxTheme.text}`}
                            style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                          >
                            {Number.isInteger(box.got)
                              ? box.got
                              : box.got.toFixed(1)}
                          </span>
                          <span
                            className={`text-[10px] font-bold ${boxTheme.subText}`}
                            style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                          >
                            /{box.max}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {Array.from({
                    length: Math.max(0, sub.assessments.length < 3 ? 3 - sub.assessments.length : (3 - (sub.assessments.length % 3)) % 3),
                  }).map((_, idx) => (
                    <div
                      key={`fill-${idx}`}
                      className="min-w-0 flex-1 min-h-[58px] rounded-[12px] p-2 flex flex-col items-center justify-center border-[1.5px] border-dashed border-theme-border bg-theme-surface/50"
                    >
                      <span
                        className="text-[10px] font-bold text-theme-faint uppercase tracking-widest"
                        style={{ fontFamily: "var(--font-afacad), sans-serif" }}
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

        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="absolute bottom-0 left-0 right-0 h-48 px-6 pb-[30px] z-20 flex justify-between items-end pointer-events-none"
          style={{ background: 'linear-gradient(to top, var(--theme-bg) 0%, color-mix(in srgb, var(--theme-bg) 80%, transparent) 60%, transparent 100%)' }}
        >
          {"marks".split("").map((char, i) => (
            <span
              key={i}
              className="text-[3.2rem] leading-[0.75] lowercase text-theme-text"
              style={{ fontFamily: "var(--font-afacad), sans-serif", fontWeight: 400 }}
            >
              {char}
            </span>
          ))}
        </motion.div>
      </div>

      <Target
        isOpen={predictMode}
        onClose={() => setPredictMode(false)}
        activePredSub={activePredSub}
        predictedGpa={predictedGpa}
        gpaColor={gpaColor}
        semRequiredOutOfMax={semRequiredOutOfMax}
        currentInternals={currentInternals}
        expectedMarks={currentExpectedMarks}
        maxPossibleExpected={maxPossibleExpected}
        handleExpectedChange={handleExpectedChange}
        setExpectedMarks={setExpectedMarks}
        targetGrade={currentTargetGrade}
        setTargetGrade={setTargetGrade}
        grades={grades}
        subjects={[...subjects].sort((a: any, b: any) => b.credits - a.credits)}
        predSubjectId={predSubjectId}
        setPredSubjectId={setPredSubjectId}
        ignoredSubjectIds={ignoredSubjectIds}
        toggleSubjectIgnore={toggleSubjectIgnore}
        textClass="text-theme-text"
      />
    </>
  );
}
