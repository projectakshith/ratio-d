import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { AlertCircle, Zap, Calendar, X } from 'lucide-react';
import { flavorText } from '../utils/flavortext';

const Counter = ({ value, color }) => {
  const nodeRef = useRef();
  const prevValue = useRef(0);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    const controls = animate(prevValue.current, value, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: v => { node.textContent = Math.floor(v) + '%' }
    });
    prevValue.current = value;
    return () => controls.stop();
  }, [value]);

  return <span ref={nodeRef} className={color} />;
};

const MarginCounter = ({ value, color }) => {
  const nodeRef = useRef();
  const prevValue = useRef(0);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    const controls = animate(prevValue.current, value, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: v => { node.textContent = Math.floor(v) }
    });
    prevValue.current = value;
    return () => controls.stop();
  }, [value]);

  return <span ref={nodeRef} className={color} />;
};

const MobileAttendance = ({ data }) => {
  const rawAttendance = Array.isArray(data?.attendance) ? data.attendance : [];

  const sortedAttendance = useMemo(() => {
    const processed = rawAttendance.map((subject, index) => {
      const pct = parseFloat(subject?.percent || '0');
      let category = pct < 75 ? 'cooked' : pct >= 85 ? 'safe' : 'danger';
      const list = flavorText.header?.[category] || flavorText.header?.danger || ['...'];
      const stableBadge = list[Math.floor(index % list.length)].toLowerCase();

      return {
        id: index,
        rawTitle: String(subject?.title || 'unknown'),
        code: String(subject?.code || ''),
        percentage: String(subject?.percent || '0'),
        conducted: parseInt(subject?.conducted || 0),
        present: parseInt(subject?.conducted || 0) - parseInt(subject?.absent || 0),
        badge: category,
        tagline: stableBadge
      };
    }).sort((a, b) => parseFloat(a.percentage) - parseFloat(b.percentage));

    const titleCounts = {};
    processed.forEach(s => { titleCounts[s.rawTitle] = (titleCounts[s.rawTitle] || 0) + 1; });

    return processed.map(s => ({
      ...s,
      title: titleCounts[s.rawTitle] > 1 ? `${s.rawTitle} [${s.code}]` : s.rawTitle
    }));
  }, [rawAttendance]);

  const [selectedId, setSelectedId] = useState(null);
  const [predictMode, setPredictMode] = useState(false);
  const [introMode, setIntroMode] = useState(true);
  const itemRefs = useRef([]);
  const listContainerRef = useRef(null);
  const scrollTimeout = useRef(null);

  useEffect(() => {
    if (sortedAttendance.length > 0 && selectedId === null) {
      setSelectedId(sortedAttendance[0].id);
    }
  }, [sortedAttendance]);

  useEffect(() => {
    const timer = setTimeout(() => setIntroMode(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleScroll = () => {
    if (predictMode || introMode || !listContainerRef.current) return;
    if (scrollTimeout.current) return;

    scrollTimeout.current = setTimeout(() => {
      const container = listContainerRef.current;
      const triggerLine = container.getBoundingClientRect().top + (container.offsetHeight * 0.3);

      let closestId = null;
      let minDistance = Infinity;

      itemRefs.current.forEach((el, index) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top - triggerLine);
        
        if (dist < minDistance) {
          minDistance = dist;
          closestId = sortedAttendance[index].id;
        }
      });

      if (closestId !== null && closestId !== selectedId) {
        setSelectedId(closestId);
        if (navigator.vibrate) navigator.vibrate(2); 
      }
      scrollTimeout.current = null;
    }, 100);
  };

  const activeSubject = sortedAttendance.find(s => s.id === selectedId) || sortedAttendance[0];

  const getStatus = (pct, conducted, present) => {
    const p = parseFloat(pct);
    if (p >= 75) {
      const margin = Math.floor(present / 0.75 - conducted);
      return { val: Math.max(0, margin), label: 'margin', safe: true, textColor: 'text-[#050505]', lineColor: 'bg-[#050505]' };
    }
    const needed = Math.ceil((0.75 * conducted - present) / 0.25);
    return { val: Math.max(0, needed), label: 'recover', safe: false, textColor: 'text-[#050505]', lineColor: 'bg-white' };
  };

  const currentStat = getStatus(activeSubject.percentage, activeSubject.conducted, activeSubject.present);

  if (sortedAttendance.length === 0) return null;

  return (
    <div className="h-full w-full flex flex-col bg-[#f5f6fc] text-[#050505] font-sans relative overflow-hidden touch-pan-y">
      
      <div 
        className="w-full relative z-30 shadow-xl overflow-hidden flex flex-col shrink-0"
        style={{ 
            backgroundColor: currentStat.safe ? '#ceff1c' : '#ff003c',
            height: introMode ? '100%' : '50%',
            transition: 'height 0.6s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.6s ease',
            willChange: 'height'
        }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat opacity-20" />

        <AnimatePresence mode="wait">
          {introMode ? (
            <motion.div
              key="intro"
              exit={{ opacity: 0, transition: { duration: 0 } }} 
              className="absolute inset-0 flex flex-col justify-end items-start p-8 pb-32 text-left"
            >
              <h1 className="text-6xl font-black lowercase tracking-tighter text-[#050505] mb-2" style={{ fontFamily: 'Urbanosta' }}>
                {activeSubject.badge}
              </h1>
              <p className="text-xl font-bold lowercase text-[#050505] leading-tight max-w-[80%]" style={{ fontFamily: 'Aonic' }}>
                {activeSubject.tagline}
              </p>
            </motion.div>
          ) : !predictMode ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex flex-col h-full justify-between p-6 md:p-8 relative z-20"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 px-3 py-1 bg-black/5 rounded-full border border-black/5 backdrop-blur-sm">
                  {currentStat.safe ? <Zap size={12} fill="black" /> : <AlertCircle size={12} fill="black" stroke="black" />}
                  <span className="font-mono text-[10px] lowercase tracking-widest font-bold text-black/60">
                    {activeSubject.badge}
                  </span>
                </div>
                <button onClick={() => setPredictMode(true)} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full active:scale-95 transition-transform">
                  <Calendar size={12} />
                  <span className="font-mono text-[10px] lowercase tracking-widest font-bold">predict</span>
                </button>
              </div>

              <div className="my-auto flex flex-col justify-center">
                <div className="flex items-baseline gap-2">
                  <span className={`text-[22vw] md:text-[9rem] leading-none font-black tracking-tighter ${currentStat.textColor}`} style={{ fontFamily: 'Urbanosta' }}>
                    <MarginCounter value={currentStat.val} color={currentStat.textColor} />
                    h
                  </span>
                  <span className={`text-sm font-bold lowercase opacity-40 -translate-y-2 ${currentStat.textColor}`} style={{ fontFamily: 'Aonic' }}>
                    {currentStat.label}
                  </span>
                </div>
              </div>

              <div className="pb-1">
                <h3 className={`text-2xl md:text-3xl font-bold lowercase leading-tight mb-3 line-clamp-1 ${currentStat.textColor}`} style={{ fontFamily: 'Aonic' }}>
                  {activeSubject.title.toLowerCase()}
                </h3>
                <div className="w-full h-[4px] bg-black/10 mb-2 relative overflow-hidden rounded-full">
                  <motion.div 
                    className={`h-full ${currentStat.lineColor}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(parseFloat(activeSubject.percentage), 100)}%` }}
                    transition={{ duration: 0.5, ease: "circOut" }}
                  />
                </div>
                <span className={`block text-[10px] font-mono font-bold lowercase mt-1 ${currentStat.textColor} opacity-60`}>
                  {activeSubject.present}/{activeSubject.conducted} sessions
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="predict"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full w-full bg-[#050505] absolute inset-0 z-50 p-8 flex flex-col text-white"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black lowercase tracking-tighter text-[#ceff1c]" style={{ fontFamily: 'Urbanosta' }}>future_sim</h3>
                <button onClick={() => setPredictMode(false)} className="p-2 bg-white/10 rounded-full text-white"><X size={16} /></button>
              </div>
              <div className="flex-1 flex items-center justify-center opacity-50 font-mono text-xs">
                 Coming Soon
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div 
        ref={listContainerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto bg-[#f5f6fc] custom-scrollbar pb-24 transition-all duration-700 ease-out 
            ${introMode ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0 pointer-events-auto'}`}
        style={{ 
            touchAction: 'pan-y', 
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain' 
        }}
      >
        <div className="px-6 py-6 flex flex-col gap-4">
          <span className="font-mono text-[10px] lowercase tracking-widest text-[#050505]/40 mb-2 block sticky top-0 bg-[#f5f6fc] z-10 py-2">
            /// watchlist
          </span>

          {sortedAttendance.map((subject, index) => {
            const isSelected = subject.id === selectedId;
            const dStat = getStatus(subject.percentage, subject.conducted, subject.present);

            return (
              <div
                key={subject.id}
                ref={el => (itemRefs.current[index] = el)}
                onClick={() => { if (!predictMode) setSelectedId(subject.id) }}
                className={`group relative w-full p-4 rounded-2xl cursor-pointer transition-all duration-300 ease-out border 
                    ${isSelected 
                        ? 'bg-white shadow-lg scale-[1.02] border-black/5 opacity-100 z-10' 
                        : 'bg-transparent border-transparent scale-100 opacity-50 grayscale hover:opacity-80'
                    }`}
                style={{ willChange: 'transform, opacity' }}
              >
                <div className="flex justify-between items-end mb-3">
                  <h4 className="text-lg font-bold lowercase truncate max-w-[65%]" style={{ fontFamily: 'Aonic' }}>
                    {subject.title.toLowerCase()}
                  </h4>
                  <span className={`text-2xl font-black ${dStat.safe ? 'text-[#050505]' : 'text-[#ff003c]'}`} style={{ fontFamily: 'Urbanosta' }}>
                    {Math.floor(subject.percentage)}%
                  </span>
                </div>

                <div className="w-full h-[2px] bg-[#050505]/5 relative mb-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full absolute top-0 left-0 ${dStat.safe ? 'bg-[#050505]' : 'bg-[#ff003c]'}`}
                    style={{ width: `${Math.min(subject.percentage, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono tracking-wide text-[#050505]/50 lowercase">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${dStat.safe ? 'bg-[#ceff1c]' : 'bg-[#ff003c]'}`} />
                    <span>{subject.code.toLowerCase()}</span>
                  </div>
                  <span className={dStat.safe ? 'text-[#050505]/50' : 'text-[#ff003c]/70'}>
                    {dStat.val}h {dStat.label}
                  </span>
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

export default MobileAttendance;