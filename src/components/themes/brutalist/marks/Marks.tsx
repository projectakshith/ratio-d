"use client";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { Zap, AlertCircle, Calculator } from "lucide-react";
import { getRandomRoast } from "@/utils/shared/flavortext";
import {
  processAndSortMarks,
  buildCourseMap,
  getGrade,
  gradePoints,
  getInitialTargetGrades,
  calculateSemMarksNeeded,
  calculatePredictedGpa,
  isPracticalLogic,
} from "@/utils/marks/marksLogic";
import BrutalistTarget from "./BrutalistTarget";
import { AcademiaData } from "@/types";
import { useAppLayout } from "@/context/AppLayoutContext";
import { Haptics } from "@/utils/shared/haptics";

const ScoreCounter = ({ value }: any) => {
  const nodeRef = useRef<any>(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    const numericValue = parseFloat(String(value));
    if (isNaN(numericValue)) {
      node.textContent = value;
      return;
    }
    const controls = animate(prevValue.current, numericValue, {
      duration: 0.8,
      ease: "circOut",
      onUpdate: (v) => {
        node.textContent = Number.isInteger(v) ? v.toString() : v.toFixed(1);
      },
    });
    prevValue.current = numericValue;
    return () => controls.stop();
  }, [value]);

  return <span ref={nodeRef} />;
};

const MarksPage = ({ data }: { data: AcademiaData }) => {
  const { setIsSwipeDisabled } = useAppLayout();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [introMode, setIntroMode] = useState(true);
  const [predictMode, setPredictMode] = useState(false);
  const [targetGrades, setTargetGrades] = useState<Record<string, number>>({});
  const [expectedMarksMap, setExpectedMarksMap] = useState<Record<string, number>>({});
  const [ignoredSubjectIds, setIgnoredSubjectIds] = useState<string[]>([]);

  const toggleSubjectIgnore = (id: string) => {
    setIgnoredSubjectIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    setIsSwipeDisabled(predictMode);
  }, [predictMode, setIsSwipeDisabled]);

  const listContainerRef = useRef<any>(null);
  const itemRefs = useRef<any[]>([]);
  const scrollTimeout = useRef<any>(null);

  const courseMap = useMemo(() => buildCourseMap(data), [data]);
  const rawMarks = useMemo(() => Array.isArray(data?.marks) ? data.marks : [], [data?.marks]);

  const sortedMarks = useMemo(() => {
    const processed = processAndSortMarks(rawMarks, courseMap);
    return processed.map((sub: any) => {
      const sStr = sub.slot || "";
      const firstSlot = sStr.split(/[,\s+-]/)[0].trim().toUpperCase();
      let courseDetails = (data.courses as any)?.[firstSlot];
      if (!courseDetails) {
        const normCode = (sub.code || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        courseDetails = Object.values(data.courses || {}).find((c: any) => 
          (c.code || "").toLowerCase().replace(/[^a-z0-9]/g, "") === normCode ||
          (c.courseCode || "").toLowerCase().replace(/[^a-z0-9]/g, "") === normCode
        );
      }
      return { 
        ...sub, 
        credits: courseDetails?.credits ? parseFloat(courseDetails.credits) : (sub.credits || 0),
        isPractical: isPracticalLogic(sub)
      };
    });
  }, [rawMarks, courseMap, data.courses]);

  useEffect(() => {
    if (sortedMarks.length > 0 && selectedId === null) {
      setSelectedId(sortedMarks[0].id);
    }
  }, [sortedMarks, selectedId]);

  useEffect(() => {
    const timer = setTimeout(() => setIntroMode(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const overallPercentage = useMemo(() => {
    const validMarks = sortedMarks.filter(m => !m.isNA);
    if (validMarks.length === 0) return 0;
    const totalPct = validMarks.reduce((sum, m) => sum + m.percentage, 0);
    return Math.round(totalPct / validMarks.length);
  }, [sortedMarks]);

  const activeSubject: any = useMemo(() => 
    sortedMarks.find((s: any) => s.id === selectedId) || sortedMarks[0] || {},
    [sortedMarks, selectedId]
  );

  const currentRoast = useMemo(() => {
    return getRandomRoast(activeSubject.status);
  }, [activeSubject.id, activeSubject.status]);

  const grades = useMemo(() => [
    { label: "O", min: 91 },
    { label: "A+", min: 81 },
    { label: "A", min: 71 },
    { label: "B+", min: 61 },
    { label: "B", min: 56 },
    { label: "C", min: 50 }
  ], []);

  useEffect(() => {
    if (sortedMarks.length > 0 && Object.keys(targetGrades).length === 0) {
      setTargetGrades(getInitialTargetGrades(sortedMarks));
    }
  }, [sortedMarks, targetGrades]);

  const predictedGpa = useMemo(() => {
    return calculatePredictedGpa(sortedMarks, targetGrades, ignoredSubjectIds);
  }, [sortedMarks, targetGrades, ignoredSubjectIds]);

  const currentTargetGrade = targetGrades[selectedId || ""] || 91;
  const currentExpectedMarks = expectedMarksMap[selectedId || ""] || 0;

  const { semRequiredOutOfMax, maxExternal, isCooked } = useMemo(() => {
    return calculateSemMarksNeeded(
      currentTargetGrade,
      activeSubject.totalGot || 0,
      currentExpectedMarks,
      activeSubject.isPractical
    );
  }, [currentTargetGrade, activeSubject, currentExpectedMarks]);

  const currentInternals = activeSubject.totalGot || 0;
  const maxPossibleExpected = Math.max(0, 60 - (activeSubject.totalMax || 0));

  const handleExpectedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedId) return;
    let val = parseInt(e.target.value);
    const safeVal = isNaN(val) ? 0 : Math.min(maxPossibleExpected, Math.max(0, val));
    setExpectedMarksMap(prev => ({ ...prev, [selectedId]: safeVal }));
  };

  const setExpectedMarks = (val: number | ((prev: number) => number)) => {
    if (!selectedId) return;
    setExpectedMarksMap(prev => {
      const currentVal = prev[selectedId] || 0;
      const newVal = typeof val === "function" ? val(currentVal) : val;
      return { ...prev, [selectedId]: Math.min(maxPossibleExpected, Math.max(0, newVal)) };
    });
  };

  const setTargetGrade = (val: number) => {
    if (!selectedId) return;
    setTargetGrades(prev => ({ ...prev, [selectedId]: val }));
  };

  const handleScroll = () => {
    if (introMode || predictMode || !listContainerRef.current) return;
    if (scrollTimeout.current) return;
    scrollTimeout.current = setTimeout(() => {
      const container = listContainerRef.current;
      if (!container) return;
      if (container.scrollTop < 20) {
        if (sortedMarks.length > 0 && selectedId !== sortedMarks[0].id) {
          setSelectedId(sortedMarks[0].id);
          Haptics.vibe(2);
        }
        scrollTimeout.current = null;
        return;
      }
      const triggerLine = container.getBoundingClientRect().top + container.offsetHeight * 0.2;
      let closestId: any = null, minDistance = Infinity;
      itemRefs.current.forEach((el, index) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top - triggerLine);
        if (dist < minDistance) { minDistance = dist; closestId = sortedMarks[index].id; }
      });
      if (closestId !== null && closestId !== selectedId) {
        setSelectedId(closestId);
        Haptics.vibe(2);
      }
      scrollTimeout.current = null;
    }, 50);
  };

  const themeColorClass = activeSubject.status === "safe" ? "text-[#ceff1c]" : activeSubject.status === "danger" ? "text-[#ffb800]" : "text-[#ff003c]";
  const barColorClass = activeSubject.status === "safe" ? "bg-[#ceff1c]" : activeSubject.status === "danger" ? "bg-[#ffb800]" : "bg-[#ff003c]";

  return (
    <div className="h-full w-full flex flex-col bg-[#050505] text-white font-sans relative overflow-y-auto">
      <div className="absolute inset-0 w-full h-full z-0 bg-[#050505]">
      </div>

      <div className="absolute top-0 left-0 w-full h-[45%] flex flex-col justify-between p-6 md:p-8 z-10">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/5 backdrop-blur-md">
            {activeSubject.status === "safe" ? <Zap size={12} className={themeColorClass} fill="currentColor" /> : <AlertCircle size={12} className={themeColorClass} />}
            <span className={`font-mono text-[10px] lowercase tracking-widest font-bold ${themeColorClass}`}>{activeSubject.type}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPredictMode(true)} className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full active:scale-95 transition-transform">
              <Calculator size={12} />
              <span className="font-mono text-[10px] lowercase tracking-widest font-bold">target</span>
            </button>
          </div>
        </div>

        <div className="my-auto flex flex-col justify-center">
          <div className="flex items-baseline gap-6">
            <span className={`text-[20vw] md:text-[8rem] leading-[0.8] font-black tracking-wide transition-colors duration-300 ${themeColorClass}`} style={{ fontFamily: "Urbanosta" }}>
              <ScoreCounter value={activeSubject.isNA ? "0" : activeSubject.score} />
            </span>
            <div className="flex items-baseline gap-3">
              <span className={`text-xl font-bold opacity-40 ${themeColorClass}`} style={{ fontFamily: "Urbanosta" }}>
                {activeSubject.isNA ? "%" : `/ ${activeSubject.max}`}
              </span>
              {!activeSubject.isNA && (
                <span className={`text-[12px] font-black uppercase tracking-tight opacity-40 ${themeColorClass}`}>{activeSubject.testName}</span>
              )}
            </div>
          </div>
        </div>

        <div className="pb-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSubject.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-2 mb-4 overflow-x-auto no-scrollbar"
            >
              {activeSubject.assessments?.map((box: any, idx: number) => {
                const isHigh = (box.got / box.max) >= 0.75;
                const isLow = (box.got / box.max) < 0.5;
                const boxColor = isHigh ? "bg-[#ceff1c] text-black" : isLow ? "bg-[#ff003c] text-white" : "bg-white/10 text-white";
                return (
                  <div key={idx} className={`px-3 py-2 rounded-xl border border-white/5 flex flex-col items-center justify-center min-w-[70px] ${boxColor}`}>
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1" style={{ fontFamily: "Aonic" }}>{box.title}</span>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-lg font-black leading-none" style={{ fontFamily: "Urbanosta" }}>{Number.isInteger(box.got) ? box.got : box.got.toFixed(1)}</span>
                      <span className="text-[10px] font-bold opacity-40">/{box.max}</span>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
          <h3 className="text-xl md:text-2xl font-bold lowercase leading-tight mb-4 line-clamp-1 text-white" style={{ fontFamily: "Aonic" }}>{activeSubject.title?.toLowerCase()}</h3>
          <div className="w-full h-[4px] bg-white/10 mb-2 relative overflow-y-auto rounded-full">
            <motion.div className={`h-full transition-colors duration-300 ${barColorClass}`} initial={{ width: 0 }} animate={{ width: activeSubject.isNA ? "0%" : `${activeSubject.percentage}%` }} transition={{ duration: 0.8, ease: "circOut" }} />
          </div>
          <span className="block text-[10px] font-mono font-bold lowercase mt-1 opacity-60 text-white/80">{currentRoast}</span>
        </div>
      </div>

      <div ref={listContainerRef} onScroll={handleScroll} className={`absolute bottom-0 w-full overflow-y-auto bg-[#f5f6fc] text-black no-scrollbar pb-32 h-[55%] rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] z-20 transition-transform duration-700 ease-in-out snap-y snap-mandatory ${introMode ? "translate-y-[60%]" : "translate-y-0"}`} style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="px-6 flex flex-col gap-4 pt-4">
          <span className="font-mono text-[10px] lowercase tracking-widest text-[#050505]/40 mb-2 block sticky top-0 bg-[#f5f6fc] z-20 py-2">/// full records</span>
          {sortedMarks.map((subject: any, index: number) => {
            const isSelected = subject.id === selectedId;
            const statusColor = subject.status === "cooked" ? "text-[#ff003c]" : subject.status === "danger" ? "text-[#ffb800]" : "text-[#050505]";
            const pillColor = subject.status === "cooked" ? "bg-[#ff003c]" : subject.status === "danger" ? "bg-[#ffb800]" : "bg-[#ceff1c]";
            return (
              <div key={subject.id} ref={(el) => { itemRefs.current[index] = el; }} onClick={() => { if(!predictMode) itemRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" }); else setSelectedId(subject.id); }} className={`group relative w-full p-4 rounded-2xl cursor-pointer transition-all duration-300 border snap-start scroll-mt-12 shrink-0 ${isSelected ? "bg-white shadow-xl scale-[1.02] border-black/5 opacity-100 z-10" : "bg-transparent border-transparent opacity-40 grayscale"}`}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex flex-col min-w-0 max-w-[70%]">
                    <h4 className="text-lg font-bold lowercase truncate" style={{ fontFamily: "Aonic" }}>{subject.title?.toLowerCase()}</h4>
                    <span className="text-[10px] font-mono text-black/40 lowercase tracking-tight">{subject.credits} credits</span>
                  </div>
                  {!subject.isNA && <span className="text-2xl font-black" style={{ fontFamily: "Urbanosta" }}>{Math.floor(subject.percentage)}%</span>}
                </div>
                <div className="w-full h-[2px] bg-[#050505]/5 relative mb-3 rounded-full overflow-y-auto">
                  <div className={`h-full absolute top-0 left-0 transition-colors ${subject.status === "cooked" ? "bg-[#ff003c]" : subject.status === "danger" ? "bg-[#ffb800]" : "bg-[#050505]"}`} style={{ width: subject.isNA ? "0%" : `${subject.percentage}%` }} />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono tracking-wide text-[#050505]/50 lowercase mt-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${pillColor}`} />
                    <span>{subject.type}</span>
                  </div>
                  <span className={`font-bold ${statusColor}`}>{subject.badge}</span>
                </div>
              </div>
            );
          })}
          <div className="h-[20vh] shrink-0 pointer-events-none" />
        </div>
      </div>

      <AnimatePresence>
        {introMode && (
          <motion.div
            key="introOverlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col justify-end items-start p-8 pb-[60%] z-50 bg-[#050505]"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <h1 className="text-6xl font-black lowercase tracking-tighter text-white mb-2" style={{ fontFamily: "Aonic" }}>marks</h1>
              <p className="text-xl font-bold lowercase text-white/80 leading-tight max-w-[80%]" style={{ fontFamily: "Aonic" }}>{currentRoast}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BrutalistTarget
        isOpen={predictMode}
        onClose={() => setPredictMode(false)}
        activePredSub={activeSubject}
        predictedGpa={predictedGpa}
        gpaColor={parseFloat(predictedGpa) >= 9.0 ? "text-[#ceff1c]" : parseFloat(predictedGpa) <= 7.0 ? "text-[#ff003c]" : "text-[#ffb800]"}
        semRequiredOutOfMax={semRequiredOutOfMax}
        maxExternal={maxExternal}
        isCooked={isCooked}
        currentInternals={currentInternals}
        expectedMarks={currentExpectedMarks}
        maxPossibleExpected={maxPossibleExpected}
        handleExpectedChange={handleExpectedChange}
        setExpectedMarks={setExpectedMarks}
        targetGrade={currentTargetGrade}
        setTargetGrade={setTargetGrade}
        grades={grades}
        subjects={[...sortedMarks].sort((a: any, b: any) => b.credits - a.credits)}
        predSubjectId={selectedId}
        setPredSubjectId={setSelectedId}
        ignoredSubjectIds={ignoredSubjectIds}
        toggleSubjectIgnore={toggleSubjectIgnore}
      />
    </div>
  );
};

export default MarksPage;
