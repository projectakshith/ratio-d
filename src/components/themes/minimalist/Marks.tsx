"use client";
import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, X } from "lucide-react";
import { processAndSortMarks, buildCourseMap } from "@/utils/marksLogic";

export default function MinimalMarks({ data }: any) {
  const [mounted, setMounted] = useState(false);
  const [predictMode, setPredictMode] = useState(false);
  const [predSubjectId, setPredSubjectId] = useState<number | null>(null);
  const [expectedMarks, setExpectedMarks] = useState<number>(0);
  const [targetGrade, setTargetGrade] = useState<number>(91);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getAcronym = (name: string) => {
    if (!name) return "";
    const lowerName = name.toLowerCase().trim();
    if (lowerName.includes("internet of things")) return "iot";
    if (lowerName.includes("design thinking")) return "dtm";

    const skipWords = [
      "and",
      "of",
      "to",
      "in",
      "for",
      "with",
      "a",
      "an",
      "the",
    ];
    const parts = lowerName.split(/\s+/).filter((w) => !skipWords.includes(w));
    if (parts.length === 1 && parts[0].length <= 5) return parts[0];
    return parts.map((w) => w[0]).join("");
  };

  const getTheme = (pct: number, max: number) => {
    if (max === 0)
      return {
        wrapperBg: "bg-[#F7F7F7]/50",
        cardBg: "bg-white",
        border: "border-[#111111]/10",
        text: "text-[#111111]",
        subText: "text-[#111111]/50",
        boxBg: "bg-[#F7F7F7]",
        dottedClass: "neutral-dotted",
      };
    if (pct >= 85)
      return {
        wrapperBg: "bg-[#F2FFDB]/60",
        cardBg: "bg-white",
        border: "border-[#85a818]/30",
        text: "text-[#4d6600]",
        subText: "text-[#4d6600]/60",
        boxBg: "bg-[#F2FFDB]/40",
        dottedClass: "safe-dotted",
      };
    if (pct >= 60)
      return {
        wrapperBg: "bg-[#FFF4E5]/70",
        cardBg: "bg-white",
        border: "border-[#F97316]/30",
        text: "text-[#EA580C]",
        subText: "text-[#EA580C]/60",
        boxBg: "bg-[#FFF4E5]/50",
        dottedClass: "danger-dotted",
      };
    return {
      wrapperBg: "bg-[#FFEDED]/60",
      cardBg: "bg-white",
      border: "border-[#FF4D4D]/30",
      text: "text-[#FF4D4D]",
      subText: "text-[#FF4D4D]/70",
      boxBg: "bg-[#FFEDED]/50",
      dottedClass: "warning-dotted",
    };
  };

  const getMarkColor = (got: number, max: number) => {
    if (max === 0) return "text-[#111111]";
    const pct = (got / max) * 100;
    if (pct >= 75) return "text-[#85a818]";
    if (pct >= 50) return "text-[#F97316]";
    return "text-[#FF4D4D]";
  };

  const getBoxTheme = (got: number | null, max: number) => {
    if (got === null || max === 0)
      return {
        boxBg: "bg-[#F7F7F7]",
        text: "text-[#111111]/50",
        subText: "text-[#111111]/40",
        border: "border-[#111111]/5",
      };
    const pct = (got / max) * 100;
    if (pct >= 75)
      return {
        boxBg: "bg-[#F2FFDB]/60",
        text: "text-[#4d6600]",
        subText: "text-[#4d6600]/60",
        border: "border-[#85a818]/20",
      };
    if (pct >= 50)
      return {
        boxBg: "bg-[#FFF4E5]/70",
        text: "text-[#EA580C]",
        subText: "text-[#EA580C]/60",
        border: "border-[#F97316]/20",
      };
    return {
      boxBg: "bg-[#FFEDED]/60",
      text: "text-[#FF4D4D]",
      subText: "text-[#FF4D4D]/70",
      border: "border-[#FF4D4D]/20",
    };
  };

  const subjects = useMemo(() => {
    if (!data?.marks || data.marks.length === 0) return [];
    const courseMap = buildCourseMap(data);
    const sorted = processAndSortMarks(data.marks, courseMap);

    return sorted.map((sub: any, i: number) => {
      let recent = null;
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

      return {
        ...sub,
        displayCode: getAcronym(sub.title) || sub.code,
        displayName: sub.title.toLowerCase(),
        recent,
        theme: getTheme(sub.percentage, sub.totalMax),
      };
    });
  }, [data]);

  useEffect(() => {
    if (subjects.length > 0 && predSubjectId === null) {
      setPredSubjectId(subjects[0].id);
    }
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

  const totalObtained = useMemo(() => {
    return subjects.reduce(
      (acc: number, sub: any) =>
        acc + sub.assessments.reduce((a: number, curr: any) => a + curr.got, 0),
      0,
    );
  }, [subjects]);

  const maxTotal = useMemo(() => {
    return subjects.reduce(
      (acc: number, sub: any) =>
        acc + sub.assessments.reduce((a: number, curr: any) => a + curr.max, 0),
      0,
    );
  }, [subjects]);

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
  const semRequired = targetGrade - projectedInternals;

  const grades = [
    { label: "O", min: 91 },
    { label: "A+", min: 81 },
    { label: "A", min: 71 },
    { label: "B+", min: 61 },
  ];

  const baseGpa = data?.profile?.cgpa ? parseFloat(data.profile.cgpa) : 8.74;
  let gpaOffset = 0;
  if (targetGrade === 91) gpaOffset = 0.08;
  else if (targetGrade === 81) gpaOffset = 0.04;
  else if (targetGrade === 71) gpaOffset = -0.02;
  else if (targetGrade === 61) gpaOffset = -0.08;

  const predictedGpa = (baseGpa + gpaOffset).toFixed(2);
  const gpaColor =
    targetGrade >= 91
      ? "text-[#ceff1c]"
      : targetGrade <= 71
        ? "text-[#FF4D4D]"
        : "text-white";

  const recentOverallPct =
    recentlyUpdated.length > 0
      ? recentlyUpdated.reduce((acc: number, s: any) => acc + s.percentage, 0) /
        recentlyUpdated.length
      : 0;

  const recentBgTheme = getTheme(recentOverallPct, 100);

  const gpaFlavorText =
    baseGpa >= 9.0
      ? "academic weapon"
      : baseGpa >= 8.0
        ? "keeping it steady"
        : baseGpa >= 7.0
          ? "needs a slight push"
          : "your gpa is in the trenches";

  if (!mounted) return null;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700;800;900&display=swap');
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

          .warning-dotted { background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='24' stroke='%23FF4D4D' stroke-opacity='0.4' stroke-width='3' stroke-dasharray='6%2c 10' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e"); border-radius: 24px; }
          .safe-dotted { background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='24' stroke='%2385a818' stroke-opacity='0.4' stroke-width='3' stroke-dasharray='6%2c 10' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e"); border-radius: 24px; }
          .danger-dotted { background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='24' stroke='%23F97316' stroke-opacity='0.4' stroke-width='3' stroke-dasharray='6%2c 10' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e"); border-radius: 24px; }
          .neutral-dotted { background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='24' stroke='%23111111' stroke-opacity='0.15' stroke-width='3' stroke-dasharray='6%2c 10' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e"); border-radius: 24px; }
        `,
        }}
      />

      <div className="absolute inset-0 bg-[#F7F7F7]">
        <div className="h-full w-full overflow-y-auto no-scrollbar px-6 pt-10 pb-[220px] flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col items-center mt-2 mb-12 shrink-0"
          >
            <span
              className="text-[12px] font-bold lowercase tracking-[0.3em] text-[#111111] mb-3"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              total marks
            </span>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-[7.5rem] leading-[0.8] font-black tracking-tighter ${getMarkColor(totalObtained, maxTotal)}`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {Number.isInteger(totalObtained)
                  ? totalObtained
                  : totalObtained.toFixed(1)}
              </span>
              <span
                className="text-[2.5rem] font-bold text-[#111111]/40"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                /{maxTotal > 0 ? maxTotal : "0"}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col mb-8 w-full shrink-0"
          >
            <button
              onClick={() => {
                setPredictMode(true);
                setExpectedMarks(0);
              }}
              className="w-full border-[1.5px] border-[#111111] rounded-[24px] p-4 flex items-center justify-between bg-white shadow-sm active:scale-95 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#111111]" />
                <span
                  className="text-[14px] font-bold lowercase tracking-widest text-[#111111]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  target
                </span>
              </div>
              <Calculator
                size={20}
                strokeWidth={2.5}
                className="text-[#111111]"
              />
            </button>
          </motion.div>

          {recentlyUpdated.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className={`w-full ${recentBgTheme.dottedClass} p-5 flex flex-col gap-4 mb-8 shrink-0 ${recentBgTheme.wrapperBg}`}
            >
              <div className="flex items-center gap-3 w-full">
                <span
                  className={`text-[12px] font-bold lowercase tracking-[0.25em] whitespace-nowrap ${recentBgTheme.text}`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  recently updated
                </span>
                <div
                  className={`flex-1 h-[1.5px] rounded-full opacity-40 bg-current ${recentBgTheme.text}`}
                />
              </div>

              {recentlyUpdated.map((sub: any) => (
                <div
                  key={sub.id}
                  className={`w-full border-[1.5px] rounded-[24px] p-4 flex flex-col shadow-sm transition-all gap-4 ${sub.theme.cardBg} ${sub.theme.border}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <div className="flex flex-col items-center justify-center min-w-[85px] shrink-0 px-1">
                      <span
                        className={`text-[3.2rem] leading-[0.8] font-black tracking-tighter ${sub.theme.text}`}
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
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
                      <span
                        className={`text-[16px] font-black uppercase tracking-widest leading-[1.1] truncate w-full ${sub.theme.text}`}
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {sub.displayCode}
                      </span>
                      <span
                        className={`text-[13px] font-medium lowercase tracking-wide leading-[1.1] mt-0.5 truncate w-full ${sub.theme.subText}`}
                        style={{ fontFamily: "'Afacad', sans-serif" }}
                      >
                        {sub.displayName}
                      </span>
                      {sub.recent && (
                        <div
                          className={`border-[1px] px-3 py-1.5 rounded-full mt-2 flex items-center justify-center ${sub.theme.boxBg} ${sub.theme.border}`}
                        >
                          <span
                            className={`text-[9px] uppercase tracking-widest ${sub.theme.text}`}
                            style={{ fontFamily: "'Afacad', sans-serif" }}
                          >
                            <strong className="font-black">
                              {sub.recent.test}
                            </strong>{" "}
                            <span className="opacity-70">
                              {sub.recent.text}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 w-full mt-1 overflow-x-auto no-scrollbar pb-1">
                    {sub.assessments.slice(-3).map((box: any, idx: number) => {
                      const boxTheme = getBoxTheme(box.got, box.max);
                      return (
                        <div
                          key={idx}
                          className={`min-w-[65px] flex-1 rounded-[12px] p-2 flex flex-col items-center justify-center border-[1px] ${boxTheme.boxBg} ${boxTheme.border}`}
                        >
                          <span
                            className={`text-[12px] font-bold uppercase tracking-widest mb-0.5 ${boxTheme.subText}`}
                            style={{ fontFamily: "'Afacad', sans-serif" }}
                          >
                            {box.title}
                          </span>
                          <div className="flex items-baseline justify-center gap-0.5 w-full">
                            <span
                              className={`text-[18px] font-black leading-none tracking-tighter ${boxTheme.text}`}
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
                        key={`empty-${idx}`}
                        className={`min-w-[65px] flex-1 rounded-[12px] p-2 flex flex-col items-center justify-center border-[1px] opacity-40 bg-[#F7F7F7] border-[#111111]/5`}
                      >
                        <span
                          className={`text-[12px] font-bold uppercase tracking-widest mb-0.5 text-[#111111]/50`}
                          style={{ fontFamily: "'Afacad', sans-serif" }}
                        >
                          --
                        </span>
                        <div className="flex items-baseline justify-center gap-0.5 w-full">
                          <span
                            className={`text-[18px] font-black leading-none tracking-tighter text-[#111111]/50`}
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            -
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="w-full flex justify-center mt-1">
                <span
                  className={`text-[11px] font-bold lowercase tracking-widest ${recentBgTheme.text}`}
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  {gpaFlavorText}
                </span>
              </div>
            </motion.div>
          )}

          {allMarks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-col gap-3.5 w-full shrink-0"
            >
              <div className="flex items-center gap-3 mb-2 w-full">
                <span
                  className="text-[12px] font-bold lowercase tracking-[0.25em] text-[#111111]/40 whitespace-nowrap"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  all subjects
                </span>
                <div className="flex-1 h-[1.5px] bg-[#111111]/10 rounded-full" />
              </div>

              {allMarks.map((sub: any) => (
                <div
                  key={sub.id}
                  className="w-full border-[1.5px] rounded-[24px] p-4 flex flex-col shadow-sm gap-4 transition-all bg-white border-[#111111]/10"
                >
                  <div className="flex justify-between items-center w-full">
                    <div className="flex flex-col items-center justify-center min-w-[85px] shrink-0 px-1">
                      <span
                        className="text-[3.2rem] leading-[0.8] font-black tracking-tighter text-[#111111]"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {Number.isInteger(sub.totalGot)
                          ? sub.totalGot
                          : sub.totalGot.toFixed(1)}
                      </span>
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest mt-1 text-center text-[#111111]/40"
                        style={{ fontFamily: "'Afacad', sans-serif" }}
                      >
                        out of {sub.totalMax}
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col items-end text-right min-w-0 ml-4">
                      <span
                        className="text-[16px] font-black uppercase tracking-widest leading-[1.1] truncate w-full text-[#111111]"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {sub.displayCode}
                      </span>
                      <span
                        className="text-[13px] font-medium lowercase tracking-wide leading-[1.1] mt-0.5 truncate w-full text-[#111111]/50"
                        style={{ fontFamily: "'Afacad', sans-serif" }}
                      >
                        {sub.displayName}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full mt-1 overflow-x-auto no-scrollbar pb-1">
                    {sub.assessments.slice(-3).map((box: any, idx: number) => {
                      const boxTheme = getBoxTheme(box.got, box.max);
                      return (
                        <div
                          key={idx}
                          className={`min-w-[65px] flex-1 rounded-[12px] p-2 flex flex-col items-center justify-center border-[1px] ${boxTheme.boxBg} ${boxTheme.border}`}
                        >
                          <span
                            className={`text-[12px] font-bold uppercase tracking-widest mb-0.5 ${boxTheme.subText}`}
                            style={{ fontFamily: "'Afacad', sans-serif" }}
                          >
                            {box.title}
                          </span>
                          <div className="flex items-baseline justify-center gap-0.5 w-full">
                            <span
                              className={`text-[18px] font-black leading-none tracking-tighter ${boxTheme.text}`}
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
                        key={`empty-${idx}`}
                        className="min-w-[65px] flex-1 rounded-[12px] p-2 flex flex-col items-center justify-center border-[1px] opacity-40 bg-[#F7F7F7] border-[#111111]/5"
                      >
                        <span
                          className="text-[12px] font-bold uppercase tracking-widest mb-0.5 text-[#111111]/50"
                          style={{ fontFamily: "'Afacad', sans-serif" }}
                        >
                          --
                        </span>
                        <div className="flex items-baseline justify-center gap-0.5 w-full">
                          <span
                            className="text-[18px] font-black leading-none tracking-tighter text-[#111111]/50"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            -
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#F7F7F7] via-[#F7F7F7] to-transparent px-6 pt-24 pb-[30px] z-20 flex justify-between items-end pointer-events-none">
          {"marks".split("").map((char, i) => (
            <span
              key={i}
              className="text-[3.2rem] leading-[0.75] lowercase text-[#111111]"
              style={{ fontFamily: "'Afacad', sans-serif", fontWeight: 400 }}
            >
              {char}
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {predictMode && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.8 }}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                setPredictMode(false);
              }
            }}
            className="fixed inset-0 bg-[#111111] z-[60] flex flex-col px-6 pt-10 pb-6 overflow-hidden"
          >
            <div className="flex justify-between items-start w-full shrink-0">
              <div className="flex flex-col">
                <span
                  className="text-[32px] leading-[1] font-black uppercase tracking-[0.15em] text-white"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  TARGET
                </span>
                <span
                  className="text-[10px] font-bold lowercase tracking-[0.2em] text-white/40 mt-1.5"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  predict grade
                </span>
              </div>
              <button
                onClick={() => setPredictMode(false)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-95 transition-all shrink-0"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex flex-col flex-1 justify-between mt-5 w-full">
              <div className="w-full bg-white/5 border border-white/10 rounded-[16px] px-4 py-3.5 flex items-center gap-3 shrink-0">
                <span
                  className="text-[16px] font-black uppercase tracking-widest text-white/90 shrink-0"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {activePredSub.displayCode}
                </span>
                <div className="w-[1.5px] h-4 bg-white/20 shrink-0" />
                <span
                  className="text-[13px] font-medium lowercase tracking-wide text-white/60 truncate min-w-0"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  {activePredSub.displayName}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center shrink-0">
                <span
                  className="text-[11px] font-bold lowercase tracking-[0.2em] text-white/40 mb-1"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  predicted gpa
                </span>
                <span
                  className={`text-[4.5rem] leading-[0.9] font-black tracking-tighter transition-colors duration-300 ${gpaColor}`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {predictedGpa}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center shrink-0">
                <span
                  className="text-[11px] font-bold lowercase tracking-widest text-white/40 mb-1"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  sem marks needed
                </span>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`leading-[0.85] font-black tracking-tighter text-center ${semRequired > 40 ? "text-[4rem] text-[#FF4D4D]" : "text-[5rem] text-[#ceff1c]"}`}
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {semRequired > 40
                      ? "cooked."
                      : semRequired <= 0
                        ? "0"
                        : semRequired}
                  </span>
                  {semRequired > 0 && semRequired <= 40 && (
                    <span
                      className="text-[20px] font-bold text-white/30"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      /40
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-end w-full px-2 shrink-0">
                <div className="flex flex-col items-start w-1/2">
                  <span
                    className="text-[11px] font-bold lowercase tracking-widest text-white/50 mb-1.5"
                    style={{ fontFamily: "'Afacad', sans-serif" }}
                  >
                    current internals
                  </span>
                  <div className="flex items-baseline gap-1 h-9">
                    <span
                      className="text-[2rem] leading-[1] font-black text-white"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {Number.isInteger(currentInternals)
                        ? currentInternals
                        : currentInternals.toFixed(1)}
                    </span>
                    <span
                      className="text-[12px] font-bold text-white/40"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      /60
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end w-1/2">
                  <span
                    className="text-[11px] font-bold lowercase tracking-widest text-white/50 mb-1.5 text-right"
                    style={{ fontFamily: "'Afacad', sans-serif" }}
                  >
                    expected remaining
                  </span>
                  <div className="flex items-center gap-1 bg-white/10 rounded-[12px] px-1.5 py-1.5 h-10">
                    <button
                      onClick={() =>
                        setExpectedMarks(Math.max(0, expectedMarks - 1))
                      }
                      className="w-7 h-7 rounded-[8px] bg-white/10 flex items-center justify-center text-white font-bold active:scale-95 transition-all"
                    >
                      -
                    </button>
                    <div className="flex items-center justify-center w-8">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={expectedMarks === 0 ? "" : expectedMarks}
                        onChange={handleExpectedChange}
                        placeholder="0"
                        className="w-full bg-transparent text-[18px] font-black text-white text-center outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [appearance:textfield] placeholder:text-white/30"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      />
                    </div>
                    <button
                      onClick={() =>
                        setExpectedMarks(
                          Math.min(maxPossibleExpected, expectedMarks + 1),
                        )
                      }
                      className="w-7 h-7 rounded-[8px] bg-white text-[#111111] flex items-center justify-center font-bold active:scale-95 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col w-full shrink-0 mt-2">
                <span
                  className="text-[10px] font-bold lowercase tracking-[0.2em] text-white/50 mb-2 px-2"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  target grade
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {grades.map((g) => (
                    <button
                      key={g.label}
                      onClick={() => setTargetGrade(g.min)}
                      className={`py-3 rounded-[16px] flex flex-col items-center justify-center transition-all ${
                        targetGrade === g.min
                          ? "bg-[#ceff1c] text-[#111111]"
                          : "bg-white/10 text-white/60 hover:bg-white/20"
                      }`}
                    >
                      <span
                        className="text-[18px] font-black"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {g.label}
                      </span>
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest mt-0.5"
                        style={{ fontFamily: "'Afacad', sans-serif" }}
                      >
                        {g.min}+
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col w-full overflow-hidden mt-2 pb-2">
                <span
                  className="text-[10px] font-bold lowercase tracking-[0.2em] text-white/50 mb-2 px-2"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  select subject
                </span>
                <div
                  className="flex gap-2 overflow-x-auto no-scrollbar w-full px-2"
                  onPointerDownCapture={(e) => e.stopPropagation()}
                >
                  {subjects.map((sub: any) => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setPredSubjectId(sub.id);
                        setExpectedMarks(0);
                      }}
                      className={`px-4 py-2.5 rounded-[12px] text-[12px] font-bold uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${
                        predSubjectId === sub.id
                          ? "bg-white text-[#111111]"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                      style={{ fontFamily: "'Afacad', sans-serif" }}
                    >
                      {sub.displayCode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
