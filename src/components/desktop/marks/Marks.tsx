"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import DesktopSidebar from "../DesktopSidebar";
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
  BarChart3
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

const STORAGE_KEY = "ratio_marks_targets";

const getSubjectFlavor = (subId: string, category: string, targetGradeLabel: string, expected: number) => {
  const texts = (flavorText.marks as any)[category] || flavorText.marks.neutral;
  const hash = subId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0) | 0;
  }, 0);
  const seed = Math.abs(hash + targetGradeLabel.charCodeAt(0) + Math.floor(expected));
  return texts[seed % texts.length].replace(/{grade}/g, targetGradeLabel);
};

const DetailedMarkCard = ({ ass }: any) => {
  const box = getBoxTheme(ass.got, ass.max);
  const lost = (ass.max - ass.got).toFixed(1);
  return (
    <div className={`p-3 rounded-2xl border-2 ${box.boxBg} ${box.border} flex flex-col justify-between transition-all duration-300 hover:scale-[1.03] group relative overflow-hidden flex-1 min-w-[120px]`}>
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

const GradeNeedCard = ({ grade, min, sub, expected, isCurrentOnTrack }: any) => {
  const internalsRemaining = Math.max(0, 60 - (sub?.totalMax || 0));
  const currentGot = sub?.totalGot || 0;
  const assumedEndSemContribution = sub.isPractical ? 40 : 34.7;
  const neededInternalsTotal = Math.max(0, min - assumedEndSemContribution);
  const neededFromRemaining = Math.max(0, neededInternalsTotal - currentGot);
  
  const isPossible = (currentGot + internalsRemaining + assumedEndSemContribution) >= min;
  const isAlreadySafeWithExpected = (currentGot + expected) >= neededInternalsTotal;

  let stateStyles = "bg-theme-surface border-theme-border opacity-60";
  if (!isPossible) {
    stateStyles = "bg-theme-secondary/5 border-theme-secondary text-theme-secondary opacity-80";
  } else if (isCurrentOnTrack) {
    stateStyles = "bg-theme-highlight text-theme-bg border-theme-highlight shadow-sm scale-[1.02]";
  }

  return (
    <div className={`flex items-center justify-between p-3 rounded-2xl transition-all border-2 ${stateStyles}`}>
      <span className="text-sm font-black" style={{ fontFamily: 'var(--font-montserrat)' }}>{grade}</span>
      <span className={`text-[10px] font-black uppercase ${isCurrentOnTrack ? 'opacity-80' : 'opacity-60'}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
        {!isPossible ? 'rip' : isAlreadySafeWithExpected ? 'Safe' : `Need ${neededFromRemaining.toFixed(1)}`}
      </span>
    </div>
  );
};

const DetailedWorkspace = ({ sub, targetGrade, updateTarget, expectedMarks, setExpectedMarks, allSubjects, targetGradesMap }: any) => {
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
  
  const currentPredictedGrade = useMemo(() => {
    const contribution = sub.isPractical ? 40 : 34.7;
    const total = (sub.totalGot || 0) + expectedMarks + contribution;
    return grades.find(g => total >= g.min)?.min || 0;
  }, [sub, expectedMarks, grades]);

  const advice = useMemo(() => {
    const totalMax = sub.totalMax || 0;
    const totalGot = sub.totalGot || 0;
    const lostMarks = totalMax - totalGot;
    const internalsRemaining = 60 - totalMax;
    
    if (sub.assessments?.length === 0 || totalMax === 0) {
      return { text: "academia forgot to enter your details blud. waiting for them to wake up.", sentiment: "neutral", lostMarks: 0, category: "neutral" };
    }
    
    const neededInternalsTotal = Math.max(0, targetGrade - 40);
    const neededFromRemaining = Math.max(0, neededInternalsTotal - totalGot);
    const isAlreadySafe = totalGot >= neededInternalsTotal;
    const bestLabel = bestAchievable.best.label;
    
    let sentiment = "neutral";
    let category = "neutral";

    if (bestLabel === "F") {
      sentiment = "danger";
      category = "cooked";
    } else if (bestAchievable.maxPossibleTotal < targetGrade) {
      sentiment = "danger";
      category = "lostO";
    } else if (bestLabel === "A+") {
      sentiment = "warning";
      category = "lostO";
    } else if (bestLabel === "A") {
      sentiment = "warning";
      category = "lostAPlus";
    } else if (neededFromRemaining > internalsRemaining) {
      sentiment = "warning";
      category = "capped";
    } else if (neededFromRemaining > (internalsRemaining * 0.95) && !isAlreadySafe) {
      sentiment = "razor";
      category = "razor";
    } else if (neededFromRemaining <= 0) {
      sentiment = "safe";
      category = "safe";
    } else {
      sentiment = "achievable";
      category = "achievable";
    }

    return { text: getSubjectFlavor(sub.id, category, targetGradeLabel, expectedMarks), sentiment, lostMarks, category };
  }, [sub, targetGrade, targetGradeLabel, bestAchievable, expectedMarks]);

  const sentimentStyles: Record<string, string> = {
    danger: "bg-theme-secondary text-theme-bg border-theme-secondary",
    warning: "bg-theme-secondary/10 text-theme-secondary border-theme-secondary/20",
    razor: "bg-theme-secondary/5 text-theme-secondary border-theme-secondary border-dotted shadow-[0_0_15px_rgba(255,77,77,0.2)]",
    safe: "bg-theme-highlight text-theme-bg border-theme-highlight",
    achievable: "bg-theme-highlight text-theme-bg border-theme-highlight shadow-sm",
    neutral: "bg-theme-surface text-theme-text border-theme-border",
  };

  const adviceEmoji = useMemo(() => {
    if (advice.category === 'lostO' || advice.category === 'cooked') return <Frown size={24} strokeWidth={2.5} />;
    if (advice.category === 'razor' || advice.sentiment === 'warning') return <Meh size={24} strokeWidth={2.5} />;
    return <Smile size={24} strokeWidth={2.5} />;
  }, [advice]);

  const internalsRemaining = Math.max(0, 60 - (sub.totalMax || 0));
  const placeholdersCount = Math.max(0, 5 - (sub.assessments?.length || 0));
  const placeholders = Array.from({ length: placeholdersCount });

  const adviceBoxStyles = useMemo(() => {
    if (advice.category === 'lostO' || advice.category === 'cooked') return "bg-theme-secondary text-theme-bg border-theme-secondary";
    return sentimentStyles[advice.sentiment] || sentimentStyles.neutral;
  }, [advice, sentimentStyles]);

  return (
    <div className="flex flex-col gap-10">
      <div className={`flex flex-row justify-between items-start border-b-2 pb-6 gap-10 border-theme-border`}>
        <div className="flex-1 min-w-0">
          <h2 className="text-3xl font-black text-theme-text lowercase tracking-tighter leading-[1.1] mb-1" style={{ fontFamily: 'var(--font-montserrat)' }}>{sub.title}</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-theme-muted" style={{ fontFamily: 'var(--font-montserrat)' }}>{sub.code}</span>
            <div className="w-1 h-1 rounded-full bg-theme-border" />
            <span className={`text-[10px] font-black uppercase tracking-widest ${sub.type?.toLowerCase().includes('practical') ? 'text-[#0EA5E9]' : 'text-theme-text'}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{sub.type}</span>
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
          <span className="text-[9px] font-black uppercase tracking-normal text-theme-muted whitespace-nowrap" style={{ fontFamily: 'var(--font-montserrat)' }}>Test Performance</span>
          <div className="h-[1px] flex-1 bg-theme-border opacity-30" />
        </div>
        <div className="flex flex-row gap-3 w-full">
          {sub.assessments?.map((ass: any, i: number) => <DetailedMarkCard key={i} ass={ass} />)}
          {placeholders.map((_, i) => <TBAMarkCard key={`tba-${i}`} />)}
        </div>
      </section>

      <div className={`p-6 rounded-[32px] border-2 flex flex-row items-center justify-between gap-8 w-full relative overflow-hidden transition-all duration-500 ${adviceBoxStyles}`}>
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <div className={`p-3 rounded-2xl ${(advice.category === 'lostO' || advice.category === 'cooked' || advice.sentiment === 'safe' || advice.sentiment === 'achievable') ? 'bg-white/20 text-white' : advice.sentiment === 'danger' || advice.sentiment === 'razor' ? 'bg-theme-secondary/10 text-theme-secondary' : 'bg-theme-bg text-theme-text'} shrink-0`}>
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
        <div className="col-span-12 xl:col-span-7">
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-black uppercase tracking-normal text-theme-muted whitespace-nowrap" style={{ fontFamily: 'var(--font-montserrat)' }}>Grade Requirements</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {grades.map((g, i) => (
                <GradeNeedCard key={i} grade={g.label} min={g.min} sub={sub} expected={expectedMarks} isCurrentOnTrack={currentPredictedGrade === g.min} />
              ))}
            </div>
            <p className="text-[9px] font-black text-theme-muted uppercase tracking-[0.2em] mt-2 opacity-50" style={{ fontFamily: 'var(--font-montserrat)' }}>
              *This assumes you would get <span className="font-black text-theme-text opacity-100">65 out of 75</span> in the endsem
            </p>
          </section>
        </div>

        <div className="col-span-12 xl:col-span-5">
          <div className="bg-theme-surface border-2 border-theme-border rounded-[32px] p-6 flex flex-col gap-4 relative overflow-hidden shadow-xl h-full justify-center">
            <div className="absolute -bottom-10 -right-10 opacity-[0.03] rotate-12 text-theme-text"><TargetIcon size={200} /></div>
            
            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-theme-text/5 text-theme-text"><TargetIcon size={16} /></div>
                <h2 className="text-lg font-black lowercase tracking-tighter" style={{ fontFamily: 'var(--font-montserrat)' }}>Target</h2>
              </div>

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
                    <div className="flex flex-wrap gap-1.5">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MarksDashboard = ({ subjects, targetGradesMap, onSelectSubject }: any) => {
  const gpa = calculatePredictedGpa(subjects, targetGradesMap, []);
  const totalInternalGot = subjects.reduce((acc: number, s: any) => acc + (s.totalGot || 0), 0);
  const totalInternalMax = subjects.reduce((acc: number, s: any) => acc + (s.totalMax || 0), 0);

  const grades = [
    { label: "O", min: 91 }, { label: "A+", min: 81 }, { label: "A", min: 71 }, { label: "B+", min: 61 }, { label: "B", min: 56 }, { label: "C", min: 50 },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4 bg-theme-surface border-2 border-theme-border p-4 rounded-[28px] shadow-sm">
        <div className="flex-1 flex items-center gap-6 px-4 border-r border-theme-border/50">
          <div className="p-2.5 rounded-2xl bg-theme-highlight/10 text-theme-highlight"><Activity size={20} /></div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted mb-0.5 block" style={{ fontFamily: 'var(--font-montserrat)' }}>Predicted SGPA</span>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-theme-text tracking-tighter" style={{ fontFamily: 'var(--font-montserrat)' }}>{gpa}</span>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-6 px-4">
          <div className="p-2.5 rounded-2xl bg-theme-highlight/10 text-theme-highlight"><BarChart3 size={20} /></div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted mb-0.5 block" style={{ fontFamily: 'var(--font-montserrat)' }}>Semester Progress</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-theme-text tracking-tighter" style={{ fontFamily: 'var(--font-montserrat)' }}>{totalInternalGot.toFixed(1)}</span>
              <span className="text-sm font-black text-theme-muted opacity-20">/ {totalInternalMax.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black uppercase tracking-[0.6em] text-theme-muted" style={{ fontFamily: 'var(--font-montserrat)' }}>Overall Marks (based on target)</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((s: any) => {
            const targetMin = targetGradesMap[s.id];
            const targetLabel = grades.find(g => g.min === targetMin)?.label || "O";
            return (
              <div 
                key={s.id} 
                onClick={() => onSelectSubject(s.id)}
                className="bg-theme-surface border-2 border-theme-border rounded-[32px] p-5 flex flex-col gap-4 hover:bg-theme-text/5 hover:border-theme-text/20 transition-all hover:scale-[1.02] shadow-sm cursor-pointer group"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black uppercase text-theme-muted tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>{s.code}</span>
                  <h3 className="text-sm font-bold text-theme-text lowercase truncate tracking-tight group-hover:text-theme-highlight transition-colors" style={{ fontFamily: 'var(--font-montserrat)' }}>{s.title}</h3>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xl font-black text-theme-text tracking-tighter" style={{ fontFamily: 'var(--font-montserrat)' }}>{(s.totalGot || 0).toFixed(1)}<span className="opacity-20 text-sm">/{(s.totalMax || 0).toFixed(1)}</span></span>
                  <div className="px-3 py-1 rounded-full border border-theme-border text-[10px] font-black uppercase text-theme-text">{targetLabel}</div>
                </div>
              </div>
            );
          })}
        </div>
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
  }>({ grades: {}, expected: {} });

  useEffect(() => {
    setMounted(true);
    const oldKeys = ["target", "ratiod_target_data", "ratiod_target_grades"];
    oldKeys.forEach(k => localStorage.removeItem(k));

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTargetData(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const subjects = useMemo(() => {
    if (!userData?.marks) return [];
    const courseMap = buildCourseMap(userData);
    return processAndSortMarks(userData.marks, courseMap);
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
          const newData = { ...prev, grades: newGrades };
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

  if (!mounted) return null;

  return (
    <div className="h-screen w-full flex flex-row p-1.5 font-sans overflow-hidden transition-colors duration-500 selection:bg-theme-highlight selection:text-theme-bg"
      style={{ backgroundColor: 'color-mix(in srgb, var(--theme-bg), black 12%)' }}>
      <div className="flex-1 bg-theme-bg rounded-[24px] relative overflow-hidden flex flex-col border border-theme-border shadow-2xl h-full">
        
        <div className="w-full h-14 border-b border-theme-border flex items-center px-10 bg-theme-surface z-20 shrink-0">
          <div className="flex bg-theme-bg p-1 rounded-xl border border-theme-border shadow-inner gap-1">
            <button 
              onClick={() => setViewMode("feed")} 
              className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-2 ${viewMode === "feed" ? 'bg-theme-text/10 text-theme-text' : 'text-theme-muted hover:bg-theme-text/5'}`}
            >
              <LayoutGrid size={14} />
              <span className={`text-[10px] font-black uppercase tracking-widest`} style={{ fontFamily: 'var(--font-montserrat)' }}>feed</span>
            </button>
            <button 
              onClick={() => setViewMode("list")} 
              className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-2 ${viewMode === "list" ? 'bg-theme-text/10 text-theme-text' : 'text-theme-muted hover:bg-theme-text/5'}`}
            >
              <Columns size={14} />
              <span className={`text-[10px] font-black uppercase tracking-widest`} style={{ fontFamily: 'var(--font-montserrat)' }}>detailed</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-row overflow-hidden h-full">
          <AnimatePresence mode="wait">
            {viewMode === "feed" ? (
              <ReactLenis key="feed" options={{ orientation: 'vertical', smoothWheel: true }} className="flex-1 h-full overflow-y-auto no-scrollbar">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-10 pb-48 flex flex-col gap-4 max-w-[1700px] mx-auto w-full">
                  {subjects.map(s => (
                    <div key={s.id} onClick={() => { setActiveTab(s.id); setViewMode("list"); }} className="cursor-pointer">
                      <SubjectBlockCompact sub={s} />
                    </div>
                  ))}
                </motion.div>
              </ReactLenis>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-row overflow-hidden h-full">
                <div className="w-[340px] h-full border-r border-theme-border relative shrink-0">
                  <ReactLenis options={{ orientation: 'vertical', smoothWheel: true }} className="absolute inset-0 overflow-y-auto no-scrollbar p-6 flex flex-col gap-3">
                    <div onClick={() => setActiveTab("dashboard")} className={`p-4 rounded-2xl cursor-pointer transition-all ${activeTab === 'dashboard' ? 'bg-theme-text/10 text-theme-text shadow-md scale-[1.02]' : 'hover:bg-theme-text/5'} group flex items-center gap-4`}>
                      <div className={`p-2 rounded-xl ${activeTab === 'dashboard' ? 'bg-theme-text/20' : 'bg-theme-surface'}`}><LayoutDashboard size={18} /></div>
                      <span className={`text-sm font-bold lowercase tracking-tight`} style={{ fontFamily: 'var(--font-montserrat)' }}>dashboard</span>
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
                      <MarksDashboard subjects={subjects} targetGradesMap={targetData.grades} onSelectSubject={setActiveTab} />
                    ) : activeSub && (
                      <DetailedWorkspace 
                        sub={activeSub} 
                        targetGrade={currentTargetGrade}
                        updateTarget={updateTargetGrade}
                        expectedMarks={targetData.expected[activeSub.id] || 0}
                        setExpectedMarks={setExpectedMarks}
                        allSubjects={subjects}
                        targetGradesMap={targetData.grades}
                      />
                    )}
                  </ReactLenis>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="absolute bottom-10 right-12 pointer-events-none z-30 text-right">
          <h1 className="text-theme-text font-regular lowercase leading-none select-none opacity-80" style={{ fontFamily: 'var(--font-afacad)', fontSize: '55px', letterSpacing: '-4px' }}>marks</h1>
        </div>
      </div>
      <DesktopSidebar />
    </div>
  );
}

const SubjectBlockCompact = ({ sub }: any) => {
  const placeholdersCount = Math.max(0, 5 - (sub.assessments?.length || 0));
  const placeholders = Array.from({ length: placeholdersCount });

  return (
    <div className={`w-full bg-theme-surface/5 border-2 rounded-[28px] p-5 flex flex-row items-center gap-10 transition-all hover:bg-theme-surface/10 hover:scale-[1.01] hover:shadow-xl hover:border-theme-highlight/20 border-theme-border min-h-[110px] group`}>
      <div className="w-56 shrink-0 flex flex-col gap-1">
        <span className="text-[10px] font-black uppercase text-theme-muted tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>{sub.code}</span>
        <h2 className="text-base font-black text-theme-text lowercase tracking-tight leading-tight line-clamp-2 group-hover:text-theme-highlight transition-colors" style={{ fontFamily: 'var(--font-montserrat)' }}>{sub.title}</h2>
      </div>
      <div className="flex-1 flex flex-wrap gap-2.5">
        {sub.assessments?.map((ass: any, i: number) => {
          const box = getBoxTheme(ass.got, ass.max);
          return (
            <div key={i} className={`p-2.5 rounded-xl border-2 ${box.boxBg} ${box.border} flex flex-col justify-center min-w-[85px]`}>
              <span className={`text-[9px] font-black uppercase ${box.text} mb-0.5 truncate`} style={{ fontFamily: 'var(--font-montserrat)' }}>{ass.title}</span>
              <div className="flex items-baseline gap-0.5">
                <span className={`text-base font-black ${box.text}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{ass.got}</span>
                <span className={`text-[11px] font-black opacity-60 ${box.text}`} style={{ fontFamily: 'var(--font-montserrat)' }}>/{ass.max}</span>
              </div>
            </div>
          );
        })}
        {placeholders.map((_, i) => (
          <div key={`tba-${i}`} className="p-2.5 rounded-xl border-2 border-theme-border border-dashed flex flex-col justify-center min-w-[85px] opacity-40">
            <span className="text-[9px] font-black uppercase text-theme-muted mb-0.5 truncate" style={{ fontFamily: 'var(--font-montserrat)' }}>tba</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-base font-black text-theme-muted" style={{ fontFamily: 'var(--font-montserrat)' }}>-</span>
              <span className="text-[11px] font-black opacity-60 text-theme-muted" style={{ fontFamily: 'var(--font-montserrat)' }}>/-</span>
            </div>
          </div>
        ))}
      </div>
      <div className="w-32 shrink-0 flex flex-row items-baseline justify-end gap-1.5">
        <span className="text-2xl font-black text-theme-text" style={{ fontFamily: 'var(--font-montserrat)' }}>{(sub.totalGot || 0).toFixed(1)}</span>
        <span className="text-[10px] font-black text-theme-muted opacity-30" style={{ fontFamily: 'var(--font-montserrat)' }}>/ {(sub.totalMax || 0).toFixed(1)}</span>
      </div>
    </div>
  );
};
