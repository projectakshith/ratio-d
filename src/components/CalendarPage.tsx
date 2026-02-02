"use client";

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CalendarItem {
  date: string;
  day: string;
  order: string;
  description: string;
}

export interface CalendarData {
  calendar: CalendarItem[];
  dayOrder: string;
}

interface CalendarPageProps {
  data: CalendarData | null | undefined;
}

const transition = { type: "spring", stiffness: 300, damping: 30 };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.02, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition }
};

export const CalendarPage: React.FC<CalendarPageProps> = ({ data }) => {
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const calendarEvents = data?.calendar || [];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const handlePrevMonth = () => {
    const newDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
    setViewMonth(newDate);
    setSelectedDate(newDate); 
  };

  const handleNextMonth = () => {
    const newDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
    setViewMonth(newDate);
    setSelectedDate(newDate);
  };
  
  const goToToday = () => {
    const now = new Date();
    setViewMonth(now);
    setSelectedDate(now);
  };

  const viewYear = viewMonth.getFullYear();
  const viewMonthIndex = viewMonth.getMonth();
  const today = new Date();

  const selectedDayStr = String(selectedDate.getDate()).padStart(2, '0');
  const selectedMonthStr = selectedDate.toLocaleString('en-US', { month: 'short' }); 
  const selectedYearStr = selectedDate.getFullYear();
  const selectedDateKey = `${selectedDayStr} ${selectedMonthStr} ${selectedYearStr}`;
  const selectedEvent = calendarEvents.find(e => e.date === selectedDateKey);

  const display = {
    dayNum: String(selectedDate.getDate()).padStart(2, '0'),
    monthStr: selectedDate.toLocaleString('en-US', { month: 'long' }).toUpperCase(),
    dayName: selectedDate.toLocaleString('en-US', { weekday: 'long' }),
    statusText: selectedEvent ? (selectedEvent.order !== '-' ? `Day Order ${selectedEvent.order}` : selectedEvent.description) : 'No Schedule',
    isHoliday: selectedEvent?.description?.toLowerCase().includes('holiday') || selectedEvent?.description?.toLowerCase().includes('sunday')
  };

  const gridItems = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonthIndex);
    const startOffset = getFirstDayOfMonth(viewYear, viewMonthIndex);
    const totalSlots = 42; 
    const slots = [];
    
    for (let i = 0; i < startOffset; i++) {
        slots.push({ type: 'padding', key: `prev-${i}` });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const currentDayDate = new Date(viewYear, viewMonthIndex, d);
      const dayStr = String(d).padStart(2, '0');
      const monStr = viewMonth.toLocaleString('en-US', { month: 'short' }); 
      const dateKey = `${dayStr} ${monStr} ${viewYear}`;
      const event = calendarEvents.find(e => e.date === dateKey);

      const isSelected = currentDayDate.toDateString() === selectedDate.toDateString();
      const isActuallyToday = currentDayDate.toDateString() === today.toDateString();

      let status = 'neutral';
      
      if (event) {
          if (event.order !== '-') status = 'active'; 
          else status = 'holiday'; 
      } else {
          status = 'holiday'; 
      }

      if (isActuallyToday) status = 'today';
      if (isSelected && !isActuallyToday) status = 'selected';

      slots.push({ type: 'day', day: d, status, key: `day-${d}`, dateObj: currentDayDate });
    }

    const remaining = totalSlots - slots.length;
    for (let i = 0; i < remaining; i++) {
        slots.push({ type: 'padding', key: `next-${i}` });
    }

    return slots;
  }, [viewYear, viewMonthIndex, calendarEvents, selectedDate, today]);

  return (
    <div className="h-full w-full bg-[#E5E5EA] text-black relative overflow-hidden flex flex-col">
      
      <div className="absolute top-12 right-8 flex gap-3 z-30">
        <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={goToToday} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1C1C1E] text-white shadow-lg transition-colors"
        >
            <Target size={18} />
        </motion.button>
        <div className="w-px h-10 bg-black/10 mx-1"></div>
        <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={handlePrevMonth} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#D1D1D6]/50 hover:bg-[#D1D1D6] transition-colors"
        >
            <ChevronLeft size={20} className="text-[#1C1C1E]" />
        </motion.button>
        <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={handleNextMonth} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#D1D1D6]/50 hover:bg-[#D1D1D6] transition-colors"
        >
            <ChevronRight size={20} className="text-[#1C1C1E]" />
        </motion.button>
      </div>

      <div className="flex-1 flex flex-col justify-end px-8 pb-32 z-10">
        <AnimatePresence mode='wait'>
          <motion.div 
            key={selectedDate.toISOString()} 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 20 }} 
            transition={transition}
            className="mb-8 flex flex-col"
          >
            <div className="flex justify-between items-start w-full">
                <motion.h1 
                    className="text-[160px] leading-[0.75] font-black tracking-tighter text-[#1C1C1E]" 
                    style={{ fontFamily: 'Urbanosta' }}
                >
                  {display.dayNum}
                </motion.h1>
            </div>
            
            <div className="flex flex-col mt-5 pl-2">
                <h2 className="text-[32px] font-bold tracking-tight text-[#1C1C1E] uppercase mb-0 leading-none" style={{ fontFamily: 'Aonic' }}>
                  {display.monthStr}
                </h2>
                <div className="flex justify-between items-center w-full">
                    <p className="text-[24px] font-bold text-[#8E8E93]" style={{ fontFamily: 'Aonic' }}>
                        {display.dayName}
                    </p>
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-right text-[12px] font-black uppercase tracking-wide px-4 py-2 rounded-full ${display.isHoliday ? 'bg-[#D1D1D6] text-black/50' : 'bg-[#1C1C1E] text-white'}`}
                        style={{ fontFamily: 'Aonic' }}
                    >
                        {display.statusText}
                    </motion.div>
                </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="w-full mt-2"
        >
            <div className="grid grid-cols-7 mb-3 px-1">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <motion.div variants={itemVariants} key={i} className="text-center text-[10px] font-bold text-[#AEAEB2]" style={{ fontFamily: 'Aonic' }}>
                        {d}
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5 justify-items-center">
                <AnimatePresence mode='popLayout'>
                    {gridItems.map((item, i) => {
                        let bgClass = "";
                        let content = null;

                        if (item.type === 'padding') {
                            bgClass = "border-2 border-[#D1D1D6] opacity-30"; 
                        } else {
                            if (item.status === 'active') bgClass = "bg-[#1C1C1E]"; // Black for Class
                            else if (item.status === 'holiday') bgClass = "bg-[#AEAEB2]"; // Grey for Holiday/Weekend
                            else if (item.status === 'today') bgClass = "bg-[#FF3B30]"; // Orange for Today
                            else if (item.status === 'selected') bgClass = "bg-[#1C1C1E] ring-4 ring-black/20"; // Selected
                            else bgClass = "bg-[#AEAEB2]"; 
                        }

                        return (
                            <motion.div
                                layout
                                key={item.key}
                                variants={itemVariants}
                                whileTap={item.type === 'day' ? { scale: 0.8 } : {}}
                                onClick={() => {
                                    if (item.type === 'day' && item.dateObj) {
                                        setSelectedDate(item.dateObj);
                                    }
                                }}
                                className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer relative transition-all duration-300 ${bgClass}`}
                            >
                                {item.status === 'today' && (
                                    <div className="w-1.5 h-1.5 bg-white rounded-full opacity-50" />
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </motion.div>
      </div>
    </div>
  );
};