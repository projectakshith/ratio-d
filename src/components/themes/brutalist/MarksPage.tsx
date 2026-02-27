"use client";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { Zap, AlertCircle } from "lucide-react";
import { getRandomRoast } from "@/utils/flavortext";

const ScoreCounter = ({ value }) => {
  const nodeRef = useRef<any>(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    if (isNaN(value)) {
      node.textContent = value;
      return;
    }
    const numericValue = parseFloat(value);
    const controls = animate(prevValue.current, numericValue, {
      duration: 0.8,
      ease: "circOut",
      onUpdate: (v) => {
        node.textContent = v.toFixed(1);
      },
    });
    prevValue.current = numericValue;
    return () => controls.stop();
  }, [value]);

  return <span ref={nodeRef} />;
};

const MarksPage = ({ data }: { data: any }) => {
  const [selectedId, setSelectedId] = useState<any>(null);
  const [introMode, setIntroMode] = useState(true);
  const itemRefs = useRef<any[]>([]);
  const listContainerRef = useRef<any>(null);
  const scrollTimeout = useRef<any>(null);

  const courseMap = useMemo(() => {
    const map: any = {};
    if (data?.attendance) {
      data.attendance.forEach((sub: any) => {
        if (sub.code && sub.title) {
          map[sub.code.trim()] = sub.title;
        }
      });
    }
    return map;
  }, [data]);

  const rawMarks = Array.isArray(data?.marks) ? data.marks : [];

  const sortedMarks = useMemo(() => {
    return rawMarks
      .map((subject: any, index: number) => {
        const assessments = subject.assessments || [];
        const latestTest =
          assessments.length > 0 ? assessments[assessments.length - 1] : null;
        const perfString = subject.performance || "N/A";
        const isNA = perfString === "N/A" || perfString === ".";
        let got = 0;
        let max = 0;
        if (!isNA && perfString.includes("/")) {
          const parts = perfString.split("/");
          got = parseFloat(parts[0]);
          max = parseFloat(parts[1]);
        } else if (!isNA) {
          got = parseFloat(perfString);
          max = 100;
        }
        const percentage = max > 0 ? (got / max) * 100 : 0;
        const code = subject.courseCode || "";
        const cleanCode = code.trim();
        const title =
          courseMap[cleanCode] ||
          subject.courseTitle ||
          code ||
          "Unknown Subject";
        let status: "cooked" | "danger" | "safe" | "neutral" = "neutral";
        let badge = "pending";
        if (!isNA && max > 0) {
          if (percentage >= 85) {
            status = "safe";
            badge = "outstanding";
          } else if (percentage >= 70) {
            status = "danger";
            badge = "average";
          } else {
            status = "cooked";
            badge = "critical";
          }
        }
        return {
          id: index,
          title,
          code: cleanCode,
          type: subject.type || "Theory",
          score: got,
          max: max,
          testName: latestTest ? latestTest.title : "total",
          percentage: Math.round(percentage),
          displayScore: isNA ? "N/A" : got.toString(),
          status,
          badge,
          isNA,
          assessments,
        };
      })
      .sort((a: any, b: any) => {
        if (a.isNA && !b.isNA) return 1;
        if (!a.isNA && b.isNA) return -1;
        return b.percentage - a.percentage;
      });
  }, [rawMarks, courseMap]);

  const activeSubject = useMemo(() => {
    if (selectedId === null && sortedMarks.length > 0) return sortedMarks[0];
    return (
      sortedMarks.find((s: any) => s.id === selectedId) || sortedMarks[0] || {}
    );
  }, [selectedId, sortedMarks]);

  const currentRoast = useMemo(() => {
    const category =
      activeSubject.status === "neutral" ? "safe" : activeSubject.status;
    return getRandomRoast(category as any);
  }, [activeSubject.id]);

  useEffect(() => {
    if (sortedMarks.length > 0 && selectedId === null) {
      setSelectedId(sortedMarks[0].id);
    }
  }, [sortedMarks]);

  useEffect(() => {
    const timer = setTimeout(() => setIntroMode(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleScroll = () => {
    if (introMode || !listContainerRef.current) return;
    if (scrollTimeout.current) return;

    scrollTimeout.current = setTimeout(() => {
      const container = listContainerRef.current;
      if (!container) return;

      if (container.scrollTop < 20) {
        if (sortedMarks.length > 0 && selectedId !== sortedMarks[0].id) {
          setSelectedId(sortedMarks[0].id);
          if (navigator.vibrate) navigator.vibrate(2);
        }
        scrollTimeout.current = null;
        return;
      }

      const triggerLine =
        container.getBoundingClientRect().top + container.offsetHeight * 0.2;
      let closestId = null;
      let minDistance = Infinity;

      itemRefs.current.forEach((el, index) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top - triggerLine);
        if (dist < minDistance) {
          minDistance = dist;
          closestId = sortedMarks[index].id;
        }
      });

      if (closestId !== null && closestId !== selectedId) {
        setSelectedId(closestId);
        if (navigator.vibrate) navigator.vibrate(2);
      }
      scrollTimeout.current = null;
    }, 50);
  };

  const themeColorClass =
    activeSubject.status === "safe"
      ? "text-[#ceff1c]"
      : activeSubject.status === "danger"
        ? "text-[#ffb800]"
        : "text-[#ff003c]";
  const barColorClass =
    activeSubject.status === "safe"
      ? "bg-[#ceff1c]"
      : activeSubject.status === "danger"
        ? "bg-[#ffb800]"
        : "bg-[#ff003c]";

  if (sortedMarks.length === 0) {
    return (
      <div className="h-full w-full bg-[#050505] flex items-center justify-center text-white/50 font-mono text-sm">
        NO DATA AVAILABLE
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-[#050505] text-white font-sans relative overflow-hidden">
      <div className="absolute inset-0 w-full h-full z-0 bg-[#050505]">
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat mix-blend-screen" />
      </div>

      {/* DASHBOARD - Always rendered */}
      <div className="absolute top-0 left-0 w-full h-[45%] flex flex-col justify-between p-6 md:p-8 z-10">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/5 backdrop-blur-md">
            {activeSubject.status === "safe" ? (
              <Zap
                size={12}
                className={`transition-colors duration-300 ${themeColorClass}`}
                fill="currentColor"
              />
            ) : (
              <AlertCircle
                size={12}
                className={`transition-colors duration-300 ${themeColorClass}`}
              />
            )}
            <span
              className={`font-mono text-[10px] lowercase tracking-widest font-bold transition-colors duration-300 ${themeColorClass}`}
            >
              {activeSubject.type}
            </span>
          </div>
        </div>
        <div className="my-auto flex flex-col justify-center">
          <div className="flex items-baseline gap-6">
            {/* Added tracking-wide for increased letter spacing on big numbers */}
            <span
              className={`text-[20vw] md:text-[8rem] leading-[0.8] font-black tracking-wide transition-colors duration-300 ease-out ${themeColorClass}`}
              style={{ fontFamily: "Urbanosta" }}
            >
              <ScoreCounter value={activeSubject.score} />
            </span>
            {!activeSubject.isNA && (
              <div className="flex items-baseline gap-3">
                <span
                  className={`text-xl font-bold opacity-40 transition-colors duration-300 ease-out ${themeColorClass}`}
                  style={{ fontFamily: "Urbanosta" }}
                >
                  /{activeSubject.max.toFixed(1)}
                </span>
                <span
                  className={`text-[12px] font-black uppercase tracking-tight opacity-40 transition-colors duration-300 ease-out ${themeColorClass}`}
                >
                  {activeSubject.testName}
                </span>
              </div>
            )}
          </div>
          {activeSubject.isNA && (
            <span
              className={`text-sm font-bold uppercase tracking-widest opacity-50 mt-1 transition-colors duration-300 ${themeColorClass}`}
            >
              Not Graded Yet
            </span>
          )}
        </div>
        <div className="pb-1">
          <h3
            className="text-xl md:text-2xl font-bold lowercase leading-tight mb-4 line-clamp-1 text-white"
            style={{ fontFamily: "Aonic" }}
          >
            {activeSubject.title?.toLowerCase()}
          </h3>
          {!activeSubject.isNA && activeSubject.assessments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeSubject.assessments.map((asm: any, i: number) => (
                <div
                  key={i}
                  className="bg-white/10 border border-white/5 px-2 py-1 rounded-md flex flex-col"
                >
                  <span
                    className={`text-[8px] uppercase font-black opacity-60 transition-colors duration-300 ${themeColorClass}`}
                  >
                    {asm.title}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold transition-colors duration-300 ${themeColorClass}`}
                  >
                    {parseFloat(asm.marks).toFixed(1)}/
                    {parseFloat(asm.total).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="w-full h-[4px] bg-white/10 mb-2 relative overflow-hidden rounded-full">
            <motion.div
              className={`h-full transition-colors duration-300 ease-out ${barColorClass}`}
              initial={{ width: 0 }}
              animate={{
                width: activeSubject.isNA
                  ? "0%"
                  : `${activeSubject.percentage}%`,
              }}
              transition={{ duration: 0.8, ease: "circOut" }}
            />
          </div>
          {!activeSubject.isNA && (
            <span className="block text-[10px] font-mono font-bold lowercase mt-1 opacity-60 text-white/80">
              {currentRoast}
            </span>
          )}
        </div>
      </div>

      {/* LIST CONTAINER - Pre rendered */}
      <div
        ref={listContainerRef}
        onScroll={handleScroll}
        className={`absolute bottom-0 w-full overflow-y-auto bg-[#f5f6fc] text-black custom-scrollbar pb-32 h-[55%] rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] z-20 transition-transform duration-700 ease-in-out snap-y snap-mandatory ${
          introMode ? "translate-y-[60%]" : "translate-y-0"
        }`}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="px-6 flex flex-col gap-4 pt-4">
          <span className="font-mono text-[10px] lowercase tracking-widest text-[#050505]/40 mb-2 block sticky top-0 bg-[#f5f6fc] z-20 py-2">
            /// full records
          </span>

          {sortedMarks.map((subject: any, index: number) => {
            const isSelected = subject.id === selectedId;
            let itemColor = "text-[#050505]";
            let barColor = "bg-[#050505]";
            let pillColor = "bg-[#ceff1c]";
            if (subject.status === "cooked") {
              itemColor = "text-[#ff003c]";
              pillColor = "bg-[#ff003c]";
              barColor = "bg-[#ff003c]";
            } else if (subject.status === "danger") {
              itemColor = "text-[#ffb800]";
              pillColor = "bg-[#ffb800]";
              barColor = "bg-[#ffb800]";
            }
            return (
              <div
                key={subject.id}
                data-id={subject.id}
                ref={(el) => (itemRefs.current[index] = el)}
                onClick={() => {
                  itemRefs.current[index]?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className={`group relative w-full p-4 rounded-2xl cursor-pointer transition-all duration-300 ease-out border snap-start scroll-mt-12 shrink-0
                    ${isSelected ? "bg-white shadow-xl scale-[1.02] border-black/5 opacity-100 z-10" : "bg-transparent border-transparent scale-100 opacity-40 grayscale hover:opacity-80"}
                `}
              >
                <div className="flex justify-between items-center mb-1">
                  <h4
                    className="text-lg font-bold lowercase truncate max-w-[70%]"
                    style={{ fontFamily: "Aonic" }}
                  >
                    {subject.title?.toLowerCase()}
                  </h4>
                  <div className="flex items-baseline gap-1">
                    {!subject.isNA && (
                      <span
                        className="text-2xl font-black"
                        style={{ fontFamily: "Urbanosta" }}
                      >
                        {subject.percentage}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full h-[2px] bg-[#050505]/5 relative mb-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full absolute top-0 left-0 transition-colors duration-300 ease-out ${barColor}`}
                    style={{
                      width: subject.isNA ? "0%" : `${subject.percentage}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono tracking-wide text-[#050505]/50 lowercase mt-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${pillColor}`}
                    />
                    <span>{subject.type}</span>
                  </div>
                  <span
                    className={`font-bold transition-colors duration-300 ${itemColor}`}
                  >
                    {subject.badge}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Small spacer to allow final item to scroll up */}
          <div className="h-[20vh] shrink-0 pointer-events-none" />
        </div>
      </div>

      {/* INTRO OVERLAY */}
      <AnimatePresence>
        {introMode && (
          <motion.div
            key="introOverlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col justify-end items-start p-8 pb-[60%] z-50 bg-[#050505]"
          >
            <h1
              className="text-6xl font-black lowercase tracking-tighter text-white mb-2"
              style={{ fontFamily: "Aonic" }}
            >
              marks
            </h1>
            <p
              className="text-xl font-bold lowercase text-white/80 leading-tight max-w-[80%]"
              style={{ fontFamily: "Aonic" }}
            >
              {currentRoast}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MarksPage;
