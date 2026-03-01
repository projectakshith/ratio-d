"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Star, X } from "lucide-react";

export default function MinimalMarks() {
  const [mounted, setMounted] = useState(false);
  const [predictMode, setPredictMode] = useState(false);
  const [predSubjectId, setPredSubjectId] = useState<number>(1);
  const [expectedMarks, setExpectedMarks] = useState<number>(0);
  const [targetGrade, setTargetGrade] = useState<number>(91);

  useEffect(() => {
    setMounted(true);
  }, []);

  const subjects = [
    {
      id: 1,
      code: "dtm",
      name: "discrete transforms",
      ft1: 12,
      ft2: null,
      other: 24,
      recent: "ft1 updated",
    },
    {
      id: 2,
      code: "oops",
      name: "object oriented prog",
      ft1: 14,
      ft2: 13,
      other: 28,
      recent: "ft2 updated",
    },
    {
      id: 3,
      code: "ml",
      name: "machine learning",
      ft1: 10,
      ft2: 11,
      other: 25,
      recent: null,
    },
    {
      id: 4,
      code: "dsa",
      name: "data structures",
      ft1: 15,
      ft2: null,
      other: 22,
      recent: null,
    },
    {
      id: 5,
      code: "os",
      name: "operating systems",
      ft1: 6,
      ft2: 7,
      other: 12,
      recent: null,
    },
    {
      id: 6,
      code: "dbms",
      name: "database systems",
      ft1: 10,
      ft2: 8,
      other: 18,
      recent: null,
    },
  ];

  const getInternalTotal = (sub: any) =>
    (sub.ft1 || 0) + (sub.ft2 || 0) + (sub.other || 0);

  const getMarkColor = (mark: number | null, max: number) => {
    if (mark === null || mark === undefined) return "text-[#111111]/20";
    const ratio = mark / max;
    if (ratio >= 0.75) return "text-[#111111]";
    if (ratio >= 0.5) return "text-[#F97316]";
    return "text-[#FF4D4D]";
  };

  const handleExpectedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 0;
    setExpectedMarks(Math.min(maxPossibleExpected, Math.max(0, val)));
  };

  const recentlyUpdated = subjects.filter((s) => s.recent);
  const allMarks = subjects.filter((s) => !s.recent);

  const totalObtained = subjects.reduce(
    (sum, sub) => sum + getInternalTotal(sub),
    0,
  );
  const maxTotal = subjects.length * 60;

  const activePredSub =
    subjects.find((s) => s.id === predSubjectId) || subjects[0];
  const currentInternals = getInternalTotal(activePredSub);
  const maxPossibleExpected = 60 - currentInternals;
  const projectedInternals = currentInternals + expectedMarks;
  const semRequired = targetGrade - projectedInternals;

  const grades = [
    { label: "O", min: 91 },
    { label: "A+", min: 81 },
    { label: "A", min: 71 },
    { label: "B+", min: 61 },
  ];

  const baseGpa = 8.74;
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

  if (!mounted) return null;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700;800;900&display=swap');

          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

          .recent-dotted {
            background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='24' stroke='%23111111' stroke-width='3' stroke-dasharray='6%2c 10' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e");
            border-radius: 24px;
          }
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
              className="text-[12px] font-bold lowercase tracking-[0.3em] text-[#111111]/40 mb-3"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              total marks
            </span>
            <div className="flex items-baseline gap-1">
              <span
                className="text-[7.5rem] leading-[0.8] font-black tracking-tighter text-[#111111]"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {totalObtained}
              </span>
              <span
                className="text-[2.5rem] font-bold text-[#111111]/40"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                /{maxTotal}
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
              className="w-full recent-dotted p-5 flex flex-col gap-4 mb-8 bg-white shrink-0"
            >
              <div className="flex items-center gap-3 w-full">
                <span
                  className="text-[12px] font-bold lowercase tracking-[0.25em] text-[#111111] whitespace-nowrap"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  recently updated
                </span>
                <div className="flex-1 h-[1.5px] bg-[#111111]/10 rounded-full" />
              </div>

              {recentlyUpdated.map((sub) => {
                const total = getInternalTotal(sub);
                return (
                  <div
                    key={sub.id}
                    className="w-full border-[1.5px] border-[#111111]/10 rounded-[24px] p-5 flex items-center justify-between bg-white shadow-sm transition-all"
                  >
                    <div className="flex flex-col items-center justify-center w-[70px] shrink-0">
                      <span
                        className={`text-[3.5rem] leading-[0.8] font-black tracking-tighter ${getMarkColor(total, 60)}`}
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {total}
                      </span>
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest mt-2 text-[#111111]/40"
                        style={{ fontFamily: "'Afacad', sans-serif" }}
                      >
                        out of 60
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col items-end text-right min-w-0 ml-4">
                      <span
                        className="text-[18px] font-black uppercase tracking-widest leading-none mb-0.5 truncate w-full text-[#111111]"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {sub.code}
                      </span>
                      <span
                        className="text-[14px] font-medium lowercase tracking-wide mb-3 truncate w-full text-[#111111]/50"
                        style={{ fontFamily: "'Afacad', sans-serif" }}
                      >
                        {sub.name}
                      </span>
                      <div className="bg-[#F7F7F7] border-[1px] border-[#111111]/10 px-3 py-1.5 rounded-full flex items-center justify-center">
                        <span
                          className="text-[9px] font-bold tracking-widest text-[#111111]/60 uppercase"
                          style={{ fontFamily: "'Afacad', sans-serif" }}
                        >
                          {sub.recent}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="w-full flex justify-center mt-1">
                <span
                  className="text-[11px] font-bold lowercase tracking-widest text-[#111111]/50"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  your gpa is in the trenches
                </span>
              </div>
            </motion.div>
          )}

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

            {allMarks.map((sub) => {
              const total = getInternalTotal(sub);
              return (
                <div
                  key={sub.id}
                  className="w-full border-[1.5px] border-[#111111]/10 rounded-[24px] p-5 flex flex-col bg-white shadow-sm gap-5 transition-all"
                >
                  <div className="flex justify-between items-center w-full">
                    <div className="flex flex-col items-center justify-center w-[70px] shrink-0">
                      <span
                        className={`text-[3.5rem] leading-[0.8] font-black tracking-tighter ${getMarkColor(total, 60)}`}
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {total}
                      </span>
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest mt-2 text-[#111111]/40"
                        style={{ fontFamily: "'Afacad', sans-serif" }}
                      >
                        out of 60
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col items-end text-right min-w-0 ml-4">
                      <span
                        className="text-[18px] font-black uppercase tracking-widest leading-none mb-0.5 truncate w-full text-[#111111]"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {sub.code}
                      </span>
                      <span
                        className="text-[14px] font-medium lowercase tracking-wide mb-1 truncate w-full text-[#111111]/50"
                        style={{ fontFamily: "'Afacad', sans-serif" }}
                      >
                        {sub.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full mt-1">
                    <div className="flex-1 bg-[#F7F7F7] rounded-[12px] p-2.5 flex flex-col items-center justify-center">
                      <span
                        className="text-[12px] font-bold uppercase tracking-widest text-[#111111]/50 mb-1"
                        style={{ fontFamily: "'Afacad', sans-serif" }}
                      >
                        ft1
                      </span>
                      <div className="flex items-baseline gap-0.5">
                        <span
                          className="text-[24px] font-black leading-none tracking-tighter text-[#111111]"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          {sub.ft1 ?? "-"}
                        </span>
                        <span
                          className="text-[11px] font-bold text-[#111111]/40"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          /15
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 bg-[#F7F7F7] rounded-[12px] p-2.5 flex flex-col items-center justify-center">
                      <span
                        className="text-[12px] font-bold uppercase tracking-widest text-[#111111]/50 mb-1"
                        style={{ fontFamily: "'Afacad', sans-serif" }}
                      >
                        ft2
                      </span>
                      <div className="flex items-baseline gap-0.5">
                        <span
                          className="text-[24px] font-black leading-none tracking-tighter text-[#111111]"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          {sub.ft2 ?? "-"}
                        </span>
                        <span
                          className="text-[11px] font-bold text-[#111111]/40"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          /15
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 bg-[#F7F7F7] rounded-[12px] p-2.5 flex flex-col items-center justify-center">
                      <span
                        className="text-[12px] font-bold uppercase tracking-widest text-[#111111]/50 mb-1"
                        style={{ fontFamily: "'Afacad', sans-serif" }}
                      >
                        oth
                      </span>
                      <div className="flex items-baseline gap-0.5">
                        <span
                          className="text-[24px] font-black leading-none tracking-tighter text-[#111111]"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          {sub.other ?? "-"}
                        </span>
                        <span
                          className="text-[11px] font-bold text-[#111111]/40"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          /30
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
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
                  {activePredSub.code}
                </span>
                <div className="w-[1.5px] h-4 bg-white/20 shrink-0" />
                <span
                  className="text-[13px] font-medium lowercase tracking-wide text-white/60 truncate min-w-0"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  {activePredSub.name}
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
                      {currentInternals}
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
                  {subjects.map((sub) => (
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
                      {sub.code}
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
