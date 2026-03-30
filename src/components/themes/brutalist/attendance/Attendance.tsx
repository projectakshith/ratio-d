"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import {
  AlertCircle,
  Zap,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";
import { flavorText } from "@/utils/shared/flavortext";
import { 
  getBaseAttendance, 
  getImpactMap, 
  getProcessedList, 
  getStatus,
  getRecoveryDate,
} from "@/utils/attendance/attendanceLogic";
import BrutalistPredict from "./BrutalistPredict";

import { AcademiaData } from "@/types";
import { useAppLayout } from "@/context/AppLayoutContext";
import { Haptics } from "@/utils/shared/haptics";
import { useApp } from "@/context/AppContext";
import { UserAvatar } from "@/components/shared/UserAvatar";

const MarginCounter = ({ value }: { value: number }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    if (Math.abs(prevValue.current - value) < 0.1) {
      node.textContent = Math.round(value).toString();
      prevValue.current = value;
      return;
    }
    const controls = animate(prevValue.current, value, {
      duration: 0.5,
      ease: "easeOut",
      onUpdate: (v) => {
        node.textContent = Math.round(v).toString();
      },
    });
    prevValue.current = value;
    return () => controls.stop();
  }, [value]);

  return <span ref={nodeRef} />;
};

const MobileAttendance = ({
  data,
  academia,
}: {
  data: AcademiaData;
  academia: any;
}) => {
  const { profileSeed } = useApp();
  const { setIsSwipeDisabled } = useAppLayout();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [predictMode, setPredictMode] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [introMode, setIntroMode] = useState(true);
  const [selectedDates, setSelectedDates] = useState<Record<string, "leave" | "attend" | "od">>({});
  const [predType, setPredType] = useState<"leave" | "attend" | "od">("leave");
  const [currentCalDate, setCurrentCalDate] = useState(new Date());
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [rangeStart, setRangeStart] = useState<string | null>(null);

  useEffect(() => {
    setIsSwipeDisabled(predictMode);
  }, [predictMode, setIsSwipeDisabled]);

  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const rawAttendance = useMemo(() => Array.isArray(data?.attendance) ? data.attendance : [], [data?.attendance]);
  const baseAttendance = useMemo(() => getBaseAttendance(rawAttendance), [rawAttendance]);

  const calendarData = useMemo(() => academia?.calendarData || [], [academia?.calendarData]);
  const effectiveSchedule = useMemo(() => academia?.effectiveSchedule || data?.schedule || data?.timetable || {}, [academia?.effectiveSchedule, data?.schedule, data?.timetable]);

  const predictionImpact = useMemo(
    () => getImpactMap(selectedDates, calendarData, effectiveSchedule, baseAttendance),
    [selectedDates, calendarData, effectiveSchedule, baseAttendance]
  );

  const processedList = useMemo(() => {
    const list = getProcessedList(baseAttendance, predictionImpact, isPredicting);
    return list.map((s) => {
      const origStatus = getStatus(
        parseFloat(s.percentage),
        s.conducted,
        s.present,
      );

      const recDate = getRecoveryDate(
        s,
        calendarData,
        effectiveSchedule,
        selectedDates,
        predType
      );

      return {
        ...s,
        percent: s.pred.pct.toFixed(1),
        safe: s.pred.status.safe,
        val: s.pred.status.val,
        label: s.pred.status.label,
        sessionsAffected: s.pred.sessionsAffected,
        originalVal: origStatus.val,
        originalLabel: origStatus.label,
        currentLabel: s.pred.status.label,
        hasChanged: s.pred.status.val !== origStatus.val || s.pred.status.label !== origStatus.label,
        recoveryDate: recDate,
      };
    });
  }, [baseAttendance, predictionImpact, isPredicting, calendarData, effectiveSchedule, selectedDates, predType]);

  const overallStats = useMemo(() => {
    if (baseAttendance.length === 0)
      return { pct: 0, badge: "safe", tagline: "all good", color: "text-[#ceff1c]" };
    
    let totalC = 0, totalP = 0;
    baseAttendance.forEach((s) => {
      const imp = (predictionImpact && predictionImpact[s.id]) || { conducted: 0, present: 0 };
      totalC += s.conducted + imp.conducted;
      totalP += s.present + imp.present;
    });
    const pct = totalC === 0 ? 0 : (totalP / totalC) * 100;
    
    let category = pct < 75 ? "cooked" : pct >= 85 ? "safe" : "danger";
    const list = flavorText.header?.[category] || ["..."];
    const badge = list[0].toLowerCase();
    
    let tagline = "you're doing great";
    if (category === "cooked") tagline = "academic comeback needed";
    if (category === "danger") tagline = "treading on thin ice";
    
    const color = category === "safe" ? "text-[#ceff1c]" : category === "danger" ? "text-[#ffb800]" : "text-[#ff003c]";
    return { pct, badge, tagline, color };
  }, [baseAttendance, predictionImpact, isPredicting]);

  const actionRequired = useMemo(
    () => processedList.filter((s) => !s.safe).sort((a, b) => b.val - a.val),
    [processedList],
  );
  const safeSubjectsList = useMemo(
    () =>
      processedList
        .filter((s) => s.safe)
        .sort((a, b) => (a.sessionsAffected ? -1 : 1) || a.val - b.val),
    [processedList],
  );

  useEffect(() => {
    if (processedList.length > 0 && selectedId === null) {
      setSelectedId(processedList[0].id);
    }
  }, [processedList, selectedId]);

  useEffect(() => {
    const timer = setTimeout(() => setIntroMode(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!predictMode && !isPredicting) {
      setSelectedDates({});
      setPredType("leave");
      setRangeStart(null);
      setIsRangeMode(false);
    }
  }, [predictMode, isPredicting]);

  useEffect(() => {
    if (isPredicting && listContainerRef.current) {
      listContainerRef.current.scrollTop = 0;
      if (processedList.length > 0) {
        setSelectedId(processedList[0].id);
      }
    }
  }, [isPredicting, processedList]);

  const formatDate = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const isWeekendStr = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const day = new Date(y, m - 1, d).getDay();
    return day === 0 || day === 6;
  };

  const holidayMap = useMemo(() => {
    const map = new Map();
    calendarData.forEach((ev: any) => {
      if (!ev.date) return;
      const d = new Date(ev.date);
      if (isNaN(d.getTime())) return;
      const normDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const rawOrder = ev.dayOrder || ev.day_order || ev.order;
      if (
        ev.type === "holiday" ||
        rawOrder === "-" ||
        rawOrder === "0" ||
        ev.description?.toLowerCase().includes("holiday")
      )
        map.set(normDate, true);
    });
    return map;
  }, [calendarData]);

  const handleDateClick = (day: number) => {
    const dStr = formatDate(currentCalDate.getFullYear(), currentCalDate.getMonth(), day);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const isPast = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth(), day) < now;
    if (isPast && predType !== "od") return;
    if (isWeekendStr(dStr) || holidayMap.has(dStr)) return;

    if (!isRangeMode) {
      setSelectedDates((prev) => {
        const next = { ...prev };
        if (next[dStr] === predType) {
          delete next[dStr];
        } else {
          next[dStr] = predType;
        }
        return next;
      });
    } else {
      if (!rangeStart) {
        setRangeStart(dStr);
        setSelectedDates((prev) => ({ ...prev, [dStr]: predType }));
      } else {
        let start = new Date(rangeStart);
        let end = new Date(dStr);
        if (start > end) [start, end] = [end, start];
        
        const range: Record<string, "leave" | "attend" | "od"> = {};
        for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
          const s = formatDate(dt.getFullYear(), dt.getMonth(), dt.getDate());
          if (!isWeekendStr(s) && !holidayMap.has(s)) range[s] = predType;
        }
        setSelectedDates((prev) => ({ ...prev, ...range }));
        setRangeStart(null);
        setIsRangeMode(false);
      }
    }
  };

  const activeSubject: any = useMemo(() => 
    processedList.find((s: any) => s.id === selectedId) || processedList[0] || {},
    [processedList, selectedId]
  );

  const currentActiveStat = useMemo(() => {
    if (isPredicting && activeSubject.pred) return activeSubject.pred.status;
    return getStatus(
      parseFloat(String(activeSubject.percentage || 0)),
      activeSubject.conducted || 0,
      activeSubject.present || 0
    );
  }, [isPredicting, activeSubject]);

  const activePct = isPredicting && activeSubject.pred ? activeSubject.pred.pct : parseFloat(activeSubject.percentage || "0");
  
  const themeColorClass = activePct < 75 ? "text-[#ff003c]" : activePct < 85 ? "text-[#ffb800]" : "text-[#ceff1c]";
  const barColorClass = activePct < 75 ? "bg-[#ff003c]" : activePct < 85 ? "bg-[#ffb800]" : "bg-[#ceff1c]";

  const handleScroll = () => {
    if (predictMode || introMode || !listContainerRef.current) return;
    if (scrollTimeout.current) return;

    scrollTimeout.current = setTimeout(() => {
      const container = listContainerRef.current;
      if (!container) return;

      if (container.scrollTop < 20) {
        if (processedList.length > 0 && selectedId !== processedList[0].id) {
          setSelectedId(processedList[0].id);
          Haptics.vibe(2);
        }
        scrollTimeout.current = null;
        return;
      }

      const triggerLine = container.getBoundingClientRect().top + container.offsetHeight * 0.2;
      let closestId: string | null = null;
      let minDistance = Infinity;

      itemRefs.current.forEach((el, index) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top - triggerLine);
        if (dist < minDistance) {
          minDistance = dist;
          closestId = processedList[index].id;
        }
      });

      if (closestId !== null && closestId !== selectedId) {
        setSelectedId(closestId);
        Haptics.vibe(2);
      }
      scrollTimeout.current = null;
    }, 50);
  };

  const stopProp = (e: any) => e.stopPropagation();

  const daysInMonth = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1, 0).getDate();
  const startOffset = (new Date(currentCalDate.getFullYear(), currentCalDate.getMonth(), 1).getDay() + 6) % 7;
  const monthName = currentCalDate.toLocaleString("default", { month: "long" }).toLowerCase();

  return (
    <div className="h-full w-full flex flex-col bg-[#050505] text-white font-sans relative overflow-hidden touch-pan-y">
      <div className="absolute inset-0 w-full h-full z-0 bg-[#050505]">
      </div>

      <div className="absolute top-0 left-0 w-full h-[45%] z-10">
        <AnimatePresence mode="wait">
          {!isPredicting ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col justify-between p-6 md:p-8"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/5 backdrop-blur-md">
                  {currentActiveStat.safe ? (
                    <Zap size={12} className={`transition-colors duration-300 ${themeColorClass}`} fill="currentColor" />
                  ) : (
                    <AlertCircle size={12} className={`transition-colors duration-300 ${themeColorClass}`} />
                  )}
                  <span className={`font-mono text-[10px] lowercase tracking-widest font-bold transition-colors duration-300 ${themeColorClass}`}>
                    {activeSubject.badge}
                  </span>
                </div>
                <button
                  onClick={() => setPredictMode(true)}
                  className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full active:scale-95 transition-transform"
                >
                  <CalendarIcon size={12} />
                  <span className="font-mono text-[10px] lowercase tracking-widest font-bold">predict</span>
                </button>
              </div>
              <div className="my-auto flex flex-col justify-center">
                <div className="flex items-baseline gap-3">
                  <span className={`text-[22vw] md:text-[9rem] leading-[0.8] font-black tracking-tighter transition-colors duration-300 ease-out ${themeColorClass}`} style={{ fontFamily: "Urbanosta" }}>
                    <MarginCounter value={currentActiveStat.val} />h
                  </span>
                  <span className={`text-xl md:text-2xl font-bold lowercase opacity-70 transition-colors duration-300 ${themeColorClass}`} style={{ fontFamily: "Aonic" }}>
                    {currentActiveStat.label}
                  </span>
                </div>
                {currentActiveStat.label === "recover" && activeSubject.recoveryDate && (
                  <div className="mt-4 flex items-center gap-2 bg-[#ff003c]/10 px-3 py-1.5 rounded-xl border border-[#ff003c]/10 w-fit">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#ff003c]/60">RECOVER :</span>
                    <span className="text-[14px] font-black text-[#ff003c]">
                      {new Date(activeSubject.recoveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="pb-1">
                <h3 className="text-2xl md:text-3xl font-bold lowercase leading-tight mb-3 line-clamp-1 text-white" style={{ fontFamily: "Aonic" }}>
                  {activeSubject.title?.toLowerCase()}
                </h3>
                <div className="w-full h-[4px] bg-white/10 mb-2 relative overflow-hidden rounded-full">
                  <motion.div
                    className={`h-full transition-colors duration-300 ease-out ${barColorClass}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(activePct, 100)}%` }}
                    transition={{ duration: 0.8, ease: "circOut" }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono font-bold lowercase mt-1">
                  <span className="text-white/50">{activeSubject.tagline}</span>
                  <span className="text-white/50">
                    {activeSubject.present}/{activeSubject.conducted} sessions
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="predict-results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full h-full flex flex-col justify-between p-6 md:p-8"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] lowercase tracking-widest font-bold text-white/40 mb-1">prediction active</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-black lowercase ${predType === "leave" ? "text-[#ff003c]" : "text-[#ceff1c]"}`} style={{ fontFamily: "Urbanosta" }}>
                      {predType === "leave" ? "leave" : "attend"}
                    </span>
                    <span className="text-white/20 text-xl font-bold">/</span>
                    <span className="text-white/60 text-xl font-bold lowercase" style={{ fontFamily: "Aonic" }}>{Object.keys(selectedDates).length} days</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsPredicting(false)}
                  className="p-3 bg-white/10 rounded-full text-white active:scale-90 transition-transform"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="my-auto flex flex-col justify-center">
                <div className="flex items-baseline gap-3">
                  <span className={`text-[22vw] md:text-[9rem] leading-[0.8] font-black tracking-tighter transition-colors duration-300 ease-out ${themeColorClass}`} style={{ fontFamily: "Urbanosta" }}>
                    <MarginCounter value={currentActiveStat.val} />h
                  </span>
                  <span className={`text-xl md:text-2xl font-bold lowercase opacity-70 transition-colors duration-300 ${themeColorClass}`} style={{ fontFamily: "Aonic" }}>
                    {currentActiveStat.label}
                  </span>
                </div>
                {currentActiveStat.label === "recover" && activeSubject.recoveryDate && (
                  <div className="mt-4 flex items-center gap-2 bg-[#ff003c]/10 px-3 py-1.5 rounded-xl border border-[#ff003c]/10 w-fit">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#ff003c]/60">RECOVER :</span>
                    <span className="text-[14px] font-black text-[#ff003c]">
                      {new Date(activeSubject.recoveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="pb-1">
                <h3 className="text-2xl md:text-3xl font-bold lowercase leading-tight mb-3 line-clamp-1 text-white" style={{ fontFamily: "Aonic" }}>
                  {activeSubject.title?.toLowerCase()}
                </h3>
                <div className="w-full h-[4px] bg-white/10 mb-2 relative overflow-hidden rounded-full">
                  <motion.div
                    className={`h-full transition-colors duration-300 ease-out ${barColorClass}`}
                    initial={false}
                    animate={{ width: `${Math.min(activePct, 100)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono font-bold lowercase mt-1">
                   <span className="text-white/50">impact result</span>
                   <span className={themeColorClass}>{Math.floor(activePct)}% predicted</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        ref={listContainerRef}
        onScroll={handleScroll}
        className={`absolute bottom-0 w-full overflow-y-auto bg-[#f5f6fc] text-black no-scrollbar pb-32 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] z-20 transition-transform duration-700 ease-in-out snap-y snap-mandatory ${
          introMode ? "translate-y-[60%]" : "translate-y-0"
        } ${isPredicting ? "h-[45%]" : "h-[55%]"}`}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="px-6 flex flex-col gap-4 pt-4">
          <span className="font-mono text-[10px] lowercase tracking-widest text-[#050505]/40 mb-2 block sticky top-0 bg-[#f5f6fc] z-20 py-2">
            /// {isPredicting ? "predicted margin" : "watchlist"}
          </span>

          {processedList.map((subject, index) => {
            const isSelected = subject.id === selectedId;
            const predData = subject.pred;
            const isSafe = predData.status.safe;
            const affected = predData.sessionsAffected;
            const isPredictActive = isPredicting && Object.keys(selectedDates).length > 0;
            const isPredictDimmed = isPredicting && isPredictActive && !affected;

            return (
              <div
                key={subject.id}
                ref={(el) => { itemRefs.current[index] = el; }}
                onClick={() => {
                  if (!isPredicting) {
                    itemRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
                  } else {
                    setSelectedId(subject.id);
                  }
                }}
                className={`group relative w-full p-4 rounded-2xl cursor-pointer transition-all duration-300 ease-out border snap-start scroll-mt-16 shrink-0
                    ${!isPredicting ? (isSelected ? "bg-white shadow-xl scale-[1.02] border-black/5 opacity-100 z-10" : "bg-transparent border-transparent scale-100 opacity-40 grayscale hover:opacity-80") : "bg-white shadow-sm border-transparent scale-100 opacity-100"}
                    ${isPredictDimmed ? "opacity-30 grayscale" : ""}
                `}
              >
                <div className="flex justify-between items-end mb-3">
                  <h4 className="text-lg font-bold lowercase truncate max-w-[60%]" style={{ fontFamily: "Aonic" }}>
                    {subject.title?.toLowerCase()}
                  </h4>
                  <div className="flex flex-col items-end min-w-[80px]">
                    <span className={`text-2xl font-black leading-none transition-colors duration-300 ${isSafe ? "text-[#050505]" : "text-[#ff003c]"}`} style={{ fontFamily: "Urbanosta" }}>
                      {isPredicting ? predData.status.val : Math.floor(parseFloat(subject.percentage)) + "%"}
                    </span>
                    {isPredicting && (
                      <div className="flex flex-col items-end mt-1">
                        <span className={`text-[10px] font-bold lowercase transition-colors duration-300 ${isSafe ? "text-[#050505]" : "text-[#ff003c]"}`}>
                          {predData.status.label}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-full h-[2px] bg-[#050505]/5 relative mb-3 rounded-full overflow-hidden">
                  <div className={`h-full absolute top-0 left-0 transition-all duration-300 ${isSafe ? "bg-[#050505]" : "bg-[#ff003c]"}`}
                    style={{ width: `${Math.min(isPredicting ? predData.pct : parseFloat(subject.percentage), 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono tracking-wide text-[#050505]/50 lowercase">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${isSafe ? "bg-[#ceff1c]" : "bg-[#ff003c]"}`} />
                    <span>{subject.code?.toLowerCase()} ({subject.type?.toLowerCase()})</span>
                  </div>
                  {isPredicting && <span className="font-bold flex items-center gap-1">{Math.floor(predData.pct)}%</span>}
                </div>
              </div>
            );
          })}
          <div className="h-[20vh] shrink-0 pointer-events-none" />
        </div>
      </div>

      <AnimatePresence>
        {introMode && (
          <motion.div
            key="introOverlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col justify-end items-start p-8 pb-[60%] z-50 bg-[#050505]"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <h1 className={`text-6xl font-black lowercase tracking-tighter mb-2 ${overallStats.color}`} style={{ fontFamily: "Aonic" }}>
                {overallStats.badge}
              </h1>
              <div className="text-xl font-bold lowercase text-white/80 leading-tight max-w-[80%] flex items-center gap-2" style={{ fontFamily: "Aonic" }}>
                <UserAvatar seed={profileSeed} className="w-6 h-6 shrink-0" />
                {overallStats.tagline}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BrutalistPredict
        isOpen={predictMode}
        onClose={() => setPredictMode(false)}
        predictAction={predType}
        setPredictAction={setPredType}
        calYear={currentCalDate.getFullYear()}
        calMonth={currentCalDate.getMonth()}
        monthName={monthName}
        setCurrentCalDate={setCurrentCalDate}
        startOffset={startOffset}
        daysInMonth={daysInMonth}
        formatDate={formatDate}
        isWeekendStr={isWeekendStr}
        holidayMap={holidayMap}
        isRangeMode={isRangeMode}
        setIsRangeMode={setIsRangeMode}
        rangeStart={rangeStart}
        setRangeStart={setRangeStart}
        setRangeEnd={() => {}}
        selectedDates={selectedDates}
        setSelectedDates={setSelectedDates}
        handleDateClick={handleDateClick}
        setIsPredicting={setIsPredicting}
      />
    </div>
  );
};

export default MobileAttendance;
