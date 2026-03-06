"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";

interface PredictProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  predictAction: "leave" | "attend";
  setPredictAction: (action: "leave" | "attend") => void;
  calYear: number;
  calMonth: number;
  monthName: string;
  setCurrentCalDate: (date: Date) => void;
  startOffset: number;
  daysInMonth: number;
  formatDate: (y: number, m: number, d: number) => string;
  isWeekendStr: (dateStr: string) => boolean;
  holidayMap: Map<string, boolean>;
  isRangeMode: boolean;
  setIsRangeMode: (val: boolean) => void;
  rangeStart: string | null;
  setRangeStart(val: string | null): void;
  setRangeEnd(val: string | null): void;
  selectedDates: string[];
  setSelectedDates: (dates: string[] | ((prev: string[]) => string[])) => void;
  handleDateClick: (day: number) => void;
  setIsPredicting: (val: boolean) => void;
}

export default function Predict({
  isOpen,
  onClose,
  isDark,
  predictAction,
  setPredictAction,
  calYear,
  calMonth,
  monthName,
  setCurrentCalDate,
  startOffset,
  daysInMonth,
  formatDate,
  isWeekendStr,
  holidayMap,
  isRangeMode,
  setIsRangeMode,
  rangeStart,
  setRangeStart,
  setRangeEnd,
  selectedDates,
  setSelectedDates,
  handleDateClick,
  setIsPredicting,
}: PredictProps) {
  const textClass = isDark ? "text-white" : "text-[#111111]";

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
            if (info.offset.y > 150 || info.velocity.y > 500) onClose();
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
                PREDICT
              </span>
              <span
                className="text-[10px] font-bold lowercase tracking-[0.2em] text-[#85a818] mt-1.5"
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                {predictAction === "leave"
                  ? "plan your leaves"
                  : "plan your presence"}
              </span>
            </div>
            <button
              onClick={onClose}
              className={`w-10 h-10 rounded-full ${isDark ? "bg-white/10" : "bg-[#111111]/5"} flex items-center justify-center ${textClass} active:scale-95 transition-all shrink-0`}
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
          <div className="flex flex-col flex-1 justify-center w-full mt-6">
            <div
              className={`flex items-center gap-2 ${isDark ? "bg-white/5" : "bg-black/5"} p-1 rounded-[16px] mb-3 shrink-0`}
            >
              <button
                onClick={() => setPredictAction("leave")}
                className={`flex-1 py-2.5 rounded-[12px] text-[11px] font-bold uppercase transition-all ${predictAction === "leave" ? "bg-[#ceff1c] text-[#111111]" : isDark ? "text-white/50" : "text-black/50"}`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                leaves
              </button>
              <button
                onClick={() => setPredictAction("attend")}
                className={`flex-1 py-2.5 rounded-[12px] text-[11px] font-bold uppercase transition-all ${predictAction === "attend" ? "bg-[#ceff1c] text-[#111111]" : isDark ? "text-white/50" : "text-black/50"}`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                attending
              </button>
            </div>
            <div className="w-full flex justify-between items-center mb-6 shrink-0">
              <button
                onClick={() =>
                  setCurrentCalDate(new Date(calYear, calMonth - 1, 1))
                }
                className={`w-10 h-10 ${isDark ? "bg-white/5" : "bg-black/5"} rounded-full flex items-center justify-center ${textClass}`}
              >
                <ChevronLeft />
              </button>
              <span
                className={`text-[16px] font-black uppercase ${textClass}`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {monthName} {calYear}
              </span>
              <button
                onClick={() =>
                  setCurrentCalDate(new Date(calYear, calMonth + 1, 1))
                }
                className={`w-10 h-10 ${isDark ? "bg-white/5" : "bg-black/5"} rounded-full flex items-center justify-center ${textClass}`}
              >
                <ChevronRight />
              </button>
            </div>
            <div
              className={`w-full flex flex-col ${isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-[24px] p-5 mb-4 shrink-0`}
            >
              <div className="grid grid-cols-7 gap-2 mb-3">
                {["m", "t", "w", "t", "f", "s", "s"].map((d, i) => (
                  <div
                    key={i}
                    className={`text-center text-[11px] font-bold ${isDark ? "text-white/40" : "text-black/40"} uppercase`}
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: startOffset }).map((_, i) => (
                  <div key={i} className="aspect-square" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateObj = new Date(calYear, calMonth, day);
                  const dStr = formatDate(calYear, calMonth, day);
                  const now = new Date();
                  now.setHours(0, 0, 0, 0);
                  const isPast = dateObj < now;
                  const isToday = dateObj.getTime() === now.getTime();
                  const isWeekend = isWeekendStr(dStr);
                  const isHoliday = holidayMap.has(dStr);
                  const isDisabled = isWeekend || isHoliday || isPast;
                  const selected =
                    (isRangeMode && rangeStart === dStr) ||
                    selectedDates.includes(dStr);
                  return (
                    <div
                      key={day}
                      className="relative aspect-square flex flex-col items-center justify-center"
                    >
                      <button
                        onClick={() => handleDateClick(day)}
                        disabled={isDisabled}
                        className={`w-full h-full rounded-[12px] flex items-center justify-center text-[15px] font-black transition-all ${isDisabled ? (isDark ? "text-white/10" : "text-black/10") : selected ? "bg-[#ceff1c] text-[#111111] shadow-lg" : isToday ? (isDark ? "bg-[#0EA5E9]/20 text-[#0EA5E9] border border-[#0EA5E9]/40" : "bg-[#0EA5E9]/10 text-[#0EA5E9] border border-[#0EA5E9]/30") : isDark ? "bg-white/10 text-white" : "bg-black/10 text-black"}`}
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {day}
                      </button>
                      {isToday && !selected && (
                        <div className="absolute -top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#0EA5E9]" />
                      )}
                      {isHoliday && !isWeekend && (
                        <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#FF4D4D]" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div
              className={`flex items-center gap-2 shrink-0 ${isDark ? "bg-white/5" : "bg-black/5"} p-1 rounded-[16px]`}
            >
              <button
                onClick={() => {
                  setIsRangeMode(false);
                  setRangeStart(null);
                  setRangeEnd(null);
                  setSelectedDates([]);
                }}
                className={`flex-1 py-2.5 rounded-[12px] text-[10px] font-bold uppercase tracking-widest transition-all ${!isRangeMode ? (isDark ? "bg-white/20 text-white" : "bg-black/20 text-black") : isDark ? "bg-transparent text-white/40" : "bg-transparent text-black/40"}`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Single Day
              </button>
              <button
                onClick={() => {
                  setIsRangeMode(true);
                  setSelectedDates([]);
                }}
                className={`flex-1 py-2.5 rounded-[12px] text-[10px] font-bold uppercase tracking-widest transition-all ${isRangeMode ? (isDark ? "bg-white/20 text-white" : "bg-black/20 text-black") : isDark ? "bg-transparent text-white/40" : "bg-transparent text-black/40"}`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Date Range
              </button>
            </div>
          </div>
          <div
            className={`w-full flex justify-between items-center ${isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} p-4 border rounded-[24px] shrink-0 mt-auto`}
          >
            <div className="flex flex-col ml-2">
              <span
                className={`text-[12px] font-bold lowercase tracking-widest ${isDark ? "text-white/50" : "text-black/50"} mb-0.5`}
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                total days
              </span>
              <span
                className={`text-[28px] font-black ${textClass}`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {selectedDates.length}
              </span>
            </div>
            <button
              onClick={() => {
                setIsPredicting(true);
                onClose();
              }}
              className="bg-[#ceff1c] text-[#111111] px-8 py-4 rounded-[16px] flex items-center gap-3 active:scale-95 shadow-xl transition-all"
            >
              <span
                className="text-[14px] font-black uppercase"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                confirm
              </span>
              <Check size={20} strokeWidth={3} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
