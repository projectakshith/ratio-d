"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Haptics } from "@/utils/shared/haptics";

interface TargetProps {
  isOpen: boolean;
  onClose: () => void;
  activePredSub: any;
  predictedGpa: string;
  gpaColor: string;
  semRequiredOutOfMax: number;
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
  ignoredSubjectIds: number[];
  toggleSubjectIgnore: (id: number) => void;
  textClass: string;
}

export default function Target({
  isOpen,
  onClose,
  activePredSub,
  predictedGpa,
  gpaColor,
  semRequiredOutOfMax,
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
  ignoredSubjectIds,
  toggleSubjectIgnore,
  textClass,
}: TargetProps) {
  const maxExternal = activePredSub.isPractical ? 40 : 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.6}
          onDragEnd={(e, info) => {
            if (info.offset.y > 150 || info.velocity.y > 500) {
              Haptics.medium();
              onClose();
            }
          }}
          className="fixed inset-0 bg-theme-bg z-[60] flex flex-col overflow-hidden px-6 pt-10 pb-6"
        >
          <div
            className="w-12 h-1.5 bg-theme-text-10 rounded-full mx-auto mb-6 shrink-0"
          />
          <div className="flex justify-between items-start w-full shrink-0">
            <div className="flex flex-col">
              <span
                className={`text-[32px] font-black uppercase tracking-[0.15em] ${textClass}`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                TARGET
              </span>
              <span
                className="text-[10px] font-bold lowercase tracking-[0.2em] text-theme-highlight mt-1.5"
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                sgpa prediction
              </span>
            </div>
            <button
              onClick={() => {
                Haptics.selection();
                onClose();
              }}
              className={`w-10 h-10 rounded-full bg-theme-surface flex items-center justify-center ${textClass} transition-all shrink-0`}
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
          <div className="flex flex-col flex-1 justify-between mt-5 w-full overflow-y-auto no-scrollbar pb-4">
            <div
              className="w-full bg-theme-surface border border-theme-subtle rounded-[16px] px-4 py-3.5 flex items-center gap-3 shrink-0"
            >
              <span
                className={`text-[16px] font-black uppercase tracking-widest ${textClass} shrink-0`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {activePredSub.displayCode}
              </span>
              <div
                className="w-[1.5px] h-4 bg-theme-text-20 shrink-0"
              />
              <span
                className="text-[13px] font-medium lowercase tracking-wide text-theme-muted truncate min-w-0"
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                {activePredSub.displayName}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center shrink-0">
              <span
                className="text-[11px] font-bold lowercase tracking-[0.2em] text-theme-muted mb-1"
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                predicted sgpa
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
                className="text-[11px] font-bold lowercase tracking-widest text-theme-muted mb-1"
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                sem marks needed
              </span>
              <div className="flex items-baseline gap-1">
                <span
                  className={`leading-[0.85] font-black tracking-tighter text-center ${semRequiredOutOfMax > maxExternal ? "text-[4rem] text-[#FF4D4D]" : "text-[5rem] text-theme-highlight"}`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {semRequiredOutOfMax > maxExternal
                    ? "cooked."
                    : semRequiredOutOfMax <= 0
                      ? "0"
                      : semRequiredOutOfMax}
                </span>
                {semRequiredOutOfMax > 0 && semRequiredOutOfMax <= maxExternal && (
                  <span
                    className="text-[20px] font-bold text-theme-subtle"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    /{maxExternal}
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-start w-full px-2 shrink-0">
              <div className="flex flex-col items-start w-1/2">
                <span
                  className="text-[11px] font-bold lowercase tracking-widest text-theme-muted mb-1.5"
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
                    className="text-[12px] font-bold text-theme-subtle"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    /{activePredSub.totalMax}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end w-1/2">
                <span
                  className="text-[11px] font-bold lowercase tracking-widest text-theme-muted mb-1.5 text-right"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  expected remaining
                </span>
                <div
                  className="flex items-center gap-1 bg-theme-surface rounded-[12px] px-1.5 py-1.5 h-10"
                >
                  <button
                    onClick={() => {
                      Haptics.selection();
                      setExpectedMarks((prev: any) => Math.max(0, (typeof prev === "function" ? prev(expectedMarks) : prev) - 1));
                    }}
                    className={`w-7 h-7 rounded-[8px] bg-theme-text-10 flex items-center justify-center ${textClass} font-bold transition-all`}
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
                      className={`w-6 bg-transparent text-[18px] font-black ${textClass} text-center outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [appearance:textfield] placeholder:text-theme-subtle`}
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    />
                    <span
                      className="text-[11px] font-bold text-theme-subtle"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      /{maxPossibleExpected}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      Haptics.selection();
                      setExpectedMarks((prev: any) => Math.min(maxPossibleExpected, (typeof prev === "function" ? prev(expectedMarks) : prev) + 1));
                    }}
                    className="w-7 h-7 rounded-[8px] bg-theme-emphasis text-theme-bg flex items-center justify-center font-bold transition-all"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-col w-full shrink-0 mt-2">
              <span
                className="text-[10px] font-bold lowercase tracking-[0.2em] text-theme-muted mb-2 px-2"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                target grade
              </span>
              <div className="grid grid-cols-3 gap-2">
                {grades.map((g) => (
                  <button
                    key={g.label}
                    onClick={() => {
                      Haptics.selection();
                      setTargetGrade(g.min);
                    }}
                    className={`py-3 rounded-[16px] flex flex-col items-center justify-center transition-all ${targetGrade === g.min ? "bg-theme-emphasis text-theme-bg" : "bg-theme-surface text-theme-muted hover:bg-theme-text-10"}`}
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
                className="text-[10px] font-bold lowercase tracking-[0.2em] text-theme-muted mb-2 px-2"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                select subject
              </span>
              <div className="flex gap-2 overflow-x-auto no-scrollbar w-full px-2">
                {subjects.map((sub: any) => {
                  const isIgnored = ignoredSubjectIds.includes(sub.id);
                  const isActive = predSubjectId === sub.id;
                  
                  return (
                    <div key={sub.id} className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => {
                          Haptics.selection();
                          setPredSubjectId(sub.id);
                          setExpectedMarks(0);
                        }}
                        className={`px-4 py-2.5 rounded-[12px] text-[12px] font-bold uppercase tracking-widest transition-all whitespace-nowrap flex flex-col items-center gap-0.5 ${isIgnored ? "opacity-40 grayscale" : ""} ${isActive ? "bg-theme-highlight text-theme-bg" : "bg-theme-surface text-theme-text hover:bg-theme-text-10"}`}
                        style={{ fontFamily: "'Afacad', sans-serif" }}
                      >
                        <span>{sub.displayCode}</span>
                        <span className={`text-[9px] ${isActive ? "opacity-100 font-black" : "opacity-60 font-black"}`}>
                          {sub.credits} credits
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          Haptics.vibe(6);
                          toggleSubjectIgnore(sub.id);
                        }}
                        className={`text-[8px] font-black uppercase tracking-tighter py-1 rounded-md transition-all flex items-center justify-center gap-1.5 ${isIgnored ? "text-theme-muted bg-theme-text/5 px-2" : "text-theme-highlight bg-theme-highlight/10 px-3"}`}
                      >
                        <div className={`w-1 h-1 rounded-full ${isIgnored ? "bg-theme-muted" : "bg-theme-highlight animate-pulse"}`} />
                        {isIgnored ? "enable" : "disable"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
