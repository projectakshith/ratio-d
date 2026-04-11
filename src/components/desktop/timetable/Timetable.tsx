"use client";
import React, { useMemo, useState, useEffect } from "react";
import DesktopSidebar from "../DesktopSidebar";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { buildCourseMap, processSchedule, parseTimetableTime } from "@/utils/dashboard/timetableLogic";
import { Clock, Plus, ChevronRight, LayoutGrid, List, MapPin, Coffee, Zap } from "lucide-react";

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
          borderColor: active ? "var(--theme-emphasis)" : "color-mix(in srgb, var(--theme-text) 10%, transparent)",
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
          ? "bg-theme-emphasis text-theme-bg border-theme-emphasis" 
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
  const { userData } = useApp();
  const [showExtra, setShowExtra] = useState(false);
  const [view, setView] = useState<"full" | "default">("default");
  
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

  const getDayOrder = () => {
    const dayOrder = userData?.profile?.dayOrder || 1;
    return parseInt(String(dayOrder)) || 1;
  };

  const [selectedDay, setSelectedDay] = useState(getDayOrder());
  const [previewTime, setPreviewTime] = useState<string | null>(null);

  useEffect(() => {
    setSelectedDay(getDayOrder());
  }, [userData]);

  const activeHeroTime = useMemo(() => {
    if (previewTime) return previewTime;
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const dayOrder = getDayOrder();
    
    if (selectedDay !== dayOrder) return null;

    const ongoing = displayTimings.find(time => {
      const parts = time.split("-");
      const start = parseTimetableTime(parts[0].trim());
      const end = parseTimetableTime(parts[1]?.trim() || "");
      return currentMinutes >= start && currentMinutes <= end;
    });

    return ongoing || null;
  }, [previewTime, displayTimings, selectedDay, userData]);

  const activeHeroSlot = activeHeroTime ? gridData[selectedDay][activeHeroTime] : null;

  return (
    <div className="h-screen w-full flex flex-row p-1.5 font-sans overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: 'color-mix(in srgb, var(--theme-bg), black 12%)' }}
    >
      <div className="flex-1 bg-theme-bg rounded-[24px] relative overflow-hidden flex flex-col border border-theme-border shadow-xl">
        
        <div className="flex-1 overflow-hidden relative flex flex-col">
          <AnimatePresence mode="wait">
            {view === "full" ? (
              <motion.div 
                key="full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col gap-1.5 px-6 pt-12"
              >
                <div className="grid gap-1.5" style={{ gridTemplateColumns: `60px repeat(${displayTimings.length}, minmax(0, 1fr))` }}>
                  <div className="flex items-center justify-center opacity-20">
                    <Clock size={16} className="text-theme-text" />
                  </div>
                  {displayTimings.map(time => (
                    <div key={time} className="flex flex-col items-center justify-center py-2 rounded-xl bg-theme-surface border border-theme-border shadow-sm">
                      <span className="text-theme-text text-[10px] font-black tabular-nums tracking-tighter leading-none" style={{ fontFamily: 'var(--font-montserrat)' }}>
                        {time.split('-')[0].trim()}
                      </span>
                      <div className="h-[1.5px] w-2 bg-theme-border my-0.5 rounded-full" />
                      <span className="text-theme-muted text-[9px] font-black tabular-nums tracking-tighter leading-none" style={{ fontFamily: 'var(--font-montserrat)' }}>
                        {time.split('-')[1].trim()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
                  {days.map((day) => (
                    <div key={day} className="grid gap-1.5 flex-1" style={{ gridTemplateColumns: `60px repeat(${displayTimings.length}, minmax(0, 1fr))` }}>
                      <div className="flex flex-col items-center justify-center rounded-xl bg-theme-surface border border-theme-border shadow-sm">
                        <span className="text-theme-text text-xl font-black leading-none" style={{ fontFamily: 'var(--font-montserrat)' }}>{day}</span>
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
                className="h-full flex flex-col"
              >
                <div className="flex-[1.8] flex flex-col justify-center px-12 pt-24">
                  <div className="flex items-center gap-4 mb-6 h-6">
                    {activeHeroTime && (
                      <span className="text-theme-highlight font-black text-sm uppercase tracking-[0.5em]" style={{ fontFamily: 'var(--font-montserrat)' }}>
                        {activeHeroTime}
                      </span>
                    )}
                  </div>

                  <div className="max-w-5xl">
                    <h1 
                      className="text-6xl font-black lowercase tracking-[-0.06em] leading-[0.85] text-theme-text mb-10" 
                      style={{ fontFamily: 'var(--font-montserrat)' }}
                    >
                      {activeHeroSlot ? activeHeroSlot.name : "chill out."}
                    </h1>
                    
                    <div className="flex items-center gap-12">
                      <div className="flex flex-col">
                        <span className="text-theme-muted text-[10px] font-bold uppercase tracking-[0.4em] mb-2" style={{ fontFamily: 'var(--font-afacad)' }}>location</span>
                        <span className="text-2xl font-black uppercase text-theme-highlight" style={{ fontFamily: 'var(--font-montserrat)' }}>
                          {activeHeroSlot?.room || "Anywhere"}
                        </span>
                      </div>
                      <div className="w-[1px] h-12 bg-theme-border" />
                      <div className="flex flex-col">
                        <span className="text-theme-muted text-[10px] font-bold uppercase tracking-[0.4em] mb-2" style={{ fontFamily: 'var(--font-afacad)' }}>faculty</span>
                        <span className="text-2xl font-black lowercase text-theme-text opacity-70" style={{ fontFamily: 'var(--font-montserrat)' }}>
                          {activeHeroSlot?.faculty?.split('(')[0].trim() || "Nobody"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col mt-auto pb-16">
                  <div className="px-12 mb-4 flex justify-end">
                    <div className="flex gap-1 bg-theme-surface/30 p-1 rounded-[18px]">
                      {days.map(d => (
                        <button
                          key={d}
                          onClick={() => { setSelectedDay(d); setPreviewTime(null); }}
                          className={`w-9 h-9 flex items-center justify-center rounded-[14px] text-xs font-black transition-all ${selectedDay === d ? 'bg-theme-emphasis text-theme-bg' : 'text-theme-muted hover:text-theme-text'}`}
                          style={{ fontFamily: 'var(--font-montserrat)' }}
                        >
                          {d}
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

        <div className="absolute bottom-10 right-12 pointer-events-none z-30 text-right">
          <h1 className="text-theme-text font-regular lowercase leading-none select-none opacity-80" style={{ fontFamily: 'var(--font-afacad)', fontSize: '55px', letterSpacing: '-4px' }}>timetable</h1>
        </div>

        <div className="px-8 py-6 flex items-center justify-between z-20 bg-gradient-to-t from-theme-bg via-theme-bg/95 to-transparent mt-auto">
          <div className="flex items-center gap-6">
            <div className="flex bg-theme-surface p-1 rounded-2xl border border-theme-border shadow-sm">
              <button 
                onClick={() => setView("default")}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === "default" ? 'bg-theme-emphasis text-theme-bg shadow-md' : 'text-theme-muted hover:text-theme-text'}`}
                style={{ fontFamily: 'var(--font-montserrat)' }}
              >
                <List size={14} />
                default
              </button>
              <button 
                onClick={() => setView("full")}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === "full" ? 'bg-theme-emphasis text-theme-bg shadow-md' : 'text-theme-muted hover:text-theme-text'}`}
                style={{ fontFamily: 'var(--font-montserrat)' }}
              >
                <LayoutGrid size={14} />
                full
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-8 pr-[200px]">
            {extraTimeSlots.length > 0 && view === "full" && (
              <button 
                onClick={() => setShowExtra(!showExtra)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-theme-surface border border-theme-border text-theme-muted hover:text-theme-text transition-all group shadow-sm"
              >
                {showExtra ? <ChevronRight size={14} /> : <Plus size={14} className="group-hover:rotate-90 transition-transform" />}
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>
                  {showExtra ? "standard" : `${extraTimeSlots.length} more`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      <DesktopSidebar />
    </div>
  );
}
