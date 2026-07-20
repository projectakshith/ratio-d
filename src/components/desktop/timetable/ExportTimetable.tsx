"use client";
import React, { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { buildCourseMap, processSchedule, parseTimetableTime } from "@/utils/dashboard/timetableLogic";
import { Clock } from "lucide-react";

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
    <div
      className={`h-full w-full p-2.5 rounded-xl border-[1.5px] transition-all duration-300 flex flex-col justify-between overflow-hidden ${
        isLab 
          ? "bg-[#0EA5E9]/5 border-[#0EA5E9]/30" 
          : "bg-theme-card border-theme-border shadow-sm"
      }`}
    >
      <div className="flex flex-col gap-0.5">
        <h3 
          className={`text-[12px] font-black uppercase tracking-tight leading-[1.1] line-clamp-2 ${isLab ? "text-[#0EA5E9]" : "text-theme-text"}`} 
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          {slot.name}
        </h3>
        <p className={`text-[9px] font-bold opacity-60 truncate ${isLab ? "text-[#0EA5E9]" : "text-theme-muted"}`} style={{ fontFamily: 'var(--font-afacad)' }}>
          {slot.faculty}
        </p>
      </div>
      
      <div className="flex flex-col mt-0.5">
        <span className={`text-[10px] font-black uppercase text-theme-muted/60`} style={{ fontFamily: 'var(--font-afacad)' }}>
          {slot.room}
        </span>
      </div>
    </div>
  );
};

export default function ExportTimetable() {
  const { userData } = useApp();

  const scheduleData = useMemo(() => 
    userData?.timetable || userData?.schedule || {}, 
    [userData]
  );

  const courseMap = useMemo(() => 
    buildCourseMap(userData), 
    [userData]
  );

  const { days, displayTimings, gridData } = useMemo(() => {
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

    const grid: Record<number, Record<string, any>> = {};
    dayOrders.forEach(day => {
      grid[day] = {};
      sortedTimeSlots.forEach(time => {
        const slot = slotsByDay[day - 1].find(s => s.time === time);
        grid[day][time] = slot || null;
      });
    });

    return { days: dayOrders, displayTimings: standardTimes, gridData: grid };
  }, [scheduleData, courseMap]);

  return (
    <div className="h-full w-full flex flex-col bg-theme-bg overflow-hidden relative" style={{ WebkitTextSizeAdjust: 'none' }}>
      <div className="flex-1 relative min-h-0 bg-theme-bg overflow-hidden">
        <div className="absolute inset-0 flex flex-col gap-2 px-6 pt-10 pb-20 min-h-0 overflow-hidden">
          {/* Time Header Bar */}
          <div className="grid gap-2 shrink-0" style={{ gridTemplateColumns: `60px repeat(${displayTimings.length}, minmax(0, 1fr))` }}>
            <div className="flex items-center justify-center opacity-20">
              <Clock size={16} className="text-theme-text" />
            </div>
            {displayTimings.map(time => (
              <div key={time} className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-theme-surface border border-theme-border shadow-sm">
                <span className="text-theme-text text-[12px] font-black tabular-nums tracking-tighter leading-none" style={{ fontFamily: 'var(--font-montserrat)' }}>
                  {time.split('-')[0].trim()}
                </span>
                <div className="h-[1px] w-2 bg-theme-border my-1 rounded-full" />
                <span className="text-theme-muted text-[10px] font-bold tabular-nums tracking-tighter leading-none" style={{ fontFamily: 'var(--font-montserrat)' }}>
                  {time.split('-')[1].trim()}
                </span>
              </div>
            ))}
          </div>

          {/* Grid Rows */}
          <div className="flex-1 grid gap-2 min-h-0">
            {days.map(day => (
              <div key={day} className="grid gap-2 min-h-0" style={{ gridTemplateColumns: `60px repeat(${displayTimings.length}, minmax(0, 1fr))` }}>
                {/* Day Header (Clean & Uniform across all days) */}
                <div className="flex flex-col items-center justify-center rounded-xl bg-theme-surface border border-theme-border shadow-sm">
                  <span className="text-xl font-black leading-none text-theme-text" style={{ fontFamily: 'var(--font-montserrat)' }}>
                    {day}
                  </span>
                </div>
                {/* Slots */}
                {displayTimings.map(time => (
                  <div key={time} className="h-full min-h-0">
                    <CompactSlot slot={gridData[day][time]} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prominent ratio'd logo & URL at Bottom Left */}
      <div className="absolute bottom-6 left-8 pointer-events-none z-10 select-none flex flex-col gap-0">
        <span className="text-theme-text opacity-60 tracking-tight leading-none" style={{ fontFamily: 'var(--font-urbanosta)', fontSize: '32px' }}>
          ratio'd
        </span>
        <span className="text-theme-muted opacity-50 text-[10px] font-bold tracking-widest lowercase leading-none mt-[-4px]" style={{ fontFamily: 'var(--font-montserrat)' }}>
          www.getratiod.lol
        </span>
      </div>

      {/* Watermark timetable text at Bottom Right */}
      <div className="absolute bottom-6 right-8 pointer-events-none z-0 text-right select-none">
        <h1 className="text-theme-text font-regular lowercase leading-none opacity-80" style={{ fontFamily: 'var(--font-afacad)', fontSize: '48px', letterSpacing: '-4px' }}>
          timetable
        </h1>
      </div>
    </div>
  );
}
