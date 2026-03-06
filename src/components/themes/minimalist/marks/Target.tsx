"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";

interface TargetProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  activePredSub: any;
  predictedGpa: string;
  gpaColor: string;
  semRequiredOutOf75: number;
  currentInternals: number;
  expectedMarks: number;
  maxPossibleExpected: number;
  handleExpectedChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setExpectedMarks: (val: number | ((prev: number) => number)) => void;
  targetGrade: number;
  setTargetGrade: (val: number) => void;
  grades: { label: string; min: number }[];
  subjects: any[];
  predSubjectId: number | null;
  setPredSubjectId: (id: number | null) => void;
  textClass: string;
}

export default function Target({
  isOpen,
  onClose,
  isDark,
  activePredSub,
  predictedGpa,
  gpaColor,
  semRequiredOutOf75,
  currentInternals,
  expectedMarks,
  maxPossibleExpected,
  handleExpectedChange,
  setExpectedMarks,
  targetGrade,
  setTargetGrade,
  grades,
  subjects,
  predSubjectId,
  setPredSubjectId,
  textClass,
}: TargetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 500 }}
          dragElastic={{ top: 0, bottom: 0.8 }}
          onDragEnd={(e, info) => {
            if (info.offset.y > 100 || info.velocity.y > 500) onClose();
          }}
          className={`fixed inset-0 ${isDark ? "bg-[#111111]" : "bg-white"} z-[60] flex flex-col overflow-hidden px-6 pt-10 pb-6`}
        >
          <div
            className={`w-12 h-1.5 ${isDark ? "bg-white/20" : "bg-black/10"} rounded-full mx-auto mb-6 shrink-0`}
          />
          <div className="flex justify-between items-start w-full shrink-0">
            <div className="flex flex-col">
              <span
                className={`text-[32px] leading-[1] font-black uppercase tracking-[0.15em] ${textClass}`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                TARGET
              </span>
              <span
                className="text-[10px] font-bold lowercase tracking-[0.2em] text-[#85a818] mt-1.5"
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                gpa prediction
              </span>
            </div>
            <button
              onClick={onClose}
              className={`w-10 h-10 rounded-full ${isDark ? "bg-white/10" : "bg-[#111111]/5"} flex items-center justify-center ${textClass} active:scale-95 transition-all shrink-0`}
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
          <div className="flex flex-col flex-1 justify-between mt-5 w-full overflow-y-auto no-scrollbar pb-4">
            <div
              className={`w-full ${isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-[16px] px-4 py-3.5 flex items-center gap-3 shrink-0`}
            >
              <span
                className={`text-[16px] font-black uppercase tracking-widest ${isDark ? "text-white/90" : "text-[#111111]"} shrink-0`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {activePredSub.displayCode}
              </span>
              <div
                className={`w-[1.5px] h-4 ${isDark ? "bg-white/20" : "bg-black/20"} shrink-0`}
              />
              <span
                className={`text-[13px] font-medium lowercase tracking-wide ${isDark ? "text-white/60" : "text-black/60"} truncate min-w-0`}
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                {activePredSub.displayName}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center shrink-0">
              <span
                className={`text-[11px] font-bold lowercase tracking-[0.2em] ${isDark ? "text-white/40" : "text-black/40"} mb-1`}
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
                className={`text-[11px] font-bold lowercase tracking-widest ${isDark ? "text-white/40" : "text-black/40"} mb-1`}
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                sem marks needed
              </span>
              <div className="flex items-baseline gap-1">
                <span
                  className={`leading-[0.85] font-black tracking-tighter text-center ${semRequiredOutOf75 > 75 ? "text-[4rem] text-[#FF4D4D]" : "text-[5rem] text-[#85a818]"}`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {semRequiredOutOf75 > 75
                    ? "cooked."
                    : semRequiredOutOf75 <= 0
                      ? "0"
                      : semRequiredOutOf75}
                </span>
                {semRequiredOutOf75 > 0 && semRequiredOutOf75 <= 75 && (
                  <span
                    className={`text-[20px] font-bold ${isDark ? "text-white/30" : "text-black/30"}`}
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    /75
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-start w-full px-2 shrink-0">
              <div className="flex flex-col items-start w-1/2">
                <span
                  className={`text-[11px] font-bold lowercase tracking-widest ${isDark ? "text-white/50" : "text-black/50"} mb-1.5`}
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  current internals
                </span>
                <div className="flex items-baseline gap-1 h-10">
                  <span
                    className={`text-[2rem] leading-[1] font-black ${textClass}`}
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {Number.isInteger(currentInternals)
                      ? currentInternals
                      : currentInternals.toFixed(1)}
                  </span>
                  <span
                    className={`text-[12px] font-bold ${isDark ? "text-white/40" : "text-black/40"}`}
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    /60
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end w-1/2">
                <span
                  className={`text-[11px] font-bold lowercase tracking-widest ${isDark ? "text-white/50" : "text-black/50"} mb-1.5 text-right`}
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  expected remaining
                </span>
                <div
                  className={`flex items-center gap-1 ${isDark ? "bg-white/10" : "bg-black/10"} rounded-[12px] px-1.5 py-1.5 h-10`}
                >
                  <button
                    onClick={() =>
                      setExpectedMarks(Math.max(0, expectedMarks - 1))
                    }
                    className={`w-7 h-7 rounded-[8px] ${isDark ? "bg-white/10" : "bg-black/10"} flex items-center justify-center ${textClass} font-bold active:scale-95 transition-all`}
                  >
                    -
                  </button>
                  <div className="flex items-baseline justify-center gap-0.5 min-w-[40px] px-1">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={expectedMarks === 0 ? "" : expectedMarks}
                      onChange={handleExpectedChange}
                      placeholder="0"
                      className={`w-6 bg-transparent text-[18px] font-black ${textClass} text-center outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [appearance:textfield] placeholder:${isDark ? "text-white/30" : "text-black/30"}`}
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    />
                    <span
                      className={`text-[11px] font-bold ${isDark ? "text-white/30" : "text-black/30"}`}
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      /{maxPossibleExpected}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setExpectedMarks(
                        Math.min(maxPossibleExpected, expectedMarks + 1),
                      )
                    }
                    className={`w-7 h-7 rounded-[8px] ${isDark ? "bg-white text-black" : "bg-black text-white"} flex items-center justify-center font-bold active:scale-95 transition-all`}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-col w-full shrink-0 mt-2">
              <span
                className={`text-[10px] font-bold lowercase tracking-[0.2em] ${isDark ? "text-white/50" : "text-black/50"} mb-2 px-2`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                target grade
              </span>
              <div className="grid grid-cols-3 gap-2">
                {grades.map((g) => (
                  <button
                    key={g.label}
                    onClick={() => setTargetGrade(g.min)}
                    className={`py-3 rounded-[16px] flex flex-col items-center justify-center transition-all ${targetGrade === g.min ? (isDark ? "bg-white text-black" : "bg-black text-white") : isDark ? "bg-white/10 text-white/60 hover:bg-white/20" : "bg-black/10 text-black/60 hover:bg-black/20"}`}
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
            <div className="flex flex-col w-full shrink-0 mt-2 pb-2">
              <span
                className={`text-[10px] font-bold lowercase tracking-[0.2em] ${isDark ? "text-white/50" : "text-black/50"} mb-2 px-2`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                select subject
              </span>
              <div className="flex gap-2 overflow-x-auto no-scrollbar w-full px-2">
                {subjects.map((sub: any) => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setPredSubjectId(sub.id);
                      setExpectedMarks(0);
                    }}
                    className={`px-4 py-2.5 rounded-[12px] text-[12px] font-bold uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${predSubjectId === sub.id ? "bg-[#85a818] text-white" : isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"}`}
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
  );
}
