"use client";
import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { buildCourseMap, processSchedule, parseTimetableTime } from "@/utils/dashboard/timetableLogic";
import { Clock, Plus, ChevronRight, LayoutGrid, List, MapPin, Coffee, Zap, Download, RotateCcw } from "lucide-react";
import { toPng } from 'html-to-image';

const CompactSlot = ({ slot }: { slot: any }) => {
  if (!slot) {
    return (
      <div 
        className="h-full w-full rounded-xl border-[1.5px] border-dashed"
        style={{
          borderColor: "color-mix(in srgb, var(--theme-text) 15%, transparent)",
          borderDasharray: "4 6"
        } as any}
      />
    );
  }

  const isLab = slot.type === "lab" || slot.slot?.includes("P");
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`h-full w-full p-2.5 rounded-xl border-[1.5px] transition-all duration-300 flex flex-col justify-between group overflow-hidden ${
        isLab 
          ? "bg-[#0EA5E9]/5 border-[#0EA5E9]/30" 
          : "bg-theme-card border-theme-border shadow-sm hover:border-theme-text/20"
      }`}
    >
      <div className="flex flex-col gap-0.5">
        <h3 
          className={`text-[9px] font-black uppercase tracking-tight leading-[1.1] line-clamp-2 ${isLab ? "text-[#0EA5E9]" : "text-theme-text"}`} 
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          {slot.name}
        </h3>
        <p className={`text-[7px] font-bold opacity-60 truncate ${isLab ? "text-[#0EA5E9]" : "text-theme-muted"}`} style={{ fontFamily: 'var(--font-afacad)' }}>
          {slot.faculty}
        </p>
      </div>
      
      <div className="flex flex-col mt-0.5">
        <span className={`text-[8px] font-black uppercase text-theme-muted/60`} style={{ fontFamily: 'var(--font-afacad)' }}>
          {slot.room}
        </span>
      </div>
    </motion.div>
  );
};

const TimelineCard = ({ slot, time, active, onClick }: { slot: any, time: string, active: boolean, onClick: () => void }) => {
  const isLab = slot?.type === "lab" || slot?.slot?.includes("P");
  
  if (!slot) {
    return (
      <div 
        onClick={onClick}
        className={`flex-1 min-w-0 h-full rounded-2xl border-[1.5px] border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:bg-theme-surface/30 ${active ? 'bg-theme-emphasis/10' : ''}`}
        style={{ 
          borderColor: active ? "transparent" : "color-mix(in srgb, var(--theme-text) 10%, transparent)",
          borderDasharray: "4 6"
        } as any}
      >
        <Coffee size={20} className={`transition-colors ${active ? 'text-theme-emphasis' : 'text-theme-muted opacity-40'}`} />
        <span className={`text-[8px] font-black uppercase tracking-widest transition-colors ${active ? 'text-theme-emphasis' : 'text-theme-muted/40'}`} style={{ fontFamily: 'var(--font-montserrat)' }}>free</span>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`flex-1 min-w-0 h-full p-3 rounded-2xl flex flex-col justify-between cursor-pointer transition-all duration-300 shadow-sm border-[1.5px] ${
        active 
          ? "bg-theme-emphasis text-theme-bg border-transparent" 
          : isLab 
            ? "bg-[#0EA5E9]/5 border-[#0EA5E9]/30 text-theme-text hover:border-[#0EA5E9]" 
            : "bg-theme-card border-theme-border text-theme-text hover:border-theme-text/20"
      }`}
    >
      <div className="flex flex-col">
        <span className={`text-[13px] font-black uppercase tracking-tighter leading-none mb-1`} style={{ fontFamily: 'var(--font-montserrat)' }}>
          {time.split('-')[0].trim()}
        </span>
        <h4 className={`text-[9px] font-bold lowercase tracking-tight line-clamp-2 leading-tight ${active ? 'opacity-90' : 'opacity-60'}`} style={{ fontFamily: 'var(--font-afacad)' }}>
          {slot.name}
        </h4>
      </div>

      <div className="flex flex-col">
        <span className={`text-[8px] font-black uppercase tracking-widest truncate ${active ? 'opacity-80' : 'opacity-40'}`} style={{ fontFamily: 'var(--font-afacad)' }}>
          {slot.room}
        </span>
      </div>
    </motion.div>
  );
};

export default function DesktopTimetable() {
  const { userData, calendarData } = useApp();
  const [showExtra, setShowExtra] = useState(false);
  const [view, setView] = useState<"full" | "default">("default");
  const timetableRef = useRef<HTMLDivElement>(null);
  
  const downloadTimetable = async () => {
    if (timetableRef.current === null) return;
    
    const logo = document.createElement('div');
    logo.id = 'download-logo';
    logo.innerHTML = "ratio'd";
    logo.style.position = 'absolute';
    logo.style.top = '15px';
    logo.style.right = '60px';
    logo.style.fontFamily = 'var(--font-urbanosta)';
    logo.style.fontSize = '18px';
    logo.style.fontWeight = 'normal';
    logo.style.color = 'var(--theme-text)';
    logo.style.opacity = '0.7';
    logo.style.letterSpacing = '-1px';
    logo.style.zIndex = '100';
    timetableRef.current.appendChild(logo);

    try {
      const dataUrl = await toPng(timetableRef.current, { 
        cacheBust: true,
        backgroundColor: 'var(--theme-bg)',
        pixelRatio: 4,
      });
      const link = document.createElement('a');
      link.download = `ratio-d-timetable-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('oops, something went wrong!', err);
    } finally {
      logo.remove();
    }
  };

  const scheduleData = useMemo(() => 
    userData?.timetable || userData?.schedule || {}, 
    [userData]
  );

  const courseMap = useMemo(() => 
    buildCourseMap(userData), 
    [userData]
  );

  const { days, timeSlots, extraTimeSlots, gridData } = useMemo(() => {
    const dayOrders = [1, 2, 3, 4, 5];
    const slotsByDay = dayOrders.map(day => 
      processSchedule(scheduleData, {}, day, 0, courseMap).filter(s => s.type !== 'break')
    );
    
    const timeMap = new Map<string, number>();
    slotsByDay.forEach(daySlots => {
      daySlots.forEach(slot => {
        if (slot.time && !timeMap.has(slot.time)) {
          timeMap.set(slot.time, parseTimetableTime(slot.time.split("-")[0].trim()));
        }
      });
    });

    const sortedTimeSlots = Array.from(timeMap.entries())
      .sort((a, b) => a[1] - b[1])
      .map(entry => entry[0]);

    const cutoff = parseTimetableTime("16:50");
    const standardTimes = sortedTimeSlots.filter(t => parseTimetableTime(t.split("-")[0].trim()) < cutoff);
    const extraTimes = sortedTimeSlots.filter(t => parseTimetableTime(t.split("-")[0].trim()) >= cutoff);

    const grid: Record<number, Record<string, any>> = {};
    dayOrders.forEach(day => {
      grid[day] = {};
      sortedTimeSlots.forEach(time => {
        const slot = slotsByDay[day-1].find(s => s.time === time);
        grid[day][time] = slot || null;
      });
    });

    return { days: dayOrders, timeSlots: standardTimes, extraTimeSlots: extraTimes, gridData: grid };
  }, [scheduleData, courseMap]);

  const displayTimings = showExtra ? [...timeSlots, ...extraTimeSlots] : timeSlots;

  const currentDayOrder = useMemo(() => {
    const todayDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const todayEntry = calendarData?.find((item: any) => {
      const d = item.date instanceof Date ? item.date : new Date(item.date);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) === todayDate;
    });

    if (todayEntry && todayEntry.order !== "-" && !isNaN(parseInt(todayEntry.order))) {
      return parseInt(todayEntry.order);
    }
    return parseInt(String(userData?.profile?.dayOrder || userData?.dayOrder || "1")) || 1;
  }, [userData, calendarData]);

  const isHoliday = useMemo(() => {
    const todayDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const todayEntry = calendarData?.find((item: any) => {
      const d = item.date instanceof Date ? item.date : new Date(item.date);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) === todayDate;
    });
    return !todayEntry || todayEntry.order === "-" || isNaN(parseInt(todayEntry.order));
  }, [calendarData]);

  const nextWorkingDayOrder = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const futureDays = calendarData
      ?.filter((ev: any) => {
        const d = ev.date instanceof Date ? ev.date : new Date(ev.date);
        return d > now;
      })
      .sort((a: any, b: any) => {
        const da = a.date instanceof Date ? a.date : new Date(a.date);
        const db = b.date instanceof Date ? b.date : new Date(b.date);
        return da.getTime() - db.getTime();
      });

    for (const ev of futureDays || []) {
      const dOrder = parseInt(ev.dayOrder || ev.order);
      if (!isNaN(dOrder) && dOrder >= 1 && dOrder <= 5) {
        return dOrder;
      }
    }
    return 1;
  }, [calendarData]);

  const isTodayFinished = useMemo(() => {
    if (isHoliday) return true;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const todaySlots = gridData[currentDayOrder];
    if (!todaySlots) return true;
    let lastEnd = 0;
    Object.keys(todaySlots).forEach(time => {
      const end = parseTimetableTime(time.split("-")[1]?.trim() || "");
      if (end > lastEnd) lastEnd = end;
    });
    
    return currentMinutes >= lastEnd;
  }, [isHoliday, currentDayOrder, gridData]);

  const [selectedDay, setSelectedDay] = useState(1);
  const [previewTime, setPreviewTime] = useState<string | null>(null);

  useEffect(() => {
    if (isHoliday || isTodayFinished) {
      setSelectedDay(nextWorkingDayOrder);
    } else {
      setSelectedDay(currentDayOrder);
    }
  }, [currentDayOrder, isHoliday, isTodayFinished, nextWorkingDayOrder]);

  const activeHeroTime = useMemo(() => {
    if (previewTime) return previewTime;
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    if (selectedDay !== currentDayOrder || isHoliday || isTodayFinished) return null;

    const ongoing = displayTimings.find(time => {
      const parts = time.split("-");
      const start = parseTimetableTime(parts[0].trim());
      const end = parseTimetableTime(parts[1]?.trim() || "");
      return currentMinutes >= start && currentMinutes <= end;
    });

    return ongoing || null;
  }, [previewTime, displayTimings, selectedDay, currentDayOrder, isHoliday, isTodayFinished]);

  const activeHeroSlot = activeHeroTime ? gridData[selectedDay][activeHeroTime] : null;

  const nextUpSlot = useMemo(() => {
    if (activeHeroSlot) return null;
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const isActuallyCurrentDay = selectedDay === currentDayOrder && !isHoliday && !isTodayFinished;
    
    const upcoming = displayTimings
      .map(time => {
        const parts = time.split("-");
        const start = parseTimetableTime(parts[0].trim());
        return { time, start };
      })
      .filter(t => t.start > (isActuallyCurrentDay ? currentMinutes : 0))
      .sort((a, b) => a.start - b.start)[0];
      
    if (upcoming) {
      return gridData[selectedDay][upcoming.time];
    }
    
    return null;
  }, [activeHeroSlot, displayTimings, gridData, selectedDay, currentDayOrder, isHoliday, isTodayFinished]);

  const isActuallyToday = selectedDay === currentDayOrder && !isHoliday && !isTodayFinished;
  const isActuallyUpcoming = (isHoliday || isTodayFinished) && selectedDay === nextWorkingDayOrder;

  const handleResetDay = () => {
    if (isHoliday || isTodayFinished) {
      setSelectedDay(nextWorkingDayOrder);
    } else {
      setSelectedDay(currentDayOrder);
    }
    setPreviewTime(null);
  };

  return (
    <div className="h-full w-full flex flex-col bg-theme-bg overflow-hidden relative">
      <div ref={timetableRef} className="flex-1 relative min-h-0 bg-theme-bg overflow-hidden pb-12">
        <AnimatePresence mode="popLayout">
          {view === "full" ? (
            <motion.div 
              key="full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col gap-2 px-6 pt-12 min-h-0 overflow-hidden"
            >
              <div className="grid gap-2 shrink-0" style={{ gridTemplateColumns: `60px repeat(${displayTimings.length}, minmax(0, 1fr))` }}>
                <div className="flex items-center justify-center opacity-20">
                  <Clock size={16} className="text-theme-text" />
                </div>
                {displayTimings.map(time => (
                  <div key={time} className="flex flex-col items-center justify-center py-3 rounded-xl bg-theme-surface border border-theme-border shadow-sm">
                    <span className="text-theme-text text-[10px] font-black tabular-nums tracking-tighter leading-none" style={{ fontFamily: 'var(--font-montserrat)' }}>
                      {time.split('-')[0].trim()}
                    </span>
                    <div className="h-[1.5px] w-2 bg-theme-border my-1 rounded-full" />
                    <span className="text-theme-muted text-[9px] font-black tabular-nums tracking-tighter leading-none" style={{ fontFamily: 'var(--font-montserrat)' }}>
                      {time.split('-')[1].trim()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex-1 flex flex-col gap-2 overflow-hidden pb-4">
                {days.map((day) => (
                  <div key={day} className="grid gap-2 flex-1" style={{ gridTemplateColumns: `60px repeat(${displayTimings.length}, minmax(0, 1fr))` }}>
                    <div className={`flex flex-col items-center justify-center rounded-xl shadow-sm transition-colors relative ${currentDayOrder === day ? 'bg-theme-emphasis' : 'bg-theme-surface border border-theme-border'}`}>
                      <span className={`text-2xl font-black leading-none ${currentDayOrder === day ? 'text-theme-bg translate-y-0.5' : 'text-theme-text'}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{day}</span>
                      {currentDayOrder === day && (
                        <span className="absolute bottom-1.5 text-[7px] font-black uppercase tracking-widest text-theme-bg/60" style={{ fontFamily: 'var(--font-montserrat)' }}>today</span>
                      )}
                    </div>
                    {displayTimings.map(time => (
                      <div key={`${day}-${time}`} className="relative h-full">
                        <CompactSlot slot={gridData[day][time]} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col min-h-0 overflow-hidden"
            >
              <div className="flex-[1.8] flex flex-col justify-center px-12 pt-44 shrink-0">
                <div className="max-w-5xl">
                  <div className="flex items-center gap-3 mb-2 translate-y-[-4px]">
                    <span className="text-theme-muted text-[10px] font-bold uppercase tracking-[0.5em]" style={{ fontFamily: 'var(--font-montserrat)' }}>
                      day order {selectedDay} {isActuallyToday ? (
                        <span className="text-theme-emphasis opacity-100">- today</span>
                      ) : isActuallyUpcoming ? (
                        <span className="text-theme-highlight opacity-100">- upcoming</span>
                      ) : (
                        <span className="opacity-40">- selected</span>
                      )}
                    </span>
                  </div>
                  <h1 
                    className="text-6xl font-black lowercase tracking-[-0.06em] leading-[0.85] text-theme-text mb-10" 
                    style={{ fontFamily: 'var(--font-montserrat)' }}
                  >
                    {activeHeroSlot ? activeHeroSlot.name : nextUpSlot ? nextUpSlot.name : "chill out."}
                  </h1>
                  
                  <div className="flex items-center gap-12 w-fit">
                    {(activeHeroTime || (nextUpSlot && nextUpSlot.time)) && (
                      <>
                        <div className="flex flex-col">
                          <span className="text-theme-muted text-[10px] font-bold uppercase tracking-[0.4em] mb-2" style={{ fontFamily: 'var(--font-afacad)' }}>timing</span>
                          <span className="text-2xl font-black uppercase text-theme-highlight whitespace-nowrap" style={{ fontFamily: 'var(--font-montserrat)' }}>
                            {activeHeroTime || (nextUpSlot && nextUpSlot.time)}
                          </span>
                        </div>
                        <div className="w-[1px] h-12 bg-theme-border" />
                      </>
                    )}
                    <div className="flex flex-col">
                      <span className="text-theme-muted text-[10px] font-bold uppercase tracking-[0.4em] mb-2" style={{ fontFamily: 'var(--font-afacad)' }}>location</span>
                      <span className="text-2xl font-black lowercase text-theme-text opacity-70" style={{ fontFamily: 'var(--font-montserrat)' }}>
                        {(activeHeroSlot?.room || nextUpSlot?.room || "anywhere").toLowerCase()}
                      </span>
                    </div>
                    <div className="w-[1px] h-12 bg-theme-border" />
                    <div className="flex flex-col">
                      <span className="text-theme-muted text-[10px] font-bold uppercase tracking-[0.4em] mb-2" style={{ fontFamily: 'var(--font-afacad)' }}>faculty</span>
                      <span className="text-2xl font-black lowercase text-theme-text opacity-70" style={{ fontFamily: 'var(--font-montserrat)' }}>
                        {(activeHeroSlot?.faculty || nextUpSlot?.faculty || "Nobody").split('(')[0].trim()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col mt-auto pb-12 shrink-0">
                <div className="px-12 mb-4 flex items-center justify-end gap-3">
                  <button
                    onClick={handleResetDay}
                    className="w-10 h-10 rounded-full bg-theme-surface border border-theme-border flex items-center justify-center text-theme-muted hover:text-theme-text hover:border-theme-text transition-all shadow-sm active:scale-90"
                    title="reset to now"
                  >
                    <RotateCcw size={18} />
                  </button>
                  <div className="flex gap-1 bg-theme-surface/30 p-1 rounded-[18px]">
                    {days.map(d => (
                      <button
                        key={d}
                        onClick={() => { setSelectedDay(d); setPreviewTime(null); }}
                        className={`w-9 h-9 flex flex-col items-center justify-center rounded-[14px] text-xs font-black transition-all relative ${selectedDay === d ? 'bg-theme-emphasis text-theme-bg' : 'text-theme-muted hover:text-theme-text'}`}
                        style={{ fontFamily: 'var(--font-montserrat)' }}
                      >
                        <span className="translate-y-[1px]">{d}</span>
                        {currentDayOrder === d && !isHoliday && !isTodayFinished && (
                          <div className={`absolute bottom-1 w-1 h-1 rounded-full ${selectedDay === d ? 'bg-theme-bg' : 'bg-theme-emphasis'}`} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-10">
                  <div className="h-[110px] bg-theme-emphasis/5 rounded-[32px] flex items-center px-4 gap-2.5">
                    {displayTimings.map(time => (
                      <TimelineCard 
                        key={time} 
                        time={time} 
                        slot={gridData[selectedDay][time]} 
                        active={activeHeroTime === time}
                        onClick={() => setPreviewTime(time)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-8 pb-10 flex items-center justify-between z-20 shrink-0 h-24 translate-y-[-10px]">
        <div className="flex items-center gap-6">
          <div className="flex bg-theme-surface p-1 rounded-2xl border border-theme-border shadow-sm">
            <button 
              onClick={() => setView("default")}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === "default" ? 'bg-theme-emphasis text-theme-bg shadow-md' : 'text-theme-muted hover:text-theme-text'}`}
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              <List size={14} />
              list
            </button>
            <button 
              onClick={() => setView("full")}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === "full" ? 'bg-theme-emphasis text-theme-bg shadow-md' : 'text-theme-muted hover:text-theme-text'}`}
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              <LayoutGrid size={14} />
              grid
            </button>
            {extraTimeSlots.length > 0 && view === "full" && (
              <button 
                onClick={() => setShowExtra(!showExtra)}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ml-1 ${showExtra ? 'bg-theme-highlight text-theme-bg shadow-md' : 'text-theme-muted hover:text-theme-text'}`}
                style={{ fontFamily: 'var(--font-montserrat)' }}
              >
                {showExtra ? <ChevronRight size={14} /> : <Plus size={14} />}
                {showExtra ? "standard" : `${extraTimeSlots.length} more`}
              </button>
            )}
          </div>
          
          {view === "full" && (
            <button 
              onClick={downloadTimetable}
              className="p-3 rounded-2xl bg-theme-surface border border-theme-border text-theme-muted hover:text-theme-text transition-all shadow-sm group active:scale-95"
              title="download as image"
            >
              <Download size={18} className="group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>
      </div>
      <div className="absolute bottom-8 right-8 pointer-events-none z-0 text-right">
        <h1 className="text-theme-text font-regular lowercase leading-none select-none opacity-80" style={{ fontFamily: 'var(--font-afacad)', fontSize: '55px', letterSpacing: '-4px' }}>timetable</h1>
      </div>
    </div>
  );
}
