"use client";
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, User, ArrowRight, Layers } from 'lucide-react';

export default function Timetable({ schedule, dayOrder = "1" }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeDayOrder, setActiveDayOrder] = useState(parseInt(dayOrder) || 1);

  const dateDisplay = useMemo(() => {
    const d = new Date();
    return {
      date: d.getDate(),
      month: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
      day: d.toLocaleString('default', { weekday: 'long' }).toUpperCase(),
      year: d.getFullYear()
    };
  }, []);

  const currentSchedule = useMemo(() => {
    if (!schedule) return [];
    
    const dayKey = `Day ${activeDayOrder}`;
    const dayData = schedule[dayKey];

    if (!dayData) return [];
    
    const rawItems = Object.values(dayData).map((details) => {
        const [startStr, endStr] = details.time.split(' - ');
        
        const parseTime = (str) => {
          let [h, m] = str.split(':').map(Number);
          if (h < 8) h += 12; 
          if (h === 12 && m >= 0) h = 12; 
          return h * 60 + m;
        };

        return {
          ...details,
          start: startStr,
          end: endStr,
          minutesStart: parseTime(startStr),
          minutesEnd: parseTime(endStr),
        };
      }).sort((a, b) => a.minutesStart - b.minutesStart);

    const mergedItems = [];
    let currentBlock = null;

    rawItems.forEach((item) => {
      if (currentBlock && 
          currentBlock.course === item.course && 
          currentBlock.room === item.room) {
        currentBlock.end = item.end;
        currentBlock.minutesEnd = item.minutesEnd;
        currentBlock.slot += ` + ${item.slot}`; 
      } else {
        if (currentBlock) mergedItems.push(currentBlock);
        currentBlock = { ...item };
      }
    });
    if (currentBlock) mergedItems.push(currentBlock);

    return mergedItems.map(item => {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const isToday = parseInt(dayOrder) === activeDayOrder;
        
        const isNow = isToday && nowMinutes >= item.minutesStart && nowMinutes < item.minutesEnd;
        const isPast = isToday && nowMinutes >= item.minutesEnd;
        
        return { ...item, isNow, isPast };
    });

  }, [schedule, activeDayOrder, dayOrder]);

  return (
    <div className="h-full w-full bg-[#050505] flex flex-col relative overflow-hidden font-sans">
      
      <div className="pt-16 px-8 absolute top-0 w-full z-0 pointer-events-none">
        <div className="flex flex-col text-white">
            <span className="text-[#ceff1c] font-black text-sm tracking-[0.2em] uppercase mb-2 ml-1 relative z-10" style={{ fontFamily: 'Aonic' }}>
                {dateDisplay.day}
            </span>
            <div className="flex items-baseline leading-[0.8] relative z-0">
                <h1 className="text-[130px] font-medium tracking-tighter text-white" style={{ fontFamily: 'Urbanosta' }}>
                    {dateDisplay.date}
                </h1>
                
                <div className="flex flex-col ml-4 mb-3">
                    <span className="text-4xl font-black tracking text-white/30 uppercase" style={{ fontFamily: 'Aonic' }}>
                        {dateDisplay.month}
                    </span>
                    <span className="text-xs text-white/20 font-bold font-mono tracking-widest mt-1">
                        {dateDisplay.year}
                    </span>
                </div>
            </div>
        </div>
      </div>

      <motion.div 
        layout
        initial={{ y: "100%" }}
        animate={{ 
            y: 0,
            top: isExpanded ? '0%' : '38%', 
            bottom: '0px', 
            left: '0px',
            right: '0px',
            borderRadius: isExpanded ? '0px' : '32px 32px 0px 0px',
        }} 
        transition={{ type: "spring", stiffness: 220, damping: 28 }}
        className={`absolute w-full bg-[#fdfdfd] flex flex-col shadow-[0_-30px_80px_rgba(0,0,0,0.9)] z-20 overflow-hidden`}
      >
        <div 
            className="w-full flex flex-col bg-[#fdfdfd] z-30 pb-2 shrink-0 pt-4"
            onClick={() => !isExpanded && setIsExpanded(true)}
        >
            <div className="w-full flex justify-center mb-6 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="w-12 h-1.5 bg-black/10 rounded-full"></div>
            </div>

            <div className="px-6 pb-2" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/40" style={{ fontFamily: 'Aonic' }}>Day Order</span>
                    {parseInt(dayOrder) === activeDayOrder && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-black bg-[#ceff1c] px-2 py-0.5 rounded-sm">
                            Today
                        </span>
                    )}
                </div>
                
                <div className="flex justify-between gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                        <button
                            key={num}
                            onClick={() => setActiveDayOrder(num)}
                            className={`flex-1 h-11 rounded-xl flex items-center justify-center text-lg font-bold transition-all duration-200
                                ${activeDayOrder === num 
                                    ? 'bg-black text-[#ceff1c] shadow-md scale-105' 
                                    : 'bg-white text-black/40 border border-black/5 hover:border-black/20'}
                            `}
                            style={{ fontFamily: 'Aonic' }}
                        >
                            {num}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-32">
            <div className="flex flex-col gap-3 mt-2">
                <AnimatePresence mode="wait">
                    {currentSchedule.length > 0 ? (
                        currentSchedule.map((item, index) => (
                            <motion.div
                                key={`${activeDayOrder}-${index}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`w-full rounded-[24px] p-5 relative group overflow-hidden transition-all duration-300 flex flex-col gap-3
                                    ${item.isNow 
                                        ? 'bg-white border-l-4 border-l-[#3b82f6] shadow-xl shadow-blue-500/10' 
                                        : 'bg-white border border-[#f0f0f0]'
                                    }
                                    ${item.isPast ? 'opacity-50 grayscale' : 'opacity-100'}
                                `}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl font-bold tracking-tight text-black" style={{ fontFamily: 'Aonic' }}>
                                            {item.start}
                                        </span>
                                        <ArrowRight size={14} className="text-black/20" />
                                        <span className="text-lg font-medium tracking-tight text-black/40" style={{ fontFamily: 'Aonic' }}>
                                            {item.end}
                                        </span>
                                    </div>

                                    <div className="text-[9px] font-bold text-black/30 uppercase tracking-widest bg-black/5 px-2 py-1 rounded">
                                        {item.slot.replace(/ /g, '')}
                                    </div>
                                </div>

                                <div className="py-1">
                                    <h3 className="text-[17px] font-bold text-black leading-snug lowercase tracking-normal mb-2" style={{ fontFamily: 'Aonic' }}>
                                        {item.course}
                                    </h3>
                                    
                                    <div className="flex items-center gap-2">
                                        <User size={12} className="text-[#999]" />
                                        <span className="text-[10px] font-bold uppercase tracking-wide text-[#888]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                            {item.faculty.split('(')[0]}
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t border-[#f5f5f5] pt-3 flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={12} className={item.isNow ? 'text-[#3b82f6]' : 'text-black/30'} />
                                        <span className="text-xs font-bold text-black uppercase tracking-wide" style={{ fontFamily: 'Aonic' }}>
                                            {item.room}
                                        </span>
                                    </div>
                                    
                                    {item.isNow && (
                                        <span className="text-[9px] font-bold text-white bg-[#3b82f6] px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">
                                            Active
                                        </span>
                                    )}
                                </div>

                            </motion.div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 opacity-40 gap-4">
                            <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center">
                                <Layers className="text-black/40" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-bold lowercase text-black" style={{ fontFamily: 'Aonic' }}>free day</h3>
                                <p className="text-[10px] uppercase tracking-widest mt-1 text-black/50">
                                    No classes for Day {activeDayOrder}
                                </p>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
      </motion.div>
    </div>
  );
}