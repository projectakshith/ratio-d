"use client";
import React, { useMemo, useState } from "react";
import DesktopSidebar from "../DesktopSidebar";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { buildCourseMap, processSchedule, parseTimetableTime } from "@/utils/dashboard/timetableLogic";
import { Clock, Plus, ChevronRight } from "lucide-react";

const CompactSlot = ({ slot }: { slot: any }) => {
  if (!slot) {
    return (
      <div className="h-full w-full rounded-xl border-2 border-dashed border-theme-border/30 bg-theme-surface/5 transition-colors hover:border-theme-border/50" />
    );
  }

  const isLab = slot.type === "lab" || slot.slot?.includes("P");
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`h-full w-full p-2 rounded-xl border transition-all duration-300 flex flex-col justify-between group overflow-hidden ${
        isLab 
          ? "bg-[#0EA5E9]/5 border-[#0EA5E9]/30" 
          : "bg-theme-card border-theme-border shadow-sm hover:border-theme-text/20"
      }`}
    >
      <div className="flex flex-col gap-0.5">
        <h3 
          className={`text-[8px] font-black uppercase tracking-tight leading-[1.1] line-clamp-2 ${isLab ? "text-[#0EA5E9]" : "text-theme-text"}`} 
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          {slot.name}
        </h3>
        <p className={`text-[7px] font-bold opacity-60 truncate ${isLab ? "text-[#0EA5E9]" : "text-theme-muted"}`} style={{ fontFamily: 'var(--font-afacad)' }}>
          {slot.faculty}
        </p>
      </div>
      
      <div className="flex items-center justify-between mt-1">
        <span className={`text-[7px] font-black uppercase px-1 py-0.5 rounded bg-theme-text/5 text-theme-muted shrink-0`} style={{ fontFamily: 'var(--font-afacad)' }}>
          {slot.room}
        </span>
        <span className={`text-[7px] font-black uppercase opacity-20 ${isLab ? "text-[#0EA5E9]" : "text-theme-text"}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
          {slot.slot}
        </span>
      </div>
    </motion.div>
  );
};

export default function DesktopTimetable() {
  const { userData } = useApp();
  const [showExtra, setShowExtra] = useState(false);
  
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
    // Filter out breaks at the source
    const allSlotsByDay = dayOrders.map(day => 
      processSchedule(scheduleData, {}, day, 0, courseMap).filter(s => s.type !== 'break')
    );
    
    const timeMap = new Map<string, number>();
    allSlotsByDay.forEach(daySlots => {
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
        const slot = allSlotsByDay[day-1].find(s => s.time === time);
        grid[day][time] = slot || null;
      });
    });

    return { days: dayOrders, timeSlots: standardTimes, extraTimeSlots: extraTimes, gridData: grid };
  }, [scheduleData, courseMap]);

  const displayTimings = showExtra ? [...timeSlots, ...extraTimeSlots] : timeSlots;

  return (
    <div className="h-screen w-full flex flex-row p-1 font-sans overflow-hidden bg-transparent">
      <div className="flex-1 bg-theme-bg rounded-[24px] relative overflow-hidden flex flex-col border border-theme-border shadow-xl">
        
        <header className="px-8 pt-6 pb-2 flex justify-between items-center z-20">
          <h1 className="text-theme-text text-xl font-black tracking-tighter lowercase opacity-20" style={{ fontFamily: 'var(--font-montserrat)' }}>weekly schedule</h1>
          
          {extraTimeSlots.length > 0 && (
            <button 
              onClick={() => setShowExtra(!showExtra)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-theme-surface border border-theme-border text-theme-muted hover:text-theme-text transition-all group"
            >
              {showExtra ? <ChevronRight size={12} /> : <Plus size={12} className="group-hover:rotate-90 transition-transform" />}
              <span className="text-[8px] font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>
                {showExtra ? "standard" : `${extraTimeSlots.length} more`}
              </span>
            </button>
          )}
        </header>

        <div className="flex-1 overflow-hidden px-8 pb-20 relative flex flex-col">
          {/* Header Row: Timings */}
          <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: `50px repeat(${displayTimings.length}, 1fr)` }}>
            <div className="flex items-center justify-center">
              <Clock size={12} className="text-theme-muted opacity-30" />
            </div>
            {displayTimings.map(time => (
              <div key={time} className="flex flex-col items-center justify-center py-1.5 rounded-lg bg-theme-surface/30 border border-theme-border/40">
                <span className="text-theme-text text-[7px] font-black tabular-nums tracking-tighter" style={{ fontFamily: 'var(--font-afacad)' }}>
                  {time.split('-')[0].trim()}
                </span>
                <div className="h-[1px] w-2 bg-theme-border/50 my-0.5" />
                <span className="text-theme-muted text-[7px] font-bold tabular-nums tracking-tighter" style={{ fontFamily: 'var(--font-afacad)' }}>
                  {time.split('-')[1].trim()}
                </span>
              </div>
            ))}
          </div>

          {/* Timetable Rows: Days */}
          <div className="flex-1 flex flex-col gap-2 mb-4">
            {days.map((day) => (
              <div key={day} className="grid gap-2 flex-1" style={{ gridTemplateColumns: `50px repeat(${displayTimings.length}, 1fr)` }}>
                <div className="flex flex-col items-center justify-center rounded-xl bg-theme-surface/50 border border-theme-border shadow-sm">
                  <span className="text-theme-muted text-[6px] font-black uppercase tracking-tighter opacity-60" style={{ fontFamily: 'var(--font-montserrat)' }}>Day</span>
                  <span className="text-theme-text text-base font-black leading-none" style={{ fontFamily: 'var(--font-montserrat)' }}>{day}</span>
                </div>
                {displayTimings.map(time => (
                  <div key={`${day}-${time}`} className="relative h-full">
                    <CompactSlot slot={gridData[day][time]} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Branding & Labels */}
        <div className="absolute bottom-8 left-8 pointer-events-none z-30 opacity-10">
          <h1 className="text-lg font-black tracking-tighter lowercase text-theme-text" style={{ fontFamily: 'var(--font-urbanosta)' }}>ratio'd</h1>
        </div>

        <div className="absolute bottom-6 right-10 pointer-events-none z-30 text-right">
          <h1 className="text-theme-text font-regular lowercase leading-none select-none opacity-80" style={{ fontFamily: 'var(--font-afacad)', fontSize: '55px', letterSpacing: '-4px' }}>timetable</h1>
        </div>
      </div>

      <DesktopSidebar />
    </div>
  );
}
