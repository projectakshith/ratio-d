"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import {
  AlertCircle,
  Zap,
  Calendar as CalendarIcon,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { flavorText } from "@/utils/shared/flavortext";

import { CalendarEvent, AcademiaData, ScheduleData } from "@/types";

const MarginCounter = ({ value }: { value: number }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    if (Math.abs(prevValue.current - value) < 1) {
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
  schedule,
}: {
  data: AcademiaData;
  schedule: ScheduleData;
}) => {
  const [calendarData, setCalendarData] = useState<CalendarEvent[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [predictMode, setPredictMode] = useState(false);
  const [introMode, setIntroMode] = useState(true);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [predType, setPredType] = useState<"leave" | "attend">("leave");
  const [calMonth, setCalMonth] = useState(new Date());
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);

  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch("/calendar_data.json")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCalendarData(data);
      })
      .catch((err) => console.error(err));
  }, []);

  const effectiveSchedule = useMemo(() => {
    if (schedule) return schedule;
    if (data?.timetable) return data.timetable;
    if (data?.schedule) return data.schedule;
    if (data?.time_table) return data.time_table;
    return {};
  }, [data, schedule]);

  const rawAttendance = useMemo(() => Array.isArray(data?.attendance) ? data.attendance : [], [data]);

  const baseAttendance = useMemo(() => {
    return rawAttendance
      .map((subject: any, index: number) => {
        const pct = parseFloat(String(subject?.percent || "0"));
        let category = pct < 75 ? "cooked" : pct >= 85 ? "safe" : "danger";
        const list = flavorText.header?.[category] ||
          flavorText.header?.danger || ["..."];
        const stableBadge = list[Math.floor(index % list.length)].toLowerCase();
        const safeTitle =
          subject.title || subject.courseTitle || "Unknown Subject";
        return {
          id: index,
          title: safeTitle,
          rawTitle: safeTitle,
          code: String(subject?.code || ""),
          percentage: String(subject?.percent || "0"),
          conducted: parseInt(String(subject?.conducted || "4")),
          present:
            parseInt(String(subject?.conducted || "0")) -
            parseInt(String(subject?.absent || "0")),
          badge: category,
          tagline: stableBadge,
          isPractical:
            (subject.slot || "").toUpperCase().includes("P") ||
            (subject.slot || "").toUpperCase().includes("LAB") ||
            safeTitle.toLowerCase().includes("practical") ||
            safeTitle.toLowerCase().includes("lab"),
        };
      })
      .sort((a, b) => parseFloat(a.percentage) - parseFloat(b.percentage));
  }, [rawAttendance]);

  const overallStats = useMemo(() => {
    if (baseAttendance.length === 0)
      return {
        pct: 0,
        badge: "safe",
        tagline: "all good",
        color: "text-theme-highlight",
      };
    let totalConducted = 0;
    let totalPresent = 0;
    baseAttendance.forEach((s) => {
      totalConducted += s.conducted;
      totalPresent += s.present;
    });
    const overallPct =
      totalConducted === 0 ? 0 : (totalPresent / totalConducted) * 100;
    let category =
      overallPct < 75 ? "cooked" : overallPct >= 85 ? "safe" : "danger";
    const list = flavorText.header?.[category] || ["..."];
    const badge = list[0].toLowerCase();
    let tagline = "you're doing great";
    if (category === "cooked") tagline = "academic comeback needed";
    if (category === "danger") tagline = "treading on thin ice";
    const color =
      category === "safe"
        ? "text-theme-highlight"
        : category === "danger"
          ? "text-theme-secondary"
          : "text-theme-accent";
    return { pct: overallPct, badge, tagline, color };
  }, [baseAttendance]);

  useEffect(() => {
    if (baseAttendance.length > 0 && selectedId === null) {
      setSelectedId(baseAttendance[0].id);
    }
  }, [baseAttendance, selectedId]);

  useEffect(() => {
    const timer = setTimeout(() => setIntroMode(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!predictMode) {
      setSelectedDates([]);
      setPredType("leave");
      setRangeStart(null);
      setIsRangeMode(false);
    }
  }, [predictMode]);

  const getImpactMap = useCallback(() => {
    const impact: Record<string, number> = {};
    if (
      calendarData.length === 0 ||
      Object.keys(effectiveSchedule).length === 0
    )
      return impact;
    selectedDates.forEach((dateStr) => {
      const dayInfo = calendarData.find((c) => {
        if (!c.date) return false;
        const cDate = new Date(c.date);
        const targetDate = new Date(dateStr);
        return (
          cDate.getDate() === targetDate.getDate() &&
          cDate.getMonth() === targetDate.getMonth() &&
          cDate.getFullYear() === targetDate.getFullYear()
        );
      });
      if (
        dayInfo &&
        dayInfo.order &&
        dayInfo.order !== "-" &&
        !isNaN(parseInt(dayInfo.order))
      ) {
        const dayOrderKey = `Day ${parseInt(dayInfo.order)}`;
        const dayClasses =
          effectiveSchedule[dayOrderKey] ||
          effectiveSchedule[`Day ${dayInfo.order}`];
        if (dayClasses) {
          Object.values(dayClasses).forEach((cls: any) => {
            if (!cls.course) return;
            const matchedSubject = baseAttendance.find((s) => {
              const sCode = (s.code || "").toLowerCase().trim();
              const cCode = (cls.code || "").toLowerCase().trim();
              if (sCode && cCode && sCode === cCode) return true;
              const sName = s.rawTitle.toLowerCase().replace(/[^a-z0-9]/g, "");
              const cName = cls.course.toLowerCase().replace(/[^a-z0-9]/g, "");
              return (
                sName === cName ||
                (sName.length > 4 && cName.length > 4 && sName.includes(cName))
              );
            });
            if (matchedSubject) {
              impact[matchedSubject.code] =
                (impact[matchedSubject.code] || 0) + 1;
            }
          });
        }
      }
    });
    return impact;
  }, [calendarData, effectiveSchedule, baseAttendance, selectedDates]);

  const predictionImpact = useMemo(
    () => getImpactMap(),
    [getImpactMap],
  );

  const getStatus = useCallback((pct: number, conducted: number, present: number) => {
    if (pct >= 75) {
      const margin = Math.floor(present / 0.75 - conducted);
      return { val: Math.max(0, margin), label: "margin", safe: true };
    }
    const needed = Math.ceil((0.75 * conducted - present) / 0.25);
    return { val: Math.max(0, needed), label: "recover", safe: false };
  }, []);

  const processedList = useMemo(() => {
    const list = baseAttendance.map((subject) => {
      const sessions = predictionImpact[subject.code] || 0;
      const currentPresent = subject.present;
      const currentConducted = subject.conducted;
      const newPresent =
        predType === "attend" ? currentPresent + sessions : currentPresent;
      const newConducted = currentConducted + sessions;
      const newPct = newConducted === 0 ? 0 : (newPresent / newConducted) * 100;
      const currentStatus = getStatus(
        parseFloat(subject.percentage),
        currentConducted,
        currentPresent,
      );
      const newStatus = getStatus(newPct, newConducted, newPresent);
      return {
        ...subject,
        pred: {
          pct: newPct,
          status: newStatus,
          currentStatus: currentStatus,
          diffVal: newStatus.val - currentStatus.val,
          sessionsAffected: sessions > 0,
        },
      };
    });
    if (predictMode) {
      return list.sort((a, b) => {
        const scoreA = !a.pred.status.safe
          ? a.pred.status.val + 1000
          : -a.pred.status.val;
        const scoreB = !b.pred.status.safe
          ? b.pred.status.val + 1000
          : -b.pred.status.val;
        return scoreB - scoreA;
      });
    }
    return list.sort(
      (a, b) => parseFloat(a.percentage) - parseFloat(b.percentage),
    );
  }, [baseAttendance, predictionImpact, predType, predictMode, getStatus]);

  useEffect(() => {
    if (predictMode && listContainerRef.current) {
      listContainerRef.current.scrollTop = 0;
      if (processedList.length > 0) {
        setSelectedId(processedList[0].id);
      }
    }
  }, [predictMode, processedList]);

  const formatDateKey = (date: Date) => {
    const dayStr = String(date.getDate()).padStart(2, "0");
    const monthStr = date.toLocaleString("en-US", { month: "short" });
    const yearStr = date.getFullYear();
    return `${dayStr} ${monthStr} ${yearStr}`;
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(
      calMonth.getFullYear(),
      calMonth.getMonth(),
      day,
    );
    const dateKey = formatDateKey(clickedDate);
    if (isRangeMode) {
      if (!rangeStart) {
        setRangeStart(clickedDate);
        if (!selectedDates.includes(dateKey))
          setSelectedDates([...selectedDates, dateKey]);
      } else {
        const start = rangeStart < clickedDate ? rangeStart : clickedDate;
        const end = rangeStart < clickedDate ? clickedDate : rangeStart;
        const newDates = [...selectedDates];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const key = formatDateKey(d);
          if (!newDates.includes(key)) newDates.push(key);
        }
        setSelectedDates(newDates);
        setRangeStart(null);
        setIsRangeMode(false);
      }
    } else {
      if (selectedDates.includes(dateKey)) {
        setSelectedDates(selectedDates.filter((d) => d !== dateKey));
      } else {
        setSelectedDates([...selectedDates, dateKey]);
      }
    }
  };

  const activeSubject: any =
    processedList.find((s: any) => s.id === selectedId) ||
    processedList[0] ||
    {};
  const currentActiveStat =
    predictMode && activeSubject.pred
      ? activeSubject.pred.status
      : getStatus(
          parseFloat(String(activeSubject.percentage || 0)),
          activeSubject.conducted || 0,
          activeSubject.present || 0,
        );

  const activePct =
    predictMode && activeSubject.pred
      ? activeSubject.pred.pct
      : parseFloat(activeSubject.percentage || "0");
  const themeColorClass =
    activePct < 75
      ? "text-theme-accent"
      : activePct < 85
        ? "text-theme-secondary"
        : "text-theme-highlight";
  const barColorClass =
    activePct < 75
      ? "bg-theme-accent"
      : activePct < 85
        ? "bg-theme-secondary"
        : "bg-theme-highlight";

  // Smooth RequestAnimationFrame scroll logic tuned for "snap-start"
  const handleScroll = () => {
    if (predictMode || introMode || !listContainerRef.current) return;
    if (scrollTimeout.current) return;

    scrollTimeout.current = setTimeout(() => {
      const container = listContainerRef.current;
      if (!container) return;

      if (container.scrollTop < 20) {
        if (processedList.length > 0 && selectedId !== processedList[0].id) {
          setSelectedId(processedList[0].id);
          if (navigator.vibrate) navigator.vibrate(2);
        }
        scrollTimeout.current = null;
        return;
      }

      const triggerLine =
        container.getBoundingClientRect().top + container.offsetHeight * 0.2;
      let closestId: number | null = null;
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
        if (navigator.vibrate) navigator.vibrate(2);
      }
      scrollTimeout.current = null;
    }, 50);
  };

  const stopProp = (e) => e.stopPropagation();

  return (
    <div className="h-full w-full flex flex-col bg-theme-bg text-theme-text font-sans relative overflow-hidden touch-pan-y">
      <div className="absolute inset-0 w-full h-full z-0 bg-theme-bg">
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat mix-blend-screen" />
      </div>

      <div className="absolute top-0 left-0 w-full h-[45%] z-10">
        <AnimatePresence mode="wait">
          {!predictMode ? (
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
                    <Zap
                      size={12}
                      className={`transition-colors duration-300 ${themeColorClass}`}
                      fill="currentColor"
                    />
                  ) : (
                    <AlertCircle
                      size={12}
                      className={`transition-colors duration-300 ${themeColorClass}`}
                    />
                  )}
                  <span
                    className={`font-mono text-[10px] lowercase tracking-widest font-bold transition-colors duration-300 ${themeColorClass}`}
                  >
                    {activeSubject.badge}
                  </span>
                </div>
                <button
                  onClick={() => setPredictMode(true)}
                  className="flex items-center gap-2 bg-theme-surface text-theme-text px-4 py-2 rounded-full active:scale-95 transition-transform"
                >
                  <CalendarIcon size={12} />
                  <span className="font-mono text-[10px] lowercase tracking-widest font-bold">
                    predict
                  </span>
                </button>
              </div>
              <div className="my-auto flex flex-col justify-center">
                <div className="flex items-baseline gap-3">
                  <span
                    className={`text-[22vw] md:text-[9rem] leading-[0.8] font-black tracking-tighter transition-colors duration-300 ease-out ${themeColorClass}`}
                    style={{ fontFamily: "Urbanosta" }}
                  >
                    <MarginCounter value={currentActiveStat.val} />h
                  </span>
                  <span
                    className={`text-xl md:text-2xl font-bold lowercase opacity-70 transition-colors duration-300 ${themeColorClass}`}
                    style={{ fontFamily: "Aonic" }}
                  >
                    {currentActiveStat.label}
                  </span>
                </div>
              </div>
              <div className="pb-1">
                <h3
                  className="text-2xl md:text-3xl font-bold lowercase leading-tight mb-3 line-clamp-1 text-theme-text"
                  style={{ fontFamily: "Aonic" }}
                >
                  {activeSubject.title?.toLowerCase()}
                </h3>
                <div className="w-full h-[4px] bg-white/10 mb-2 relative overflow-hidden rounded-full">
                  <motion.div
                    className={`h-full transition-colors duration-300 ease-out ${barColorClass}`}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(parseFloat(activeSubject.percentage || "0"), 100)}%`,
                    }}
                    transition={{ duration: 0.8, ease: "circOut" }}
                  />
                </div>
                <span className="block text-[10px] font-mono font-bold lowercase mt-1 text-theme-text/50">
                  {activeSubject.present}/{activeSubject.conducted} sessions
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="predict"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full h-full flex flex-col p-6 text-theme-text"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 opacity-60">
                  <CalendarIcon size={14} />
                  <span className="font-mono text-[10px] lowercase tracking-widest font-bold">
                    predict
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {isRangeMode && (
                    <span className="text-[9px] font-bold text-theme-text/40 animate-pulse">
                      {rangeStart ? "Select end date" : "Select start date"}
                    </span>
                  )}
                  <button
                    onClick={() => setIsRangeMode(!isRangeMode)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${isRangeMode ? "bg-theme-surface text-theme-text border-theme-text/20" : "bg-transparent text-theme-text/60 border-theme-text/20"}`}
                  >
                    {isRangeMode ? "Range On" : "Select Range"}
                  </button>
                  <button
                    onClick={() => setPredictMode(false)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-3 mb-2 flex-1 flex flex-col min-h-0 border border-white/10">
                  <div className="flex justify-between items-center mb-2 px-2">
                    <button
                      onClick={() =>
                        setCalMonth(
                          new Date(
                            calMonth.getFullYear(),
                            calMonth.getMonth() - 1,
                            1,
                          ),
                        )
                      }
                      className="p-1 hover:bg-white/10 rounded-full"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span
                      className="font-bold uppercase tracking-wide text-xs"
                      style={{ fontFamily: "Aonic" }}
                    >
                      {calMonth.toLocaleString("default", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <button
                      onClick={() =>
                        setCalMonth(
                          new Date(
                            calMonth.getFullYear(),
                            calMonth.getMonth() + 1,
                            1,
                          ),
                        )
                      }
                      className="p-1 hover:bg-white/10 rounded-full"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 text-center mb-1">
                    {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-bold text-theme-text/30"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-y-1 justify-items-center overflow-y-auto custom-scrollbar">
                    {Array.from({
                      length:
                        new Date(
                          calMonth.getFullYear(),
                          calMonth.getMonth(),
                          1,
                        ).getDay() === 0
                          ? 6
                          : new Date(
                              calMonth.getFullYear(),
                              calMonth.getMonth(),
                              1,
                            ).getDay() - 1,
                    }).map((_, i) => (
                      <div key={`e-${i}`} />
                    ))}
                    {Array.from({
                      length: new Date(
                        calMonth.getFullYear(),
                        calMonth.getMonth() + 1,
                        0,
                      ).getDate(),
                    }).map((_, i) => {
                      const d = i + 1;
                      const dateObj = new Date(
                        calMonth.getFullYear(),
                        calMonth.getMonth(),
                        d,
                      );
                      const dateKey = formatDateKey(dateObj);
                      const isSelected = selectedDates.includes(dateKey);
                      const isToday =
                        dateObj.toDateString() === new Date().toDateString();
                      const isRangeStart =
                        rangeStart &&
                        rangeStart.toDateString() === dateObj.toDateString();
                      return (
                        <button
                          key={dateKey}
                          onClick={() => handleDateClick(d)}
                          className={`w-8 h-8 flex items-center justify-center rounded-full text-[10px] font-bold transition-all relative ${isSelected ? "bg-theme-highlight text-theme-bg scale-105 z-10" : isRangeStart ? "bg-theme-text/50 text-theme-bg" : isToday ? "bg-transparent text-theme-text ring-2 ring-theme-text" : "text-theme-text/60 hover:bg-theme-text/10"}`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex bg-white/10 border border-white/5 p-1 rounded-full w-full max-w-[200px] relative h-10">
                    <motion.div
                      layoutId="predToggle"
                      className={`absolute rounded-full h-[calc(100%-8px)] top-1 ${predType === "attend" ? "bg-theme-surface" : "bg-theme-accent"}`}
                      style={{
                        width: "calc(50% - 4px)",
                        left: predType === "attend" ? 4 : "50%",
                      }}
                    />
                    <button
                      onClick={() => setPredType("attend")}
                      className={`flex-1 text-[10px] font-black uppercase tracking-wider relative z-10 transition-colors ${predType === "attend" ? "text-theme-text" : "text-theme-text/40"}`}
                    >
                      Attend
                    </button>
                    <button
                      onClick={() => setPredType("leave")}
                      className={`flex-1 text-[10px] font-black uppercase tracking-wider relative z-10 transition-colors ${predType === "leave" ? "text-theme-text" : "text-theme-text/40"}`}
                    >
                      Leave
                    </button>
                  </div>
                  <div className="flex-1 flex justify-end items-center">
                    <div className="flex flex-col items-end">
                      <span
                        className="text-2xl font-black leading-none"
                        style={{ fontFamily: "Urbanosta" }}
                      >
                        {selectedDates.length}
                      </span>
                      <span className="text-[8px] font-bold uppercase opacity-50">
                        Sessions
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* LIST - Native CSS Snapping, Pre-Rendered */}
      <div
        ref={listContainerRef}
        onScroll={handleScroll}
        onTouchStart={stopProp}
        onTouchMove={stopProp}
        onTouchEnd={stopProp}
        className={`absolute bottom-0 w-full overflow-y-auto bg-theme-surface text-theme-text custom-scrollbar pb-32 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] z-20 transition-transform duration-700 ease-in-out snap-y snap-mandatory ${
          introMode ? "translate-y-[60%]" : "translate-y-0"
        } ${predictMode ? "h-[45%]" : "h-[55%]"}`}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="px-6 flex flex-col gap-4 pt-4">
          <span className="font-mono text-[10px] lowercase tracking-widest text-theme-text/40 mb-2 block sticky top-0 bg-theme-surface z-20 py-2">
            {/* {predictMode ? "predicted margin" : "watchlist"} */}
          </span>

          {processedList.map((subject, index) => {
            const isSelected = subject.id === selectedId;
            const predData = subject.pred;
            const isSafe = predData.status.safe;
            const affected = predData.sessionsAffected;
            const dStat = predData.currentStatus;
            const isPredictActive = predictMode && selectedDates.length > 0;
            const isPredictDimmed = predictMode && isPredictActive && !affected;

            return (
              <div
                key={subject.id}
                data-id={subject.id}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                onClick={() => {
                  if (!predictMode) {
                    itemRefs.current[index]?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }}
                // Swapped to snap-start so no top spacing is required
                className={`group relative w-full p-4 rounded-2xl cursor-pointer transition-all duration-300 ease-out border snap-start scroll-mt-16 shrink-0
                    ${
                      !predictMode
                        ? isSelected
                          ? "bg-white shadow-xl scale-[1.02] border-black/5 opacity-100 z-10"
                          : "bg-transparent border-transparent scale-100 opacity-40 grayscale hover:opacity-80"
                        : "bg-white shadow-sm border-transparent scale-100 opacity-100"
                    }
                    ${isPredictDimmed ? "opacity-30 grayscale" : ""}
                `}
              >
                <div className="flex justify-between items-end mb-3">
                  <h4
                    className="text-lg font-bold lowercase truncate max-w-[60%]"
                    style={{ fontFamily: "Aonic" }}
                  >
                    {subject.title?.toLowerCase()}
                  </h4>
                  <div className="flex flex-col items-end min-w-[80px]">
                    <span
                      className={`text-2xl font-black leading-none transition-colors duration-300 ${predictMode ? (isSafe ? "text-theme-text" : "text-theme-accent") : currentActiveStat.safe ? "text-theme-text" : "text-theme-accent"}`}
                      style={{ fontFamily: "Urbanosta" }}
                    >
                      {predictMode
                        ? predData.status.val
                        : Math.floor(parseFloat(subject.percentage)) + "%"}
                    </span>
                    {predictMode && (
                      <div className="flex flex-col items-end mt-1">
                        <span
                          className={`text-[10px] font-bold lowercase transition-colors duration-300 ${isSafe ? "text-theme-text" : "text-theme-accent"}`}
                        >
                          {predData.status.label}
                        </span>
                        {affected && predData.diffVal !== 0 && (
                          <span className="text-[9px] font-bold text-theme-text/40 mt-0.5 font-mono">
                            {dStat.val}h &rarr; {predData.status.val}h
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-full h-[2px] bg-theme-text/5 relative mb-3 rounded-full overflow-hidden">
                  {predictMode && (
                    <div
                      className="h-full absolute top-0 left-0 bg-black/10"
                      style={{
                        width: `${Math.min(parseFloat(subject.percentage), 100)}%`,
                      }}
                    />
                  )}
                  <div
                    className={`h-full absolute top-0 left-0 transition-all duration-300 ${predictMode ? (isSafe ? "bg-theme-text" : "bg-theme-accent") : currentActiveStat.safe ? "bg-theme-text" : "bg-theme-accent"}`}
                    style={{
                      width: `${Math.min(predictMode ? predData.pct : parseFloat(subject.percentage), 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono tracking-wide text-theme-text/50 lowercase">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${predictMode ? (isSafe ? "bg-theme-highlight" : "bg-theme-accent") : currentActiveStat.safe ? "bg-theme-highlight" : "bg-theme-accent"}`}
                    />
                    <span>{subject.code?.toLowerCase()}</span>
                  </div>
                  {predictMode && (
                    <span className="font-bold flex items-center gap-1">
                      {affected && (
                        <span className="w-1 h-1 bg-black rounded-full animate-pulse" />
                      )}
                      {Math.floor(predData.pct)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {/* Small spacer to allow the final element to scroll up fully */}
          <div className="h-[20vh] shrink-0 pointer-events-none" />
        </div>
      </div>

      {/* INTRO OVERLAY - Completely decoupled from list rendering */}
      <AnimatePresence>
        {introMode && (
          <motion.div
            key="introOverlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col justify-end items-start p-8 pb-[60%] z-50 bg-theme-bg"
          >
            <h1
              className={`text-6xl font-black lowercase tracking-tighter mb-2 ${overallStats.color}`}
              style={{ fontFamily: "Aonic" }}
            >
              {overallStats.badge}
            </h1>
            <p
              className="text-xl font-bold lowercase text-theme-text/80 leading-tight max-w-[80%]"
              style={{ fontFamily: "Aonic" }}
            >
              {overallStats.tagline}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileAttendance;
