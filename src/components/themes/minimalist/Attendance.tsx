"use client";
import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronRight as ChevronRightIcon,
  ArrowRight,
} from "lucide-react";
import {
  getBaseAttendance,
  getImpactMap,
  getProcessedList,
  getStatus,
} from "@/utils/attendanceLogic";
import calendarDataJson from "@/data/calendar_data.json";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: -20, scale: 0.98 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 450, damping: 30 } 
  }
};

export default function MinimalAttendance({
  data,
  academia,
  setIsSwipeDisabled,
  isDark,
}: any) {
  const [mounted, setMounted] = useState(false);
  const [isPredictOverlay, setIsPredictOverlay] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);

  useEffect(() => {
    if (setIsSwipeDisabled) {
      setIsSwipeDisabled(isPredictOverlay);
    }
  }, [isPredictOverlay, setIsSwipeDisabled]);

  const [predictAction, setPredictAction] = useState<"leave" | "attend">("leave");
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
    const skipWords = ["and", "of", "to", "in", "for", "with", "a", "an", "the"];
    return name.toLowerCase().split(/\s+/).filter((word) => word.length > 0 && !skipWords.includes(word)).map((word) => word[0]).join("").toLowerCase();
  };

  const baseAttendance = useMemo(() => getBaseAttendance(data?.attendance || []), [data?.attendance]);

  const impactMap = useMemo(() => {
    if (!isPredicting || selectedDates.length === 0) return {};
    return getImpactMap(selectedDates, academia?.calendarData || [], academia?.effectiveSchedule || {}, baseAttendance);
  }, [isPredicting, selectedDates, academia, baseAttendance]);

  const processedList = useMemo(() => {
    const list = getProcessedList(baseAttendance, impactMap, predictAction, isPredicting);
    return list.map((s) => {
      const origStatus = getStatus(parseFloat(s.percentage), s.conducted, s.present);
      return { ...s, displayCode: getAcronym(s.title), fullName: s.title.toLowerCase(), percent: s.pred.pct.toFixed(1), safe: s.pred.status.safe, val: s.pred.status.val, sessionsAffected: s.pred.sessionsAffected, originalVal: origStatus.val, originalLabel: origStatus.label, currentLabel: s.pred.status.label };
    });
  }, [baseAttendance, impactMap, predictAction, isPredicting]);

  const actionRequired = useMemo(() => processedList.filter((s) => !s.safe).sort((a, b) => b.val - a.val), [processedList]);
  const predictedShifts = useMemo(() => processedList.filter((s) => s.safe && s.sessionsAffected).sort((a, b) => b.val - a.val), [processedList]);
  const safeSubjectsList = useMemo(() => processedList.filter((s) => s.safe && !s.sessionsAffected).sort((a, b) => a.val - b.val), [processedList]);

  const stats = useMemo(() => {
    let totalC = 0, totalP = 0;
    baseAttendance.forEach((s) => {
      const sessions = impactMap[s.id] || 0;
      totalC += s.conducted + sessions;
      totalP += s.present + (predictAction === "attend" ? sessions : 0);
    });
    const pct = totalC === 0 ? 0 : (totalP / totalC) * 100;
    return { percent: pct.toFixed(1), safe: pct >= 75 };
  }, [baseAttendance, impactMap, predictAction, isPredicting]);

  const getPercentColor = () => {
    const pVal = parseFloat(stats.percent);
    if (pVal < 75) return "#FF4D4D";
    if (pVal < 85) return "#F97316";
    return "#85a818";
  };

  const calYear = currentCalDate.getFullYear();
  const calMonth = currentCalDate.getMonth();
  const monthName = currentCalDate.toLocaleString("en-US", { month: "long" });
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const startOffset = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;
  const formatDate = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const isWeekendStr = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const day = new Date(y, m - 1, d).getDay();
    return day === 0 || day === 6;
  };

  const holidayMap = useMemo(() => {
    const calDataToUse = academia?.calendarData?.length > 0 ? academia.calendarData : calendarDataJson || [];
    const map = new Map();
    calDataToUse.forEach((ev: any) => {
      if (!ev.date) return;
      const d = new Date(ev.date);
      if (isNaN(d.getTime())) return;
      const normDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const rawOrder = ev.dayOrder || ev.day_order || ev.order;
      if (ev.type === "holiday" || rawOrder === "-" || rawOrder === "0" || ev.description?.toLowerCase().includes("holiday")) map.set(normDate, true);
    });
    return map;
  }, [academia?.calendarData]);

  const handleDateClick = (day: number) => {
    const dStr = formatDate(calYear, calMonth, day);
    if (isWeekendStr(dStr) || holidayMap.has(dStr)) return;
    if (!isRangeMode) setSelectedDates((prev) => prev.includes(dStr) ? prev.filter((d) => d !== dStr) : [...prev, dStr]);
    else {
      if (!rangeStart || (rangeStart && rangeEnd)) { setRangeStart(dStr); setRangeEnd(null); setSelectedDates((prev) => prev.includes(dStr) ? prev : [...prev, dStr]); }
      else {
        setRangeEnd(dStr);
        let start = new Date(rangeStart.split("-")[0] as any, Number(rangeStart.split("-")[1]) - 1, Number(rangeStart.split("-")[2]));
        let end = new Date(dStr.split("-")[0] as any, Number(dStr.split("-")[1]) - 1, Number(dStr.split("-")[2]));
        if (start > end) [start, end] = [end, start];
        const range = [];
        for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
          const s = formatDate(dt.getFullYear(), dt.getMonth(), dt.getDate());
          if (!isWeekendStr(s) && !holidayMap.has(s)) range.push(s);
        }
        setSelectedDates((prev) => Array.from(new Set([...prev, ...range])));
      }
    }
  };

  if (!mounted) return null;

  const bgClass = isDark ? "bg-[#111111]" : "bg-[#F7F7F7]";
  const textClass = isDark ? "text-white" : "text-[#111111]";
  const subTextClass = isDark ? "text-white/40" : "text-[#111111]/40";
  const cardBg = isDark ? "bg-white/5" : "bg-white";
  const cardBorder = isDark ? "border-white/10" : "border-[#111111]/10";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .warning-dotted-rect { background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='14' stroke='%23FF4D4D' stroke-width='3' stroke-dasharray='6%2c 10' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e"); border-radius: 24px; } .affected-dotted-rect { background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='14' stroke='%23${isDark ? "ffffff" : "111111"}' stroke-width='2' stroke-dasharray='8%2c 12' stroke-dashoffset='0' stroke-linecap='round' opacity='0.15'/%3e%3c/svg%3e"); border-radius: 24px; } .shift-bar { background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='12' ry='12' stroke='%23${isDark ? "ffffff" : "111111"}15' stroke-width='1.5' stroke-dasharray='4%2c 6' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e"); border-radius: 12px; }` }} />
      <div className={`absolute inset-0 ${bgClass}`}>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="h-full w-full overflow-y-auto no-scrollbar px-6 pt-10 pb-[180px] flex flex-col relative z-10"
        >
          <motion.div variants={itemVariants} className="w-full flex flex-col items-center mt-2 mb-12 shrink-0">
            <span className={`text-[12px] font-bold lowercase tracking-[0.3em] mb-3 ${textClass}`} style={{ fontFamily: "'Montserrat', sans-serif" }}>overall attendance</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[7.5rem] leading-[0.8] font-black tracking-tighter transition-colors" style={{ fontFamily: "'Montserrat', sans-serif", color: getPercentColor() }}>{stats.percent}</span>
              <span className={`text-[2.5rem] font-bold ${subTextClass}`} style={{ fontFamily: "'Montserrat', sans-serif" }}>%</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col mb-8 w-full shrink-0">
            {!isPredicting ? (
              <button onClick={() => setIsPredictOverlay(true)} className="w-full relative group active:scale-[0.98] transition-all duration-200">
                <div className={`absolute inset-0 ${isDark ? "bg-white" : "bg-[#111111]"} rounded-[24px] translate-y-1.5 transition-transform group-hover:translate-y-2`} />
                <div className={`relative w-full border-[1.5px] ${isDark ? "border-white bg-[#111111] text-white" : "border-[#111111] bg-white text-[#111111]"} rounded-[24px] p-4 flex items-center justify-between transition-transform group-hover:-translate-y-0.5 group-active:translate-y-1`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${isDark ? "bg-white/5" : "bg-[#111111]/5"} flex items-center justify-center`}><Calculator size={20} strokeWidth={2.5} className={isDark ? "text-white" : "text-[#111111]"} /></div>
                    <div className="flex flex-col items-start"><span className="text-[14px] font-black uppercase tracking-widest leading-none" style={{ fontFamily: "'Montserrat', sans-serif" }}>PREDICT</span><span className={`text-[10px] font-bold lowercase tracking-wider ${isDark ? "text-white/40" : "text-[#111111]/40"} mt-1`} style={{ fontFamily: "'Afacad', sans-serif" }}>calculate future attendance</span></div>
                  </div>
                  <div className={`w-9 h-9 rounded-full ${isDark ? "bg-white/5 border-white/20" : "bg-[#F7F7F7] border-[#111111]"} flex items-center justify-center shadow-[2px_2px_0px_${isDark ? "#ffffff" : "#111111"}]`}><ChevronRightIcon size={20} strokeWidth={3} className={isDark ? "text-white" : "text-[#111111]"} /></div>
                </div>
              </button>
            ) : (
              <div className="w-full relative group transition-all duration-200"><div className={`absolute inset-0 ${isDark ? "bg-white" : "bg-[#111111]"} rounded-[24px] translate-y-1.5`} /><div className={`relative w-full border-[1.5px] ${isDark ? "border-white bg-[#111111]" : "border-[#111111] bg-[#111111]"} rounded-[24px] p-4 flex items-center justify-between`}><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" /></div><div className="flex flex-col items-start"><span className="text-[14px] font-black uppercase tracking-widest text-white leading-none" style={{ fontFamily: "'Montserrat', sans-serif" }}>predicting</span><span className="text-[10px] font-bold lowercase tracking-wider text-white/50 mt-1" style={{ fontFamily: "'Afacad', sans-serif" }}>{selectedDates.length} days {predictAction === "leave" ? "off" : "present"}</span></div></div><div className="flex items-center gap-2"><button onClick={() => setIsPredictOverlay(true)} className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all"><ChevronRightIcon size={18} strokeWidth={2.5} /></button><button onClick={() => { setIsPredicting(false); setSelectedDates([]); setRangeStart(null); setRangeEnd(null); }} className="w-9 h-9 rounded-full bg-[#FF4D4D]/20 border border-[#FF4D4D]/20 flex items-center justify-center text-[#FF4D4D] active:scale-95 transition-all"><X size={18} strokeWidth={2.5} /></button></div></div></div>
            )}
          </motion.div>

          {actionRequired.length > 0 && (
            <motion.div variants={itemVariants} className={`w-full warning-dotted-rect p-5 flex flex-col gap-4 mb-12 ${isDark ? "bg-[#FFEDED]/5" : "bg-[#FFEDED]/30"} shrink-0`}>
              <div className="flex items-center gap-3 w-full"><span className="text-[12px] font-bold lowercase tracking-[0.25em] text-[#FF4D4D] whitespace-nowrap" style={{ fontFamily: "'Montserrat', sans-serif" }}>action required</span><div className="flex-1 h-[1.5px] bg-[#FF4D4D]/20 rounded-full" /></div>
              {actionRequired.map((sub: any) => (
                <div key={sub.id} className={`w-full ${isDark ? "bg-white/5 border-[#FF4D4D]/20" : "bg-white border-[#FF4D4D]/30"} border-[1.5px] rounded-[18px] p-4 flex flex-col shadow-sm transition-all`}><div className="flex items-center justify-between w-full"><div className="flex flex-col items-center justify-center w-[70px] shrink-0"><span className="text-[3.2rem] leading-[0.8] font-black tracking-tighter" style={{ fontFamily: "'Montserrat', sans-serif", color: "#FF4D4D" }}>{sub.val}</span><span className="text-[10px] font-bold uppercase tracking-widest mt-1 text-center" style={{ fontFamily: "'Afacad', sans-serif", color: "#FF4D4Db3" }}>{sub.currentLabel}</span></div><div className="flex-1 flex flex-col items-end text-right min-w-0 ml-4"><div className="flex items-center gap-2 mb-1">{sub.isPractical && (<span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#0EA5E9] bg-[#0EA5E9]/10 px-2 py-0.5 rounded-md" style={{ fontFamily: "'Afacad', sans-serif" }}>practical</span>)}<span className="text-[16px] font-black uppercase tracking-widest leading-[1.1] truncate" style={{ fontFamily: "'Montserrat', sans-serif", color: "#FF4D4D" }}>{sub.displayCode}</span></div><span className="text-[12px] font-medium lowercase tracking-wide leading-[1.1] truncate w-full" style={{ fontFamily: "'Afacad', sans-serif", color: "#FF4D4Db3" }}>{sub.fullName}</span><div className="flex items-center gap-2 mt-2"><span className="text-[12px] font-bold opacity-70" style={{ color: "#FF4D4D" }}>{sub.present}/{sub.conducted}</span><div className="w-[3px] h-[3px] rounded-full opacity-40" style={{ backgroundColor: "#FF4D4D" }} /><span className="text-[16px] font-black tracking-tighter" style={{ fontFamily: "'Montserrat', sans-serif", color: "#FF4D4D" }}>{sub.percent}%</span></div></div></div></div>
              ))}
            </motion.div>
          )}

          <motion.div variants={containerVariants} className="flex flex-col gap-3.5 w-full shrink-0">
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-2 w-full px-1"><span className={`text-[12px] font-bold lowercase tracking-[0.25em] ${isDark ? "text-white/40" : "text-[#111111]/40"} whitespace-nowrap`} style={{ fontFamily: "'Montserrat', sans-serif" }}>safe subjects</span><div className={`flex-1 h-[1.5px] ${isDark ? "bg-white/10" : "bg-[#111111]/10"} rounded-full`} /></motion.div>
            {safeSubjectsList.map((sub: any) => {
              const isPrac = sub.isPractical;
              const baseColor = isPrac ? "#0EA5E9" : (isDark ? "#ffffff" : "#111111");
              return (
                <motion.div key={sub.id} variants={itemVariants} className={`w-full border-[1.5px] rounded-[24px] p-5 flex items-center justify-between shadow-sm transition-all ${isDark ? "bg-white/5 border-white/10" : "bg-white border-[#111111]/10"}`}><div className="flex flex-col items-center justify-center w-[70px] shrink-0"><span className="text-[3.2rem] leading-[0.8] font-black tracking-tighter" style={{ fontFamily: "'Montserrat', sans-serif", color: baseColor }}>{sub.val}</span><span className="text-[10px] font-bold uppercase tracking-widest mt-1 text-center" style={{ fontFamily: "'Afacad', sans-serif", color: isPrac ? `${baseColor}b3` : (isDark ? "rgba(255,255,255,0.4)" : "#11111166") }}>margin</span></div><div className="flex-1 flex flex-col items-end text-right min-w-0 ml-4"><div className="flex items-center gap-2 mb-1">{isPrac && (<span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#0EA5E9] bg-[#0EA5E9]/10 px-2 py-0.5 rounded-md" style={{ fontFamily: "'Afacad', sans-serif" }}>practical</span>)}<span className="text-[16px] font-black uppercase tracking-widest leading-[1.1] truncate" style={{ fontFamily: "'Montserrat', sans-serif", color: baseColor }}>{sub.displayCode}</span></div><span className={`text-[13px] font-medium lowercase tracking-wide leading-[1.1] truncate w-full`} style={{ fontFamily: "'Afacad', sans-serif", color: isPrac ? `${baseColor}b3` : (isDark ? "rgba(255,255,255,0.5)" : "#11111180") }}>{sub.fullName}</span><div className="flex items-center gap-2 mt-2"><span className="text-[12px] font-bold opacity-70" style={{ color: baseColor }}>{sub.present}/{sub.conducted}</span><div className="w-[3px] h-[3px] rounded-full opacity-40" style={{ backgroundColor: baseColor }} /><span className="text-[16px] font-black tracking-tighter" style={{ fontFamily: "'Montserrat', sans-serif", color: baseColor }}>{sub.percent}%</span></div></div></motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${isDark ? "from-[#111111] via-[#111111]" : "from-[#F7F7F7] via-[#F7F7F7]"} to-transparent px-6 pt-24 pb-[30px] z-20 flex justify-between items-end pointer-events-none`}>
          {"attendance".split("").map((char, i) => (<span key={i} className={`text-[3.2rem] leading-[0.75] lowercase ${textClass}`} style={{ fontFamily: "'Afacad', sans-serif", fontWeight: 400 }}>{char}</span>))}
        </div>
      </div>

      <AnimatePresence>
        {isPredictOverlay && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }} drag="y" dragDirectionLock dragConstraints={{ top: 0, bottom: 500 }} dragElastic={{ top: 0, bottom: 0.8 }} onDragEnd={(e, info) => { if (info.offset.y > 100) setIsPredictOverlay(false); }} className={`fixed inset-0 ${isDark ? "bg-[#111111]" : "bg-white"} z-[60] flex flex-col overflow-hidden px-6 pt-6 pb-6`}>
            <div className={`w-12 h-1.5 ${isDark ? "bg-white/20" : "bg-black/10"} rounded-full mx-auto mb-6 shrink-0`} />
            <div className="flex justify-between items-start w-full shrink-0"><div className="flex flex-col"><span className={`text-[32px] leading-[1] font-black uppercase tracking-[0.15em] ${textClass}`} style={{ fontFamily: "'Montserrat', sans-serif" }}>PREDICT</span><span className="text-[10px] font-bold lowercase tracking-[0.2em] text-[#85a818] mt-1.5" style={{ fontFamily: "'Afacad', sans-serif" }}>{predictAction === "leave" ? "plan your leaves" : "plan your presence"}</span></div><button onClick={() => setIsPredictOverlay(false)} className={`w-10 h-10 rounded-full ${isDark ? "bg-white/10" : "bg-[#111111]/5"} flex items-center justify-center ${textClass} active:scale-95 transition-all shrink-0`}><X size={20} strokeWidth={2.5} /></button></div>
            <div className="flex flex-col flex-1 justify-center w-full mt-6"><div className={`flex items-center gap-2 ${isDark ? "bg-white/5" : "bg-black/5"} p-1 rounded-[16px] mb-3 shrink-0`}><button onClick={() => setPredictAction("leave")} className={`flex-1 py-2.5 rounded-[12px] text-[11px] font-bold uppercase transition-all ${predictAction === "leave" ? "bg-[#ceff1c] text-[#111111]" : (isDark ? "text-white/50" : "text-black/50")}`} style={{ fontFamily: "'Montserrat', sans-serif" }}>leaves</button><button onClick={() => setPredictAction("attend")} className={`flex-1 py-2.5 rounded-[12px] text-[11px] font-bold uppercase transition-all ${predictAction === "attend" ? "bg-[#ceff1c] text-[#111111]" : (isDark ? "text-white/50" : "text-black/50")}`} style={{ fontFamily: "'Montserrat', sans-serif" }}>attending</button></div><div className="w-full flex justify-between items-center mb-6 shrink-0"><button onClick={() => setCurrentCalDate(new Date(calYear, calMonth - 1, 1))} className={`w-10 h-10 ${isDark ? "bg-white/5" : "bg-black/5"} rounded-full flex items-center justify-center ${textClass}`}><ChevronLeft /></button><span className={`text-[16px] font-black uppercase ${textClass}`} style={{ fontFamily: "'Montserrat', sans-serif" }}>{monthName} {calYear}</span><button onClick={() => setCurrentDate(new Date(calYear, calMonth + 1, 1))} className={`w-10 h-10 ${isDark ? "bg-white/5" : "bg-black/5"} rounded-full flex items-center justify-center ${textClass}`}><ChevronRight /></button></div><div className={`w-full flex flex-col ${isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-[24px] p-5 mb-4 shrink-0`}><div className="grid grid-cols-7 gap-2 mb-3">{["m", "t", "w", "t", "f", "s", "s"].map((d, i) => (<div key={i} className={`text-center text-[11px] font-bold ${isDark ? "text-white/40" : "text-black/40"} uppercase`} style={{ fontFamily: "'Montserrat', sans-serif" }}>{d}</div>))}</div><div className="grid grid-cols-7 gap-2">{Array.from({ length: startOffset }).map((_, i) => (<div key={i} className="aspect-square" />))}{Array.from({ length: daysInMonth }).map((_, i) => { const day = i + 1; const dStr = formatDate(calYear, calMonth, day); const isWeekend = isWeekendStr(dStr); const isHoliday = holidayMap.has(dStr); const isDisabled = isWeekend || isHoliday; const selected = (isRangeMode && rangeStart === dStr && !rangeEnd) || selectedDates.includes(dStr); return (<div key={day} className="relative aspect-square flex flex-col items-center justify-center"><button onClick={() => handleDateClick(day)} disabled={isDisabled} className={`w-full h-full rounded-[12px] flex items-center justify-center text-[15px] font-black transition-all ${isDisabled ? (isDark ? "text-white/10" : "text-black/10") : selected ? "bg-[#ceff1c] text-[#111111] shadow-lg" : (isDark ? "bg-white/10 text-white" : "bg-black/10 text-black")}`} style={{ fontFamily: "'Montserrat', sans-serif" }}>{day}</button>{isHoliday && !isWeekend && (<div className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#FF4D4D]" />)}</div>); })}</div></div><div className={`flex items-center gap-2 shrink-0 ${isDark ? "bg-white/5" : "bg-black/5"} p-1 rounded-[16px]`}><button onClick={() => { setIsRangeMode(false); setRangeStart(null); setRangeEnd(null); setSelectedDates([]); }} className={`flex-1 py-2.5 rounded-[12px] text-[10px] font-bold uppercase tracking-widest transition-all ${!isRangeMode ? (isDark ? "bg-white/20 text-white" : "bg-black/20 text-black") : (isDark ? "bg-transparent text-white/40" : "bg-transparent text-black/40")}`} style={{ fontFamily: "'Montserrat', sans-serif" }}>Single Day</button><button onClick={() => { setIsRangeMode(true); setSelectedDates([]); }} className={`flex-1 py-2.5 rounded-[12px] text-[10px] font-bold uppercase tracking-widest transition-all ${isRangeMode ? (isDark ? "bg-white/20 text-white" : "bg-black/20 text-black") : (isDark ? "bg-transparent text-white/40" : "bg-transparent text-black/40")}`} style={{ fontFamily: "'Montserrat', sans-serif" }}>Date Range</button></div></div>
            <div className={`w-full flex justify-between items-center ${isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} p-4 border rounded-[24px] shrink-0 mt-auto`}><div className="flex flex-col ml-2"><span className={`text-[12px] font-bold lowercase tracking-widest ${isDark ? "text-white/50" : "text-black/50"} mb-0.5`} style={{ fontFamily: "'Afacad', sans-serif" }}>total days</span><span className={`text-[28px] font-black ${textClass}`} style={{ fontFamily: "'Montserrat', sans-serif" }}>{selectedDates.length}</span></div><button onClick={() => { setIsPredicting(true); setIsPredictOverlay(false); }} className="bg-[#ceff1c] text-[#111111] px-8 py-4 rounded-[16px] flex items-center gap-3 active:scale-95 shadow-xl transition-all"><span className="text-[14px] font-black uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>confirm</span><Check size={20} strokeWidth={3} /></button></div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function calculateOverallAttendance(attendance: any[]) {
  if (!attendance || attendance.length === 0) return 0;
  const totalC = attendance.reduce((acc, curr) => acc + curr.conducted, 0);
  const totalA = attendance.reduce((acc, curr) => acc + curr.absent, 0);
  return totalC === 0 ? 0 : Math.round(((totalC - totalA) / totalC) * 100);
}
