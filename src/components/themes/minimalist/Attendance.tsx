"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertTriangle, Plus } from "lucide-react";

export default function MinimalAttendance() {
  const [mounted, setMounted] = useState(false);
  const [predictMode, setPredictMode] = useState(false);
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [singleDates, setSingleDates] = useState<number[]>([]);
  const [rangeStart, setRangeStart] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);

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

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("en-US", { month: "long" });
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const isWeekend = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return date.getDay() === 0 || date.getDay() === 6;
  };

  const toggleRangeMode = () => {
    setIsRangeMode(!isRangeMode);
    setSingleDates([]);
    setRangeStart(null);
    setRangeEnd(null);
  };

  const handleDateClick = (day: number) => {
    if (isWeekend(day)) return;

    if (!isRangeMode) {
      if (singleDates.includes(day)) {
        setSingleDates(singleDates.filter((d) => d !== day));
      } else {
        setSingleDates([...singleDates, day]);
      }
    } else {
      if (rangeStart === null || (rangeStart !== null && rangeEnd !== null)) {
        setRangeStart(day);
        setRangeEnd(null);
      } else {
        if (day < rangeStart) {
          setRangeStart(day);
        } else {
          setRangeEnd(day);
        }
      }
    }
  };

  const getSelectedCount = () => {
    let count = 0;
    if (!isRangeMode) {
      count = singleDates.length;
    } else if (rangeStart !== null) {
      const end = rangeEnd !== null ? rangeEnd : rangeStart;
      for (let i = rangeStart; i <= end; i++) {
        if (!isWeekend(i)) count++;
      }
    }
    return count;
  };

  const isDateSelected = (day: number) => {
    if (!isRangeMode) return singleDates.includes(day);
    if (rangeStart !== null) {
      const end = rangeEnd !== null ? rangeEnd : rangeStart;
      return day >= rangeStart && day <= end;
    }
    return false;
  };

  const missedClasses = getSelectedCount();

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

  const predictedSubjects = baseSubjects.map((sub) => {
    const newTotal = sub.total + missedClasses;
    const stats = calculateStats(sub.attended, newTotal);
    return { ...sub, ...stats };
  });

  const lowAttendance = predictedSubjects.filter((s) => !s.safe);
  const safeAttendance = predictedSubjects.filter((s) => s.safe);

  const totalAttended = predictedSubjects.reduce(
    (sum, s) => sum + s.attended,
    0,
  );
  const totalClasses = predictedSubjects.reduce(
    (sum, s) => sum + s.total + missedClasses,
    0,
  );
  const overallPredicted =
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

          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }

          .warning-dotted {
            background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='24' stroke='%23FF4D4D' stroke-width='3' stroke-dasharray='6%2c 10' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e");
            border-radius: 24px;
          }
        `,
        }}
      />

      <div className="absolute inset-0 bg-[#F7F7F7]">
        <div className="h-full w-full overflow-y-auto no-scrollbar px-6 pt-6 pb-[180px] flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col mb-8 w-full shrink-0 relative"
          >
            <button
              onClick={() => setPredictMode(!predictMode)}
              className="w-full border-[1.5px] border-[#111111] rounded-[24px] p-4 flex items-center justify-between bg-white shadow-sm z-10 relative"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${predictMode ? "bg-[#ceff1c] animate-pulse shadow-[0_0_8px_rgba(206,255,28,0.8)]" : "bg-[#111111]"}`}
                />
                <span
                  className="text-[14px] font-bold lowercase tracking-widest text-[#111111]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  predict attendance
                </span>
              </div>
              <Plus
                size={22}
                strokeWidth={2.5}
                className={`text-[#111111] transition-transform duration-300 ${predictMode ? "rotate-45" : ""}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {predictMode && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
                  className="w-full overflow-hidden"
                >
                  <div className="w-full bg-[#111111] rounded-b-[24px] pt-10 pb-6 px-5 -mt-6 flex flex-col shadow-lg">
                    <div className="flex justify-between items-end w-full mb-6">
                      <div className="flex flex-col">
                        <span
                          className="text-[11px] font-bold lowercase tracking-[0.2em] text-white/50 mb-0.5"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          predicted overall
                        </span>
                        <span
                          className="text-[3rem] leading-[0.9] font-black tracking-tighter text-white"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          {overallPredicted}%
                        </span>
                      </div>
                      <span
                        className="text-[11px] font-bold uppercase tracking-widest text-[#ceff1c] mb-1"
                        style={{ fontFamily: "'Afacad', sans-serif" }}
                      >
                        {missedClasses} days off
                      </span>
                    </div>

                    <div className="w-full flex justify-between items-center mb-4">
                      <span
                        className="text-[14px] font-bold uppercase tracking-widest text-white"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {monthName} {currentYear}
                      </span>
                      <button
                        onClick={toggleRangeMode}
                        className="flex items-center gap-2 group"
                      >
                        <span
                          className="text-[10px] font-bold lowercase tracking-widest text-white/60 group-hover:text-white transition-colors"
                          style={{ fontFamily: "'Afacad', sans-serif" }}
                        >
                          range selection
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

                    <div className="w-full flex flex-col">
                      <div className="grid grid-cols-7 gap-1.5 mb-2">
                        {["m", "t", "w", "t", "f", "s", "s"].map((d, i) => (
                          <div
                            key={i}
                            className="text-center text-[10px] font-bold text-white/40 uppercase"
                            style={{ fontFamily: "'Afacad', sans-serif" }}
                          >
                            {d}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1.5">
                        {Array.from({ length: startOffset }).map((_, i) => (
                          <div key={`empty-${i}`} className="aspect-square" />
                        ))}

                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const day = i + 1;
                          const weekend = isWeekend(day);
                          const selected = isDateSelected(day);

                          return (
                            <button
                              key={day}
                              onClick={() => handleDateClick(day)}
                              disabled={weekend}
                              className={`aspect-square rounded-[8px] flex items-center justify-center text-[13px] font-bold transition-all
                                ${
                                  weekend
                                    ? "text-white/10 cursor-not-allowed"
                                    : selected
                                      ? "bg-[#ceff1c] text-[#111111] scale-105 shadow-[0_0_10px_rgba(206,255,28,0.4)]"
                                      : "bg-white/10 text-white hover:bg-white/20"
                                }
                              `}
                              style={{ fontFamily: "'Afacad', sans-serif" }}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {lowAttendance.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
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
            transition={{ duration: 0.4, delay: 0.2 }}
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

        {/* BOTTOM FIXED ATTENDANCE TEXT */}
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
    </>
  );
}
