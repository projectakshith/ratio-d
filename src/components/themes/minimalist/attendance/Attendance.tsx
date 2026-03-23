"use client";
import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calculator, X, ChevronRight as ChevronRightIcon, Loader } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import {
  getBaseAttendance,
  getImpactMap,
  getProcessedList,
  getStatus,
  getAcronym,
} from "@/utils/attendance/attendanceLogic";
import calendarDataJson from "@/data/calendar_data.json";
import Predict from "./Predict";
import { AcademiaData } from "@/types";
import { useAppLayout } from "@/context/AppLayoutContext";
import { getOverallStats } from "@/utils/attendance/attendanceLogic";
import { getRandomRoast } from "@/utils/shared/flavortext";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: -20, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 450, damping: 30 } as const,
  },
};

export default function Attendance({
  data,
  academia,
}: {
  data: AcademiaData;
  academia: any;
}) {
  const { setIsSwipeDisabled } = useAppLayout();
  const [isPredictOverlay, setIsPredictOverlay] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const {
    pullY,
    isRefreshing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = usePullToRefresh(isPredictOverlay);

  useEffect(() => {
    if (setIsSwipeDisabled) {
      setIsSwipeDisabled(isPredictOverlay);
    }
  }, [isPredictOverlay, setIsSwipeDisabled]);

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

  const baseAttendance = useMemo(
    () => getBaseAttendance(data?.attendance || []),
    [data?.attendance],
  );

  const impactMap = useMemo(() => {
    if (!isPredicting || selectedDates.length === 0) return {};
    const calDataToUse = (academia?.calendarData?.length > 0) ? academia.calendarData : (calendarDataJson || []);
    return getImpactMap(
      selectedDates,
      calDataToUse,
      academia?.effectiveSchedule || data?.schedule || data?.timetable || {},
      baseAttendance,
    );
  }, [isPredicting, selectedDates, academia, baseAttendance, data?.schedule, data?.timetable]);

  const processedList = useMemo(() => {
    const list = getProcessedList(
      baseAttendance,
      impactMap,
      predictAction,
      isPredicting,
    );
    return list.map((s) => {
      const origStatus = getStatus(
        parseFloat(s.percentage),
        s.conducted,
        s.present,
      );
      return {
        ...s,
        displayCode: getAcronym(s.title),
        fullName: s.title.toLowerCase(),
        percent: s.pred.pct.toFixed(1),
        safe: s.pred.status.safe,
        val: s.pred.status.val,
        sessionsAffected: s.pred.sessionsAffected,
        originalVal: origStatus.val,
        originalLabel: origStatus.label,
        currentLabel: s.pred.status.label,
        hasChanged: s.pred.status.val !== origStatus.val || s.pred.status.label !== origStatus.label,
      };
    });
  }, [baseAttendance, impactMap, predictAction, isPredicting]);

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

  const stats = useMemo(() => {
    let totalC = 0,
      totalP = 0;
    baseAttendance.forEach((s) => {
      const sessions = impactMap[s.id] || 0;
      totalC += s.conducted + sessions;
      totalP += s.present + (predictAction === "attend" ? sessions : 0);
    });
    const pct = totalC === 0 ? 0 : (totalP / totalC) * 100;
    
    const overallStats = getOverallStats(baseAttendance);
    const roast = getRandomRoast(overallStats.badge as any);
    
    return { percent: pct.toFixed(1), safe: pct >= 75, roast };
  }, [baseAttendance, impactMap, predictAction]);

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

  const holidayMap = useMemo(() => {
    const calDataToUse =
      academia?.calendarData?.length > 0
        ? academia.calendarData
        : calendarDataJson || [];
    const map = new Map();
    calDataToUse.forEach((ev: any) => {
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
  }, [academia]);

  const handleDateClick = (day: number) => {
    const dStr = formatDate(calYear, calMonth, day);
    if (isWeekendStr(dStr) || holidayMap.has(dStr)) return;
    if (!isRangeMode)
      setSelectedDates((prev) =>
        prev.includes(dStr) ? prev.filter((d) => d !== dStr) : [...prev, dStr],
      );
    else {
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
        const range: string[] = [];
        for (
          let dt = new Date(start);
          dt <= end;
          dt.setDate(dt.getDate() + 1)
        ) {
          const s = formatDate(dt.getFullYear(), dt.getMonth(), dt.getDate());
          if (!isWeekendStr(s) && !holidayMap.has(s)) range.push(s);
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
          __html: `.warning-dotted-rect { background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='14' stroke='%23FF4D4D' stroke-width='3' stroke-dasharray='6%2c 10' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e"); border-radius: 24px; } .affected-dotted-border { border-style: dashed !important; border-width: 2px !important; border-color: color-mix(in srgb, var(--theme-text) 40%, transparent) !important; }`,
        }}
      />
      <div className="absolute inset-0 bg-theme-bg overflow-hidden">
        <div
          className="fixed top-0 left-0 w-full flex justify-center pt-8 z-50 transition-opacity duration-300 pointer-events-none"
          style={{
            opacity: Math.min(pullY / 60, 1),
            transform: `translateY(${pullY * 0.3}px)`,
          }}
        >
          <Loader
            className="w-6 h-6 text-theme-muted"
            style={{
              animation: isRefreshing ? "spin 1s linear infinite" : "none",
              transform: `rotate(${pullY * 2}deg)`,
            }}
          />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{ y: pullY }}
          className="h-full w-full overflow-y-auto no-scrollbar px-6 pt-10 pb-[180px] flex flex-col relative z-10"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <motion.div
            variants={itemVariants}
            className="w-full flex flex-col items-center mt-2 mb-12 shrink-0"
          >
            <span
              className="text-[12px] font-bold lowercase tracking-[0.3em] mb-3 text-theme-muted"
              style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
            >
              overall attendance
            </span>
            <div className="flex items-baseline gap-1">
              <span
                className="text-[7.5rem] leading-[0.8] font-black tracking-tighter text-theme-text"
                style={{
                  fontFamily: "var(--font-montserrat), sans-serif",
                }}
              >
                {stats.percent}
              </span>
              <span
                className="text-[2.5rem] font-bold text-theme-muted"
                style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
              >
                %
              </span>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex flex-col mb-8 w-full shrink-0"
          >
            {!isPredicting ? (
              <button
                onClick={() => setIsPredictOverlay(true)}
                className="w-full relative group transition-all duration-200"
              >
                <div
                  className="absolute inset-0 bg-theme-text rounded-[24px] translate-y-1.5 transition-transform group-hover:translate-y-2"
                />
                <div
                  className="relative w-full border-[1.5px] border-theme-text bg-theme-bg text-theme-text rounded-[24px] p-4 flex items-center justify-between transition-transform group-hover:-translate-y-0.5 group-active:translate-y-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-theme-surface flex items-center justify-center">
                      <Calculator
                        size={20}
                        strokeWidth={2.5}
                        className="text-theme-text"
                      />
                    </div>
                    <div className="flex flex-col items-start">
                      <span
                        className="text-[14px] font-black uppercase tracking-widest leading-none"
                        style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                      >
                        PREDICT
                      </span>
                      <span
                        className="text-[10px] font-bold lowercase tracking-wider text-theme-muted mt-1"
                        style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                      >
                        calculate future attendance
                      </span>
                    </div>
                  </div>
                  <div
                    className="w-9 h-9 rounded-full bg-theme-surface border border-theme-border flex items-center justify-center"
                    style={{ boxShadow: '2px 2px 0px var(--theme-text)' }}
                  >
                    <ChevronRightIcon
                      size={20}
                      strokeWidth={3}
                      className="text-theme-text"
                    />
                  </div>
                </div>
              </button>
            ) : (
              <div className="w-full relative group transition-all duration-200">
                <div
                  className="absolute inset-0 bg-theme-text rounded-[24px] translate-y-1.5"
                />
                <div
                  className="relative w-full border-[1.5px] border-theme-text bg-theme-text rounded-[24px] p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-theme-bg-alpha flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-theme-bg animate-pulse" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span
                        className="text-[14px] font-black uppercase tracking-widest text-theme-bg leading-none"
                        style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                      >
                        predicting
                      </span>
                      <span
                        className="text-[10px] font-bold lowercase tracking-wider text-theme-bg-60 mt-1"
                        style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                      >
                        {selectedDates.length} days{" "}
                        {predictAction === "leave" ? "off" : "present"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPredictOverlay(true)}
                      className="w-9 h-9 rounded-full bg-theme-bg-alpha border border-theme-bg-10 flex items-center justify-center text-theme-bg transition-all"
                    >
                      <ChevronRightIcon size={18} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => {
                        setIsPredicting(false);
                        setSelectedDates([]);
                        setRangeStart(null);
                        setRangeEnd(null);
                      }}
                      className="w-9 h-9 rounded-full bg-[#FF4D4D]/20 border border-[#FF4D4D]/20 flex items-center justify-center text-[#FF4D4D] transition-all"
                    >
                      <X size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {actionRequired.length > 0 && (
            <motion.div
              variants={itemVariants}
              className="w-full p-5 flex flex-col gap-4 mb-12 rounded-[32px] shrink-0 border-[2px] border-dashed"
              style={{ 
                borderColor: 'color-mix(in srgb, var(--theme-secondary) 50%, transparent)',
                backgroundColor: 'color-mix(in srgb, var(--theme-secondary) 5%, transparent)',
                borderDasharray: '12 16'
              } as any}
            >
              <div className="flex items-center gap-3 w-full">
                <span
                  className="text-[12px] font-bold lowercase tracking-[0.25em] text-[#FF4D4D] whitespace-nowrap"
                  style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                >
                  action required
                </span>
                <div className="flex-1 h-[1.5px] bg-[#FF4D4D]/20 rounded-full" />
              </div>
              {actionRequired.map((sub: any) => (
                <div
                  key={sub.id}
                  className={`w-full bg-theme-surface border-[1.5px] rounded-[18px] p-4 flex flex-col shadow-sm transition-all ${isPredicting && sub.hasChanged ? "affected-dotted-border" : "border-[#FF4D4D]/20"}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col items-center justify-center min-w-[80px] shrink-0">
                      <span
                        className="text-[3.2rem] leading-[0.8] font-black tracking-tighter"
                        style={{
                          fontFamily: "var(--font-montserrat), sans-serif",
                          color: "#FF4D4D",
                        }}
                      >
                        {sub.val}
                      </span>
                      {isPredicting && sub.hasChanged ? (
                        <div className="flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-[#FF4D4D]/10 border border-[#FF4D4D]/20">
                          <span className="text-[10px] font-bold opacity-40 text-[#FF4D4D]">
                            {sub.originalVal}
                          </span>
                          <ChevronRightIcon size={8} className="opacity-40 text-[#FF4D4D]" />
                          <span className="text-[10px] font-black text-[#FF4D4D]">
                            {sub.val}
                          </span>
                        </div>
                      ) : (
                        <span
                          className="text-[10px] font-bold uppercase tracking-widest mt-1 text-center"
                          style={{
                            fontFamily: "var(--font-afacad), sans-serif",
                            color: "#FF4D4Db3",
                          }}
                        >
                          {sub.currentLabel}
                        </span>
                      )}
                      {isPredicting && sub.hasChanged && sub.originalLabel !== sub.currentLabel && (
                        <span className="text-[8px] font-black uppercase tracking-tighter mt-1 text-[#FF4D4D]/60 text-center">
                          {sub.originalLabel} → {sub.currentLabel}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col items-end text-right min-w-0 ml-4">
                      <div className="flex items-center gap-2 mb-1">
                        {sub.isPractical && (
                          <span
                            className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#0EA5E9] bg-[#0EA5E9]/10 px-2 py-0.5 rounded-md"
                            style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                          >
                            practical
                          </span>
                        )}
                        <span
                          className="text-[16px] font-black uppercase tracking-widest leading-[1.1] truncate"
                          style={{
                            fontFamily: "var(--font-montserrat), sans-serif",
                            color: "#FF4D4D",
                          }}
                        >
                          {sub.displayCode}
                        </span>
                      </div>
                      <span
                        className="text-[12px] font-medium lowercase tracking-wide leading-[1.1] truncate w-full"
                        style={{
                          fontFamily: "var(--font-afacad), sans-serif",
                          color: "#FF4D4Db3",
                        }}
                      >
                        {sub.fullName}
                      </span>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className="text-[12px] font-bold opacity-70"
                          style={{ color: "#FF4D4D" }}
                        >
                          {sub.present}/{sub.conducted}
                        </span>
                        <div
                          className="w-[3px] h-[3px] rounded-full opacity-40"
                          style={{ backgroundColor: "#FF4D4D" }}
                        />
                        <span
                          className="text-[16px] font-black tracking-tighter"
                          style={{
                            fontFamily: "var(--font-montserrat), sans-serif",
                            color: "#FF4D4D",
                          }}
                        >
                          {sub.percent}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="w-full flex justify-center mt-1">
                <span
                  className="text-[11px] font-bold lowercase tracking-widest text-[#FF4D4D] opacity-80"
                  style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                >
                  {stats.roast}
                </span>
              </div>
            </motion.div>
          )}

          <motion.div
            variants={containerVariants}
            className="flex flex-col gap-3.5 w-full shrink-0"
          >
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-3 mb-2 w-full px-1"
            >
              <span
                className="text-[12px] font-bold lowercase tracking-[0.25em] text-theme-muted whitespace-nowrap"
                style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
              >
                subjects
              </span>
              <div
                className="flex-1 h-[1.5px] bg-theme-text-10 rounded-full"
              />
            </motion.div>
            {safeSubjectsList.map((sub: any) => {
              const isPrac = sub.isPractical;
              const baseColor = isPrac ? "#0EA5E9" : "var(--theme-text)";
              return (
                <motion.div
                  key={sub.id}
                  variants={itemVariants}
                  className={`w-full bg-theme-surface border-[1.5px] rounded-[24px] p-5 flex items-center justify-between shadow-sm transition-all ${isPredicting && sub.hasChanged ? "affected-dotted-border" : "border-theme-subtle"}`}
                >
                  <div className="flex flex-col items-center justify-center min-w-[80px] shrink-0">
                    <span
                      className="text-[3.2rem] leading-[0.8] font-black tracking-tighter"
                      style={{
                        fontFamily: "var(--font-montserrat), sans-serif",
                        color: baseColor,
                      }}
                    >
                      {sub.val}
                    </span>
                    {isPredicting && sub.hasChanged ? (
                      <div className="flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full border bg-theme-surface border-theme-subtle">
                        <span className="text-[10px] font-bold opacity-40" style={{ color: baseColor }}>
                          {sub.originalVal}
                        </span>
                        <ChevronRightIcon size={8} className="opacity-40" style={{ color: baseColor }} />
                        <span className="text-[10px] font-black" style={{ color: baseColor }}>
                          {sub.val}
                        </span>
                      </div>
                    ) : (
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest mt-1 text-center"
                        style={{
                          fontFamily: "var(--font-afacad), sans-serif",
                          color: isPrac ? "#0EA5E9b3" : "color-mix(in srgb, var(--theme-text) 40%, transparent)",
                        }}
                      >
                        {sub.currentLabel}
                      </span>
                    )}
                    {isPredicting && sub.hasChanged && sub.originalLabel !== sub.currentLabel && (
                      <span className="text-[8px] font-black uppercase tracking-tighter mt-1 opacity-60 text-center" style={{ color: baseColor }}>
                        {sub.originalLabel} → {sub.currentLabel}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col items-end text-right min-w-0 ml-4">
                    <div className="flex items-center gap-2 mb-1">
                      {isPrac && (
                        <span
                          className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#0EA5E9] bg-[#0EA5E9]/10 px-2 py-0.5 rounded-md"
                          style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                        >
                          practical
                        </span>
                      )}
                      <span
                        className="text-[16px] font-black uppercase tracking-widest leading-[1.1] truncate"
                        style={{
                          fontFamily: "var(--font-montserrat), sans-serif",
                          color: baseColor,
                        }}
                      >
                        {sub.displayCode}
                      </span>
                    </div>
                    <span
                      className={`text-[13px] font-medium lowercase tracking-wide leading-[1.1] truncate w-full`}
                      style={{
                        fontFamily: "var(--font-afacad), sans-serif",
                        color: isPrac ? "#0EA5E9b3" : "color-mix(in srgb, var(--theme-text) 50%, transparent)",
                      }}
                    >
                      {sub.fullName}
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="text-[12px] font-bold opacity-70"
                        style={{ color: baseColor }}
                      >
                        {sub.present}/{sub.conducted}
                      </span>
                      <div
                        className="w-[3px] h-[3px] rounded-full opacity-40"
                        style={{ backgroundColor: baseColor }}
                      />
                      <span
                        className="text-[16px] font-black tracking-tighter"
                        style={{
                          fontFamily: "var(--font-montserrat), sans-serif",
                          color: baseColor,
                        }}
                      >
                        {sub.percent}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="absolute bottom-0 left-0 right-0 px-6 pt-24 pb-[30px] z-20 flex justify-between items-end pointer-events-none"
          style={{ background: 'linear-gradient(to top, var(--theme-bg) 0%, color-mix(in srgb, var(--theme-bg) 80%, transparent) 60%, transparent 100%)' }}
        >
          {"attendance".split("").map((char, i) => (
            <span
              key={i}
              className="text-[3.2rem] leading-[0.75] lowercase text-theme-text"
              style={{ fontFamily: "var(--font-afacad), sans-serif", fontWeight: 400 }}
            >
              {char}
            </span>
          ))}
        </motion.div>
      </div>

      <Predict
        isOpen={isPredictOverlay}
        onClose={() => setIsPredictOverlay(false)}
        predictAction={predictAction}
        setPredictAction={setPredictAction}
        calYear={calYear}
        calMonth={calMonth}
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
        setRangeEnd={setRangeEnd}
        selectedDates={selectedDates}
        setSelectedDates={setSelectedDates}
        handleDateClick={handleDateClick}
        setIsPredicting={setIsPredicting}
      />
    </>
  );
}
