"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import DesktopSidebar from "../DesktopSidebar";
import { ReactLenis } from "lenis/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, 
  RotateCcw, 
  ChevronLeft, 
  Plus, 
  Minus,
  Target as TargetIcon
} from "lucide-react";
import { 
  processAndSortMarks, 
  buildCourseMap, 
  getBoxTheme,
  calculateSemMarksNeeded,
  calculatePredictedGpa,
  getInitialTargetGrades
} from "@/utils/marks/marksLogic";
import { getRandomRoast } from "@/utils/shared/flavortext";
import { useApp } from "@/context/AppContext";

const SubjectMarkCard = ({ sub, onClick }: any) => {
  const pctNum = parseFloat(sub.percentage);
  const isCritical = pctNum < 70 && !sub.isNA;
  const isPractical = sub.type?.toLowerCase() === 'practical';
  const isNA = sub.isNA;
  
  let cardStyles = '';
  let textStyles = '';
  let subTextStyles = '';
  let progressBarBg = '';
  let progressBarFill = '';

  if (isNA) {
    cardStyles = 'bg-theme-surface/10 border-theme-border opacity-60 grayscale';
    textStyles = 'text-theme-text/60';
    subTextStyles = 'text-theme-text/40';
    progressBarBg = 'bg-theme-text/5';
    progressBarFill = 'transparent';
  } else if (isCritical) {
    cardStyles = 'bg-[#FF4D4D]/5 border-[#FF4D4D]/25 backdrop-blur-xl hover:bg-[#FF4D4D]/10';
    textStyles = 'text-[#FF4D4D]';
    subTextStyles = 'text-[#FF4D4D]/60';
    progressBarBg = 'bg-[#FF4D4D]/10';
    progressBarFill = '#FF4D4D';
  } else if (isPractical) {
    cardStyles = 'bg-[#0EA5E9]/5 border-[#0EA5E9]/25 backdrop-blur-md hover:bg-[#0EA5E9]/10';
    textStyles = 'text-[#0EA5E9]';
    subTextStyles = 'text-[#0EA5E9]/60';
    progressBarBg = 'bg-[#0EA5E9]/10';
    progressBarFill = '#0EA5E9';
  } else {
    cardStyles = 'bg-theme-highlight/[0.08] backdrop-blur-md hover:bg-theme-highlight/[0.12]';
    textStyles = 'text-theme-text';
    subTextStyles = 'text-theme-text/60';
    progressBarBg = 'bg-theme-text/10';
    progressBarFill = 'var(--theme-highlight)';
  }

  const badgeBg = isNA 
    ? 'rgba(255, 255, 255, 0.1)'
    : (isPractical 
        ? 'rgba(14, 165, 233, 0.3)' 
        : (isCritical 
            ? 'rgba(255, 77, 77, 0.3)' 
            : 'color-mix(in srgb, var(--theme-highlight) 30%, transparent)'));

  const badgeText = isNA
    ? 'text-theme-muted'
    : (isPractical 
        ? 'text-[#0EA5E9]' 
        : (isCritical 
            ? 'text-[#FF4D4D]' 
            : 'text-theme-text'));

  const cardBorderColor = isNA
    ? 'var(--theme-border)'
    : (isCritical 
        ? 'rgba(255, 77, 77, 0.25)' 
        : (isPractical 
            ? 'rgba(14, 165, 233, 0.25)' 
            : 'color-mix(in srgb, var(--theme-highlight) 25%, transparent)'));

  return (
    <motion.div 
      layout
      onClick={onClick}
      className={`shrink-0 w-[280px] h-[380px] rounded-[32px] border-[1.5px] p-8 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] relative overflow-hidden ${cardStyles}`}
      style={{ borderColor: cardBorderColor }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <span className={`text-[12px] font-black uppercase tracking-[0.2em] ${subTextStyles}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
            {sub.code}
          </span>
          <div 
            className={`h-4 px-1.5 rounded-full flex items-center justify-center ${badgeText}`}
            style={{ backgroundColor: badgeBg }}
          >
            <span className="text-[7px] font-bold uppercase tracking-widest leading-none" style={{ fontFamily: 'var(--font-afacad)' }}>
              {isNA ? 'No Data' : (sub.type || 'Theory')}
            </span>
          </div>
        </div>
        <span className={`text-xl font-bold lowercase tracking-tight leading-tight ${textStyles}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
          {sub.title}
        </span>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${subTextStyles}`} style={{ fontFamily: 'var(--font-afacad)' }}>
            assessments
          </span>
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {isNA ? (
              <div className="flex-1 py-4 flex items-center justify-center border border-dashed border-theme-border/20 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-widest text-theme-muted opacity-40" style={{ fontFamily: 'var(--font-afacad)' }}>pending...</span>
              </div>
            ) : (
              sub.assessments.slice(-3).map((ass: any, idx: number) => {
                const box = getBoxTheme(ass.got, ass.max);
                return (
                  <div key={idx} className={`min-w-[65px] flex-1 rounded-xl p-2 border ${box.boxBg} ${box.border} flex flex-col items-center justify-center`}>
                    <span className={`text-[8px] font-black uppercase tracking-tighter mb-1 truncate w-full text-center ${box.text}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{ass.title}</span>
                    <div className="flex items-baseline gap-0.5">
                      <span className={`text-sm font-black ${box.text}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{ass.got}</span>
                      <span className={`text-[8px] font-bold opacity-50 ${box.text}`} style={{ fontFamily: 'var(--font-montserrat)' }}>/{ass.max}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 relative">
          <div className="flex justify-between items-end">
            <div className="flex items-baseline gap-1">
              <span className={`text-5xl font-black tracking-tighter leading-none ${textStyles}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
                {isNA ? '0' : (Number.isInteger(sub.totalGot) ? sub.totalGot : sub.totalGot.toFixed(1))}
              </span>
              <span className={`text-lg font-black ${textStyles} opacity-40`} style={{ fontFamily: 'var(--font-montserrat)' }}>/{sub.totalMax}</span>
            </div>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden mt-2 ${progressBarBg}`}>
            <div 
              className="h-full rounded-full transition-all duration-1000" 
              style={{ 
                width: `${sub.percentage}%`,
                backgroundColor: isNA ? 'transparent' : progressBarFill
              }} 
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function DesktopMarks() {
  const { userData } = useApp();
  const [mounted, setMounted] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isTargetMode, setIsTargetMode] = useState(false);
  const [predSubjectId, setPredSubjectId] = useState<string | null>(null);
  const [expectedMarks, setExpectedMarks] = useState<number>(0);
  const [targetGrades, setTargetGrades] = useState<Record<string, number>>({});

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setIsStatsExpanded(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const subjects = useMemo(() => {
    if (!userData?.marks) return [];
    const courseMap = buildCourseMap(userData);
    return processAndSortMarks(userData.marks, courseMap);
  }, [userData]);

  const { criticalSubjects, normalSubjects } = useMemo(() => {
    const critical = subjects
      .filter(s => s.percentage < 70 && !s.isNA)
      .sort((a, b) => a.percentage - b.percentage);
    
    const normal = subjects.filter(s => s.percentage >= 70 || s.isNA);
    
    return {
      criticalSubjects: critical,
      normalSubjects: normal
    };
  }, [subjects]);

  useEffect(() => {
    if (subjects.length > 0 && Object.keys(targetGrades).length === 0) {
      setTargetGrades(getInitialTargetGrades(subjects));
    }
    if (subjects.length > 0 && !predSubjectId) {
      setPredSubjectId(subjects[0].id);
    }
  }, [subjects, targetGrades, predSubjectId]);

  const activePredSub = useMemo(() => 
    subjects.find(s => s.id === predSubjectId) || subjects[0], 
    [subjects, predSubjectId]
  );

  const totalObtained = useMemo(() => 
    subjects.reduce((acc, sub) => acc + sub.totalGot, 0), 
    [subjects]
  );

  const totalMax = useMemo(() => 
    subjects.reduce((acc, sub) => acc + sub.totalMax, 0), 
    [subjects]
  );

  const stats = useMemo(() => {
    const pct = totalMax === 0 ? 0 : (totalObtained / totalMax) * 100;
    const badge = pct < 50 ? "cooked" : pct < 75 ? "danger" : pct >= 85 ? "safe" : "neutral";
    return { pct, badge };
  }, [totalObtained, totalMax]);

  const roast = useMemo(() => {
    return getRandomRoast(stats.badge as any, "marks");
  }, [stats.badge]);

  const predictedGpa = useMemo(() => 
    calculatePredictedGpa(subjects, targetGrades, []), 
    [subjects, targetGrades]
  );

  const currentTargetGrade = activePredSub ? targetGrades[activePredSub.id] || 91 : 91;
  const currentInternals = activePredSub?.totalGot || 0;
  const maxPossibleExpected = activePredSub ? Math.max(0, 60 - activePredSub.totalMax) : 0;
  
  const { semRequiredOutOfMax, maxExternal, isCooked } = useMemo(() => {
    if (!activePredSub) return { semRequiredOutOfMax: 0, maxExternal: 40, isCooked: false };
    return calculateSemMarksNeeded(
      currentTargetGrade,
      currentInternals,
      expectedMarks,
      activePredSub.isPractical
    );
  }, [activePredSub, currentTargetGrade, currentInternals, expectedMarks]);

  const handleMouseEnter = () => {
    if (!isStatsExpanded) {
      hoverTimeoutRef.current = setTimeout(() => setIsStatsExpanded(true), 2000);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (isStatsExpanded && !isTargetMode) setIsStatsExpanded(false);
  };

  const toggleTargetMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTargetMode) {
      setIsTargetMode(false);
      setIsStatsExpanded(false);
    } else {
      setIsTargetMode(true);
      setIsStatsExpanded(true);
    }
  };

  const grades = [
    { label: "O", min: 91 },
    { label: "A+", min: 81 },
    { label: "A", min: 71 },
    { label: "B+", min: 61 },
    { label: "B", min: 56 },
    { label: "C", min: 50 },
  ];

  if (!mounted) return null;

  return (
    <div 
      className="h-screen w-full flex flex-row p-1.5 font-sans overflow-hidden transition-colors duration-500 text-theme-text"
      style={{ backgroundColor: 'color-mix(in srgb, var(--theme-bg), black 12%)' }}
    >
      <div className="flex-1 bg-theme-bg rounded-[24px] relative overflow-hidden flex flex-col border border-theme-border shadow-xl">
        <div className="flex-1 flex flex-row items-center">
          <motion.div 
            initial={false}
            animate={{ width: isStatsExpanded ? (isTargetMode ? 480 : 320) : 80 }}
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
                <motion.div key={isTargetMode ? "target-mode" : "expanded"} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full h-full flex flex-col justify-center px-10 relative">
                  {isTargetMode ? (
                    <div className="flex flex-col h-full py-12">
                      <div className="flex items-center justify-between mb-8">
                        <span className="text-theme-highlight text-[10px] font-black uppercase tracking-[0.5em]" style={{ fontFamily: 'var(--font-montserrat)' }}>target mode</span>
                        <button onClick={toggleTargetMode} className="text-theme-muted hover:text-theme-text transition-colors"><RotateCcw size={16} /></button>
                      </div>

                      <div className="flex flex-col gap-6 mb-8">
                        <div className="bg-theme-card/50 border border-theme-border rounded-[32px] p-6 flex flex-col shadow-inner">
                          <div className="flex justify-between items-start mb-4">
                            <div className="min-w-0 flex-1">
                              <p className="text-theme-muted text-[9px] font-bold uppercase tracking-[0.25em] mb-1" style={{ fontFamily: 'var(--font-montserrat)' }}>{activePredSub?.code || 'SELECT'}</p>
                              <h3 className="text-theme-text text-lg font-black lowercase truncate" style={{ fontFamily: 'var(--font-montserrat)' }}>{activePredSub?.title || 'choose a subject'}</h3>
                            </div>
                            <TargetIcon className="text-theme-highlight/40 shrink-0" size={20} />
                          </div>

                          <div className="flex flex-col gap-6">
                            <div>
                              <p className="text-theme-muted text-[9px] font-bold uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-afacad)' }}>sem marks needed</p>
                              <div className="flex items-baseline gap-1">
                                <span className={`text-5xl font-black tracking-tighter leading-none ${isCooked ? 'text-[#FF4D4D]' : 'text-theme-text'}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
                                  {isCooked ? 'cooked' : semRequiredOutOfMax}
                                </span>
                                {!isCooked && <span className="text-xl font-bold opacity-30" style={{ fontFamily: 'var(--font-montserrat)' }}>/{maxExternal}</span>}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col gap-2">
                                <span className="text-theme-muted text-[8px] font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>expected</span>
                                <div className="flex items-center justify-between bg-theme-surface p-1 rounded-xl border border-theme-border shadow-inner">
                                  <button onClick={() => setExpectedMarks(Math.max(0, expectedMarks - 1))} className="w-8 h-8 rounded-lg text-theme-muted hover:text-theme-text transition-colors"><Minus size={14} /></button>
                                  <span className="text-sm font-black" style={{ fontFamily: 'var(--font-montserrat)' }}>{expectedMarks}</span>
                                  <button onClick={() => setExpectedMarks(Math.min(maxPossibleExpected, expectedMarks + 1))} className="w-8 h-8 rounded-lg text-theme-muted hover:text-theme-text transition-colors"><Plus size={14} /></button>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <span className="text-theme-muted text-[8px] font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>target</span>
                                <div className="flex items-center justify-center bg-theme-surface h-10 rounded-xl border border-theme-border shadow-inner">
                                  <span className="text-sm font-black text-theme-highlight" style={{ fontFamily: 'var(--font-montserrat)' }}>{grades.find(g => g.min === (targetGrades[activePredSub?.id] || 91))?.label}</span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-1.5">
                              {grades.slice(0, 6).map((g) => (
                                <button 
                                  key={g.label}
                                  onClick={() => activePredSub && setTargetGrades(prev => ({ ...prev, [activePredSub.id]: g.min }))}
                                  className={`py-2.5 rounded-xl text-[10px] font-black transition-all ${targetGrades[activePredSub?.id] === g.min ? 'bg-theme-text text-theme-bg' : 'bg-theme-surface text-theme-muted border border-theme-border hover:text-theme-text'}`}
                                  style={{ fontFamily: 'var(--font-montserrat)' }}
                                >
                                  {g.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto pb-12 pt-6 border-t border-theme-border">
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-theme-muted text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-afacad)' }}>predicted gpa</span>
                          <span className="text-theme-text text-3xl font-black tracking-tighter" style={{ fontFamily: 'var(--font-montserrat)' }}>{predictedGpa}</span>
                        </div>
                        <p className={`text-theme-muted text-xs font-medium lowercase tracking-tight leading-relaxed ${isAnimating ? 'whitespace-nowrap' : 'whitespace-normal'}`} style={{ fontFamily: 'var(--font-afacad)' }}>{roast}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col justify-center">
                      <div className="mb-12">
                        <span className="text-theme-muted text-[11px] font-bold uppercase tracking-[0.5em] block mb-3" style={{ fontFamily: 'var(--font-afacad)' }}>overall marks</span>
                        <div className="flex items-baseline">
                          <h2 className="text-[80px] font-black text-theme-text leading-[0.8] tracking-[-0.08em]" style={{ fontFamily: 'var(--font-montserrat)' }}>{Number.isInteger(totalObtained) ? totalObtained : totalObtained.toFixed(1)}</h2>
                          <span className="text-2xl font-black text-theme-muted ml-2" style={{ fontFamily: 'var(--font-montserrat)' }}>/{totalMax}</span>
                        </div>
                      </div>
                      <div className="space-y-8">
                        <p className={`text-theme-muted/80 text-2xl font-semibold lowercase tracking-tight leading-snug ${isAnimating ? 'whitespace-nowrap' : 'whitespace-normal'}`} style={{ fontFamily: 'var(--font-afacad)' }}>{roast}</p>
                        <button onClick={toggleTargetMode} className="flex items-center gap-3 px-6 py-3 bg-theme-surface border border-theme-border rounded-2xl text-theme-muted hover:text-theme-text hover:bg-theme-surface transition-all w-fit group">
                          <Calculator size={18} className="group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>target</span>
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center w-full h-full relative">
                  <div className="rotate-[-90deg] flex flex-col items-center justify-center whitespace-nowrap min-w-[400px] translate-y-[-20px]">
                    <span className="text-theme-muted text-[10px] font-bold uppercase tracking-[0.3em] mb-2" style={{ fontFamily: 'var(--font-afacad)' }}>overall marks</span>
                    <span className="text-theme-text text-5xl font-black tracking-tighter leading-none" style={{ fontFamily: 'var(--font-montserrat)' }}>{Number.isInteger(totalObtained) ? totalObtained : totalObtained.toFixed(1)}</span>
                  </div>
                  <div className="absolute bottom-32 left-0 right-0 flex justify-center">
                    <button onClick={toggleTargetMode} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-xl ${isTargetMode ? 'bg-theme-highlight text-theme-bg' : 'bg-theme-surface border border-theme-border text-theme-muted hover:text-theme-text'}`}><Calculator size={18} /></button>
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
                  onClick={(e) => { e.stopPropagation(); isTargetMode ? toggleTargetMode(e) : setIsStatsExpanded(false); }}
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
                    {criticalSubjects.map(s => <SubjectMarkCard key={s.id} sub={s} onClick={() => setPredSubjectId(s.id)} />)}
                  </div>
                </div>
              )}
              {normalSubjects.length > 0 && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 px-4 mb-2">
                    <span className="text-theme-text/40 text-[10px] font-bold uppercase tracking-[0.5em] shrink-0" style={{ fontFamily: 'var(--font-afacad)' }}>subjects</span>
                    <div className="w-12 h-px bg-theme-text/40" />
                  </div>
                  <div className="flex flex-row gap-6">
                    {normalSubjects.map(s => <SubjectMarkCard key={s.id} sub={s} onClick={() => setPredSubjectId(s.id)} />)}
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
          <h1 className="text-theme-text font-regular lowercase leading-none select-none opacity-80" style={{ fontFamily: 'var(--font-afacad)', fontSize: '55px', letterSpacing: '-4px' }}>marks</h1>
        </div>
      </div>

      <DesktopSidebar />
    </div>
  );
}
