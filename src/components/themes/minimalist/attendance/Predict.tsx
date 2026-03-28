"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Haptics } from "@/utils/shared/haptics";

interface PredictProps {
  isOpen: boolean;
  onClose: () => void;
  predictAction: "leave" | "attend" | "od";
  setPredictAction: (action: "leave" | "attend" | "od") => void;
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
  selectedDates: Record<string, "leave" | "attend" | "od">;
  setSelectedDates: React.Dispatch<React.SetStateAction<Record<string, "leave" | "attend" | "od">>>;
  handleDateClick: (day: number) => void;
  setIsPredicting: (val: boolean) => void;
}

export default function Predict({
  isOpen,
  onClose,
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
          className="fixed inset-0 bg-theme-bg z-[60] flex flex-col overflow-hidden px-6 pt-10 pb-6"
        >
          <div
            className="w-12 h-1.5 bg-theme-text-10 rounded-full mx-auto mb-6 shrink-0"
          />
          <div className="flex justify-between items-start w-full shrink-0">
            <div className="flex flex-col">
              <span
                className="text-[32px] leading-[1] font-black uppercase tracking-[0.15em] text-theme-text"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                PREDICT
              </span>
              <span
                className="text-[10px] font-bold lowercase tracking-[0.2em] text-theme-highlight mt-1.5"
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                {predictAction === "leave"
                  ? "plan your leaves"
                  : predictAction === "attend" 
                  ? "plan your presence"
                  : "plan your od/ml"}
              </span>
            </div>
            <button
              onClick={() => { Haptics.selection(); onClose(); }}
              className="w-10 h-10 rounded-full bg-theme-surface flex items-center justify-center text-theme-text transition-all shrink-0"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
          <div className="flex flex-col flex-1 justify-center w-full mt-6">
            <div
              className="flex items-center gap-2 bg-theme-surface p-1 rounded-[16px] mb-3 shrink-0"
            >
              <button
                onClick={() => { Haptics.selection(); setPredictAction("leave"); }}
                className={`flex-1 py-2.5 rounded-[12px] text-[11px] font-bold uppercase transition-all ${predictAction === "leave" ? "bg-[#FF4D4D] text-white" : "text-theme-muted"}`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                leaves
              </button>
              <button
                onClick={() => { Haptics.selection(); setPredictAction("attend"); }}
                className={`flex-1 py-2.5 rounded-[12px] text-[11px] font-bold uppercase transition-all ${predictAction === "attend" ? "bg-theme-highlight text-theme-text" : "text-theme-muted"}`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                attending
              </button>
              <button
                onClick={() => { Haptics.selection(); setPredictAction("od"); }}
                className={`flex-1 py-2.5 rounded-[12px] text-[11px] font-bold uppercase transition-all ${predictAction === "od" ? "bg-[#F97316] text-white" : "text-theme-muted"}`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                od/ml
              </button>
            </div>
            <div className="w-full flex justify-between items-center mb-6 shrink-0">
              <button
                onClick={() =>
                  setCurrentCalDate(new Date(calYear, calMonth - 1, 1))
                }
                className="w-10 h-10 bg-theme-surface rounded-full flex items-center justify-center text-theme-text"
              >
                <ChevronLeft />
              </button>
              <span
                className="text-[16px] font-black uppercase text-theme-text"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {monthName} {calYear}
              </span>
              <button
                onClick={() =>
                  setCurrentCalDate(new Date(calYear, calMonth + 1, 1))
                }
                className="w-10 h-10 bg-theme-surface rounded-full flex items-center justify-center text-theme-text"
              >
                <ChevronRight />
              </button>
            </div>
            <div
              className="w-full flex flex-col bg-theme-surface border border-theme-subtle rounded-[24px] p-5 mb-4 shrink-0"
            >
              <div className="grid grid-cols-7 gap-2 mb-3">
                {["m", "t", "w", "t", "f", "s", "s"].map((d, i) => (
                  <div
                    key={i}
                    className="text-center text-[11px] font-bold text-theme-muted uppercase"
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
                  const isDisabled = (isWeekend || isHoliday) || (isPast && predictAction !== "od");
                  
                  const selectedType = selectedDates[dStr];
                  const isSelected = !!selectedType;
                  
                  let cellStyle = "bg-theme-surface text-theme-text";
                  if (isSelected) {
                    if (selectedType === "leave") cellStyle = "bg-[#FF4D4D] text-white shadow-[#FF4D4D]/20";
                    else if (selectedType === "od") cellStyle = "bg-[#F97316] text-white shadow-[#F97316]/20";
                    else if (selectedType === "attend") cellStyle = "bg-theme-highlight text-theme-text shadow-theme-highlight/20";
                  } else if (isToday) {
                    cellStyle = "bg-[#0EA5E9]/10 text-[#0EA5E9] border border-[#0EA5E9]/30";
                  }

                  return (
                    <div
                      key={day}
                      className="relative aspect-square flex flex-col items-center justify-center"
                    >
                      <button
                        onClick={() => { Haptics.selection(); handleDateClick(day); }}
                        disabled={isDisabled}
                        className={`w-full h-full rounded-[12px] flex items-center justify-center text-[15px] font-black transition-all ${isDisabled ? "text-theme-subtle opacity-20" : cellStyle + " shadow-lg"}`}
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {day}
                      </button>
                      {isToday && !isSelected && (
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
              className="flex items-center gap-2 shrink-0 bg-theme-surface p-1 rounded-[16px]"
            >
              <button
                onClick={() => {
                  setIsRangeMode(false);
                  setRangeStart(null);
                  setRangeEnd(null);
                  setSelectedDates({});
                }}
                className={`flex-1 py-2.5 rounded-[12px] text-[10px] font-bold uppercase tracking-widest transition-all ${!isRangeMode ? "bg-theme-text-20 text-theme-text" : "text-theme-muted"}`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Single Day
              </button>
              <button
                onClick={() => {
                  setIsRangeMode(true);
                  setSelectedDates({});
                }}
                className={`flex-1 py-2.5 rounded-[12px] text-[10px] font-bold uppercase tracking-widest transition-all ${isRangeMode ? "bg-theme-text-20 text-theme-text" : "text-theme-muted"}`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Date Range
              </button>
            </div>
          </div>
          <div
              className="w-full flex justify-between items-center bg-theme-surface border border-theme-subtle p-4 rounded-[24px] shrink-0 mt-auto"
          >
            <div className="flex flex-col ml-2">
              <span
                className="text-[12px] font-bold lowercase tracking-widest text-theme-muted mb-0.5"
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                total days
              </span>
              <span
                className="text-[28px] font-black text-theme-text"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {Object.keys(selectedDates).length}
              </span>
            </div>
            <button
              onClick={() => {
                if (Object.keys(selectedDates).length > 0) {
                  setIsPredicting(true);
                  onClose();
                }
              }}
              className="bg-theme-highlight text-theme-text px-8 py-4 rounded-[16px] flex items-center gap-3 active:scale-95 shadow-xl transition-all"
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
