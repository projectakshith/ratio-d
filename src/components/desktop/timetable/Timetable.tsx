"use client";
import React, { useMemo } from "react";
import DesktopSidebar from "../DesktopSidebar";
import { ReactLenis } from "lenis/react";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { buildCourseMap, processSchedule } from "@/utils/dashboard/timetableLogic";

const SlotCard = ({ slot }: { slot: any }) => {
  if (slot.type === "break") {
    return (
      <div className="py-2 px-4 flex items-center gap-3 opacity-30">
        <div className="flex-1 h-[1px] bg-theme-border border-dashed border-t" />
        <span className="text-[7px] font-black uppercase tracking-[0.3em] whitespace-nowrap" style={{ fontFamily: 'var(--font-montserrat)' }}>
          {slot.title}
        </span>
        <div className="flex-1 h-[1px] bg-theme-border border-dashed border-t" />
      </div>
    );
  }

  const isLab = slot.type === "lab" || slot.slot?.includes("P");
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group p-5 rounded-[24px] border-[1.5px] transition-all duration-300 relative overflow-hidden ${
        isLab 
          ? "bg-[#0EA5E9]/5 border-[#0EA5E9]/20 hover:bg-[#0EA5E9]/10" 
          : "bg-theme-surface/40 border-theme-border hover:bg-theme-surface/60 hover:border-theme-text/20"
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[9px] font-black uppercase tracking-widest ${isLab ? "text-[#0EA5E9]/60" : "text-theme-muted"}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
          {slot.time || "00:00 - 00:00"}
        </span>
        <span className={`text-[8px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-md ${isLab ? "bg-[#0EA5E9]/20 text-[#0EA5E9]" : "bg-theme-text/5 text-theme-muted"}`} style={{ fontFamily: 'var(--font-afacad)' }}>
          {slot.room || "TBA"}
        </span>
      </div>
      <h3 className={`text-[14px] font-black uppercase tracking-tight leading-tight mb-2 line-clamp-2 ${isLab ? "text-[#0EA5E9]" : "text-theme-text"}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
        {slot.name || "Unknown"}
      </h3>
      <div className="flex items-center justify-between mt-4">
        <span className={`text-[10px] font-bold lowercase tracking-tight truncate max-w-[120px] ${isLab ? "text-[#0EA5E9]/60" : "text-theme-muted"}`} style={{ fontFamily: 'var(--font-afacad)' }}>
          {slot.faculty || "Staff Name"}
        </span>
        <span className={`text-[8px] font-black uppercase tracking-widest opacity-30 ${isLab ? "text-[#0EA5E9]" : "text-theme-text"}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
          {slot.slot || ""}
        </span>
      </div>
    </motion.div>
  );
};

export default function DesktopTimetable() {
  const { userData } = useApp();
  
  const scheduleData = useMemo(() => 
    userData?.timetable || userData?.schedule || {}, 
    [userData]
  );

  const courseMap = useMemo(() => 
    buildCourseMap(userData), 
    [userData]
  );

  const processedTimetable = useMemo(() => {
    const days = [1, 2, 3, 4, 5];
    return days.map(day => {
      const daySlots = processSchedule(scheduleData, {}, day, 0, courseMap);
      return {
        day,
        slots: daySlots
      };
    });
  }, [scheduleData, courseMap]);

  return (
    <div 
      className="h-screen w-full flex flex-row p-1.5 font-sans overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: 'color-mix(in srgb, var(--theme-bg), black 12%)' }}
    >
      <div className="flex-1 bg-theme-bg rounded-[24px] relative overflow-hidden flex flex-col border border-theme-border shadow-xl">
        
        <header className="px-12 pt-12 pb-6 flex justify-between items-end z-20">
          <div>
            <p className="text-theme-muted text-[10px] font-black uppercase tracking-[0.4em] mb-1" style={{ fontFamily: 'var(--font-montserrat)' }}>weekly schedule</p>
            <h1 className="text-theme-text text-5xl font-black tracking-tighter lowercase opacity-20" style={{ fontFamily: 'var(--font-montserrat)' }}>timetable</h1>
          </div>
          <div className="flex gap-8 items-center">
            <div className="flex flex-col items-end">
              <span className="text-theme-muted text-[9px] font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-afacad)' }}>total classes</span>
              <span className="text-theme-text text-xl font-black" style={{ fontFamily: 'var(--font-montserrat)' }}>
                {processedTimetable.reduce((acc, day) => acc + day.slots.filter(s => s.type !== 'break').length, 0)}
              </span>
            </div>
          </div>
        </header>

        <ReactLenis className="flex-1 overflow-y-auto no-scrollbar pt-4 pb-48 px-12">
          <div className="grid grid-cols-5 gap-8 min-w-[1200px]">
            {processedTimetable.map((dayData) => (
              <div key={dayData.day} className="flex flex-col gap-6">
                <div className="flex items-center gap-3 px-2 mb-2">
                  <span className="text-theme-text text-[11px] font-black uppercase tracking-[0.3em]" style={{ fontFamily: 'var(--font-montserrat)' }}>Day {dayData.day}</span>
                  <div className="flex-1 h-[1px] bg-theme-border opacity-50" />
                </div>
                
                <div className="flex flex-col gap-4">
                  {dayData.slots.length > 0 ? (
                    dayData.slots.map((slot: any, idx: number) => (
                      <SlotCard key={`${dayData.day}-${idx}`} slot={slot} />
                    ))
                  ) : (
                    <div className="h-32 rounded-[24px] border-[1.5px] border-dashed border-theme-border flex items-center justify-center">
                      <span className="text-theme-muted text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-afacad)' }}>no classes</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ReactLenis>

        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none bg-gradient-to-t from-theme-bg via-theme-bg/80 to-transparent z-10" />
        
        <div className="absolute bottom-10 left-10 pointer-events-none z-30 opacity-20">
          <h1 className="text-2xl font-black tracking-tighter lowercase text-theme-text" style={{ fontFamily: 'var(--font-urbanosta)' }}>
            ratio'd
          </h1>
        </div>

        <div className="absolute bottom-10 right-12 pointer-events-none z-30 text-right">
          <h1 className="text-theme-text font-regular lowercase leading-none select-none opacity-80" style={{ fontFamily: 'var(--font-afacad)', fontSize: '55px', letterSpacing: '-4px' }}>timetable</h1>
        </div>
      </div>

      <DesktopSidebar />
    </div>
  );
}
