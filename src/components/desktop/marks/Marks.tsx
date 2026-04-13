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
  Zap
} from "lucide-react";
import { 
  processAndSortMarks, 
  buildCourseMap, 
  getBoxTheme,
  calculateSemMarksNeeded,
  getInitialTargetGrades,
  calculateBestAchievableGrade
} from "@/utils/marks/marksLogic";
import { useApp } from "@/context/AppContext";

/* DEFAULT VIEW - HIGH VISIBILITY HORIZONTAL GRID */
const CompactMarkTile = ({ ass }: any) => {
  const box = getBoxTheme(ass.got, ass.max);
  return (
    <div className={`p-2.5 rounded-xl border-2 ${box.boxBg} ${box.border} flex flex-col justify-center min-w-[80px]`}>
      <span className={`text-[9px] font-black uppercase tracking-tight ${box.text} mb-1 truncate`} style={{ fontFamily: 'var(--font-afacad)' }}>
        {ass.title}
      </span>
      <div className="flex items-baseline gap-0.5">
        <span className={`text-sm font-black ${box.text}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
          {ass.got}
        </span>
        <span className={`text-[10px] font-black opacity-60 ${box.text}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
          /{ass.max}
        </span>
      </div>
    </div>
  );
};

const SubjectBlockCompact = ({ sub }: any) => {
  const isCritical = sub.percentage < 70;
  return (
    <div className="w-full bg-theme-surface/5 border border-theme-border rounded-[28px] p-5 flex flex-row items-center gap-10 transition-all hover:bg-theme-surface/10">
      
      <div className="w-56 shrink-0 flex flex-col gap-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted" style={{ fontFamily: 'var(--font-montserrat)' }}>{sub.code}</span>
        <h2 className="text-base font-black text-theme-text lowercase tracking-tight leading-tight line-clamp-2" style={{ fontFamily: 'var(--font-montserrat)' }}>{sub.title}</h2>
      </div>

      <div className="flex-1 flex flex-wrap gap-2">
        {sub.assessments.map((ass: any, i: number) => <CompactMarkTile key={i} ass={ass} />)}
        {sub.assessments.length === 0 && (
          <span className="text-xs font-black text-theme-muted/20 lowercase py-2" style={{ fontFamily: 'var(--font-afacad)' }}>pending data stream...</span>
        )}
      </div>

      <div className="w-28 shrink-0 flex flex-col items-end gap-1">
        <span className={`text-4xl font-black tracking-tighter ${isCritical ? 'text-[#FF4D4D]' : 'text-theme-text'}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{Math.round(sub.percentage)}%</span>
        <div className="w-full h-1.5 bg-theme-text/5 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${isCritical ? 'bg-[#FF4D4D]' : 'bg-theme-highlight'}`} style={{ width: `${sub.percentage}%` }} />
        </div>
      </div>
    </div>
  );
};

/* LIST VIEW - BOLD WORKSPACE DETAIL */
const DetailedMarkCard = ({ ass }: any) => {
  const box = getBoxTheme(ass.got, ass.max);
  return (
    <div className={`p-6 rounded-[32px] border-2 ${box.boxBg} ${box.border} flex flex-col justify-between transition-all duration-300 hover:scale-[1.03] min-h-[150px]`}>
      <span className={`text-[13px] font-black uppercase tracking-wide ${box.text} leading-tight mb-4`} style={{ fontFamily: 'var(--font-afacad)' }}>
        {ass.title}
      </span>
      <div className="flex items-baseline gap-1.5 mt-auto">
        <span className={`text-6xl font-black tracking-tighter ${box.text}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{ass.got}</span>
        <span className={`text-2xl font-black opacity-40 ${box.text}`} style={{ fontFamily: 'var(--font-montserrat)' }}>/{ass.max}</span>
      </div>
    </div>
  );
};

const DetailedWorkspace = ({ sub, targetGrade, expectedMarks, setExpectedMarks }: any) => {
  const isCritical = sub.percentage < 70;
  const best = useMemo(() => calculateBestAchievableGrade(sub.totalGot, sub.totalMax, 40), [sub]);
  const { semRequiredOutOfMax, isCooked } = useMemo(() => 
    calculateSemMarksNeeded(targetGrade, sub.totalGot, expectedMarks, sub.isPractical),
    [targetGrade, sub.totalGot, expectedMarks, sub.isPractical]
  );

  return (
    <div className="flex flex-col gap-12">
      <div className="flex justify-between items-center border-b-2 border-theme-border pb-10">
        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-[0.4em] text-theme-muted" style={{ fontFamily: 'var(--font-montserrat)' }}>{sub.code}</span>
          <h2 className="text-6xl font-black text-theme-text lowercase tracking-tighter" style={{ fontFamily: 'var(--font-montserrat)' }}>{sub.title}</h2>
        </div>
        <div className="flex items-baseline gap-3">
          <span className={`text-[100px] font-black tracking-tighter leading-none ${isCritical ? 'text-[#FF4D4D]' : 'text-theme-text'}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{Math.round(sub.percentage)}</span>
          <span className="text-4xl font-black text-theme-muted opacity-20" style={{ fontFamily: 'var(--font-montserrat)' }}>%</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-12 xl:col-span-8 space-y-8">
          <div className="flex items-center gap-6">
            <span className="text-[11px] font-black uppercase tracking-[0.6em] text-theme-muted" style={{ fontFamily: 'var(--font-montserrat)' }}>Individual Scores</span>
            <div className="h-[2px] flex-1 bg-theme-border opacity-30" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sub.assessments.map((ass: any, i: number) => <DetailedMarkCard key={i} ass={ass} />)}
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 flex flex-col gap-8">
          <div className="bg-theme-text text-theme-bg rounded-[48px] p-10 flex flex-col gap-10 relative overflow-hidden shadow-2xl">
            <div className="absolute -bottom-10 -right-10 opacity-[0.03] rotate-12"><TargetIcon size={240} /></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-2 block" style={{ fontFamily: 'var(--font-montserrat)' }}>Target Goal: {targetGrade}</span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-[90px] font-black tracking-tighter leading-none ${isCooked ? 'text-[#FF4D4D]' : 'text-theme-bg'}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{isCooked ? 'cooked' : semRequiredOutOfMax}</span>
                  {!isCooked && <span className="text-4xl font-black opacity-20" style={{ fontFamily: 'var(--font-montserrat)' }}>/40</span>}
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-40 mt-4" style={{ fontFamily: 'var(--font-afacad)' }}>needed in final exam</p>
              </div>
              <div className="flex flex-col gap-4 mt-12">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40" style={{ fontFamily: 'var(--font-montserrat)' }}>Simulate Internals</span>
                <div className="flex items-center justify-between bg-theme-bg p-1.5 rounded-2xl shadow-inner border border-white/5">
                  <button onClick={() => setExpectedMarks(Math.max(0, expectedMarks - 1))} className="w-12 h-12 rounded-xl text-theme-text hover:bg-theme-surface flex items-center justify-center active:scale-90 transition-all"><Minus size={20} /></button>
                  <span className="text-xl font-black text-theme-text" style={{ fontFamily: 'var(--font-montserrat)' }}>+{expectedMarks}</span>
                  <button onClick={() => setExpectedMarks(Math.min(60-sub.totalMax, expectedMarks + 1))} className="w-12 h-12 rounded-xl text-theme-text hover:bg-theme-surface flex items-center justify-center active:scale-90 transition-all"><Plus size={20} /></button>
                </div>
              </div>
            </div>
          </div>
          <div className="p-8 rounded-[40px] bg-theme-highlight/10 border-2 border-theme-highlight/20 flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-theme-highlight/60" style={{ fontFamily: 'var(--font-montserrat)' }}>Outlook</span>
            <span className="text-2xl font-black text-theme-highlight lowercase" style={{ fontFamily: 'var(--font-montserrat)' }}>{best?.maxAchievableGrade} achievable</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DesktopMarks() {
  const { userData } = useApp();
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"feed" | "list">("feed");
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [targetGrades, setTargetGrades] = useState<Record<string, number>>({});
  const [expectedMarksMap, setExpectedMarksMap] = useState<Record<string, number>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const subjects = useMemo(() => {
    if (!userData?.marks) return [];
    const courseMap = buildCourseMap(userData);
    const list = processAndSortMarks(userData.marks, courseMap);
    if (list.length > 0 && !selectedSubId) setSelectedSubId(list[0].id);
    return list;
  }, [userData, selectedSubId]);

  useEffect(() => {
    if (subjects.length > 0 && Object.keys(targetGrades).length === 0) {
      setTargetGrades(getInitialTargetGrades(subjects));
      const initialExpected: Record<string, number> = {};
      subjects.forEach(s => initialExpected[s.id] = 0);
      setExpectedMarksMap(initialExpected);
    }
  }, [subjects, targetGrades]);

  const activeSub = useMemo(() => subjects.find(s => s.id === selectedSubId) || subjects[0], [subjects, selectedSubId]);

  if (!mounted) return null;

  return (
    <div className="h-screen w-full flex flex-row p-1.5 font-sans overflow-hidden bg-black text-theme-text">
      <div className="flex-1 bg-theme-bg rounded-[24px] relative overflow-hidden flex flex-col border border-theme-border shadow-2xl">
        <div className="w-full h-16 border-b border-theme-border flex items-center justify-between px-10 bg-theme-surface/5 z-20">
          <div className="flex items-center gap-6">
            <div className="flex bg-theme-surface/40 p-1 rounded-xl border border-theme-border">
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
                {subjects.map(s => <SubjectBlockCompact key={s.id} sub={s} />)}
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-row overflow-hidden">
                <div className="w-[340px] h-full border-r border-theme-border p-6 flex flex-col gap-2 overflow-y-auto no-scrollbar bg-theme-surface/5">
                  {subjects.map(s => (
                    <div key={s.id} onClick={() => setSelectedSubId(s.id)} className={`p-5 rounded-[24px] cursor-pointer border-2 transition-all duration-300 ${selectedSubId === s.id ? 'bg-theme-text border-theme-text shadow-xl scale-[1.02]' : 'bg-transparent border-transparent hover:border-theme-text/20 hover:bg-theme-text/5'}`}>
                      <span className={`text-[9px] font-black uppercase tracking-widest mb-1 block ${selectedSubId === s.id ? 'text-theme-bg opacity-50' : 'text-theme-muted'}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{s.code}</span>
                      <h3 className={`text-sm font-black lowercase truncate tracking-tight ${selectedSubId === s.id ? 'text-theme-bg' : 'text-theme-text'}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{s.title}</h3>
                    </div>
                  ))}
                </div>
                <div className="flex-1 p-16 overflow-y-auto no-scrollbar">
                  {activeSub && (
                    <DetailedWorkspace 
                      sub={activeSub} 
                      targetGrade={targetGrades[activeSub.id] || 91}
                      expectedMarks={expectedMarksMap[activeSub.id] || 0}
                      setExpectedMarks={(val: number) => setExpectedMarksMap(prev => ({ ...prev, [activeSub.id]: val }))}
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
