"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { ReactLenis } from "lenis/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutGrid, 
  Columns, 
  Plus, 
  Minus, 
  Target as TargetIcon,
  Smile, 
  Frown,
  Meh,
  Activity,
  LayoutDashboard,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  Calculator,
  RotateCcw,
  Power
} from "lucide-react";
import { 
  processAndSortMarks, 
  buildCourseMap, 
  getBoxTheme,
  calculateSemMarksNeeded,
  getInitialTargetGrades,
  calculateBestAchievableGrade,
  calculatePredictedGpa
} from "@/utils/marks/marksLogic";
import { useApp } from "@/context/AppContext";
import { flavorText } from "@/utils/shared/flavortext";

const STORAGE_KEY = "ratio_marks_targets_v2";

const DetailedMarkCard = ({ ass }: any) => {
  const box = getBoxTheme(ass.got, ass.max);
  const lost = (ass.max - ass.got).toFixed(1);
  return (
    <div className={`px-2.5 pt-2 pb-1.5 rounded-xl border ${box.boxBg} ${box.border} flex flex-col justify-start gap-1 shadow-sm h-[55px] relative overflow-hidden`}>
      <div className="flex justify-between items-start leading-none relative z-10">
        <span className={`text-[7px] font-black uppercase ${box.text} opacity-80 truncate block`} style={{ fontFamily: 'var(--font-montserrat)' }}>{ass.title}</span>
        {parseFloat(lost) > 0 && (
          <span className="text-[7px] font-black text-theme-secondary uppercase tracking-tight" style={{ fontFamily: 'var(--font-montserrat)' }}>-{lost} lost</span>
        )}
      </div>
      <div className="flex items-baseline gap-0.5 leading-none mt-auto">
        <span className={`text-[14px] font-black ${box.text}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{ass.got}</span>
        <span className={`text-[9px] font-black opacity-40 ${box.text}`} style={{ fontFamily: 'var(--font-montserrat)' }}>/{ass.max}</span>
      </div>
    </div>
  );
};

const MarkSubjectCard = ({ sub, onSelect }: { sub: any, onSelect: (id: string) => void }) => {
  const isCritical = sub.status === 'cooked';
  const isPractical = sub.isPractical;
  
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
    cardStyles = 'bg-theme-highlight/[0.08] backdrop-blur-md hover:bg-theme-highlight/[0.12]';
    textStyles = 'text-theme-text';
    subTextStyles = 'text-theme-text/60';
    statusColor = 'text-theme-text';
    progressBarBg = 'bg-theme-text/10';
    progressBarFill = 'var(--theme-highlight)';
  }

  const cardBorderColor = isCritical 
    ? 'rgba(255, 77, 77, 0.25)' 
    : (isPractical 
        ? 'rgba(14, 165, 233, 0.25)' 
        : 'color-mix(in srgb, var(--theme-highlight) 25%, transparent)');

  const badgeBg = isPractical 
    ? 'rgba(14, 165, 233, 0.3)' 
    : (isCritical 
        ? 'rgba(255, 77, 77, 0.3)' 
        : 'color-mix(in srgb, var(--theme-highlight) 30%, transparent)');

  const badgeText = isPractical 
    ? 'text-[#0EA5E9]' 
    : (isCritical 
        ? 'text-[#FF4D4D]' 
        : 'text-theme-text');

  const sortedAssessments = useMemo(() => {
    if (!sub.assessments) return [];
    return [...sub.assessments].sort((a, b) => {
      const getPriority = (title: string) => {
        const t = title.toUpperCase();
        if (t.includes('I')) {
          if (t.includes('III')) return 3;
          if (t.includes('II')) return 2;
          return 1;
        }
        if (t.includes('1')) return 1;
        if (t.includes('2')) return 2;
        if (t.includes('3')) return 3;
        return 99;
      };
      return getPriority(a.title) - getPriority(b.title);
    });
  }, [sub.assessments]);

  return (
    <motion.div 
      layout
      onClick={() => onSelect(sub.id)}
      className={`shrink-0 w-[300px] h-fit min-h-[380px] rounded-[32px] border-[1.5px] p-8 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] relative overflow-hidden cursor-pointer ${cardStyles}`}
      style={cardBorderColor ? { borderColor: cardBorderColor } : {}}
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <span className={`text-[12px] font-black uppercase tracking-[0.2em] ${subTextStyles}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
            {sub.code}
          </span>
          <div className={`h-4 px-1.5 rounded-full flex items-center justify-center ${badgeText}`} style={{ backgroundColor: badgeBg }}>
            <span className="text-[7px] font-bold uppercase tracking-widest leading-none" style={{ fontFamily: 'var(--font-afacad)' }}>
              {sub.type || 'Theory'}
            </span>
          </div>
        </div>
        <span className={`text-xl font-bold lowercase tracking-tight leading-tight ${textStyles}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
          {sub.title}
        </span>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => {
              const ass = sortedAssessments[i];
              if (ass) {
                const box = getBoxTheme(ass.got, ass.max);
                return (
                  <div key={i} className={`px-2.5 pt-2 pb-1.5 rounded-xl border ${box.boxBg} ${box.border} flex flex-col justify-start gap-1 shadow-sm h-[50px] relative overflow-hidden`}>
                    <span className={`text-[10px] font-black uppercase ${box.text} opacity-80 block leading-none relative z-10`} style={{ fontFamily: 'var(--font-montserrat)' }}>{ass.title}</span>
                    <div className="flex items-baseline gap-0.5 leading-none mt-auto">
                      <span className={`text-[15px] font-black ${box.text}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{ass.got}</span>
                      <span className={`text-[10px] font-black opacity-40 ${box.text}`} style={{ fontFamily: 'var(--font-montserrat)' }}>/{ass.max}</span>
                    </div>
                  </div>
                );
              }
              return (
                <div key={i} className="px-2.5 pt-2 pb-1.5 rounded-xl border border-dashed border-theme-text/20 bg-theme-text/[0.01] flex flex-col justify-start gap-1 opacity-40 shadow-inner h-[50px] relative overflow-hidden">
                  <span className="text-[10px] font-black uppercase text-theme-muted block leading-none" style={{ fontFamily: 'var(--font-montserrat)' }}>tba</span>
                  <div className="flex items-baseline gap-0.5 leading-none mt-auto">
                    <span className={`text-[15px] font-black text-theme-muted/30`} style={{ fontFamily: 'var(--font-montserrat)' }}>-</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-1">
            <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${subTextStyles}`} style={{ fontFamily: 'var(--font-afacad)' }}>
              total internals
            </span>
            <div className="flex flex-col gap-1 relative">
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-black tracking-tighter leading-none ${statusColor}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
                  {sub.totalGot.toFixed(1)}
                </span>
                <span className={`text-xl font-black ${subTextStyles}`}>/{sub.totalMax.toFixed(0)}</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden mt-1 ${progressBarBg}`}>
                <div 
                  className="h-full rounded-full transition-all duration-1000" 
                  style={{ 
                    width: `${(sub.totalGot / sub.totalMax) * 100}%`,
                    backgroundColor: progressBarFill
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const MarkCardList = ({ ass }: any) => {
  const box = getBoxTheme(ass.got, ass.max);
  const lost = (ass.max - ass.got).toFixed(1);
  return (
    <div className={`p-3 rounded-2xl border-2 ${box.boxBg} ${box.border} flex flex-col justify-between transition-all duration-300 group relative overflow-hidden flex-1 min-w-[120px]`}>
      <div className="relative z-10">
        <span className={`text-[10px] font-black uppercase tracking-widest ${box.text} opacity-100 mb-1 block`} style={{ fontFamily: 'var(--font-montserrat)' }}>
          {ass.title}
        </span>
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-black ${box.text}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{ass.got}</span>
          <span className={`text-[11px] font-black opacity-60 ${box.text}`} style={{ fontFamily: 'var(--font-montserrat)' }}>/ {ass.max}</span>
        </div>
      </div>
      {parseFloat(lost) > 0 && (
        <div className="absolute top-2 right-2.5 flex flex-col items-end">
          <span className="text-base font-black text-theme-secondary uppercase leading-none" style={{ fontFamily: 'var(--font-montserrat)' }}>-{lost}</span>
        </div>
      )}
    </div>
  );
};

const TBAMarkCard = () => (
  <div className="p-3 rounded-2xl border-2 border-theme-border border-dashed flex flex-col justify-between opacity-60 flex-1 min-w-[120px]">
    <div>
      <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted mb-1 block" style={{ fontFamily: 'var(--font-montserrat)' }}>
        tba
      </span>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-theme-muted" style={{ fontFamily: 'var(--font-montserrat)' }}>-</span>
        <span className={`text-[11px] font-black opacity-60 text-theme-muted`} style={{ fontFamily: 'var(--font-montserrat)' }}>/ -</span>
      </div>
    </div>
  </div>
);

const GradeNeedCard = ({ grade, min, sub, isCurrentOnTrack }: any) => {
  const internalsRemaining = Math.max(0, 60 - (sub?.totalMax || 0));
  const currentGot = sub?.totalGot || 0;
  const assumedEndSemContribution = sub.isPractical ? 40 : 34.7;
  const neededInternalsTotal = Math.max(0, min - assumedEndSemContribution);
  const neededFromRemaining = Math.max(0, neededInternalsTotal - currentGot);
  
  const isPossible = (currentGot + internalsRemaining + assumedEndSemContribution) >= (min - 0.05);
  const isAlreadySafe = currentGot >= (neededInternalsTotal - 0.05);

  let stateStyles = "bg-theme-surface border-theme-border opacity-60";
  if (!isPossible) {
    stateStyles = "bg-theme-secondary/5 border-theme-secondary text-theme-secondary opacity-80";
  } else if (isCurrentOnTrack) {
    stateStyles = "bg-theme-highlight text-theme-bg border-theme-highlight shadow-sm scale-[1.02]";
  }

  return (
    <div className={`flex items-center justify-between p-4 rounded-2xl transition-all border-2 ${stateStyles}`}>
      <span className="text-base font-black" style={{ fontFamily: 'var(--font-montserrat)' }}>{grade}</span>
      <span className={`text-[11px] font-black uppercase text-right ${isCurrentOnTrack ? 'opacity-80' : 'opacity-60'}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
        {!isPossible ? 'rip' : isAlreadySafe ? 'Safe' : `Need ${neededFromRemaining.toFixed(1)}`}
      </span>
    </div>
  );
};

const DetailedWorkspace = ({ sub, targetGrade, updateTarget, expectedMarks, setExpectedMarks, targetGradesMap, isTargetEnabled, toggleTarget }: any) => {
  if (!sub) return null;

  const grades = useMemo(() => [
    { label: "O", min: 91 }, { label: "A+", min: 81 }, { label: "A", min: 71 }, { label: "B+", min: 61 }, { label: "B", min: 56 }, { label: "C", min: 50 },
  ], []);

  const targetGradeLabel = useMemo(() => grades.find(g => g.min === targetGrade)?.label || "??", [targetGrade, grades]);

  const { semRequiredOutOfMax, isCooked } = useMemo(() => 
    calculateSemMarksNeeded(targetGrade, sub.totalGot || 0, expectedMarks, sub.isPractical),
    [targetGrade, sub.totalGot, expectedMarks, sub.isPractical]
  );

  const bestAchievable = useMemo(() => calculateBestAchievableGrade(sub.totalGot || 0, sub.totalMax || 60), [sub]);
  
  const bestAchievableWith65 = useMemo(() => {
    const contribution = sub.isPractical ? 40 : 34.7;
    const internalsRemaining = Math.max(0, 60 - (sub.totalMax || 0));
    const maxPossibleTotal = (sub.totalGot || 0) + internalsRemaining + contribution;
    return grades.find(g => maxPossibleTotal >= (g.min - 0.05))?.min || 0;
  }, [sub, grades]);

  const advice = useMemo(() => {
    const totalMax = sub.totalMax || 0;
    const totalGot = sub.totalGot || 0;
    const lostMarks = totalMax - totalGot;
    
    if (sub.assessments?.length === 0 || totalMax === 0) {
      return { text: "academia forgot to enter your details blud. waiting for them to wake up.", sentiment: "neutral", lostMarks: 0, category: "neutral" };
    }
    
    const bestLabel = bestAchievable.best.label;
    let sentiment = "neutral";
    let category = "neutral";

    if (bestLabel === "F") {
      sentiment = "danger"; category = "cooked";
    } else if (bestLabel === "O") {
      sentiment = "safe"; category = "safe";
    } else if (bestLabel === "A+") {
      sentiment = "warning"; category = "lostO";
    } else if (bestLabel === "A") {
      sentiment = "danger"; category = "lostAPlus";
    } else {
      sentiment = "danger"; category = "lostAPlus";
    }

    const texts = (flavorText.marks as any)[category] || flavorText.marks.neutral;
    const hash = sub.id.split('').reduce((acc: any, char: any) => ((acc << 5) - acc) + char.charCodeAt(0) | 0, 0);
    const seed = Math.abs(hash); 
    const rawTxt = texts[seed % texts.length];
    return { text: rawTxt.replace(/{grade}/g, targetGradeLabel), sentiment, lostMarks, category };
  }, [sub, targetGradeLabel, bestAchievable]);

  const sentimentStyles: Record<string, string> = {
    danger: "bg-theme-secondary text-theme-bg border-theme-secondary",
    warning: "bg-theme-secondary/10 border-theme-secondary text-theme-secondary", 
    razor: "bg-theme-secondary/5 text-theme-secondary border-theme-secondary border-dotted shadow-[0_0_15px_rgba(255,77,77,0.2)]",
    safe: "bg-theme-highlight text-theme-bg border-theme-highlight",
    achievable: "bg-theme-highlight text-theme-bg border-theme-highlight shadow-sm",
    neutral: "bg-theme-surface text-theme-text border-theme-border",
  };

  const adviceEmoji = useMemo(() => {
    if (advice.category === 'lostO' || advice.category === 'cooked' || advice.category === 'lostAPlus') return <Frown size={24} strokeWidth={2.5} />;
    if (advice.category === 'razor' || advice.sentiment === 'warning') return <Meh size={24} strokeWidth={2.5} />;
    return <Smile size={24} strokeWidth={2.5} />;
  }, [advice]);

  const internalsRemaining = Math.max(0, 60 - (sub.totalMax || 0));
  const placeholdersCount = Math.max(0, 5 - (sub.assessments?.length || 0));
  const placeholders = Array.from({ length: placeholdersCount });

  const adviceBoxStyles = useMemo(() => {
    if (advice.category === 'lostO') return "bg-theme-secondary/10 border-theme-secondary text-theme-secondary";
    if (advice.category === 'lostAPlus' || advice.category === 'cooked') return "bg-theme-secondary text-theme-bg border-theme-secondary";
    return sentimentStyles[advice.sentiment] || sentimentStyles.neutral;
  }, [advice, sentimentStyles]);

  const adviceIconStyles = useMemo(() => {
    if (advice.category === 'lostAPlus' || advice.category === 'cooked' || advice.sentiment === 'safe' || advice.sentiment === 'achievable') {
      return "bg-white/20 text-white";
    }
    if (advice.category === 'lostO') {
      return "bg-theme-secondary/20 text-theme-secondary";
    }
    if (advice.sentiment === 'danger' || advice.sentiment === 'razor') {
      return "bg-theme-secondary/10 text-theme-secondary";
    }
    return "bg-theme-bg text-theme-text";
  }, [advice]);

  return (
    <div className="flex flex-col gap-10 px-10">
      <div className={`flex flex-row justify-between items-start border-b-2 pb-6 gap-10 border-theme-border`}>
        <div className="flex-1 min-w-0">
          <h2 className="text-3xl font-black text-theme-text lowercase tracking-tighter leading-[1.1] mb-1" style={{ fontFamily: 'var(--font-montserrat)' }}>{sub.title}</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-theme-muted" style={{ fontFamily: 'var(--font-montserrat)' }}>{sub.code}</span>
            <div className="w-1 h-1 rounded-full bg-theme-border" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-theme-highlight" style={{ fontFamily: 'var(--font-montserrat)' }}>{sub.credits || 0} credits</span>
              <div className="w-1 h-1 rounded-full bg-theme-border" />
              <span className={`text-[10px] font-black uppercase tracking-widest ${sub.type?.toLowerCase().includes('practical') ? 'text-[#0EA5E9]' : 'text-theme-text'}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{sub.type}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted" style={{ fontFamily: 'var(--font-montserrat)' }}>Total Marks</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-theme-text leading-none" style={{ fontFamily: 'var(--font-montserrat)' }}>{(sub.totalGot || 0).toFixed(1)}</span>
            <span className="text-sm font-black text-theme-muted opacity-30 leading-none" style={{ fontFamily: 'var(--font-montserrat)' }}>/ {(sub.totalMax || 0).toFixed(1)}</span>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-theme-muted whitespace-nowrap" style={{ fontFamily: 'var(--font-montserrat)' }}>Test Performance</span>
          <div className="h-[1px] flex-1 bg-theme-border opacity-30" />
        </div>
        <div className="flex flex-row gap-3 w-full overflow-x-auto no-scrollbar pb-1">
          {sub.assessments?.map((ass: any, i: number) => <MarkCardList key={i} ass={ass} />)}
          {placeholders.map((_, i) => <TBAMarkCard key={`tba-${i}`} />)}
        </div>
      </section>

      <div className={`p-6 rounded-[32px] border-2 flex flex-row items-center justify-between gap-8 w-full relative overflow-hidden transition-all duration-500 ${adviceBoxStyles}`}>
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <div className={`p-3 rounded-2xl shrink-0 ${adviceIconStyles}`}>
            {adviceEmoji}
          </div>
          <p className="text-xl font-black lowercase leading-tight tracking-tight max-w-2xl line-clamp-2" style={{ fontFamily: 'var(--font-afacad)' }}>
            {advice.text}
          </p>
        </div>

        <div className="flex items-center gap-8 shrink-0 border-l border-current/10 pl-8 h-12">
          <div className="flex flex-col items-end justify-center">
            <div className="flex flex-col items-end leading-none">
              <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Best Possible</span>
              <span className="text-xl font-black tracking-tighter" style={{ fontFamily: 'var(--font-montserrat)' }}>{bestAchievable.best.label} Grade</span>
            </div>
            <div className="flex flex-col items-end leading-none mt-1">
              <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Total Marks Lost</span>
              <span className="text-sm font-black tracking-tighter" style={{ fontFamily: 'var(--font-montserrat)' }}>-{advice.lostMarks.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-12 xl:col-span-5">
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-theme-muted whitespace-nowrap" style={{ fontFamily: 'var(--font-montserrat)' }}>Grade Requirements</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-3 gap-2">
                {grades.slice(0, 3).map((g, i) => (
                  <GradeNeedCard key={i} grade={g.label} min={g.min} sub={sub} isCurrentOnTrack={bestAchievableWith65 === g.min} />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {grades.slice(3).map((g, i) => (
                  <GradeNeedCard key={i} grade={g.label} min={g.min} sub={sub} isCurrentOnTrack={bestAchievableWith65 === g.min} />
                ))}
              </div>
            </div>
            <p className="text-[8px] font-black text-theme-muted uppercase tracking-[0.2em] mt-2 opacity-50" style={{ fontFamily: 'var(--font-montserrat)' }}>
              *Assumes <span className="font-black text-theme-text opacity-100">65/75</span> endsem
            </p>
          </section>
        </div>

        <div className="col-span-12 xl:col-span-7">
          <div className={`bg-theme-surface border-2 rounded-[32px] p-6 flex flex-col gap-4 relative overflow-hidden shadow-xl h-full justify-center transition-all duration-500 ${isTargetEnabled ? 'border-theme-border' : 'border-theme-border opacity-60 grayscale'}`}>
            <div className="absolute -bottom-10 -right-10 opacity-[0.03] rotate-12 text-theme-text"><TargetIcon size={200} /></div>
            
            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-all ${isTargetEnabled ? 'bg-theme-text/5 text-theme-text' : 'bg-theme-muted/10 text-theme-muted'}`}><TargetIcon size={16} /></div>
                  <h2 className="text-lg font-black lowercase tracking-tighter" style={{ fontFamily: 'var(--font-montserrat)' }}>Target</h2>
                </div>
                <button 
                  onClick={() => toggleTarget(sub.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all ${isTargetEnabled ? 'bg-theme-highlight/10 border-theme-highlight text-theme-highlight' : 'bg-theme-muted/5 border-theme-border text-theme-muted'}`}
                >
                  <Power size={12} />
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>{isTargetEnabled ? 'Active' : 'Disabled'}</span>
                </button>
              </div>

              {isTargetEnabled ? (
                <div className="flex flex-row items-center gap-8">
                  <div className="space-y-1 shrink-0">
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-theme-muted" style={{ fontFamily: 'var(--font-montserrat)' }}>Required in Endsem</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-5xl font-black ${isCooked ? 'text-theme-secondary' : 'text-theme-text'} tracking-tighter`} style={{ fontFamily: 'var(--font-montserrat)' }}>{isCooked ? 'cooked' : semRequiredOutOfMax}</span>
                      {!isCooked && <span className="text-xl font-black text-theme-muted opacity-30" style={{ fontFamily: 'var(--font-montserrat)' }}>/{sub.isPractical ? 40 : 75}</span>}
                    </div>
                  </div>

                  <div className="w-[2px] h-24 bg-theme-text/20 shrink-0" />

                  <div className="flex-1 flex flex-col gap-4">
                    <div className="space-y-2">
                      <span className="text-[8px] font-black uppercase tracking-[0.4em] text-theme-muted" style={{ fontFamily: 'var(--font-montserrat)' }}>Set Target Grade</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {grades.map(g => (
                          <button 
                            key={g.label}
                            onClick={() => updateTarget(sub.id, g.min)}
                            className={`px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase transition-all border-2 ${targetGrade === g.min ? 'bg-theme-highlight text-theme-bg border-theme-highlight shadow-sm' : 'bg-transparent text-theme-text border-theme-border hover:border-theme-text/40'}`}
                            style={{ fontFamily: 'var(--font-montserrat)' }}
                          >
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[8px] font-black uppercase tracking-[0.4em] text-theme-muted whitespace-nowrap" style={{ fontFamily: 'var(--font-montserrat)' }}>Expected Internals</span>
                      <div className="flex items-center gap-1.5 max-w-[160px]">
                        <button onClick={() => setExpectedMarks(sub.id, Math.max(0, expectedMarks - 1))} className="w-8 h-8 rounded-full text-theme-text hover:bg-theme-text/5 flex items-center justify-center transition-all border border-theme-border shrink-0"><Minus size={12} /></button>
                        <div className="relative flex-1">
                          <input 
                            type="number"
                            value={expectedMarks === 0 ? "" : expectedMarks}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setExpectedMarks(sub.id, Math.min(internalsRemaining, Math.max(0, val)));
                            }}
                            placeholder="0.0"
                            className="bg-theme-surface border-2 border-theme-border rounded-full text-center text-sm font-black text-theme-text w-full py-1.5 pl-2 pr-8 outline-none focus:border-theme-highlight/50 focus:bg-theme-highlight/[0.03] transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            style={{ fontFamily: 'var(--font-montserrat)' }}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-theme-muted opacity-40" style={{ fontFamily: 'var(--font-montserrat)' }}>/{internalsRemaining.toFixed(0)}</span>
                        </div>
                        <button onClick={() => setExpectedMarks(sub.id, Math.min(internalsRemaining, expectedMarks + 1))} className="w-8 h-8 rounded-full text-theme-text hover:bg-theme-text/5 flex items-center justify-center transition-all border border-theme-border shrink-0"><Plus size={12} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <Power size={32} className="text-theme-muted mb-3 opacity-20" />
                  <p className="text-sm font-bold text-theme-muted lowercase max-w-[200px]" style={{ fontFamily: 'var(--font-montserrat)' }}>Target tracking is disabled for this subject.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MarksDashboard = ({ stats, roast, isAnimating, subjects, targetGrades, targetEnabledState, onSelect }: any) => {
  const totalCredits = useMemo(() => subjects.reduce((acc: number, s: any) => acc + (s.credits || 0), 0), [subjects]);
  const safeCount = subjects.filter((s: any) => s.status === 'safe').length;
  
  const grades = [
    { label: "O", min: 91 }, { label: "A+", min: 81 }, { label: "A", min: 71 }, { label: "B+", min: 61 }, { label: "B", min: 56 }, { label: "C", min: 50 },
  ];

  const groupedByCredits = useMemo(() => {
    const groups: Record<number, any[]> = {};
    subjects.forEach((s: any) => {
      const cr = s.credits || 0;
      if (!groups[cr]) groups[cr] = [];
      groups[cr].push(s);
    });
    return Object.entries(groups).sort((a, b) => Number(b[0]) - Number(a[0]));
  }, [subjects]);

  return (
    <div className="flex flex-col gap-16 px-10 py-4">
      <div className="grid grid-cols-12 gap-12 items-center">
        <div className="col-span-6">
          <div className="mb-6">
            <span className="text-theme-muted text-[11px] font-bold uppercase tracking-[0.5em] block mb-3" style={{ fontFamily: 'var(--font-afacad)' }}>Predicted SGPA</span>
            <div className="flex items-baseline">
              <h2 className="text-[80px] font-black text-theme-text leading-[0.8] tracking-[-0.08em]" style={{ fontFamily: 'var(--font-montserrat)' }}>{stats.gpa}</h2>
            </div>
          </div>
          <div className="space-y-8">
            <p className="text-theme-muted/80 text-2xl font-semibold lowercase tracking-tight leading-snug" style={{ fontFamily: 'var(--font-afacad)' }}>{roast}</p>
          </div>
        </div>
        
        <div className="col-span-6 border-l border-theme-border pl-12 space-y-10">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <span className="text-theme-muted text-[9px] font-bold uppercase tracking-[0.3em] block" style={{ fontFamily: 'var(--font-afacad)' }}>Total Internals</span>
              <div className="flex items-baseline gap-1.5 whitespace-nowrap overflow-hidden">
                <span className="text-theme-text text-3xl font-black tracking-tighter" style={{ fontFamily: 'var(--font-montserrat)' }}>{stats.totalInternalGot.toFixed(1)}</span>
                <span className="text-theme-muted text-sm font-bold opacity-40" style={{ fontFamily: 'var(--font-montserrat)' }}>/ {stats.totalInternalMax.toFixed(0)}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-theme-muted text-[9px] font-bold uppercase tracking-[0.3em] block" style={{ fontFamily: 'var(--font-afacad)' }}>Subjects</span>
              <div className="flex items-baseline gap-1.5 whitespace-nowrap overflow-hidden">
                <span className="text-theme-text text-3xl font-black tracking-tighter" style={{ fontFamily: 'var(--font-montserrat)' }}>{subjects.length}</span>
                <span className="text-theme-muted text-sm font-bold opacity-40 lowercase" style={{ fontFamily: 'var(--font-montserrat)' }}>tracked</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-theme-muted text-[9px] font-bold uppercase tracking-[0.3em] block" style={{ fontFamily: 'var(--font-afacad)' }}>Credits</span>
              <div className="flex items-baseline gap-1.5 whitespace-nowrap overflow-hidden">
                <span className="text-theme-text text-3xl font-black tracking-tighter" style={{ fontFamily: 'var(--font-montserrat)' }}>{totalCredits}</span>
                <span className="text-theme-muted text-sm font-bold opacity-40 lowercase" style={{ fontFamily: 'var(--font-montserrat)' }}>units</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-theme-muted text-[9px] font-bold uppercase tracking-[0.3em] block" style={{ fontFamily: 'var(--font-afacad)' }}>Status</span>
              <div className="flex items-baseline gap-1.5 whitespace-nowrap overflow-hidden">
                <span className="text-theme-text text-3xl font-black tracking-tighter" style={{ fontFamily: 'var(--font-montserrat)' }}>{safeCount}</span>
                <span className="text-theme-muted text-sm font-bold opacity-40 lowercase" style={{ fontFamily: 'var(--font-montserrat)' }}>safe</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-12 pb-12">
        {groupedByCredits.map(([credits, subs]) => (
          <div key={credits} className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-theme-muted whitespace-nowrap" style={{ fontFamily: 'var(--font-montserrat)' }}>{credits} Credit Subjects</span>
              <div className="h-[1px] flex-1 bg-theme-border opacity-30" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subs.map((s: any) => {
                const isEnabled = targetEnabledState[s.id] !== false;
                const targetMin = targetGrades[s.id] || 91;
                const targetLabel = grades.find(g => g.min === targetMin)?.label || "O";
                return (
                  <div 
                    key={s.id} 
                    onClick={() => onSelect(s.id)}
                    className={`flex items-center justify-between p-5 rounded-[24px] bg-theme-surface/40 border transition-all duration-300 group cursor-pointer hover:scale-[1.02] hover:bg-theme-surface/60 hover:shadow-xl hover:border-theme-text/30 ${!isEnabled ? 'opacity-50 grayscale' : ''}`}
                    style={{ borderColor: 'color-mix(in srgb, var(--theme-text) 15%, transparent)' }}
                  >
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-theme-muted mb-1" style={{ fontFamily: 'var(--font-montserrat)' }}>{s.code}</span>
                      <h3 className="text-sm font-bold lowercase tracking-tight text-theme-text truncate max-w-[180px]" style={{ fontFamily: 'var(--font-montserrat)' }}>{s.title}</h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black uppercase tracking-widest text-theme-muted opacity-60">Target</span>
                        <span className="text-xl font-black text-theme-highlight leading-none" style={{ fontFamily: 'var(--font-montserrat)' }}>{isEnabled ? targetLabel : 'OFF'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function DesktopMarks() {
  const { userData } = useApp();
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"feed" | "list">("feed");
  const [activeTab, setActiveTab] = useState<string | "dashboard">("dashboard");
  const [targetData, setTargetData] = useState<{
    grades: Record<string, number>;
    expected: Record<string, number>;
    enabled: Record<string, boolean>;
  }>({ grades: {}, expected: {}, enabled: {} });

  const [isStatsExpanded, setIsStatsExpanded] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTargetData(JSON.parse(saved));
      } catch (e) {}
    }
    const timer = setTimeout(() => setIsStatsExpanded(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const subjects = useMemo(() => {
    if (!userData?.marks) return [];
    const courseMap = buildCourseMap(userData);
    const sorted = processAndSortMarks(userData.marks, courseMap);
    
    return sorted.map((sub: any) => {
      let credits = sub.credits;
      if (!credits || credits === 0) {
        const sStr = sub.slot || "";
        const firstSlot = sStr.split(/[,\s+-]/)[0].trim().toUpperCase();
        let courseDetails = (userData.courses as any)?.[firstSlot];

        if (!courseDetails) {
          const normCode = (sub.code || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
          courseDetails = Object.values(userData.courses || {}).find((c: any) => {
            const cCode = (c.code || c.courseCode || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
            return cCode === normCode &&
              ((c.type || "").toLowerCase().includes("lab") === sub.isPractical || 
               (c.type || "").toLowerCase().includes("practical") === sub.isPractical);
          });
        }
        credits = courseDetails?.credits;
      }

      return {
        ...sub,
        credits: parseInt(credits || "0")
      };
    });
  }, [userData]);

  const updateTargetGrade = (subId: string, val: number) => {
    setTargetData(prev => {
      const newData = { ...prev, grades: { ...prev.grades, [subId]: val } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  };

  const setExpectedMarks = (subId: string, val: number) => {
    setTargetData(prev => {
      const newData = { ...prev, expected: { ...prev.expected, [subId]: val } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  };

  const toggleTarget = (subId: string) => {
    setTargetData(prev => {
      const current = prev.enabled[subId] !== false;
      const newData = { ...prev, enabled: { ...prev.enabled, [subId]: !current } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  };

  const activeSub = useMemo(() => subjects.find(s => s.id === activeTab), [subjects, activeTab]);

  useEffect(() => {
    if (subjects.length > 0) {
      setTargetData(prev => {
        let changed = false;
        const newGrades = { ...prev.grades };
        subjects.forEach(sub => {
          const best = calculateBestAchievableGrade(sub.totalGot || 0, sub.totalMax || 60);
          const currentTarget = newGrades[sub.id];
          if (!currentTarget || currentTarget > best.maxPossibleTotal) {
            newGrades[sub.id] = best.best.min || 50;
            changed = true;
          }
        });
        if (changed || Object.keys(prev.grades).length === 0) {
          const newData = { ...prev, grades: newGrades, enabled: prev.enabled || {}, expected: prev.expected || {} };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
          return newData;
        }
        return prev;
      });
    }
  }, [subjects]);

  const currentTargetGrade = useMemo(() => {
    if (!activeSub) return 91;
    return targetData.grades[activeSub.id] || 91;
  }, [activeSub, targetData.grades]);

  const stats = useMemo(() => {
    const activeTargets = subjects.filter(s => targetData.enabled[s.id] !== false);
    const gpa = calculatePredictedGpa(activeTargets, targetData.grades, []);
    const totalInternalGot = subjects.reduce((acc: number, s: any) => acc + (s.totalGot || 0), 0);
    const totalInternalMax = subjects.reduce((acc: number, s: any) => acc + (s.totalMax || 0), 0);
    const badge = parseFloat(gpa) > 9 ? "safe" : parseFloat(gpa) > 8 ? "danger" : "cooked";
    return { gpa, totalInternalGot, totalInternalMax, badge };
  }, [subjects, targetData]);

  const roast = useMemo(() => {
    const roasts = flavorText.marks[stats.badge as keyof typeof flavorText.marks] || flavorText.marks.neutral;
    return roasts[Math.floor(Math.random() * roasts.length)];
  }, [stats.badge]);

  const handleMouseEnter = () => {
    if (!isStatsExpanded) hoverTimeoutRef.current = setTimeout(() => setIsStatsExpanded(true), 1500);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (!isAnimating) setIsStatsExpanded(false);
  };

  if (!mounted) return null;

  const handleSelectSub = (id: string) => {
    setActiveTab(id);
    setViewMode("list");
  };

  const criticalSubs = subjects.filter(s => s.status === 'cooked');
  const normalSubs = subjects.filter(s => s.status !== 'cooked');

  return (
    <div className="relative h-full w-full">
      <div className="flex flex-row h-full">
        <AnimatePresence>
          {viewMode === "feed" && (
            <motion.div 
              key="stats-sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: isStatsExpanded ? 320 : 80, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onAnimationStart={() => setIsAnimating(true)}
              onAnimationComplete={() => setIsAnimating(false)}
              onClick={() => !isStatsExpanded && setIsStatsExpanded(true)}
              className={`shrink-0 h-full relative z-10 flex flex-col items-center justify-center overflow-visible ${!isStatsExpanded ? 'cursor-pointer' : ''}`}
            >
              <div className={`absolute inset-0 transition-colors duration-500 ${stats.badge === 'cooked' ? 'bg-[#FF4D4D]/5' : 'bg-theme-surface/10'}`} />
              <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-r from-theme-surface/10 to-transparent translate-x-full pointer-events-none z-20" />
              
              <AnimatePresence mode="wait">
                {isStatsExpanded ? (
                  <motion.div key="expanded" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full h-full flex flex-col justify-center px-10 relative overflow-hidden">
                    <div className="flex flex-col justify-center">
                      <div className="mb-6">
                        <span className="text-theme-muted text-[11px] font-bold uppercase tracking-[0.5em] block mb-3" style={{ fontFamily: 'var(--font-afacad)' }}>Predicted SGPA</span>
                        <div className="flex items-baseline">
                          <h2 className="text-[80px] font-black text-theme-text leading-[0.8] tracking-[-0.08em]" style={{ fontFamily: 'var(--font-montserrat)' }}>{stats.gpa}</h2>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="overflow-hidden">
                          <motion.p animate={{ opacity: isAnimating ? 0 : 1 }} transition={{ duration: 0.1 }} className="text-theme-muted/80 text-2xl font-semibold lowercase tracking-tight leading-snug whitespace-nowrap" style={{ fontFamily: 'var(--font-afacad)' }}>{roast}</motion.p>
                        </div>
                        <div className="flex items-baseline gap-2 whitespace-nowrap overflow-hidden">
                          <span className="text-theme-text text-3xl font-black tracking-tighter" style={{ fontFamily: 'var(--font-montserrat)' }}>{stats.totalInternalGot.toFixed(1)}</span>
                          <span className="text-theme-muted text-sm font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-afacad)' }}>/ {stats.totalInternalMax.toFixed(0)} internals</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center w-full h-full relative gap-3">
                    <span
                      className="text-theme-text text-[32px] font-black tabular-nums select-none opacity-60"
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontFamily: 'var(--font-montserrat)', letterSpacing: '-0.06em' }}
                    >
                      {stats.gpa}
                    </span>
                    <span
                      className="text-theme-muted text-[8px] font-black uppercase tracking-[0.4em] select-none opacity-40"
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontFamily: 'var(--font-montserrat)' }}
                    >
                      sgpa
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {isStatsExpanded && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    onClick={(e) => { e.stopPropagation(); setIsStatsExpanded(false); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-theme-bg border border-theme-border flex items-center justify-center text-theme-muted hover:text-theme-text transition-all shadow-2xl z-30"
                  >
                    <ChevronLeft size={20} />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 relative h-full flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {viewMode === "feed" ? (
                <div key="feed-container" className="flex-1 h-full w-full overflow-hidden flex items-center">
                  <ReactLenis options={{ orientation: 'horizontal', smoothWheel: true }} className="h-full w-full overflow-x-auto no-scrollbar">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-row gap-20 px-24 pb-20 pt-24 h-full items-start w-max">
                      {criticalSubs.length > 0 && (
                        <div className="flex flex-col gap-4 h-fit">
                          <div className="flex items-center gap-4 px-4 mb-2">
                            <span className="text-[#FF4D4D] text-[10px] font-bold uppercase tracking-[0.5em] shrink-0" style={{ fontFamily: 'var(--font-afacad)' }}>low internals</span>
                            <div className="w-12 h-px bg-[#FF4D4D]/20" />
                          </div>
                          <div className="flex flex-row gap-6">
                            {criticalSubs.map(s => <MarkSubjectCard key={s.id} sub={s} onSelect={handleSelectSub} />)}
                          </div>
                        </div>
                      )}
                      {normalSubs.length > 0 && (
                        <div className="flex flex-col gap-4 h-fit">
                          <div className="flex items-center gap-4 px-4 mb-2">
                            <span className="text-theme-text/40 text-[10px] font-bold uppercase tracking-[0.5em] shrink-0" style={{ fontFamily: 'var(--font-afacad)' }}>subjects</span>
                            <div className="w-12 h-px bg-theme-text/40" />
                          </div>
                          <div className="flex flex-row gap-6">
                            {normalSubs.map(s => <MarkSubjectCard key={s.id} sub={s} onSelect={handleSelectSub} />)}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </ReactLenis>
                </div>
              ) : (
                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-row overflow-hidden">
                  <div className="w-[340px] h-full border-r border-theme-border relative shrink-0">
                    <ReactLenis options={{ orientation: 'vertical', smoothWheel: true }} className="absolute inset-0 overflow-y-auto no-scrollbar p-6 flex flex-col gap-3">
                      <div onClick={() => setActiveTab('dashboard')} className={`p-4 rounded-2xl cursor-pointer transition-all ${activeTab === 'dashboard' ? 'bg-theme-text/10 text-theme-text shadow-md scale-[1.02]' : 'hover:bg-theme-text/5'} group flex items-center gap-4`}>
                        <div className={`p-2 rounded-xl ${activeTab === 'dashboard' ? 'bg-theme-text/20' : 'bg-theme-surface'}`}><LayoutDashboard size={18} /></div>
                        <span className="text-sm font-bold lowercase tracking-tight" style={{ fontFamily: 'var(--font-montserrat)' }}>dashboard</span>
                      </div>
                      {subjects.map(s => (
                        <div key={s.id} onClick={() => setActiveTab(s.id)} className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 ${activeTab === s.id ? 'bg-theme-text/10 text-theme-text shadow-md scale-[1.02] border-theme-highlight/30' : 'bg-transparent hover:bg-theme-text/5'} border border-transparent`}>
                          <span className={`text-[8px] font-black uppercase tracking-widest mb-0.5 block opacity-40`} style={{ fontFamily: 'var(--font-montserrat)' }}>{s.code}</span>
                          <h3 className={`text-xs font-bold lowercase truncate tracking-tight`} style={{ fontFamily: 'var(--font-montserrat)' }}>{s.title}</h3>
                        </div>
                      ))}
                    </ReactLenis>
                  </div>
                  <div className="flex-1 relative h-full bg-theme-bg">
                    <ReactLenis options={{ orientation: 'vertical', smoothWheel: true }} className="absolute inset-0 overflow-y-auto no-scrollbar p-10 pt-8">
                      {activeTab === "dashboard" ? (
                        <MarksDashboard 
                          stats={stats} 
                          roast={roast} 
                          isAnimating={isAnimating} 
                          subjects={subjects} 
                          targetGrades={targetData.grades}
                          targetEnabledState={targetData.enabled}
                          onSelect={handleSelectSub}
                        />
                      ) : activeSub && (
                        <DetailedWorkspace 
                          sub={activeSub} 
                          targetGrade={currentTargetGrade}
                          updateTarget={updateTargetGrade}
                          expectedMarks={targetData.expected[activeSub.id] || 0}
                          setExpectedMarks={setExpectedMarks}
                          targetGradesMap={targetData.grades}
                          isTargetEnabled={targetData.enabled[activeSub.id] !== false}
                          toggleTarget={toggleTarget}
                        />
                      )}
                    </ReactLenis>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="px-8 pb-10 flex items-center z-20 shrink-0 h-20">
            <div className="flex bg-theme-surface p-1 rounded-2xl border border-theme-border shadow-inner gap-1">
              <button onClick={() => setViewMode("feed")} className={`px-6 py-2 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${viewMode === "feed" ? 'bg-theme-emphasis text-theme-bg shadow-md' : 'text-theme-muted hover:text-theme-text'}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
                <LayoutGrid size={14} />overview
              </button>
              <button onClick={() => { setViewMode("list"); setActiveTab("dashboard"); }} className={`px-6 py-2 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${viewMode === "list" ? 'bg-theme-emphasis text-theme-bg shadow-md' : 'text-theme-muted hover:text-theme-text'}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
                <Columns size={14} />detailed
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-8 right-8 pointer-events-none z-0 text-right">
        <h1 className="text-theme-text font-regular lowercase leading-none select-none opacity-80" style={{ fontFamily: 'var(--font-afacad)', fontSize: '55px', letterSpacing: '-4px' }}>marks</h1>
      </div>
    </div>
  );
}
