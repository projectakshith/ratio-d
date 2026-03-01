"use client";
import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import {
  getBaseAttendance,
  getImpactMap,
  getProcessedList,
} from "@/utils/attendanceLogic";

export default function MinimalAttendance({ data, academia }: any) {
  const [mounted, setMounted] = useState(false);
  const [isPredictOverlay, setIsPredictOverlay] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictAction, setPredictAction] = useState<"leave" | "attend">(
    "leave",
  );
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [currentCalDate, setCurrentCalDate] = useState(new Date());

  useEffect(() => {
    setMounted(true);
  }, []);

  const getAcronym = (name: string) => {
    if (!name) return "";
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
    return name
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 0 && !skipWords.includes(word))
      .map((word) => word[0])
      .join("")
      .toLowerCase();
  };

  const baseAttendance = useMemo(
    () => getBaseAttendance(data?.attendance || []),
    [data?.attendance],
  );

  const impactMap = useMemo(() => {
    if (!isPredicting || selectedDates.length === 0) return {};
    return getImpactMap(
      selectedDates,
      academia?.calendarData || [],
      academia?.effectiveSchedule || {},
      baseAttendance,
    );
  }, [isPredicting, selectedDates, academia, baseAttendance]);

  const processedList = useMemo(() => {
    const list = getProcessedList(
      baseAttendance,
      impactMap,
      predictAction,
      isPredicting,
    );
    return list.map((s) => ({
      ...s,
      displayCode: getAcronym(s.title),
      fullName: s.title.toLowerCase(),
      percent: s.pred.pct.toFixed(1),
      safe: s.pred.status.safe,
      val: s.pred.status.val,
    }));
  }, [baseAttendance, impactMap, predictAction, isPredicting]);

  const lowAttendance = useMemo(
    () => processedList.filter((s) => !s.safe).sort((a, b) => b.val - a.val),
    [processedList],
  );

  const safeAttendance = useMemo(
    () => processedList.filter((s) => s.safe).sort((a, b) => a.val - b.val),
    [processedList],
  );

  const stats = useMemo(() => {
    let totalC = 0,
      totalP = 0;
    baseAttendance.forEach((s) => {
      const sessions = impactMap[s.code] || 0;
      totalC += s.conducted + sessions;
      totalP += s.present + (predictAction === "attend" ? sessions : 0);
    });
    const pct = totalC === 0 ? 0 : (totalP / totalC) * 100;
    return { percent: pct.toFixed(1), safe: pct >= 75 };
  }, [baseAttendance, impactMap, predictAction, isPredicting]);

  const calYear = currentCalDate.getFullYear();
  const calMonth = currentCalDate.getMonth();
  const monthName = currentCalDate.toLocaleString("en-US", { month: "long" });
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const startOffset = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;

  const formatDate = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const isWeekendStr = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const day = new Date(y, m - 1, d).getDay();
    return day === 0 || day === 6;
  };

  const handleDateClick = (day: number) => {
    const dStr = formatDate(calYear, calMonth, day);
    if (isWeekendStr(dStr)) return;
    if (!isRangeMode) {
      setSelectedDates((prev) =>
        prev.includes(dStr) ? prev.filter((d) => d !== dStr) : [...prev, dStr],
      );
    } else {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(dStr);
        setRangeEnd(null);
        setSelectedDates((prev) =>
          prev.includes(dStr) ? prev : [...prev, dStr],
        );
      } else {
        setRangeEnd(dStr);
        let start = new Date(
          rangeStart.split("-")[0] as any,
          Number(rangeStart.split("-")[1]) - 1,
          Number(rangeStart.split("-")[2]),
        );
        let end = new Date(
          dStr.split("-")[0] as any,
          Number(dStr.split("-")[1]) - 1,
          Number(dStr.split("-")[2]),
        );
        if (start > end) [start, end] = [end, start];
        const range = [];
        for (
          let dt = new Date(start);
          dt <= end;
          dt.setDate(dt.getDate() + 1)
        ) {
          const s = formatDate(dt.getFullYear(), dt.getMonth(), dt.getDate());
          if (!isWeekendStr(s)) range.push(s);
        }
        setSelectedDates((prev) => Array.from(new Set([...prev, ...range])));
      }
    }
  };

  if (!mounted) return null;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .warning-dotted { background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='14' stroke='%23FF4D4D' stroke-width='3' stroke-dasharray='6%2c 10' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e"); border-radius: 24px; }
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
              className="text-[12px] font-bold lowercase tracking-[0.3em] mb-3 text-[#111111]"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {isPredicting ? "predicted attendance" : "overall attendance"}
            </span>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-[7.5rem] leading-[0.8] font-black tracking-tighter transition-colors ${stats.safe ? "text-[#111111]" : "text-[#FF4D4D]"}`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {stats.percent}
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
                    predict
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
                      {selectedDates.length} days{" "}
                      {predictAction === "leave" ? "off" : "present"}
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
                    onClick={() => {
                      setIsPredicting(false);
                      setSelectedDates([]);
                    }}
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
              {lowAttendance.map((sub: any) => (
                <div
                  key={sub.id}
                  className="w-full bg-white border-[1.5px] border-[#FF4D4D]/30 rounded-[18px] p-4 flex items-center justify-between shadow-sm transition-all"
                >
                  <div className="flex flex-col items-center justify-center w-[70px] shrink-0">
                    <span
                      className="text-[3.2rem] leading-[0.8] font-black tracking-tighter text-[#FF4D4D]"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {sub.val}
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
                      {sub.displayCode}
                    </span>
                    <span
                      className="text-[12px] font-medium lowercase tracking-wide leading-[1.1] mt-0.5 truncate w-full text-[#FF4D4D]/70"
                      style={{ fontFamily: "'Afacad', sans-serif" }}
                    >
                      {sub.fullName}
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[12px] font-bold text-[#FF4D4D]/70">
                        {sub.present}/{sub.conducted}
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
                  academic comeback needed
                </span>
              </div>
            </motion.div>
          )}

          {/* Safe Subjects Segment restored */}
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
            {safeAttendance.map((sub: any) => (
              <div
                key={sub.id}
                className="w-full border-[1.5px] rounded-[24px] p-5 flex items-center justify-between bg-white shadow-sm border-[#111111]/10 transition-all"
              >
                <div className="flex flex-col items-center justify-center w-[70px] shrink-0">
                  <span
                    className="text-[3.2rem] leading-[0.8] font-black tracking-tighter text-[#111111]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {sub.val}
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
                    {sub.displayCode}
                  </span>
                  <span
                    className="text-[13px] font-medium lowercase tracking-wide leading-[1.1] mt-0.5 truncate w-full text-[#111111]/50"
                    style={{ fontFamily: "'Afacad', sans-serif" }}
                  >
                    {sub.fullName}
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[12px] font-bold text-[#111111]/40">
                      {sub.present}/{sub.conducted}
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

        {/* Wave Text Background Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#F7F7F7] via-[#F7F7F7] to-transparent px-6 pt-24 pb-[30px] z-20 flex justify-between items-end pointer-events-none">
          {"attendance".split("").map((char, i) => (
            <span
              key={i}
              className="text-[3.2rem] leading-[0.75] lowercase text-[#111111] opacity-[0.12]"
              style={{ fontFamily: "'Afacad', sans-serif" }}
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
              if (info.offset.y > 100) setIsPredictOverlay(false);
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
                  {predictAction === "leave"
                    ? "plan your leaves"
                    : "plan your presence"}
                </span>
              </div>
              <button
                onClick={() => setIsPredictOverlay(false)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-95 transition-all shrink-0"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
            {/* Calendar UI logic from static snippet */}
            <div className="flex flex-col flex-1 justify-center w-full mt-6 overflow-y-auto no-scrollbar">
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-[16px] mb-6 shrink-0">
                <button
                  onClick={() => setPredictAction("leave")}
                  className={`flex-1 py-2.5 rounded-[12px] text-[11px] font-bold uppercase transition-all ${predictAction === "leave" ? "bg-[#ceff1c] text-[#111111]" : "text-white/50"}`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  leaves
                </button>
                <button
                  onClick={() => setPredictAction("attend")}
                  className={`flex-1 py-2.5 rounded-[12px] text-[11px] font-bold uppercase transition-all ${predictAction === "attend" ? "bg-[#ceff1c] text-[#111111]" : "text-white/50"}`}
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
                  className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white"
                >
                  <ChevronLeft />
                </button>
                <span
                  className="text-[16px] font-black uppercase text-white"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {monthName} {calYear}
                </span>
                <button
                  onClick={() =>
                    setCurrentCalDate(new Date(calYear, calMonth + 1, 1))
                  }
                  className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white"
                >
                  <ChevronRight />
                </button>
              </div>
              <div className="w-full flex flex-col bg-white/5 border border-white/10 rounded-[24px] p-5 mb-6 shrink-0">
                <div className="grid grid-cols-7 gap-2 mb-3">
                  {["m", "t", "w", "t", "f", "s", "s"].map((d, i) => (
                    <div
                      key={i}
                      className="text-center text-[11px] font-bold text-white/40 uppercase"
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
                    const dStr = formatDate(calYear, calMonth, day);
                    const selected =
                      (isRangeMode && rangeStart === dStr && !rangeEnd) ||
                      selectedDates.includes(dStr);
                    return (
                      <button
                        key={day}
                        onClick={() => handleDateClick(day)}
                        disabled={isWeekendStr(dStr)}
                        className={`aspect-square rounded-[12px] flex items-center justify-center text-[15px] font-black ${isWeekendStr(dStr) ? "text-white/10" : selected ? "bg-[#ceff1c] text-[#111111] shadow-lg" : "bg-white/10 text-white"}`}
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
                <span className="text-[12px] font-bold text-white/50 mb-0.5">
                  total days
                </span>
                <span
                  className="text-[28px] font-black text-white"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {selectedDates.length}
                </span>
              </div>
              <button
                onClick={() => {
                  setIsPredicting(true);
                  setIsPredictOverlay(false);
                }}
                className="bg-[#ceff1c] text-[#111111] px-8 py-4 rounded-[16px] flex items-center gap-3 active:scale-95 shadow-xl"
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
    </>
  );
}
