"use client";
import React, { useState, useEffect, useMemo } from "react";
import DesktopSidebar from "../DesktopSidebar";
import { ReactLenis } from "lenis/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutGrid,
  Columns,
  Plus,
  Minus,
  Target as TargetIcon,
  Trophy,
  BarChart3,
  Sparkles,
  LayoutDashboard,
  Smile
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

const DetailedMarkCard = ({ ass }: any) => {
  const box = getBoxTheme(ass.got, ass.max);
  const lost = (ass.max - ass.got).toFixed(1);
  return (
    <div className={`p-3 rounded-2xl border-2 ${box.boxBg} ${box.border} flex flex-col justify-between transition-all duration-300 hover:scale-[1.03] group relative overflow-hidden`}>
      <div className="relative z-10">
        <span className={`text-[9px] font-black uppercase tracking-widest ${box.text} opacity-60 mb-1 block`} style={{ fontFamily: 'var(--font-montserrat)' }}>
          {ass.title}
        </span>
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-black tracking-tighter ${box.text}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{ass.got}</span>
          <span className={`text-[10px] font-black opacity-30 ${box.text}`} style={{ fontFamily: 'var(--font-montserrat)' }}>/{ass.max}</span>
        </div>
      </div>
      {parseFloat(lost) > 0 && (
        <div className="absolute top-2 right-3 opacity-40 group-hover:opacity-100 transition-opacity">
          <span className="text-[8px] font-black text-theme-secondary uppercase" style={{ fontFamily: 'var(--font-montserrat)' }}>-{lost}</span>
        </div>
      )}
    </div>
  );
};

const GradeThresholdCard = ({ grade, min, internalsNeeded, isPossible }: any) => {
  return (
    <div className={`p-3 rounded-xl border-2 transition-all ${isPossible ? 'bg-theme-surface border-theme-border' : 'bg-theme-secondary/5 border-theme-secondary/10 opacity-30'}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xl font-black tracking-tighter text-theme-text" style={{ fontFamily: 'var(--font-montserrat)' }}>{grade}</span>
        <span className="text-[8px] font-black uppercase opacity-40 text-theme-text" style={{ fontFamily: 'var(--font-montserrat)' }}>{min} pts</span>
      </div>
      {isPossible ? (
        <span className="text-[9px] font-black uppercase text-theme-highlight tracking-tight" style={{ fontFamily: 'var(--font-afacad)' }}>
          {internalsNeeded > 0 ? `+${internalsNeeded.toFixed(1)} more` : 'safe'}
        </span>
      ) : (
        <span className="text-[8px] font-black uppercase text-theme-secondary tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>rip</span>
      )}
    </div>
  );
};

const MarksDashboard = ({ subjects, targetGradesMap }: any) => {
  const gpaValue = calculatePredictedGpa(subjects, targetGradesMap, []);
  const totalInternalGot = subjects.reduce((acc: number, s: any) => acc + s.totalGot, 0);
  const totalInternalMax = subjects.reduce((acc: number, s: any) => acc + s.totalMax, 0);
  const avgPercentage = subjects.reduce((acc: number, s: any) => acc + s.percentage, 0) / subjects.length;

  const dashboardAdvice = useMemo(() => {
    const val = parseFloat(gpaValue);
    if (val >= 9.5) return "you're carrying the entire batch right now. keep this up and you're literal SRMist royalty.";
    if (val >= 8.5) return "solid stats. you're comfortably ahead, just don't get too cozy before finals.";
    if (val >= 7.0) return "not bad, but you're leaving points on the table. time to lock in and boost that average.";
    return "it's looking a bit mid, chief. you need a serious comeback arc in the remaining assessments.";
  }, [gpaValue]);

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-theme-highlight p-6 rounded-[32px] flex flex-col justify-center relative overflow-hidden shadow-lg border-2 border-theme-highlight">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-bg opacity-60 mb-1" style={{ fontFamily: 'var(--font-montserrat)' }}>Predicted GPA</span>
          <span className="text-5xl font-black tracking-tighter text-theme-bg" style={{ fontFamily: 'var(--font-montserrat)' }}>{gpaValue}</span>
        </div>
        <div className="bg-theme-surface border-2 border-theme-border p-6 rounded-[32px] flex flex-col justify-center shadow-sm">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted mb-1" style={{ fontFamily: 'var(--font-montserrat)' }}>Total Marks</span>
          <span className="text-4xl font-black text-theme-text" style={{ fontFamily: 'var(--font-montserrat)' }}>{totalInternalGot.toFixed(1)}<span className="text-lg opacity-20"> / {totalInternalMax.toFixed(1)}</span></span>
        </div>
        <div className="bg-theme-text p-6 rounded-[32px] flex flex-col justify-center shadow-md border-2 border-theme-text">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-bg opacity-40 mb-1" style={{ fontFamily: 'var(--font-montserrat)' }}>Avg Score</span>
          <span className="text-4xl font-black text-theme-bg" style={{ fontFamily: 'var(--font-montserrat)' }}>{Math.round(avgPercentage)}%</span>
        </div>
      </div>

      <div className="bg-theme-highlight/5 border-2 border-dashed border-theme-border p-6 rounded-[32px] flex items-start gap-4">
        <div className="p-2 rounded-xl bg-theme-highlight text-theme-bg mt-1"><Smile size={16} /></div>
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-theme-highlight" style={{ fontFamily: 'var(--font-montserrat)' }}>The Vibe</span>
          <p className="text-lg font-medium text-theme-text leading-tight lowercase" style={{ fontFamily: 'var(--font-afacad)' }}>{dashboardAdvice}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-theme-muted" style={{ fontFamily: 'var(--font-montserrat)' }}>Subject Lineup</span>
          <div className="h-[1px] flex-1 bg-theme-border opacity-30" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map((s: any) => (
            <div key={s.id} className="bg-theme-surface border-2 border-theme-border rounded-3xl p-5 flex flex-col gap-4 group hover:bg-theme-text/5 transition-all">
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] font-black uppercase text-theme-muted tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>{s.code}</span>
                <h3 className="text-base font-black text-theme-text lowercase truncate tracking-tight" style={{ fontFamily: 'var(--font-montserrat)' }}>{s.title}</h3>
              </div>
              <div className="flex items-end justify-between mt-auto">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase text-theme-muted tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>score</span>
                  <span className="text-xl font-black text-theme-text tracking-tighter" style={{ fontFamily: 'var(--font-montserrat)' }}>{s.totalGot.toFixed(1)}<span className="opacity-20 text-xs">/{s.totalMax.toFixed(1)}</span></span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-black text-theme-text tracking-tighter" style={{ fontFamily: 'var(--font-montserrat)' }}>{Math.round(s.percentage)}%</span>
                  <div className="w-16 h-1 bg-theme-text/10 rounded-full overflow-hidden">
                    <div className="h-full bg-theme-highlight rounded-full" style={{ width: `${s.percentage}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DetailedWorkspace = ({ sub, targetGrade, expectedMarks, setExpectedMarks }: any) => {
  const isCritical = sub.percentage < 70;
  const best = useMemo(() => calculateBestAchievableGrade(sub.totalGot, sub.totalMax), [sub]);
  
  const gradeSystem = [
    { label: "O", min: 91 },
    { label: "A+", min: 81 },
    { label: "A", min: 71 },
    { label: "B+", min: 61 },
    { label: "B", min: 56 },
    { label: "C", min: 50 },
  ];

  const friendAdvice = useMemo(() => {
    if (sub.percentage >= 90) return "you're absolutely killing it. just show up for the final and the O is yours.";
    if (sub.percentage >= 75) return "doing solid. keep this momentum and you'll easily land an A+ or O.";
    if (sub.percentage >= 50) return "you're in the danger zone. need to lock in for the next few tests or finals will be a nightmare.";
    return "honestly? it's looking rough. you need to max out everything from here on just to stay afloat.";
  }, [sub.percentage]);

  const { semRequiredOutOfMax, isCooked } = useMemo(() => 
    calculateSemMarksNeeded(targetGrade, sub.totalGot, expectedMarks, sub.isPractical),
    [targetGrade, sub.totalGot, expectedMarks, sub.isPractical]
  );

  return (
    <div className="flex flex-col gap-10 -mt-8">
      <div className="flex justify-between items-start border-b-2 border-theme-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-[0.4em] text-theme-muted" style={{ fontFamily: 'var(--font-montserrat)' }}>{sub.code}</span>
            <span className="px-2 py-0.5 rounded bg-theme-text text-theme-bg text-[8px] font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>{sub.type}</span>
          </div>
          <h2 className="text-5xl font-black text-theme-text lowercase tracking-tighter leading-none" style={{ fontFamily: 'var(--font-montserrat)' }}>{sub.title}</h2>
        </div>
        <div className="flex items-baseline gap-3">
          <span className={`text-[100px] font-black tracking-tighter leading-none ${isCritical ? 'text-theme-secondary' : 'text-theme-text'}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{Math.round(sub.percentage)}</span>
          <span className="text-4xl font-black text-theme-muted opacity-20" style={{ fontFamily: 'var(--font-montserrat)' }}>%</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-theme-highlight border-2 border-theme-highlight p-5 rounded-3xl flex flex-col justify-center shadow-lg">
          <span className="text-[9px] font-black uppercase tracking-widest text-theme-bg opacity-60 mb-1" style={{ fontFamily: 'var(--font-montserrat)' }}>Current Score</span>
          <span className="text-3xl font-black tracking-tighter text-theme-bg" style={{ fontFamily: 'var(--font-montserrat)' }}>{sub.totalGot.toFixed(1)}<span className="opacity-40 text-sm">/{sub.totalMax.toFixed(1)}</span></span>
        </div>
        <div className="bg-theme-surface border-2 border-theme-border p-5 rounded-3xl flex flex-col justify-center">
          <span className="text-[9px] font-black uppercase tracking-widest text-theme-muted mb-1" style={{ fontFamily: 'var(--font-montserrat)' }}>Potential</span>
          <span className="text-3xl font-black text-theme-text" style={{ fontFamily: 'var(--font-montserrat)' }}>{best.best.label}</span>
        </div>
        <div className="bg-theme-text p-5 rounded-3xl flex flex-col justify-center border-2 border-theme-text shadow-md">
          <span className="text-[9px] font-black uppercase tracking-widest text-theme-bg opacity-40 mb-1" style={{ fontFamily: 'var(--font-montserrat)' }}>Final Need</span>
          <span className={`text-3xl font-black text-theme-bg ${isCooked ? 'text-theme-secondary' : ''}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{isCooked ? 'rip' : semRequiredOutOfMax}</span>
        </div>
        <div className="bg-theme-surface border-2 border-theme-border p-5 rounded-3xl flex flex-col justify-center">
          <span className="text-[9px] font-black uppercase tracking-widest text-theme-muted mb-1" style={{ fontFamily: 'var(--font-montserrat)' }}>Projected</span>
          <span className="text-3xl font-black text-theme-text" style={{ fontFamily: 'var(--font-montserrat)' }}>{best.best.label}</span>
        </div>
      </div>

      <div className="bg-theme-highlight/5 border-2 border-dashed border-theme-border p-6 rounded-[32px] flex items-start gap-4">
        <div className="p-2 rounded-xl bg-theme-highlight text-theme-bg mt-1"><Smile size={16} /></div>
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-theme-highlight" style={{ fontFamily: 'var(--font-montserrat)' }}>The Situation</span>
          <p className="text-lg font-medium text-theme-text leading-tight lowercase" style={{ fontFamily: 'var(--font-afacad)' }}>{friendAdvice}</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 xl:col-span-8 space-y-10">
          <section className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-theme-muted whitespace-nowrap" style={{ fontFamily: 'var(--font-montserrat)' }}>Individual Performance</span>
              <div className="h-[1px] flex-1 bg-theme-border opacity-30" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {sub.assessments.map((ass: any, i: number) => <DetailedMarkCard key={i} ass={ass} />)}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-theme-muted whitespace-nowrap" style={{ fontFamily: 'var(--font-montserrat)' }}>Grade Thresholds</span>
              <div className="h-[1px] flex-1 bg-theme-border opacity-30" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {gradeSystem.map((g, i) => {
                const internalsNeeded = Math.max(0, g.min - 40 - sub.totalGot);
                const isPossible = sub.totalGot + (60 - sub.totalMax) + 40 >= g.min;
                return (
                  <GradeThresholdCard 
                    key={i} 
                    grade={g.label} 
                    min={g.min} 
                    internalsNeeded={internalsNeeded}
                    isPossible={isPossible}
                  />
                );
              })}
            </div>
          </section>
        </div>

        <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
          <div className="bg-theme-text text-theme-bg rounded-[40px] p-8 flex flex-col gap-6 relative overflow-hidden shadow-2xl border-2 border-theme-text">
            <div className="absolute -bottom-10 -right-10 opacity-[0.05] rotate-12 text-theme-bg"><TargetIcon size={200} /></div>
            <div className="relative z-10">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-theme-bg opacity-40 mb-1 block" style={{ fontFamily: 'var(--font-montserrat)' }}>Goal: {gradeSystem.find(g => g.min === targetGrade)?.label}</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-6xl font-black tracking-tighter text-theme-bg leading-none ${isCooked ? 'text-theme-secondary' : ''}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{isCooked ? 'rip' : semRequiredOutOfMax}</span>
                {!isCooked && <span className="text-2xl font-black text-theme-bg opacity-20" style={{ fontFamily: 'var(--font-montserrat)' }}>/{sub.isPractical ? 40 : 75}</span>}
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-bg opacity-40 mt-3" style={{ fontFamily: 'var(--font-montserrat)' }}>Required in End Semester</p>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-theme-bg opacity-40" style={{ fontFamily: 'var(--font-montserrat)' }}>Internal Simulator (+{expectedMarks.toFixed(1)})</span>
              <div className="flex items-center justify-between bg-theme-bg/10 p-1 rounded-2xl border border-white/5">
                <button onClick={() => setExpectedMarks(Math.max(0, expectedMarks - 1))} className="w-10 h-10 rounded-xl text-theme-bg hover:bg-white/10 flex items-center justify-center transition-all"><Minus size={16} /></button>
                <div className="flex-1 h-1 bg-white/10 mx-4 rounded-full overflow-hidden">
                  <div className="h-full bg-theme-highlight transition-all" style={{ width: `${(expectedMarks / Math.max(1, 60-sub.totalMax)) * 100}%` }} />
                </div>
                <button onClick={() => setExpectedMarks(Math.min(60-sub.totalMax, expectedMarks + 1))} className="w-10 h-10 rounded-xl text-theme-bg hover:bg-white/10 flex items-center justify-center transition-all"><Plus size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SubjectBlockCompact = ({ sub }: any) => {
  const isCritical = sub.percentage < 70;
  return (
    <div className="w-full bg-theme-surface/5 border-2 border-theme-border rounded-[28px] p-5 flex flex-row items-center gap-10 transition-all hover:bg-theme-surface/10">
      <div className="w-56 shrink-0 flex flex-col gap-1">
        <span className="text-[10px] font-black uppercase text-theme-muted tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>{sub.code}</span>
        <h2 className="text-base font-black text-theme-text lowercase tracking-tight leading-tight line-clamp-2" style={{ fontFamily: 'var(--font-montserrat)' }}>{sub.title}</h2>
      </div>
      <div className="flex-1 flex flex-wrap gap-2">
        {sub.assessments.map((ass: any, i: number) => {
          const box = getBoxTheme(ass.got, ass.max);
          return (
            <div key={i} className={`p-2 rounded-xl border-2 ${box.boxBg} ${box.border} flex flex-col justify-center min-w-[70px]`}>
              <span className={`text-[8px] font-black uppercase tracking-tight ${box.text} mb-0.5 truncate`} style={{ fontFamily: 'var(--font-afacad)' }}>{ass.title}</span>
              <div className="flex items-baseline gap-0.5">
                <span className={`text-xs font-black ${box.text}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{ass.got}</span>
                <span className={`text-[9px] font-black opacity-60 ${box.text}`} style={{ fontFamily: 'var(--font-montserrat)' }}>/{ass.max}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="w-28 shrink-0 flex flex-col items-end gap-1">
        <span className={`text-4xl font-black tracking-tighter ${isCritical ? 'text-theme-secondary' : 'text-theme-text'}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{Math.round(sub.percentage)}%</span>
        <div className="w-full h-1 bg-theme-text/10 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${isCritical ? 'bg-theme-secondary' : 'bg-theme-highlight'}`} style={{ width: `${sub.percentage}%` }} />
        </div>
      </div>
    </div>
  );
};

export default function DesktopMarks() {
  const { userData } = useApp();
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"feed" | "list">("feed");
  const [activeTab, setActiveSubId] = useState<string | "dashboard">("dashboard");
  const [targetGrades, setTargetGrades] = useState<Record<string, number>>({});
  const [expectedMarksMap, setExpectedMarksMap] = useState<Record<string, number>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const subjects = useMemo(() => {
    if (!userData?.marks) return [];
    const courseMap = buildCourseMap(userData);
    const list = processAndSortMarks(userData.marks, courseMap);
    return list;
  }, [userData]);

  useEffect(() => {
    if (subjects.length > 0 && Object.keys(targetGrades).length === 0) {
      setTargetGrades(getInitialTargetGrades(subjects));
      const initialExpected: Record<string, number> = {};
      subjects.forEach(s => initialExpected[s.id] = 0);
      setExpectedMarksMap(initialExpected);
    }
  }, [subjects, targetGrades]);

  const activeSub = useMemo(() => subjects.find(s => s.id === activeTab), [subjects, activeTab]);

  if (!mounted) return null;

  return (
    <div className="h-screen w-full flex flex-row p-1.5 font-sans overflow-hidden bg-black text-theme-text selection:bg-theme-highlight selection:text-theme-bg">
      <div className="flex-1 bg-theme-bg rounded-[24px] relative overflow-hidden flex flex-col border border-theme-border shadow-2xl">
        <div className="w-full h-16 border-b border-theme-border flex items-center justify-between px-10 bg-theme-surface z-20">
          <div className="flex items-center gap-6">
            <div className="flex bg-theme-bg p-1 rounded-xl border border-theme-border shadow-inner">
              <button onClick={() => setViewMode("feed")} className={`p-1.5 rounded-lg transition-all ${viewMode === "feed" ? 'bg-theme-text text-theme-bg shadow-md' : 'text-theme-muted hover:text-theme-text'}`}><LayoutGrid size={16} /></button>
              <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? 'bg-theme-text text-theme-bg shadow-md' : 'text-theme-muted hover:text-theme-text'}`}><Columns size={16} /></button>
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-theme-muted ml-4" style={{ fontFamily: 'var(--font-afacad)' }}>{subjects.length} subjects active</span>
          </div>
        </div>

        <ReactLenis options={{ orientation: 'vertical', smoothWheel: true }} className="flex-1 overflow-y-auto no-scrollbar">
          <AnimatePresence mode="wait">
            {viewMode === "feed" ? (
              <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-10 pb-48 flex flex-col gap-4 max-w-[1700px] mx-auto w-full">
                {subjects.map(s => (
                  <div key={s.id} onClick={() => { setActiveSubId(s.id); setViewMode("list"); }} className="cursor-pointer">
                    <SubjectBlockCompact sub={s} />
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-row overflow-hidden">
                <div className="w-[340px] h-full border-r border-theme-border p-6 flex flex-col gap-2 overflow-y-auto no-scrollbar bg-theme-surface">
                  <div onClick={() => setActiveSubId("dashboard")} className={`p-5 mb-4 rounded-[24px] cursor-pointer border-2 transition-all ${activeTab === 'dashboard' ? 'bg-theme-text border-theme-text shadow-lg' : 'border-dashed border-theme-border hover:bg-theme-text/5'} group flex items-center gap-4`}>
                    <div className={`p-2 rounded-xl ${activeTab === 'dashboard' ? 'bg-theme-bg text-theme-text' : 'bg-theme-text text-theme-bg'}`}><LayoutDashboard size={18} /></div>
                    <span className={`text-sm font-black lowercase tracking-tight ${activeTab === 'dashboard' ? 'text-theme-bg' : 'text-theme-text'}`} style={{ fontFamily: 'var(--font-montserrat)' }}>dashboard</span>
                  </div>
                  {subjects.map(s => (
                    <div key={s.id} onClick={() => setActiveSubId(s.id)} className={`p-5 rounded-[24px] cursor-pointer border-2 transition-all duration-300 ${activeTab === s.id ? 'bg-theme-text border-theme-text shadow-xl scale-[1.02]' : 'bg-transparent border-theme-border/10 border-transparent hover:border-theme-border/20 hover:bg-theme-text/5'}`}>
                      <span className={`text-[9px] font-black uppercase tracking-widest mb-1 block ${activeTab === s.id ? 'text-theme-bg opacity-50' : 'text-theme-muted'}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{s.code}</span>
                      <h3 className={`text-sm font-black lowercase truncate tracking-tight ${activeTab === s.id ? 'text-theme-bg' : 'text-theme-text'}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{s.title}</h3>
                    </div>
                  ))}
                </div>
                <div className="flex-1 p-16 overflow-y-auto no-scrollbar bg-theme-bg">
                  {activeTab === "dashboard" ? (
                    <MarksDashboard subjects={subjects} targetGradesMap={targetGrades} />
                  ) : activeSub && (
                    <DetailedWorkspace 
                      sub={activeSub} 
                      targetGrade={targetGrades[activeSub.id] || 91}
                      expectedMarks={expectedMarksMap[activeSub.id] || 0}
                      setExpectedMarks={(val: number) => setExpectedMarksMap(prev => ({ ...prev, [activeSub.id]: val }))}
                      allSubjects={subjects}
                      targetGradesMap={targetGrades}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </ReactLenis>

        <div className="absolute bottom-10 left-10 pointer-events-none z-30 opacity-10">
          <h1 className="text-3xl font-black tracking-tighter lowercase text-theme-text" style={{ fontFamily: 'var(--font-urbanosta)' }}>ratio'd</h1>
        </div>
        <div className="absolute bottom-10 right-12 pointer-events-none z-30 text-right opacity-80">
          <h1 className="text-theme-text font-regular lowercase leading-none select-none" style={{ fontFamily: 'var(--font-afacad)', fontSize: '65px', letterSpacing: '-5px' }}>marks</h1>
        </div>
      </div>
      <DesktopSidebar />
    </div>
  );
}
