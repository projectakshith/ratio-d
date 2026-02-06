import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Target, X } from 'lucide-react';

const CalendarPage = () => {
  const [calendarData, setCalendarData] = useState([]);
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [introMode, setIntroMode] = useState(true);

  useEffect(() => {
    fetch('/calendar_data.json')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCalendarData(data);
      })
      .catch(err => console.error(err));
      
    const timer = setTimeout(() => setIntroMode(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const eventsMap = useMemo(() => {
    const map = {};
    if (calendarData) {
      calendarData.forEach(item => {
        const dateObj = new Date(item.date);
        if (!isNaN(dateObj.getTime())) {
            const key = dateObj.toDateString(); 
            map[key] = item;
        }
      });
    }
    return map;
  }, [calendarData]);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const handlePrevMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  
  const goToToday = () => {
    const now = new Date();
    setViewMonth(now);
    setSelectedDate(now);
  };

  const viewYear = viewMonth.getFullYear();
  const viewMonthIndex = viewMonth.getMonth();
  const today = new Date();

  const currentEvent = useMemo(() => {
    return eventsMap[selectedDate.toDateString()];
  }, [selectedDate, eventsMap]);

  const hasOrder = currentEvent?.order && currentEvent.order !== '-' && currentEvent.order !== '';
  const dayOfWeek = selectedDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isHoliday = currentEvent?.description?.toLowerCase().includes('holiday') || (isWeekend && !hasOrder);

  const theme = useMemo(() => {
    if (hasOrder) return { bg: '#ceff1c', text: 'text-[#050505]', accent: 'bg-[#050505]' };
    if (isHoliday) return { bg: '#ff003c', text: 'text-white', accent: 'bg-white' };
    return { bg: '#ffffff', text: 'text-[#050505]', accent: 'bg-[#050505]' };
  }, [hasOrder, isHoliday]);

  const display = useMemo(() => {
    const dayNum = String(selectedDate.getDate()).padStart(2, '0');
    const weekday = selectedDate.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    const month = selectedDate.toLocaleString('en-US', { month: 'short' }).toLowerCase();
    
    if (hasOrder) {
        return {
            bigText: currentEvent.order.padStart(2, '0'),
            labelTitle: "Day order",
            subInfo: `${weekday}, ${month} ${dayNum}`,
        };
    } else {
        return {
            bigText: dayNum,
            labelTitle: isHoliday ? "Holiday" : "No schedule",
            subInfo: `${weekday}, ${month}`,
        };
    }
  }, [selectedDate, hasOrder, isHoliday, currentEvent]);

  const gridData = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonthIndex);
    const startOffset = getFirstDayOfMonth(viewYear, viewMonthIndex);
    const slots = [];
    
    for (let i = 0; i < startOffset; i++) slots.push({ type: 'padding', key: `prev-${i}` });

    for (let d = 1; d <= daysInMonth; d++) {
      const currentDayDate = new Date(viewYear, viewMonthIndex, d);
      const event = eventsMap[currentDayDate.toDateString()];
      
      const isSelected = currentDayDate.toDateString() === selectedDate.toDateString();
      const isToday = currentDayDate.toDateString() === new Date().toDateString();
      
      const dDayOfWeek = currentDayDate.getDay();
      const dIsWeekend = dDayOfWeek === 0 || dDayOfWeek === 6;
      
      const dayOrder = (event?.order && event.order !== '-') ? event.order : null;
      const isDayHoliday = event?.description?.toLowerCase().includes('holiday') || (dIsWeekend && !dayOrder);

      slots.push({ 
        type: 'day', 
        day: d, 
        key: `day-${d}`, 
        dateObj: currentDayDate,
        isSelected,
        isToday,
        isDayHoliday,
        dayOrder
      });
    }
    return slots;
  }, [viewMonth, viewMonthIndex, viewYear, eventsMap, selectedDate]);

  const monthTitle = useMemo(() => {
      const m = viewMonth.toLocaleString('default', { month: 'long' });
      return m.charAt(0).toUpperCase() + m.slice(1).toLowerCase() + ' ' + viewYear;
  }, [viewMonth, viewYear]);

  return (
    <div className="h-full w-full flex flex-col bg-[#f5f6fc] text-[#050505] font-sans relative overflow-hidden touch-pan-y">
      
      <div 
        className="w-full relative z-30 shadow-xl overflow-hidden flex flex-col shrink-0"
        style={{ 
            backgroundColor: theme.bg,
            height: introMode ? '100%' : '40%', 
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
              <h1 className="text-6xl font-black lowercase tracking-tighter text-[#050505] mb-2" style={{ fontFamily: 'Aonic' }}>calendar</h1>
              <p className="text-xl font-bold lowercase text-[#050505] leading-tight max-w-[80%]" style={{ fontFamily: 'Aonic' }}>schedule & orders</p>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col h-full justify-end p-6 pb-2 relative z-20"
            >
               <div className="flex items-end gap-6 translate-y-4">
                  <span className={`text-[11rem] leading-[0.9] font-black tracking-tighter ${theme.text}`} style={{ fontFamily: 'Urbanosta' }}>
                    {display.bigText}
                  </span>

                  <div className="flex flex-col pb-7 gap-1.5">
                     <span className={`text-[13px] font-bold tracking-wide capitalize ${theme.text}`} style={{ fontFamily: 'Aonic' }}>
                        {display.labelTitle}
                     </span>
                     <span className={`text-2xl font-bold lowercase leading-none ${theme.text}`} style={{ fontFamily: 'Aonic' }}>
                        {display.subInfo}
                     </span>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div 
        className={`flex-1 flex flex-col bg-[#f5f6fc] pb-24 pt-6 px-4 transition-all duration-700 ease-out ${introMode ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'}`}
      >
        <div className="flex justify-between items-center mb-6 px-1 relative">
            <div className="absolute left-1/2 -translate-x-1/2 font-black text-xl tracking-tight text-[#050505]" style={{ fontFamily: 'Aonic' }}>
                {monthTitle}
            </div>
            
            <button onClick={handlePrevMonth} className="p-2 hover:bg-black/5 rounded-full transition-colors text-[#050505] z-10"><ChevronLeft size={24} /></button>
            <div className="flex items-center gap-1 z-10">
                <button onClick={handleNextMonth} className="p-2 hover:bg-black/5 rounded-full transition-colors text-[#050505]"><ChevronRight size={24} /></button>
                <button onClick={goToToday} className="p-2 hover:bg-black/5 rounded-full transition-colors text-[#050505] opacity-60 hover:opacity-100"><Target size={20} /></button>
            </div>
        </div>

        <div className="grid grid-cols-7 text-center mb-3">
            {['m','t','w','t','f','s','s'].map((d, i) => (
                <span key={i} className="text-[10px] font-black text-black/30 font-mono uppercase tracking-widest">{d}</span>
            ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-7 gap-2 gap-y-3 justify-items-center">
                {gridData.map((item, i) => {
                    if (item.type === 'padding') return <div key={item.key} className="w-full" />;

                    let bg = "bg-transparent"; 
                    let text = "text-[#050505]";
                    let dateColor = "text-black/80"; 
                    let orderColor = "text-black/20"; 

                    if (item.isSelected) {
                        bg = "bg-[#050505] shadow-lg scale-105 z-10";
                        text = "text-[#ceff1c]";
                        dateColor = "text-[#ceff1c]";
                        orderColor = "text-[#ceff1c]/60";
                    } else if (item.isToday) {
                        bg = "bg-[#ceff1c]/20 border border-[#ceff1c]"; 
                    } else if (item.isDayHoliday) {
                        bg = "bg-[#ff003c]/5";
                        dateColor = "text-[#ff003c]";
                        orderColor = "text-[#ff003c]/30";
                    } else if (item.dayOrder) {
                        bg = "bg-white border border-black/5";
                    }

                    return (
                        <motion.button
                            key={item.key}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setSelectedDate(item.dateObj);
                                if (navigator.vibrate) navigator.vibrate(2);
                            }}
                            className={`aspect-square w-full rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 ${bg}`}
                        >
                            <span className={`absolute top-1.5 left-2 text-[10px] font-black ${dateColor}`} style={{ fontFamily: 'Aonic' }}>
                                {item.day}
                            </span>
                            
                            <div className="flex items-center justify-center pt-2">
                                {item.dayOrder ? (
                                    <span className={`text-xl font-black ${orderColor}`} style={{ fontFamily: 'Aonic' }}>
                                        {item.dayOrder}
                                    </span>
                                ) : item.isDayHoliday ? (
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#ff003c]" />
                                ) : (
                                    <span className="h-4 w-4" /> 
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;