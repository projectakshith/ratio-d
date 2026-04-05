"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import DesktopSidebar from "../DesktopSidebar";
import { ReactLenis } from "lenis/react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Calculator, RotateCcw } from "lucide-react";
import { getOverallStats, getBaseAttendance, getImpactMap, getProcessedList, getStatus } from "@/utils/attendance/attendanceLogic";
import { flavorText } from "@/utils/shared/flavortext";
import { useApp } from "@/context/AppContext";
import calendarDataJson from "@/data/calendar_data.json";
import Predict from "../../themes/minimalist/attendance/Predict";

const SubjectCard = ({ code, name, percent, attended, total, margin, isSafe, isCritical, type, recoveryDate, hasChanged, currentLabel }: any) => {
  const isPractical = type?.toLowerCase() === 'practical';
  
  let cardStyles = 'bg-white/[0.02] border-white/5';
  let textStyles = 'text-white/90';
  let subTextStyles = 'text-white/20';
  let badgeStyles = 'border-white/10 bg-white/5 text-white/40';
  let statusColor = isSafe ? 'text-white' : 'text-[#FF4D4D]';

  if (isCritical) {
    cardStyles = 'bg-[#FF4D4D]/10 border-[#FF4D4D]/20 backdrop-blur-md';
    textStyles = 'text-[#FF4D4D]';
    subTextStyles = 'text-[#FF4D4D]/60';
    badgeStyles = 'border-[#FF4D4D]/20 bg-[#FF4D4D]/10 text-[#FF4D4D]';
    statusColor = 'text-[#FF4D4D]';
  } else if (isPractical) {
    cardStyles = 'bg-[#0EA5E9]/10 border-[#0EA5E9]/20 backdrop-blur-md';
    textStyles = 'text-[#0EA5E9]';
    subTextStyles = 'text-[#0EA5E9]/60';
    badgeStyles = 'border-[#0EA5E9]/20 bg-[#0EA5E9]/10 text-[#0EA5E9]';
    statusColor = isSafe ? 'text-[#0EA5E9]' : 'text-[#FF4D4D]';
  }

  return (
    <motion.div 
      layout
      className={`shrink-0 w-[280px] h-[380px] rounded-[32px] border p-8 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] relative overflow-hidden ${cardStyles} ${hasChanged ? 'ring-2 ring-white/20' : ''}`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <span className={`text-[18px] font-black uppercase tracking-[0.2em] ${subTextStyles}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
            {code}
          </span>
          <div className={`h-5 px-2.5 rounded-[6px] border flex items-center justify-center ${badgeStyles}`}>
            <span className="text-[9px] font-bold uppercase tracking-widest leading-none" style={{ fontFamily: 'var(--font-afacad)' }}>
              {type || 'Theory'}
            </span>
          </div>
        </div>
        <span className={`text-2xl font-bold lowercase tracking-tight leading-tight ${textStyles}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
          {name}
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
                {margin}
              </span>
              <div className="flex flex-col">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${subTextStyles}`} style={{ fontFamily: 'var(--font-afacad)' }}>
                  {currentLabel || (isSafe ? 'margin' : 'recover')}
                </span>
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
              <span className={`text-lg font-black ${subTextStyles}`}>%</span>
            </div>
            <span className={`text-[12px] font-bold tabular-nums ${subTextStyles}`} style={{ fontFamily: 'var(--font-afacad)' }}>
              {attended}/{total}
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
          
          {recoveryDate && !isSafe && (
            <div className="absolute -bottom-6 left-0 right-0 flex justify-center">
              <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/20 bg-white/5 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm" style={{ fontFamily: 'var(--font-montserrat)' }}>
                recover by: {recoveryDate}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function DesktopAttendance() {
  const { userData } = useApp();
  const [isStatsExpanded, setIsStatsExpanded] = useState(true);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPredictOverlay, setIsPredictOverlay] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictAction, setPredictAction] = useState<"leave" | "attend" | "od">("leave");
  const [selectedDates, setSelectedDates] = useState<Record<string, "leave" | "attend" | "od">>({});
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

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
      return {
        ...s,
        percent: s.pred.pct.toFixed(1),
        safe: s.pred.status.safe,
        val: s.pred.status.val,
        hasChanged: s.pred.status.val !== origStatus.val || s.pred.status.label !== origStatus.label,
        currentLabel: s.pred.status.label,
      };
    });
  }, [baseAttendance, impactMap, isPredicting]);

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
    const timer = setTimeout(() => {
      setIsStatsExpanded(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseEnter = () => {
    if (!isStatsExpanded) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsStatsExpanded(true);
      }, 400);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (isStatsExpanded) {
      setIsStatsExpanded(false);
    }
  };

  const criticalSubjects = processedList.filter(s => !s.safe);
  const normalSubjects = processedList.filter(s => s.safe);

  return (
    <div className="h-screen w-full bg-black flex flex-row p-1 font-sans overflow-hidden text-white">
      <div className="flex-1 bg-[#121212] rounded-[24px] relative overflow-hidden flex flex-col">
        
        <div className="flex-1 flex flex-row items-center pb-20">
          
          <motion.div 
            initial={false}
            animate={{ width: isStatsExpanded ? 450 : 80 }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="shrink-0 h-full border-r border-white/5 relative z-10 bg-[#121212] flex flex-col items-center justify-center overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {isStatsExpanded ? (
                <motion.div 
                  key="expanded"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-[450px] p-16 flex flex-col justify-center"
                >
                  <div className="mb-16">
                    <span className="text-white/10 text-[11px] font-bold uppercase tracking-[0.5em] block mb-4" style={{ fontFamily: 'var(--font-afacad)' }}>overall presence</span>
                    <div className="flex items-baseline">
                      <h2 className="text-[100px] font-black text-white leading-[0.8] tracking-[-0.08em]" style={{ fontFamily: 'var(--font-montserrat)' }}>
                        {stats.pct.toFixed(1)}
                      </h2>
                      <span className="text-3xl font-black text-white/10 ml-2" style={{ fontFamily: 'var(--font-montserrat)' }}>%</span>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex flex-col gap-2">
                      <span className="text-white/10 text-[10px] font-bold uppercase tracking-[0.4em]" style={{ fontFamily: 'var(--font-afacad)' }}>academic status</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-theme-highlight uppercase tracking-tighter" style={{ fontFamily: 'var(--font-montserrat)' }}>{stats.badge}</span>
                      </div>
                    </div>
                    <p className="text-white/40 text-lg font-medium lowercase tracking-tight leading-relaxed max-w-[320px]" style={{ fontFamily: 'var(--font-afacad)' }}>
                      {roast}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="collapsed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center w-full h-full relative"
                >
                  <div className="rotate-[-90deg] flex flex-col items-center whitespace-nowrap">
                    <span className="text-white/10 text-[10px] font-bold uppercase tracking-[0.3em] mb-0" style={{ fontFamily: 'var(--font-afacad)' }}>overall percentage</span>
                    <span className="text-white text-4xl font-black tracking-tighter leading-none" style={{ fontFamily: 'var(--font-montserrat)' }}>{stats.pct.toFixed(1)}%</span>
                  </div>
                  
                  <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-4">
                    {isPredicting && (
                      <button 
                        onClick={() => {
                          setIsPredicting(false);
                          setSelectedDates({});
                        }}
                        className="w-10 h-10 rounded-full bg-[#FF4D4D]/10 border border-[#FF4D4D]/20 flex items-center justify-center text-[#FF4D4D] hover:bg-[#FF4D4D]/20 transition-all shadow-xl"
                      >
                        <RotateCcw size={18} />
                      </button>
                    )}
                    <button 
                      onClick={() => setIsPredictOverlay(true)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-xl ${isPredicting ? 'bg-theme-highlight text-black border-theme-highlight' : 'bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10'}`}
                    >
                      <Calculator size={18} />
                    </button>
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
                  onClick={() => setIsStatsExpanded(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black border border-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all shadow-2xl z-20"
                >
                  <ChevronLeft size={20} />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          <ReactLenis 
            options={{ orientation: 'horizontal', smoothWheel: true }}
            className="flex-1 h-full overflow-x-auto no-scrollbar flex items-center"
          >
            <motion.div layout className="flex flex-row gap-20 px-20">
              
              {criticalSubjects.length > 0 && (
                <div className="flex flex-col gap-8">
                  <div className="flex items-center gap-4">
                    <span className="text-[#FF4D4D] text-[10px] font-bold uppercase tracking-[0.5em] shrink-0" style={{ fontFamily: 'var(--font-afacad)' }}>action required</span>
                    <div className="w-24 h-px bg-[#FF4D4D]/20" />
                  </div>
                  <div className="flex flex-row gap-6">
                    {criticalSubjects.map(s => (
                      <SubjectCard key={s.id} {...s} margin={s.val} />
                    ))}
                  </div>
                </div>
              )}

              {normalSubjects.length > 0 && (
                <div className="flex flex-col gap-8">
                  <div className="flex items-center gap-4">
                    <span className="text-white/20 text-[10px] font-bold uppercase tracking-[0.5em] shrink-0" style={{ fontFamily: 'var(--font-afacad)' }}>subjects</span>
                    <div className="w-24 h-px bg-white/10" />
                  </div>
                  <div className="flex flex-row gap-6">
                    {normalSubjects.map(s => (
                      <SubjectCard key={s.id} {...s} margin={s.val} />
                    ))}
                  </div>
                </div>
              )}

            </motion.div>
          </ReactLenis>
        </div>

        <div className="absolute bottom-10 left-10 pointer-events-none z-30">
          <h1 className="text-2xl font-black tracking-tighter lowercase text-white opacity-20" style={{ fontFamily: 'var(--font-urbanosta)' }}>
            ratio'd
          </h1>
        </div>
        
        <div className="absolute bottom-10 right-12 pointer-events-none z-30 text-right">
          <h1 
            className="text-white font-regular lowercase leading-none select-none opacity-80" 
            style={{ 
              fontFamily: 'var(--font-afacad)', 
              fontSize: '55px', 
              letterSpacing: '-4px' 
            }}
          >
            attendance
          </h1>
        </div>
      </div>

      <DesktopSidebar />

      <Predict
        isOpen={isPredictOverlay}
        onClose={() => setIsPredictOverlay(false)}
        predictAction={predictAction}
        setPredictAction={setPredictAction}
        isRangeMode={false}
        setIsRangeMode={() => {}}
        rangeStart={rangeStart}
        setRangeStart={setRangeStart}
        rangeEnd={rangeEnd}
        setRangeEnd={setRangeEnd}
        selectedDates={selectedDates}
        setSelectedDates={setSelectedDates}
        handleDateClick={(date: string) => {
          setSelectedDates(prev => {
            const next = { ...prev };
            if (next[date]) delete next[date];
            else next[date] = predictAction;
            return next;
          });
        }}
        setIsPredicting={setIsPredicting}
      />
    </div>
  );
}
