"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import DesktopSidebar from "../DesktopSidebar";
import { ReactLenis } from "lenis/react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Calculator, RotateCcw } from "lucide-react";
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
  
  let cardStyles = 'bg-white/[0.02] border-white/5';
  let textStyles = 'text-white/90';
  let subTextStyles = 'text-white/20';
  let badgeStyles = 'border-white/10 bg-white/5 text-white/40';
  let statusColor = safe ? 'text-white' : 'text-[#FF4D4D]';

  if (isCritical) {
    cardStyles = 'bg-[#FF4D4D]/10 border-[#FF4D4D]/20 backdrop-blur-md';
    textStyles = 'text-[#FF4D4D]';
    subTextStyles = 'text-[#FF4D4D]/60';
    statusColor = 'text-[#FF4D4D]';
  } else if (isPractical) {
    cardStyles = 'bg-[#0EA5E9]/10 border-[#0EA5E9]/20 backdrop-blur-md hover:bg-[#0EA5E9]/15';
    textStyles = 'text-[#0EA5E9]';
    subTextStyles = 'text-[#0EA5E9]/60';
    statusColor = safe ? 'text-[#0EA5E9]' : 'text-[#FF4D4D]';
  }

  const currentBadgeStyles = isPractical 
    ? 'border-[#0EA5E9]/20 bg-[#0EA5E9]/10 text-[#0EA5E9]' 
    : (isCritical ? 'border-[#FF4D4D]/20 bg-[#FF4D4D]/10 text-[#FF4D4D]' : 'border-white/10 bg-white/5 text-white/40');

  const formattedDate = useMemo(() => {
    if (!recoveryDate) return null;
    const parts = recoveryDate.split(/[,\s-]+/);
    if (parts.length >= 2) return `${parts[0]} ${parts[1]}`.toLowerCase();
    return recoveryDate.toLowerCase();
  }, [recoveryDate]);

  return (
    <motion.div 
      layout
      className={`shrink-0 w-[280px] h-[380px] rounded-[32px] border p-8 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] relative overflow-hidden ${cardStyles} ${hasChanged ? 'ring-2 ring-white/20' : ''}`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <span className={`text-[12px] font-black uppercase tracking-[0.2em] ${subTextStyles}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
            {code}
          </span>
          <div className={`h-5 px-2 rounded-[6px] border flex items-center justify-center ${currentBadgeStyles}`}>
            <span className="text-[8px] font-bold uppercase tracking-widest leading-none" style={{ fontFamily: 'var(--font-afacad)' }}>
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
              <span className={`text-[10px] font-bold uppercase tracking-widest ${subTextStyles}`} style={{ fontFamily: 'var(--font-afacad)' }}>
                {safe ? 'margin' : (formattedDate ? `recover by: ${formattedDate}` : 'recover')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1 relative">
          <div className="flex justify-between items-end">
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl font-black tracking-tighter leading-none ${textStyles}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
                {percent}
              </span>
              <span className={`text-lg font-black ${subTextStyles}`}>%</span>
            </div>
            <span className={`text-[12px] font-bold tabular-nums ${subTextStyles}`} style={{ fontFamily: 'var(--font-afacad)' }}>
              {present}/{conducted}
            </span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
            <div 
              className="h-full rounded-full transition-all duration-1000" 
              style={{ 
                width: `${percent}%`,
                backgroundColor: isCritical ? '#FF4D4D' : (isPractical ? '#0EA5E9' : '#C5FF41')
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
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPredicting, setIsPredicting] = useState(false);
  const [predictAction, setPredictAction] = useState<"leave" | "attend" | "od">("leave");
  const [selectedDates, setSelectedDates] = useState<Record<string, "leave" | "attend" | "od">>({});

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

  useEffect(() => {
    const timer = setTimeout(() => setIsStatsExpanded(false), 1500);
    return () => clearTimeout(timer);
  }, []);

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
    <div className="h-screen w-full bg-black flex flex-row p-1 font-sans overflow-hidden text-white">
      <style>{`
        .rdp-root { --rdp-accent-color: #ceff1c; margin: 0; font-family: var(--font-afacad) !important; }
        .rdp-day { font-size: 11px !important; font-weight: 600 !important; width: 32px !important; height: 32px !important; border-radius: 10px !important; transition: all 0.2s; }
        .rdp-day:hover { background-color: rgba(255,255,255,0.05) !important; }
        .rdp-day_selected { background-color: var(--rdp-accent-color) !important; color: black !important; font-weight: 900 !important; }
        .rdp-head_cell { font-size: 9px !important; font-weight: 900 !important; text-transform: uppercase; color: rgba(255,255,255,0.2); padding-bottom: 8px; }
        .rdp-caption_label { font-family: var(--font-montserrat) !important; font-size: 13px !important; font-weight: 900 !important; text-transform: lowercase; }
        .rdp-nav_button { width: 28px !important; height: 28px !important; color: rgba(255,255,255,0.2) !important; border: 1px solid rgba(255,255,255,0.05) !important; border-radius: 8px !important; }
        .rdp-nav_button:hover { color: white !important; background-color: rgba(255,255,255,0.05) !important; }
        .rdp-table { border-collapse: separate !important; border-spacing: 4px !important; }
      `}</style>
      
      <div className="flex-1 bg-[#121212] rounded-[24px] relative overflow-hidden flex flex-col border border-white/5">
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
            className={`shrink-0 h-full relative z-10 bg-[#121212] flex flex-col items-center justify-center overflow-visible ${!isStatsExpanded ? 'cursor-pointer' : ''}`}
          >
            <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-r from-[#121212] to-transparent translate-x-full pointer-events-none z-20" />
            
            <AnimatePresence mode="wait">
              {isStatsExpanded ? (
                <motion.div key={isPredicting ? "predicting" : "expanded"} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full h-full flex flex-col justify-center px-10 relative">
                  {isPredicting ? (
                    <div className="flex flex-col h-full py-12">
                      <div className="flex items-center justify-between mb-8">
                        <span className="text-theme-highlight text-[10px] font-black uppercase tracking-[0.5em]" style={{ fontFamily: 'var(--font-montserrat)' }}>prediction mode</span>
                        <button onClick={togglePrediction} className="text-white/20 hover:text-white transition-colors"><RotateCcw size={16} /></button>
                      </div>
                      <div className="flex flex-col gap-6 mb-8">
                        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                          {(["leave", "attend", "od"] as const).map((a) => (
                            <button key={a} onClick={() => setPredictAction(a)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${predictAction === a ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{a}</button>
                          ))}
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-6 flex justify-center shadow-inner">
                          <DayPicker mode="multiple" selected={Object.keys(selectedDates).map(d => new Date(d))} onDayClick={handleDayClick} />
                        </div>
                      </div>
                      <div className="mt-auto pb-12 pt-6 border-t border-white/5">
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-afacad)' }}>estimated percentage</span>
                          <span className="text-white text-3xl font-black tracking-tighter" style={{ fontFamily: 'var(--font-montserrat)' }}>{stats.pct.toFixed(1)}%</span>
                        </div>
                        <p className={`text-white/40 text-xs font-medium lowercase tracking-tight leading-relaxed ${isAnimating ? 'whitespace-nowrap' : 'whitespace-normal'}`} style={{ fontFamily: 'var(--font-afacad)' }}>{roast}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col justify-center">
                      <div className="mb-12">
                        <span className="text-white/10 text-[11px] font-bold uppercase tracking-[0.5em] block mb-3" style={{ fontFamily: 'var(--font-afacad)' }}>overall presence</span>
                        <div className="flex items-baseline">
                          <h2 className="text-[80px] font-black text-white leading-[0.8] tracking-[-0.08em]" style={{ fontFamily: 'var(--font-montserrat)' }}>{stats.pct.toFixed(1)}</h2>
                          <span className="text-2xl font-black text-white/10 ml-2" style={{ fontFamily: 'var(--font-montserrat)' }}>%</span>
                        </div>
                      </div>
                      <div className="space-y-8">
                        <p className={`text-white/60 text-2xl font-semibold lowercase tracking-tight leading-snug ${isAnimating ? 'whitespace-nowrap' : 'whitespace-normal'}`} style={{ fontFamily: 'var(--font-afacad)' }}>{roast}</p>
                        <button onClick={togglePrediction} className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all w-fit group">
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
                    <span className="text-white/10 text-[10px] font-bold uppercase tracking-[0.3em] mb-2" style={{ fontFamily: 'var(--font-afacad)' }}>overall percentage</span>
                    <span className="text-white text-5xl font-black tracking-tighter leading-none" style={{ fontFamily: 'var(--font-montserrat)' }}>{stats.pct.toFixed(1)}%</span>
                  </div>
                  <div className="absolute bottom-16 left-0 right-0 flex justify-center">
                    <button onClick={togglePrediction} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-xl ${isPredicting ? 'bg-theme-highlight text-black' : 'bg-white/5 border border-white/10 text-white/40 hover:text-white'}`}><Calculator size={18} /></button>
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black border border-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all shadow-2xl z-30"
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
                    <span className="text-white/20 text-[10px] font-bold uppercase tracking-[0.5em] shrink-0" style={{ fontFamily: 'var(--font-afacad)' }}>subjects</span>
                    <div className="w-12 h-px bg-white/10" />
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
          <h1 className="text-2xl font-black tracking-tighter lowercase text-white opacity-20" style={{ fontFamily: 'var(--font-urbanosta)' }}>ratio'd</h1>
        </div>
        <div className="absolute bottom-10 right-12 pointer-events-none z-30 text-right">
          <h1 className="text-white font-regular lowercase leading-none select-none opacity-80" style={{ fontFamily: 'var(--font-afacad)', fontSize: '55px', letterSpacing: '-4px' }}>attendance</h1>
        </div>
      </div>
      <DesktopSidebar />
    </div>
  );
}
