"use client";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { Zap, AlertCircle } from "lucide-react";
import { getRandomRoast } from "@/utils/flavortext";

const ScoreCounter = ({ value, color }: { value: any; color: any }) => {
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

  return <span ref={nodeRef} className={color} />;
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
      const triggerLine =
        container.getBoundingClientRect().top + container.offsetHeight * 0.3;
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
    }, 100);
  };

  const theme = useMemo(() => {
    switch (activeSubject.status) {
      case "safe":
        return { bg: "#ceff1c", text: "text-[#050505]", bar: "bg-[#050505]" };
      case "cooked":
        return { bg: "#ff003c", text: "text-white", bar: "bg-white" };
      case "danger":
        return { bg: "#ffb800", text: "text-[#050505]", bar: "bg-[#050505]" };
      default:
        return { bg: "#f0f0f0", text: "text-[#050505]", bar: "bg-[#050505]" };
    }
  }, [activeSubject]);

  if (sortedMarks.length === 0) {
    return (
      <div className="h-full w-full bg-[#050505] flex items-center justify-center text-white/50 font-mono text-sm">
        NO DATA AVAILABLE
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-[#f5f6fc] text-[#050505] font-sans relative overflow-hidden touch-pan-y">
      <div
        className="absolute inset-0 w-full h-full z-0 transition-colors duration-500 ease-in-out"
        style={{ backgroundColor: theme.bg }}
      >
        <div className="absolute inset-0 pointer-events-none mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat opacity-20" />
        <AnimatePresence mode="wait">
          {introMode ? (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex flex-col justify-end items-start p-8 pb-32"
            >
              <h1
                className="text-6xl font-black lowercase tracking-tighter text-[#050505] mb-2"
                style={{ fontFamily: "Aonic" }}
              >
                marks
              </h1>
              <p
                className="text-xl font-bold lowercase text-[#050505] leading-tight max-w-[80%]"
                style={{ fontFamily: "Aonic" }}
              >
                {currentRoast}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-0 w-full h-[45%] flex flex-col justify-between p-6 md:p-8"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 px-3 py-1 bg-black/5 rounded-full border border-black/5 backdrop-blur-sm">
                  {activeSubject.status === "safe" ? (
                    <Zap
                      size={12}
                      fill="currentColor"
                      className="text-current"
                    />
                  ) : (
                    <AlertCircle size={12} className="text-current" />
                  )}
                  <span
                    className={`font-mono text-[10px] lowercase tracking-widest font-bold opacity-60 ${theme.text}`}
                  >
                    {activeSubject.type}
                  </span>
                </div>
              </div>
              <div className="my-auto flex flex-col justify-center">
                <div className="flex items-baseline gap-6">
                  <span
                    className={`text-[22vw] md:text-[9rem] leading-[0.8] font-black tracking-tighter ${theme.text}`}
                    style={{ fontFamily: "Urbanosta" }}
                  >
                    <ScoreCounter
                      value={activeSubject.score}
                      color={theme.text}
                    />
                  </span>
                  {!activeSubject.isNA && (
                    <div className="flex items-baseline gap-3">
                      <span
                        className={`text-xl font-bold opacity-40 ${theme.text}`}
                        style={{ fontFamily: "Urbanosta" }}
                      >
                        /{activeSubject.max.toFixed(1)}
                      </span>
                      <span
                        className={`text-[12px] font-black uppercase tracking-tight opacity-40 ${theme.text}`}
                      >
                        {activeSubject.testName}
                      </span>
                    </div>
                  )}
                </div>
                {activeSubject.isNA && (
                  <span
                    className={`text-sm font-bold uppercase tracking-widest opacity-50 mt-1 ${theme.text}`}
                  >
                    Not Graded Yet
                  </span>
                )}
              </div>
              <div className="pb-1">
                <h3
                  className={`text-xl md:text-2xl font-bold lowercase leading-tight mb-4 line-clamp-1 ${theme.text}`}
                  style={{ fontFamily: "Aonic" }}
                >
                  {activeSubject.title.toLowerCase()}
                </h3>
                {!activeSubject.isNA &&
                  activeSubject.assessments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {activeSubject.assessments.map((asm: any, i: number) => (
                        <div
                          key={i}
                          className="bg-black/5 border border-black/5 px-2 py-1 rounded-md flex flex-col"
                        >
                          <span
                            className={`text-[8px] uppercase font-black opacity-40 ${theme.text}`}
                          >
                            {asm.title}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold ${theme.text}`}
                          >
                            {parseFloat(asm.marks).toFixed(1)}/
                            {parseFloat(asm.total).toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                <div className="w-full h-[4px] bg-black/10 mb-2 relative overflow-hidden rounded-full">
                  <motion.div
                    className={`h-full ${theme.bar}`}
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
                  <span
                    className={`block text-[10px] font-mono font-bold lowercase mt-1 opacity-60 ${theme.text}`}
                  >
                    {currentRoast}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        ref={listContainerRef}
        onScroll={handleScroll}
        className={`absolute bottom-0 w-full rounded-t-[32px] overflow-y-auto bg-[#f5f6fc] custom-scrollbar pb-24 h-[55%] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-30 transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${
          introMode ? "translate-y-full" : "translate-y-0"
        }`}
        style={{
          touchAction: "pan-y",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        <div className="px-6 py-6 flex flex-col gap-4">
          <span className="font-mono text-[10px] lowercase tracking-widest text-[#050505]/40 mb-2 block sticky top-0 bg-[#f5f6fc] z-10 py-2">
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
                ref={(el) => (itemRefs.current[index] = el)}
                onClick={() => setSelectedId(subject.id)}
                className={`group relative w-full p-4 rounded-2xl cursor-pointer transition-all duration-300 ease-out border snap-start scroll-mt-16
                    ${isSelected ? "bg-white shadow-xl scale-[1.02] border-black/5 opacity-100 z-10" : "bg-transparent border-transparent scale-100 opacity-50 grayscale hover:opacity-80"}
                `}
              >
                <div className="flex justify-between items-center mb-1">
                  <h4
                    className="text-lg font-bold lowercase truncate max-w-[70%]"
                    style={{ fontFamily: "Aonic" }}
                  >
                    {subject.title.toLowerCase()}
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
                    className={`h-full absolute top-0 left-0 transition-all duration-500 ${barColor}`}
                    style={{
                      width: subject.isNA ? "0%" : `${subject.percentage}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono tracking-wide text-[#050505]/50 lowercase mt-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${pillColor}`} />
                    <span>{subject.type}</span>
                  </div>
                  <span className={`font-bold ${itemColor}`}>
                    {subject.badge}
                  </span>
                </div>
              </div>
            );
          })}
          <div className="h-24" />
        </div>
      </motion.div>
    </div>
  );
};

export default MarksPage;
