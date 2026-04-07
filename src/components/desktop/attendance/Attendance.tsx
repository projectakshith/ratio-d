"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import DesktopSidebar from "../DesktopSidebar";
import { ReactLenis } from "lenis/react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Calculator, RotateCcw, Loader, GraduationCap } from "lucide-react";
import { 
  getOverallStats, 
  getBaseAttendance, 
  getImpactMap, 
  getProcessedList, 
  getStatus,
  getRecoveryDate 
} from "@/utils/attendance/attendanceLogic";
import { flavorText } from "@/utils/shared/flavortext";
import { useApp } from "@/context/AppContext";
import calendarDataJson from "@/data/calendar_data.json";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";

const SubjectCard = ({ code, title, percent, present, conducted, val, safe, type, recoveryDate, hasChanged, currentLabel }: any) => {
  const isPractical = type?.toLowerCase() === 'practical';
  const isCritical = !safe;
  const pctNum = parseFloat(percent);
  const category = pctNum < 75 ? "cooked" : pctNum >= 85 ? "safe" : "danger";
  
  let cardStyles = '';
  let textStyles = '';
  let subTextStyles = '';
  let statusColor = '';
  let progressBarBg = '';
  let progressBarFill = '';

  if (isCritical) {
    cardStyles = 'bg-[#FF4D4D]/5 border-[#FF4D4D]/25 backdrop-blur-xl hover:bg-[#FF4D4D]/10';
    textStyles = 'text-[#FF4D4D]';
    subTextStyles = 'text-[#FF4D4D]/60';
    statusColor = 'text-[#FF4D4D]';
    progressBarBg = 'bg-[#FF4D4D]/10';
    progressBarFill = '#FF4D4D';
  } else if (isPractical) {
    cardStyles = 'bg-[#0EA5E9]/5 border-[#0EA5E9]/25 backdrop-blur-md hover:bg-[#0EA5E9]/10';
    textStyles = 'text-[#0EA5E9]';
    subTextStyles = 'text-[#0EA5E9]/60';
    statusColor = 'text-[#0EA5E9]';
    progressBarBg = 'bg-[#0EA5E9]/10';
    progressBarFill = '#0EA5E9';
  } else {
    if (category === "safe") {
      cardStyles = 'status-boxbg-safe border-status-border-safe backdrop-blur-md hover:opacity-90';
      textStyles = 'status-text-safe';
      subTextStyles = 'status-text-safe opacity-60';
      statusColor = 'status-text-safe';
      progressBarBg = 'status-bg-safe';
      progressBarFill = 'var(--theme-highlight)';
    } else {
      cardStyles = 'status-boxbg-danger border-status-border-danger backdrop-blur-md hover:opacity-90';
      textStyles = 'status-text-danger';
      subTextStyles = 'status-text-danger opacity-60';
      statusColor = 'status-text-danger';
      progressBarBg = 'status-bg-danger';
      progressBarFill = 'var(--theme-highlight)';
    }
  }

  const badgeColors = isPractical 
    ? 'border-[#0EA5E9]/40 bg-[#0EA5E9]/20 text-[#0EA5E9]' 
    : (isCritical 
        ? 'border-[#FF4D4D]/40 bg-[#FF4D4D]/20 text-[#FF4D4D]' 
        : 'border-status-border-safe bg-status-bg-safe status-text-safe');

  const formattedDate = useMemo(() => {
    if (!recoveryDate) return null;
    const parts = recoveryDate.split(/[,\s-]+/);
    if (parts.length >= 2) return `${parts[0]} ${parts[1]}`.toLowerCase();
    return recoveryDate.toLowerCase();
  }, [recoveryDate]);

  return (
    <motion.div 
      layout
      className={`shrink-0 w-[280px] h-[380px] rounded-[32px] border-[1.5px] p-8 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] relative overflow-hidden ${cardStyles} ${hasChanged ? 'ring-2 ring-theme-text/10' : ''}`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <span className={`text-[12px] font-black uppercase tracking-[0.2em] ${subTextStyles}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
            {code}
          </span>
          <div className={`h-4 px-1.5 rounded-full border flex items-center justify-center ${badgeColors}`}>
            <span className="text-[7px] font-bold uppercase tracking-widest leading-none" style={{ fontFamily: 'var(--font-afacad)' }}>
              {type || 'Theory'}
            </span>
          </div>
        </div>
        <span className={`text-xl font-bold lowercase tracking-tight leading-tight ${textStyles}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
          {title}
        </span>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${subTextStyles}`} style={{ fontFamily: 'var(--font-afacad)' }}>
            current status
          </span>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-black tracking-tighter leading-none ${statusColor}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
                {val}
              </span>
              <div className="flex items-center gap-1.5 translate-y-[-1px]">
                {safe ? (
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${subTextStyles}`} style={{ fontFamily: 'var(--font-afacad)' }}>
                    margin
                  </span>
                ) : (
                  <>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${subTextStyles}`} style={{ fontFamily: 'var(--font-afacad)' }}>
                      recover by:
                    </span>
                    {formattedDate ? (
                      <div className="px-1.5 h-[14px] flex items-center rounded-full bg-[#FF4D4D]/20 border border-[#FF4D4D]/30">
                        <span className="text-[7px] font-black uppercase tracking-widest leading-none text-[#FF4D4D]" style={{ fontFamily: 'var(--font-afacad)' }}>
                          {formattedDate}
                        </span>
                      </div>
                    ) : (
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${subTextStyles}`} style={{ fontFamily: 'var(--font-afacad)' }}>
                        recover
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1 relative">
          <div className="flex justify-between items-end">
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl font-black tracking-tighter leading-none ${textStyles}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
                {percent}
              </span>
              <span className={`text-lg font-black ${textStyles} opacity-40`}>%</span>
            </div>
            <span className={`text-[12px] font-bold tabular-nums ${textStyles} opacity-60`} style={{ fontFamily: 'var(--font-afacad)' }}>
              {present}/{conducted}
            </span>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden mt-2 ${progressBarBg}`}>
            <div 
              className="h-full rounded-full transition-all duration-1000" 
              style={{ 
                width: `${percent}%`,
                backgroundColor: progressBarFill
              }} 
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function DesktopAttendance() {
  const { userData } = useApp();
  const [isStatsExpanded, setIsStatsExpanded] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPredicting, setIsPredicting] = useState(false);
  const [predictAction, setPredictAction] = useState<"leave" | "attend" | "od">("leave");
  const [selectedDates, setSelectedDates] = useState<Record<string, "leave" | "attend" | "od">>({});

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setIsStatsExpanded(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const baseAttendance = useMemo(() => getBaseAttendance(userData?.attendance || []), [userData]);

  const impactMap = useMemo(() => {
    if (!isPredicting || Object.keys(selectedDates).length === 0) return {};
    const calDataToUse = (userData?.calendarData?.length > 0) ? userData.calendarData : (calendarDataJson || []);
    return getImpactMap(
      selectedDates,
      calDataToUse as any,
      userData?.timetable || userData?.schedule || {},
      baseAttendance
    );
  }, [isPredicting, selectedDates, baseAttendance, userData]);

  const processedList = useMemo(() => {
    const list = getProcessedList(baseAttendance, impactMap, isPredicting);
    return list.map((s) => {
      const origStatus = getStatus(parseFloat(s.percentage), s.conducted, s.present);
      const calDataToUse = (userData?.calendarData?.length > 0) ? userData.calendarData : (calendarDataJson || []);
      const recDate = getRecoveryDate(s, calDataToUse, userData?.timetable || userData?.schedule || {}, selectedDates, predictAction);
      return {
        ...s,
        percent: s.pred.pct.toFixed(1),
        safe: s.pred.status.safe,
        val: s.pred.status.val,
        hasChanged: s.pred.status.val !== origStatus.val || s.pred.status.label !== origStatus.label,
        currentLabel: s.pred.status.label,
        recoveryDate: recDate,
      };
    });
  }, [baseAttendance, impactMap, isPredicting, userData, selectedDates, predictAction]);

  const stats = useMemo(() => {
    let totalConducted = 0;
    let totalPresent = 0;
    processedList.forEach(s => {
      const imp = impactMap[s.id] || { conducted: 0, present: 0 };
      totalConducted += s.conducted + imp.conducted;
      totalPresent += Math.min(s.present + imp.present, s.conducted + imp.conducted);
    });
    const pct = totalConducted === 0 ? 0 : (totalPresent / totalConducted) * 100;
    const badge = pct < 75 ? "cooked" : pct >= 85 ? "safe" : "danger";
    return { pct, badge };
  }, [processedList, impactMap]);

  const roast = useMemo(() => {
    const roasts = flavorText.header[stats.badge as keyof typeof flavorText.header] || flavorText.header.danger;
    return roasts[Math.floor(Math.random() * roasts.length)];
  }, [stats.badge]);

  const handleMouseEnter = () => {
    if (!isStatsExpanded) {
      hoverTimeoutRef.current = setTimeout(() => setIsStatsExpanded(true), 2000);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (isStatsExpanded && !isPredicting) setIsStatsExpanded(false);
  };

  const togglePrediction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPredicting) {
      setIsPredicting(false);
      setSelectedDates({});
      setIsStatsExpanded(false);
    } else {
      setIsPredicting(true);
      setIsStatsExpanded(true);
    }
  };

  const handleDayClick = (day: Date) => {
    const dStr = format(day, "yyyy-MM-dd");
    setSelectedDates(prev => {
      const next = { ...prev };
      if (next[dStr]) delete next[dStr];
      else next[dStr] = predictAction;
      return next;
    });
  };

  const criticalSubjects = processedList.filter(s => !s.safe);
  const normalSubjects = processedList.filter(s => s.safe);

  return (
    <div 
      className="h-screen w-full flex flex-row p-1.5 font-sans overflow-hidden transition-colors duration-500 text-theme-text"
      style={{ backgroundColor: 'color-mix(in srgb, var(--theme-bg), black 12%)' }}
    >
      <style>{`
        .rdp-root { --rdp-accent-color: var(--theme-highlight); margin: 0; font-family: var(--font-afacad) !important; }
        .rdp-day { font-size: 11px !important; font-weight: 600 !important; width: 32px !important; height: 32px !important; border-radius: 10px !important; transition: all 0.2s; color: var(--theme-text) !important; }
        .rdp-day:hover { background-color: var(--theme-surface) !important; }
        .rdp-day_selected { background-color: var(--rdp-accent-color) !important; color: var(--theme-bg) !important; font-weight: 900 !important; }
        .rdp-head_cell { font-size: 9px !important; font-weight: 900 !important; text-transform: uppercase; color: var(--theme-muted); padding-bottom: 8px; }
        .rdp-caption_label { font-family: var(--font-montserrat) !important; font-size: 13px !important; font-weight: 900 !important; text-transform: lowercase; color: var(--theme-text); }
        .rdp-nav_button { width: 28px !important; height: 28px !important; color: var(--theme-muted) !important; border: 1px solid var(--theme-border) !important; border-radius: 8px !important; }
        .rdp-nav_button:hover { color: var(--theme-text) !important; background-color: var(--theme-surface) !important; }
        .rdp-table { border-collapse: separate !important; border-spacing: 4px !important; }
      `}</style>
      
      <div className="flex-1 bg-theme-bg rounded-[24px] relative overflow-hidden flex flex-col border border-theme-border shadow-xl">
        <div className="flex-1 flex flex-row items-center">
          <motion.div 
            initial={false}
            animate={{ width: isStatsExpanded ? (isPredicting ? 480 : 320) : 80 }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onAnimationStart={() => setIsAnimating(true)}
            onAnimationComplete={() => setIsAnimating(false)}
            onClick={() => !isStatsExpanded && setIsStatsExpanded(true)}
            className={`shrink-0 h-full relative z-10 bg-theme-surface/10 flex flex-col items-center justify-center overflow-visible ${!isStatsExpanded ? 'cursor-pointer' : ''}`}
          >
            <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-r from-theme-surface/10 to-transparent translate-x-full pointer-events-none z-20" />
            
            <AnimatePresence mode="wait">
              {isStatsExpanded ? (
                <motion.div key={isPredicting ? "predicting" : "expanded"} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full h-full flex flex-col justify-center px-10 relative">
                  {isPredicting ? (
                    <div className="flex flex-col h-full py-12">
                      <div className="flex items-center justify-between mb-8">
                        <span className="text-theme-highlight text-[10px] font-black uppercase tracking-[0.5em]" style={{ fontFamily: 'var(--font-montserrat)' }}>prediction mode</span>
                        <button onClick={togglePrediction} className="text-theme-muted hover:text-theme-text transition-colors"><RotateCcw size={16} /></button>
                      </div>
                      <div className="flex flex-col gap-6 mb-8">
                        <div className="flex bg-theme-surface p-1 rounded-2xl border border-theme-border">
                          {(["leave", "attend", "od"] as const).map((a) => (
                            <button key={a} onClick={() => setPredictAction(a)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${predictAction === a ? 'bg-theme-text text-theme-bg' : 'text-theme-muted hover:text-theme-text'}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{a}</button>
                          ))}
                        </div>
                        <div className="bg-theme-card/50 border border-theme-border rounded-[32px] p-6 flex justify-center shadow-inner">
                          <DayPicker mode="multiple" selected={Object.keys(selectedDates).map(d => new Date(d))} onDayClick={handleDayClick} />
                        </div>
                      </div>
                      <div className="mt-auto pb-12 pt-6 border-t border-theme-border">
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-theme-muted text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-afacad)' }}>estimated percentage</span>
                          <span className="text-theme-text text-3xl font-black tracking-tighter" style={{ fontFamily: 'var(--font-montserrat)' }}>{stats.pct.toFixed(1)}%</span>
                        </div>
                        <p className={`text-theme-muted text-xs font-medium lowercase tracking-tight leading-relaxed ${isAnimating ? 'whitespace-nowrap' : 'whitespace-normal'}`} style={{ fontFamily: 'var(--font-afacad)' }}>{roast}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col justify-center">
                      <div className="mb-12">
                        <span className="text-theme-muted text-[11px] font-bold uppercase tracking-[0.5em] block mb-3" style={{ fontFamily: 'var(--font-afacad)' }}>overall presence</span>
                        <div className="flex items-baseline">
                          <h2 className="text-[80px] font-black text-theme-text leading-[0.8] tracking-[-0.08em]" style={{ fontFamily: 'var(--font-montserrat)' }}>{stats.pct.toFixed(1)}</h2>
                          <span className="text-2xl font-black text-theme-muted ml-2" style={{ fontFamily: 'var(--font-montserrat)' }}>%</span>
                        </div>
                      </div>
                      <div className="space-y-8">
                        <p className={`text-theme-muted/80 text-2xl font-semibold lowercase tracking-tight leading-snug ${isAnimating ? 'whitespace-nowrap' : 'whitespace-normal'}`} style={{ fontFamily: 'var(--font-afacad)' }}>{roast}</p>
                        <button onClick={togglePrediction} className="flex items-center gap-3 px-6 py-3 bg-theme-surface border border-theme-border rounded-2xl text-theme-muted hover:text-theme-text hover:bg-theme-surface transition-all w-fit group">
                          <Calculator size={18} className="group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>predict</span>
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center w-full h-full relative">
                  <div className="rotate-[-90deg] flex flex-col items-center justify-center whitespace-nowrap min-w-[400px] translate-y-[-20px]">
                    <span className="text-theme-muted text-[10px] font-bold uppercase tracking-[0.3em] mb-2" style={{ fontFamily: 'var(--font-afacad)' }}>overall percentage</span>
                    <span className="text-theme-text text-5xl font-black tracking-tighter leading-none" style={{ fontFamily: 'var(--font-montserrat)' }}>{stats.pct.toFixed(1)}%</span>
                  </div>
                  <div className="absolute bottom-16 left-0 right-0 flex justify-center">
                    <button onClick={togglePrediction} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-xl ${isPredicting ? 'bg-theme-highlight text-theme-bg' : 'bg-theme-surface border border-theme-border text-theme-muted hover:text-theme-text'}`}><Calculator size={18} /></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {isStatsExpanded && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  onClick={(e) => { e.stopPropagation(); isPredicting ? togglePrediction(e) : setIsStatsExpanded(false); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-theme-bg border border-theme-border flex items-center justify-center text-theme-muted hover:text-theme-text transition-all shadow-2xl z-30"
                >
                  <ChevronLeft size={20} />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          <ReactLenis options={{ orientation: 'horizontal', smoothWheel: true }} className="flex-1 h-full overflow-x-auto no-scrollbar flex items-center translate-y-[-40px]">
            <motion.div layout className="flex flex-row gap-20 px-24 pt-20 pb-20">
              {criticalSubjects.length > 0 && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 px-4 mb-2">
                    <span className="text-[#FF4D4D] text-[10px] font-bold uppercase tracking-[0.5em] shrink-0" style={{ fontFamily: 'var(--font-afacad)' }}>action required</span>
                    <div className="w-12 h-px bg-[#FF4D4D]/20" />
                  </div>
                  <div className="flex flex-row gap-6">
                    {criticalSubjects.map(s => <SubjectCard key={s.id} {...s} />)}
                  </div>
                </div>
              )}
              {normalSubjects.length > 0 && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 px-4 mb-2">
                    <span className="text-theme-text/20 text-[10px] font-bold uppercase tracking-[0.5em] shrink-0" style={{ fontFamily: 'var(--font-afacad)' }}>subjects</span>
                    <div className="w-12 h-px bg-theme-text/20" />
                  </div>
                  <div className="flex flex-row gap-6">
                    {normalSubjects.map(s => <SubjectCard key={s.id} {...s} />)}
                  </div>
                </div>
              )}
            </motion.div>
          </ReactLenis>
        </div>
        <div className="absolute bottom-10 left-10 pointer-events-none z-30">
          <h1 className="text-2xl font-black tracking-tighter lowercase text-theme-text opacity-20" style={{ fontFamily: 'var(--font-urbanosta)' }}>ratio'd</h1>
        </div>
        <div className="absolute bottom-10 right-12 pointer-events-none z-30 text-right">
          <h1 className="text-theme-text font-regular lowercase leading-none select-none opacity-80" style={{ fontFamily: 'var(--font-afacad)', fontSize: '55px', letterSpacing: '-4px' }}>attendance</h1>
        </div>
      </div>
      <DesktopSidebar />
    </div>
  );
}
