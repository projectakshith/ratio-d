"use client";
import React, { useState, useMemo } from "react";
import { ReactLenis } from "lenis/react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getCalendarGrid, getCalendarDisplay } from "@/utils/dashboard/calendarLogic";
import calendarDataJson from "@/data/calendar_data.json";
import { CalendarEvent, CalendarSlot } from "@/types";

const DayCell = ({ slot, onClick }: { slot: CalendarSlot & { event?: CalendarEvent }, onClick: () => void }) => {
  if (slot.type === "padding") {
    return <div className="aspect-square rounded-[22px] bg-theme-surface/5 opacity-10 border border-transparent" />;
  }

  const isHoliday = slot.isDayHoliday;
  const isExam = slot.isDayExam;
  const isToday = slot.isToday;
  const isSelected = slot.isSelected;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`aspect-square rounded-[22px] p-2.5 border-[1.5px] cursor-pointer transition-all duration-300 relative group flex flex-col justify-between ${
        isSelected
          ? "bg-theme-text border-theme-text shadow-lg z-10"
          : isToday
          ? "bg-theme-surface border-theme-highlight"
          : isHoliday
          ? "bg-[#FF4D4D]/5 border-[#FF4D4D]/20 hover:bg-[#FF4D4D]/10"
          : isExam
          ? "bg-theme-emphasis/5 border-theme-emphasis/20 hover:bg-theme-emphasis/10"
          : "bg-theme-surface/40 border-theme-border hover:bg-theme-surface/60"
      }`}
    >
      <span className={`absolute bottom-1 right-1 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${
        isSelected ? "bg-theme-bg/20 text-theme-bg" : "bg-theme-text/5 text-theme-muted"
      } ${!slot.dayOrder && "opacity-20"}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
        DO {slot.dayOrder || "-"}
      </span>

      <div className="flex justify-between items-start">
        <span className={`text-xl font-black tracking-tighter ${isSelected ? "text-theme-bg" : "text-theme-text"}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
          {slot.day}
        </span>
      </div>

      <div className="flex gap-1 mt-auto">
        {isHoliday && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-theme-bg" : "bg-[#FF4D4D]"}`} />}
        {isExam && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-theme-bg" : "bg-theme-emphasis"}`} />}
        {slot.event?.description && !isHoliday && !isExam && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-theme-bg" : "bg-theme-muted"}`} />}
      </div>
    </motion.div>
  );
};

export default function DesktopCalendar() {
  const { userData } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const calendarData = useMemo(() => {
    const calData = userData?.calendarData;
    const raw = (calData && calData.length > 0) ? calData : (calendarDataJson as any[] || []);
    const map: Record<string, CalendarEvent> = {};
    (raw as CalendarEvent[]).forEach((item) => {
      if (item.date) {
        const d = new Date(item.date);
        map[d.toDateString()] = item;
      }
    });
    return map;
  }, [userData]);

  const monthGrid = useMemo(() => {
    return getCalendarGrid(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      calendarData,
      selectedDate,
      new Date(new Date().setHours(0, 0, 0, 0))
    );
  }, [currentDate, selectedDate, calendarData]);

  const selectedEvent = calendarData[selectedDate.toDateString()];
  const displayInfo = getCalendarDisplay(
    selectedDate,
    selectedEvent?.type === "exam",
    !!selectedEvent?.order && selectedEvent.order !== "-",
    selectedEvent?.description?.toLowerCase().includes("holiday"),
    selectedEvent
  );

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  return (
    <div className="h-full w-full flex flex-row overflow-hidden relative items-stretch">
      <div className="flex-[1.4] flex flex-col border-r border-theme-border min-h-0">
        <header className="px-10 pt-6 pb-3">
          <p className="text-theme-muted text-[10px] font-black uppercase tracking-[0.4em] mb-1" style={{ fontFamily: 'var(--font-montserrat)' }}>academic calendar</p>
          <div className="flex items-baseline gap-4">
            <h1 className="text-theme-text text-4xl font-black tracking-tighter lowercase" style={{ fontFamily: 'var(--font-montserrat)' }}>
              {currentDate.toLocaleString('en-US', { month: 'long' }).toLowerCase()} <span className="text-theme-muted font-light">{currentDate.getFullYear()}</span>
            </h1>
            <div className="flex gap-1.5 mb-1">
              <button onClick={prevMonth} className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text transition-colors"><ChevronLeft size={16} /></button>
              <button onClick={nextMonth} className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text transition-colors"><ChevronRight size={16} /></button>
            </div>
          </div>
        </header>

        <div className="px-10 py-2.5 grid grid-cols-7 gap-3 border-y border-theme-border bg-theme-surface/10">
          {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(d => (
            <span key={d} className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-theme-muted" style={{ fontFamily: 'var(--font-montserrat)' }}>{d}</span>
          ))}
        </div>

        <div className="flex-1 overflow-hidden px-10 pb-10 pt-4 flex items-start justify-center">
          <div className="grid grid-cols-7 gap-3 w-full">
            {monthGrid.map((slot: CalendarSlot, idx: number) => (
              <DayCell 
                key={slot.key || idx} 
                slot={{...slot, event: calendarData[slot.dateObj?.toDateString() || ""]}} 
                onClick={() => slot.dateObj && setSelectedDate(slot.dateObj)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-theme-surface/20 flex flex-col p-12 justify-center relative overflow-hidden">
        <div className="absolute top-12 left-12">
          <span className="px-4 py-1.5 rounded-full bg-theme-text text-theme-bg text-[10px] font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>
            {displayInfo.pill}
          </span>
        </div>

        <div className="mb-8">
          <div className="flex items-baseline gap-4 mb-2">
            <h2 className="text-[96px] font-black tracking-tighter leading-none text-theme-text" style={{ fontFamily: 'var(--font-montserrat)' }}>
              {displayInfo.bigText}
            </h2>
            <span className="text-2xl font-black text-theme-muted uppercase tracking-[0.2em]" style={{ fontFamily: 'var(--font-montserrat)' }}>
              {displayInfo.label}
            </span>
          </div>
          <div className="h-1.5 w-20 bg-theme-highlight rounded-full" />
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-theme-muted text-[11px] font-bold uppercase tracking-[0.4em] mb-2" style={{ fontFamily: 'var(--font-afacad)' }}>date info</p>
            <h3 className="text-3xl font-black text-theme-text tracking-tight lowercase" style={{ fontFamily: 'var(--font-montserrat)' }}>
              {displayInfo.infoMain}
            </h3>
          </div>
          
          <div className="p-6 rounded-[32px] bg-theme-surface/50 border border-theme-border backdrop-blur-sm relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-theme-highlight/10 flex items-center justify-center">
                <Info size={20} className="text-theme-highlight" />
              </div>
              <span className="text-theme-muted text-[10px] font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>details</span>
            </div>
            <p className="text-lg font-medium text-theme-text lowercase tracking-tight leading-relaxed" style={{ fontFamily: 'var(--font-afacad)' }}>
              {displayInfo.infoSub}
            </p>
          </div>
        </div>

        <div className="absolute bottom-12 right-12 text-right opacity-[0.03] z-0 pointer-events-none">
          <CalendarIcon size={160} />
        </div>
      </div>

      <div className="absolute bottom-8 right-8 pointer-events-none z-0 text-right">
        <h1 className="text-theme-text font-regular lowercase leading-none select-none opacity-80" style={{ fontFamily: 'var(--font-afacad)', fontSize: '42px', letterSpacing: '-3px' }}>calendar</h1>
      </div>
    </div>
  );
}
