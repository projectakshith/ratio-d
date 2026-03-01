"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, X, ChevronLeft, ChevronRight, Check } from "lucide-react";

export default function MinimalAttendance() {
  const [mounted, setMounted] = useState(false);
  const [isPredictOverlay, setIsPredictOverlay] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [currentCalDate, setCurrentCalDate] = useState(new Date());

  useEffect(() => {
    setMounted(true);
  }, []);

  const baseSubjects = [
    {
      id: 1,
      code: "dtm",
      name: "discrete transforms",
      attended: 35,
      total: 41,
    },
    {
      id: 2,
      code: "oops",
      name: "object oriented prog",
      attended: 29,
      total: 39,
    },
    { id: 3, code: "ml", name: "machine learning", attended: 38, total: 42 },
    { id: 4, code: "dsa", name: "data structures", attended: 32, total: 41 },
    { id: 5, code: "os", name: "operating systems", attended: 29, total: 40 },
    { id: 6, code: "dbms", name: "database systems", attended: 34, total: 41 },
  ];

  // Calendar Utilities
  const calYear = currentCalDate.getFullYear();
  const calMonth = currentCalDate.getMonth();
  const monthName = currentCalDate.toLocaleString("en-US", { month: "long" });
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const formatDate = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const isWeekendStr = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.getDay() === 0 || date.getDay() === 6;
  };

  const getDatesBetween = (startStr: string, endStr: string) => {
    let start = new Date(
      startStr.split("-")[0] as any,
      Number(startStr.split("-")[1]) - 1,
      Number(startStr.split("-")[2]),
    );
    let end = new Date(
      endStr.split("-")[0] as any,
      Number(endStr.split("-")[1]) - 1,
      Number(endStr.split("-")[2]),
    );

    if (start > end) {
      const temp = start;
      start = end;
      end = temp;
    }

    const dates = [];
    let current = new Date(start);
    while (current <= end) {
      const dStr = formatDate(
        current.getFullYear(),
        current.getMonth(),
        current.getDate(),
      );
      if (!isWeekendStr(dStr)) {
        dates.push(dStr);
      }
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const handlePrevMonth = () => {
    setCurrentCalDate(new Date(calYear, calMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalDate(new Date(calYear, calMonth + 1, 1));
  };

  const toggleRangeMode = () => {
    setIsRangeMode(!isRangeMode);
    setRangeStart(null);
    setRangeEnd(null);
  };

  const handleDateClick = (day: number) => {
    const dStr = formatDate(calYear, calMonth, day);
    if (isWeekendStr(dStr)) return;

    if (!isRangeMode) {
      if (selectedDates.includes(dStr)) {
        setSelectedDates((prev) => prev.filter((d) => d !== dStr));
      } else {
        setSelectedDates((prev) => [...prev, dStr]);
      }
    } else {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(dStr);
        setRangeEnd(null);
        setSelectedDates((prev) => {
          if (!prev.includes(dStr)) return [...prev, dStr];
          return prev;
        });
      } else {
        setRangeEnd(dStr);
        const newDates = getDatesBetween(rangeStart, dStr);
        setSelectedDates((prev) => {
          const combined = new Set([...prev, ...newDates]);
          return Array.from(combined);
        });
      }
    }
  };

  const isDateSelected = (day: number) => {
    const dStr = formatDate(calYear, calMonth, day);
    if (isRangeMode && rangeStart === dStr && !rangeEnd) return true;
    return selectedDates.includes(dStr);
  };

  const confirmPrediction = () => {
    setIsPredicting(true);
    setIsPredictOverlay(false);
  };

  const cancelPrediction = () => {
    setIsPredicting(false);
    setSelectedDates([]);
    setRangeStart(null);
    setRangeEnd(null);
  };

  const missedClasses = isPredicting ? selectedDates.length : 0;

  const calculateStats = (attended: number, total: number) => {
    const target = 0.75;
    const percent = total === 0 ? 0 : (attended / total) * 100;
    const safe = percent >= 75;
    let marginVal = 0;

    if (safe) {
      marginVal = Math.floor((attended - target * total) / target);
    } else {
      marginVal = Math.ceil((target * total - attended) / (1 - target));
    }

    return {
      percent: percent.toFixed(1),
      safe,
      marginVal: Math.max(0, marginVal),
    };
  };

  const currentSubjects = baseSubjects.map((sub) => {
    const newTotal = sub.total + missedClasses;
    const stats = calculateStats(sub.attended, newTotal);
    return { ...sub, ...stats };
  });

  const lowAttendance = currentSubjects.filter((s) => !s.safe);
  const safeAttendance = currentSubjects.filter((s) => s.safe);

  const totalAttended = currentSubjects.reduce((sum, s) => sum + s.attended, 0);
  const totalClasses = currentSubjects.reduce(
    (sum, s) => sum + s.total + missedClasses,
    0,
  );
  const overallPercent =
    totalClasses === 0
      ? "0.0"
      : ((totalAttended / totalClasses) * 100).toFixed(1);

  if (!mounted) return null;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700;800;900&display=swap');

          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

          .warning-dotted {
            background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='24' stroke='%23FF4D4D' stroke-width='3' stroke-dasharray='6%2c 10' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e");
            border-radius: 24px;
          }
        `,
        }}
      />

      <div className="absolute inset-0 bg-[#F7F7F7]">
        <div className="h-full w-full overflow-y-auto no-scrollbar px-6 pt-10 pb-[180px] flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col items-center mt-2 mb-12 shrink-0"
          >
            <span
              className={`text-[12px] font-bold lowercase tracking-[0.3em] mb-3 transition-colors ${isPredicting ? "text-[#ceff1c]" : "text-[#111111]/40"}`}
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {isPredicting ? "predicted attendance" : "overall attendance"}
            </span>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-[7.5rem] leading-[0.8] font-black tracking-tighter transition-colors ${
                  parseFloat(overallPercent) >= 75
                    ? isPredicting
                      ? "text-[#ceff1c]"
                      : "text-[#111111]"
                    : "text-[#FF4D4D]"
                }`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {overallPercent}
              </span>
              <span
                className="text-[2.5rem] font-bold text-[#111111]/40"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                %
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col mb-8 w-full shrink-0"
          >
            {!isPredicting ? (
              <button
                onClick={() => setIsPredictOverlay(true)}
                className="w-full border-[1.5px] border-[#111111] rounded-[24px] p-4 flex items-center justify-between bg-white shadow-sm active:scale-95 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#111111]" />
                  <span
                    className="text-[14px] font-bold lowercase tracking-widest text-[#111111]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    predict leaves
                  </span>
                </div>
                <Calculator
                  size={20}
                  strokeWidth={2.5}
                  className="text-[#111111]"
                />
              </button>
            ) : (
              <div className="w-full bg-[#111111] rounded-[24px] p-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#ceff1c] animate-pulse shadow-[0_0_8px_rgba(206,255,28,0.8)]" />
                  <div className="flex flex-col">
                    <span
                      className="text-[12px] font-bold uppercase tracking-widest text-[#ceff1c] leading-none"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      predicting
                    </span>
                    <span
                      className="text-[10px] font-bold lowercase tracking-[0.2em] text-white/50 mt-1"
                      style={{ fontFamily: "'Afacad', sans-serif" }}
                    >
                      {selectedDates.length} days off
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPredictOverlay(true)}
                    className="px-3 py-1.5 bg-white/10 rounded-full text-[10px] font-bold text-white uppercase tracking-widest active:scale-95"
                    style={{ fontFamily: "'Afacad', sans-serif" }}
                  >
                    edit
                  </button>
                  <button
                    onClick={cancelPrediction}
                    className="w-8 h-8 bg-[#FF4D4D]/20 rounded-full flex items-center justify-center text-[#FF4D4D] active:scale-95 transition-all"
                  >
                    <X size={16} strokeWidth={3} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {lowAttendance.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="w-full warning-dotted p-5 flex flex-col gap-4 mb-8 bg-[#FFEDED]/30 shrink-0"
            >
              <div className="flex items-center gap-3 w-full">
                <span
                  className="text-[12px] font-bold lowercase tracking-[0.25em] text-[#FF4D4D] whitespace-nowrap"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  action required
                </span>
                <div className="flex-1 h-[1.5px] bg-[#FF4D4D]/20 rounded-full" />
              </div>

              {lowAttendance.map((sub) => (
                <div
                  key={sub.id}
                  className="w-full bg-white border-[1.5px] border-[#FF4D4D]/30 rounded-[18px] p-4 flex items-center justify-between shadow-sm transition-all"
                >
                  <div className="flex flex-col items-center justify-center w-[70px] shrink-0">
                    <span
                      className="text-[3.2rem] leading-[0.8] font-black tracking-tighter text-[#FF4D4D] text-center"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {sub.marginVal}
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest mt-1 text-[#FF4D4D]/70 text-center"
                      style={{ fontFamily: "'Afacad', sans-serif" }}
                    >
                      required
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col items-end text-right min-w-0 ml-4">
                    <span
                      className="text-[16px] font-black uppercase tracking-widest leading-[1.1] truncate w-full text-[#FF4D4D]"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {sub.code}
                    </span>
                    <span
                      className="text-[13px] font-medium lowercase tracking-wide leading-[1.1] mt-0.5 truncate w-full text-[#FF4D4D]/70"
                      style={{ fontFamily: "'Afacad', sans-serif" }}
                    >
                      {sub.name}
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="text-[12px] font-bold tracking-widest text-[#FF4D4D]/70"
                        style={{ fontFamily: "'Afacad', sans-serif" }}
                      >
                        {sub.attended}/{sub.total + missedClasses}
                      </span>
                      <div className="w-[3px] h-[3px] rounded-full bg-[#FF4D4D]/40" />
                      <span
                        className="text-[16px] font-black tracking-tighter text-[#FF4D4D]"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {sub.percent}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="w-full flex justify-center mt-2">
                <span
                  className="text-[11px] font-bold lowercase tracking-widest text-[#FF4D4D]/60"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  blud is donating tution fees
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
                safe subjects
              </span>
              <div className="flex-1 h-[1.5px] bg-[#111111]/10 rounded-full" />
            </div>

            {safeAttendance.map((sub) => (
              <div
                key={sub.id}
                className="w-full border-[1.5px] rounded-[24px] p-5 flex items-center justify-between bg-white shadow-sm border-[#111111]/10 transition-all"
              >
                <div className="flex flex-col items-center justify-center w-[70px] shrink-0">
                  <span
                    className="text-[3.2rem] leading-[0.8] font-black tracking-tighter text-[#111111] text-center"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {sub.marginVal}
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest mt-1 text-[#111111]/40 text-center"
                    style={{ fontFamily: "'Afacad', sans-serif" }}
                  >
                    margin
                  </span>
                </div>

                <div className="flex-1 flex flex-col items-end text-right min-w-0 ml-4">
                  <span
                    className="text-[16px] font-black uppercase tracking-widest leading-[1.1] truncate w-full text-[#111111]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {sub.code}
                  </span>
                  <span
                    className="text-[13px] font-medium lowercase tracking-wide leading-[1.1] mt-0.5 truncate w-full text-[#111111]/50"
                    style={{ fontFamily: "'Afacad', sans-serif" }}
                  >
                    {sub.name}
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="text-[12px] font-bold tracking-widest text-[#111111]/40"
                      style={{ fontFamily: "'Afacad', sans-serif" }}
                    >
                      {sub.attended}/{sub.total + missedClasses}
                    </span>
                    <div className="w-[3px] h-[3px] rounded-full bg-[#111111]/20" />
                    <span
                      className="text-[16px] font-black tracking-tighter text-[#111111]"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {sub.percent}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#F7F7F7] via-[#F7F7F7] to-transparent px-6 pt-24 pb-[30px] z-20 flex justify-between items-end pointer-events-none">
          {"attendance".split("").map((char, i) => (
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
        {isPredictOverlay && (
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
                setIsPredictOverlay(false);
              }
            }}
            className="fixed inset-0 bg-[#111111] z-[60] flex flex-col overflow-hidden px-6 pt-10 pb-6"
          >
            <div className="flex justify-between items-start w-full shrink-0">
              <div className="flex flex-col">
                <span
                  className="text-[32px] leading-[1] font-black uppercase tracking-[0.15em] text-white"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  PREDICT
                </span>
                <span
                  className="text-[10px] font-bold lowercase tracking-[0.2em] text-white/40 mt-1.5"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  plan your leaves
                </span>
              </div>
              <button
                onClick={() => setIsPredictOverlay(false)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-95 transition-all shrink-0"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex flex-col flex-1 justify-center w-full mt-6">
              <div className="w-full flex justify-between items-center mb-6">
                <button
                  onClick={handlePrevMonth}
                  className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white active:scale-95 transition-all"
                >
                  <ChevronLeft size={20} strokeWidth={2.5} />
                </button>
                <span
                  className="text-[16px] font-black uppercase tracking-widest text-white"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {monthName} {calYear}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white active:scale-95 transition-all"
                >
                  <ChevronRight size={20} strokeWidth={2.5} />
                </button>
              </div>

              <div className="w-full flex flex-col bg-white/5 border border-white/10 rounded-[24px] p-5 mb-6">
                <div className="w-full flex justify-between items-center mb-5 pb-4 border-b border-white/10">
                  <span
                    className="text-[11px] font-bold lowercase tracking-widest text-white/50"
                    style={{ fontFamily: "'Afacad', sans-serif" }}
                  >
                    select dates
                  </span>
                  <button
                    onClick={toggleRangeMode}
                    className="flex items-center gap-2.5 bg-white/5 px-3 py-1.5 rounded-full transition-all active:scale-95"
                  >
                    <span
                      className="text-[10px] font-bold lowercase tracking-widest text-white/60 transition-colors"
                      style={{ fontFamily: "'Afacad', sans-serif" }}
                    >
                      range select
                    </span>
                    <div
                      className={`w-3.5 h-3.5 rounded-full border-[1.5px] flex items-center justify-center transition-all ${isRangeMode ? "border-[#ceff1c] bg-[#ceff1c]/10" : "border-white/40"}`}
                    >
                      {isRangeMode && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#ceff1c]" />
                      )}
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-3">
                  {["m", "t", "w", "t", "f", "s", "s"].map((d, i) => (
                    <div
                      key={i}
                      className="text-center text-[11px] font-bold text-white/40 uppercase"
                      style={{ fontFamily: "'Afacad', sans-serif" }}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: startOffset }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dStr = formatDate(calYear, calMonth, day);
                    const weekend = isWeekendStr(dStr);
                    const selected = isDateSelected(day);

                    return (
                      <button
                        key={day}
                        onClick={() => handleDateClick(day)}
                        disabled={weekend}
                        className={`aspect-square rounded-[12px] flex items-center justify-center text-[15px] font-black transition-all
                          ${
                            weekend
                              ? "text-white/10 cursor-not-allowed"
                              : selected
                                ? "bg-[#ceff1c] text-[#111111] scale-105 shadow-[0_0_12px_rgba(206,255,28,0.3)]"
                                : "bg-white/10 text-white hover:bg-white/20"
                          }
                        `}
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="w-full flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-[24px] shrink-0 mt-auto">
              <div className="flex flex-col ml-2">
                <span
                  className="text-[12px] font-bold lowercase tracking-[0.2em] text-white/50 mb-0.5"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  total leaves
                </span>
                <span
                  className="text-[28px] leading-none font-black tracking-tighter text-white"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {selectedDates.length}
                </span>
              </div>
              <button
                onClick={confirmPrediction}
                className="bg-[#ceff1c] text-[#111111] px-8 py-4 rounded-[16px] flex items-center gap-3 active:scale-95 transition-all shadow-[0_0_20px_rgba(206,255,28,0.2)]"
              >
                <span
                  className="text-[14px] font-black uppercase tracking-widest"
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
    </>
  );
}
