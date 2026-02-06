import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { Zap, AlertCircle, BarChart3 } from 'lucide-react';

const ScoreCounter = ({ value, color }) => {
  const nodeRef = useRef(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    if (isNaN(value)) {
      node.textContent = value;
      return;
    }

    const controls = animate(prevValue.current, value, {
      duration: 0.8,
      ease: "circOut",
      onUpdate: v => { node.textContent = Math.floor(v) }
    });
    prevValue.current = value;
    return () => controls.stop();
  }, [value]);

  return <span ref={nodeRef} className={color} />;
};

const MarksPage = ({ data }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [introMode, setIntroMode] = useState(true);
  
  const itemRefs = useRef([]);
  const listContainerRef = useRef(null);
  const scrollTimeout = useRef(null);

  const courseMap = useMemo(() => {
    const map = {};
    if (data?.attendance) {
      data.attendance.forEach(sub => {
        if (sub.code && sub.title) {
          map[sub.code.trim()] = sub.title;
        }
      });
    }
    return map;
  }, [data]);

  const rawMarks = Array.isArray(data?.marks) ? data.marks : [];

  const sortedMarks = useMemo(() => {
    return rawMarks.map((subject, index) => {
      const rawScore = subject.performance === "N/A" ? 0 : parseFloat(subject.performance);
      const isNA = subject.performance === "N/A";
      
      const code = subject.courseCode || '';
      const cleanCode = code.trim();
      const title = courseMap[cleanCode] || subject.courseTitle || code || 'Unknown Subject';

      let status = 'safe';
      let badge = 'average';
      
      if (!isNA) {
        if (rawScore >= 90) { status = 'safe'; badge = 'outstanding'; }
        else if (rawScore >= 75) { status = 'safe'; badge = 'good'; }
        else if (rawScore >= 50) { status = 'warning'; badge = 'average'; }
        else { status = 'danger'; badge = 'critical'; }
      } else {
        status = 'neutral';
        badge = 'pending';
      }

      return {
        id: index,
        title,
        code: cleanCode,
        type: subject.type || 'Theory',
        score: isNA ? 0 : rawScore,
        displayScore: isNA ? '0' : rawScore,
        max: 100, 
        status,
        badge,
        isNA
      };
    }).sort((a, b) => {
       if (a.isNA && !b.isNA) return 1;
       if (!a.isNA && b.isNA) return -1;
       return b.score - a.score; 
    });
  }, [rawMarks, courseMap]);

  const activeSubject = useMemo(() => {
      if (selectedId === null && sortedMarks.length > 0) return sortedMarks[0];
      return sortedMarks.find(s => s.id === selectedId) || sortedMarks[0] || {};
  }, [selectedId, sortedMarks]);

  useEffect(() => {
    if (sortedMarks.length > 0 && selectedId === null) {
      setSelectedId(sortedMarks[0].id);
    }
  }, [sortedMarks]);

  useEffect(() => {
    const timer = setTimeout(() => setIntroMode(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleScroll = () => {
    if (introMode || !listContainerRef.current) return;
    if (scrollTimeout.current) return;

    scrollTimeout.current = setTimeout(() => {
      const container = listContainerRef.current;
      if (!container) return;
      const triggerLine = container.getBoundingClientRect().top + (container.offsetHeight * 0.3);
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
          case 'safe': return { bg: '#ceff1c', text: 'text-[#050505]', bar: 'bg-[#050505]' };
          case 'danger': return { bg: '#ff003c', text: 'text-white', bar: 'bg-white' };
          case 'warning': return { bg: '#ffb800', text: 'text-[#050505]', bar: 'bg-[#050505]' };
          default: return { bg: '#f0f0f0', text: 'text-[#050505]', bar: 'bg-[#050505]' };
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
        className="w-full relative z-30 shadow-xl overflow-hidden flex flex-col shrink-0"
        style={{ 
            backgroundColor: theme.bg,
            height: introMode ? '100%' : '50%', 
            transition: 'height 0.6s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.4s ease',
            willChange: 'height'
        }}
      >
        <div className="absolute inset-0 pointer-events-none mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat opacity-20" />

        <AnimatePresence mode="wait">
          {introMode ? (
            <motion.div
              key="intro"
              initial="hidden" animate="visible" exit="exit"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0, y: -40, transition: { duration: 0.25 } } }}
              className="absolute inset-0 flex flex-col justify-end items-start p-8 pb-32"
            >
              <h1 className="text-6xl font-black lowercase tracking-tighter text-[#050505] mb-2" style={{ fontFamily: 'Aonic' }}>marks</h1>
              <p className="text-xl font-bold lowercase text-[#050505] leading-tight max-w-[80%]" style={{ fontFamily: 'Aonic' }}>performance insights</p>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col h-full justify-between p-6 md:p-8 relative z-20"
            >
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 px-3 py-1 bg-black/5 rounded-full border border-black/5 backdrop-blur-sm">
                    {activeSubject.status === 'safe' ? <Zap size={12} fill="currentColor" className="text-current" /> : <AlertCircle size={12} className="text-current" />}
                    <span className={`font-mono text-[10px] lowercase tracking-widest font-bold opacity-60 ${theme.text}`}>{activeSubject.type}</span>
                  </div>
               </div>

               <div className="my-auto flex flex-col justify-center">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-[22vw] md:text-[9rem] leading-none font-black tracking-tighter ${theme.text}`} style={{ fontFamily: 'Urbanosta' }}>
                      <ScoreCounter value={activeSubject.score} color={theme.text} />
                    </span>
                    {!activeSubject.isNA && (
                        <span className={`text-xl font-bold opacity-40 ${theme.text}`} style={{ fontFamily: 'Urbanosta' }}>
                            /{activeSubject.max}
                        </span>
                    )}
                  </div>
                  {activeSubject.isNA && (
                      <span className={`text-sm font-bold uppercase tracking-widest opacity-50 -mt-2 ${theme.text}`}>Not Graded Yet</span>
                  )}
               </div>

               <div className="pb-1">
                  <h3 className={`text-2xl md:text-3xl font-bold lowercase leading-tight mb-3 line-clamp-1 ${theme.text}`} style={{ fontFamily: 'Aonic' }}>{activeSubject.title.toLowerCase()}</h3>
                  <div className="w-full h-[4px] bg-black/10 mb-2 relative overflow-hidden rounded-full">
                    <motion.div 
                        className={`h-full ${theme.bar}`} 
                        initial={{ width: 0 }} 
                        animate={{ width: activeSubject.isNA ? '0%' : `${(activeSubject.score / activeSubject.max) * 100}%` }} 
                        transition={{ duration: 0.8, ease: "circOut" }} 
                    />
                  </div>
                  <span className={`block text-[10px] font-mono font-bold lowercase mt-1 opacity-60 ${theme.text}`}>
                      {activeSubject.badge} performance
                  </span>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div 
        ref={listContainerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto bg-[#f5f6fc] custom-scrollbar pb-24 transition-all duration-700 ease-out snap-y snap-mandatory scroll-pt-4 ${introMode ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0 pointer-events-auto'}`} 
        style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        <div className="px-6 py-6 flex flex-col gap-4">
          <span className="font-mono text-[10px] lowercase tracking-widest text-[#050505]/40 mb-2 block sticky top-0 bg-[#f5f6fc] z-10 py-2">/// assessments</span>

          {sortedMarks.map((subject, index) => {
            const isSelected = subject.id === selectedId;
            
            let itemColor = 'text-[#050505]';
            let barColor = 'bg-[#050505]';
            let pillColor = 'bg-[#ceff1c]';
            
            if (subject.status === 'danger') {
                itemColor = 'text-[#ff003c]';
                barColor = 'bg-[#ff003c]';
                pillColor = 'bg-[#ff003c]';
            } else if (subject.status === 'warning') {
                itemColor = 'text-[#ffb800]';
                barColor = 'bg-[#ffb800]';
                pillColor = 'bg-[#ffb800]';
            } else if (subject.status === 'neutral') {
                itemColor = 'text-black/40';
                barColor = 'bg-black/20';
                pillColor = 'bg-black/10';
            }

            return (
              <div
                key={subject.id}
                ref={el => (itemRefs.current[index] = el)}
                onClick={() => setSelectedId(subject.id)}
                className={`group relative w-full p-4 rounded-2xl cursor-pointer transition-all duration-300 ease-out border snap-start scroll-mt-16
                    ${isSelected 
                        ? 'bg-white shadow-xl scale-[1.02] border-black/5 opacity-100 z-10' 
                        : 'bg-transparent border-transparent scale-100 opacity-50 grayscale hover:opacity-80'
                    }
                `}
              >
                <div className="flex justify-between items-end mb-3">
                  <h4 className="text-lg font-bold lowercase truncate max-w-[65%]" style={{ fontFamily: 'Aonic' }}>
                    {subject.title.toLowerCase()}
                  </h4>
                  <div className="flex flex-col items-end min-w-[80px]">
                      <span className={`text-2xl font-black leading-none ${itemColor}`} style={{ fontFamily: 'Urbanosta' }}>
                          {subject.displayScore}{!subject.isNA && <span className="text-sm opacity-40">/{subject.max}</span>}
                      </span>
                  </div>
                </div>

                <div className="w-full h-[2px] bg-[#050505]/5 relative mb-3 rounded-full overflow-hidden">
                  <div className={`h-full absolute top-0 left-0 transition-all duration-500 ${barColor}`} style={{ width: subject.isNA ? '0%' : `${(subject.score / subject.max) * 100}%` }} />
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono tracking-wide text-[#050505]/50 lowercase">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${pillColor}`} />
                    <span>{subject.type}</span>
                  </div>
                  <span className={`font-bold ${itemColor}`}>{subject.badge}</span>
                </div>
              </div>
            );
          })}
          <div className="h-24" />
        </div>
      </div>
    </div>
  );
};

export default MarksPage;