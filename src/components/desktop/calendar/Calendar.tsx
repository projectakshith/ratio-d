"use client";
import React, { useState, useMemo } from "react";
import { ReactLenis } from "lenis/react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, Target } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getCalendarGrid, getCalendarDisplay } from "@/utils/dashboard/calendarLogic";
import calendarDataJson from "@/data/calendar_data.json";
import { CalendarEvent, CalendarSlot } from "@/types";
import { Haptics } from "@/utils/shared/haptics";

const DayCell = ({ slot, onClick }: { slot: CalendarSlot & { event?: CalendarEvent }, onClick: () => void }) => {
  if (slot.type === "padding") {
    return <div className="aspect-square rounded-[22px] bg-theme-surface/5 opacity-10 border border-transparent" />;
  }

  const isHoliday = slot.isDayHoliday;
  const isExam = slot.isDayExam;
  const isToday = slot.isToday;
  const isSelected = slot.isSelected;

  let bgClass = "bg-transparent";
  let borderClass = "border-transparent";
  let dateColor = "text-theme-text";
  let orderColor = "text-theme-muted";

  if (isSelected) {
    bgClass = isExam
      ? "bg-theme-accent"
      : isHoliday
        ? "bg-theme-secondary"
        : "bg-theme-highlight";
    dateColor = "text-theme-bg font-black";
    orderColor = "text-[color:color-mix(in_srgb,var(--theme-bg)_70%,transparent)]";
    borderClass = "border-transparent shadow-lg z-10 scale-105";
  } else if (isToday) {
    borderClass = "border-theme-highlight border-[2.5px]";
    bgClass = "bg-[color:color-mix(in_srgb,var(--theme-highlight)_10%,transparent)]";
    dateColor = "text-theme-text font-black";
    orderColor = "text-theme-muted";
  } else if (isExam) {
    bgClass = "bg-[color:color-mix(in_srgb,var(--theme-accent)_15%,transparent)]";
    borderClass = "border-theme-accent border-[1.5px]";
    dateColor = "text-theme-accent font-black";
    orderColor = "text-theme-accent";
  } else if (isHoliday) {
    bgClass = "bg-[color:color-mix(in_srgb,var(--theme-secondary)_15%,transparent)]";
    borderClass = "border-theme-secondary border-[1.5px]";
    dateColor = "text-theme-secondary font-black";
    orderColor = "text-theme-secondary";
  } else {
    bgClass = "bg-theme-surface";
    borderClass = "border-theme-border border-[1.5px]";
    dateColor = "text-theme-text";
    orderColor = "text-theme-muted font-bold";
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`aspect-square rounded-[22px] p-2.5 cursor-pointer transition-all duration-300 relative group flex flex-col justify-between ${bgClass} ${borderClass} ${slot.isPast && !isSelected && !isToday ? "opacity-40" : ""}`}
    >
      <span className={`absolute bottom-1 right-1 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${orderColor} ${!slot.dayOrder && "opacity-20"}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
        DO {slot.dayOrder || "-"}
      </span>

      <div className="flex justify-between items-start">
        <span className={`text-xl font-black tracking-tighter ${dateColor}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
          {slot.day}
        </span>
      </div>

      <div className="flex gap-1 mt-auto">
        {isHoliday && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-theme-bg" : "bg-theme-secondary"}`} />}
        {isExam && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-theme-bg" : "bg-theme-accent"}`} />}
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

  const dayOrderString = useMemo(() => {
    const order = selectedEvent?.order;
    if (order && order !== "-" && order !== "") {
      return `day order ${!isNaN(Number(order)) ? order.padStart(2, '0') : order}`;
    }
    return "day order -";
  }, [selectedEvent]);

  const detailItems = useMemo(() => {
    const items: { title: string, content: string }[] = [];
    const fullDesc = selectedEvent?.description || "";
    
    if (!fullDesc) {
      const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6;
      if (isWeekend) {
        items.push({ title: "weekend", content: "chill out. nothing to see here." });
      } else if (selectedEvent?.order && selectedEvent.order !== "-") {
        items.push({ title: "classes", content: "regular schedule. don't be late." });
      } else {
        items.push({ title: "free", content: "nothing here. go back to sleep." });
      }
      return items;
    }

    const segments = fullDesc.split('/').map(s => s.trim()).filter(Boolean);
    segments.forEach(seg => {
      if (seg.includes(":")) {
        const [t, ...c] = seg.split(":");
        items.push({ title: t.trim(), content: c.join(":").trim() });
      } else {
        items.push({ title: seg, content: "scheduled event" });
      }
    });

    return items;
  }, [selectedEvent, selectedDate]);

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
    Haptics.selection();
  };

  return (
    <div className="h-full w-full flex flex-row overflow-hidden relative items-stretch">
      <div className="flex-[1.4] flex flex-col border-r border-theme-border min-h-0">
        <header className="px-10 pt-6 pb-3">
          <p className="text-theme-muted text-[10px] font-black uppercase tracking-[0.4em] mb-1" style={{ fontFamily: 'var(--font-montserrat)' }}>academic calendar</p>
          <div className="flex items-center justify-between w-full pr-2">
            <div className="flex items-baseline gap-4">
              <h1 className="text-theme-text text-4xl font-black tracking-tighter lowercase" style={{ fontFamily: 'var(--font-montserrat)' }}>
                {currentDate.toLocaleString('en-US', { month: 'long' }).toLowerCase()} <span className="text-theme-muted font-light">{currentDate.getFullYear()}</span>
              </h1>
              <div className="flex gap-1.5 mb-1">
                <button onClick={prevMonth} className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text transition-colors"><ChevronLeft size={16} /></button>
                <button onClick={nextMonth} className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text transition-colors"><ChevronRight size={16} /></button>
              </div>
            </div>
            <button 
              onClick={goToToday}
              className="p-2.5 rounded-2xl bg-theme-surface border border-theme-border text-theme-muted hover:text-theme-text transition-all shadow-sm active:scale-95"
              title="Today"
            >
              <Target size={18} />
            </button>
          </div>
        </header>

        <div className="px-10 py-2.5 grid grid-cols-7 gap-3 border-y border-theme-border bg-theme-surface/10">
          {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(d => (
            <span key={d} className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-theme-muted" style={{ fontFamily: 'var(--font-montserrat)' }}>{d}</span>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-10 pb-10 pt-4 flex items-start justify-center">
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

      <div className="flex-1 bg-theme-surface/20 flex flex-col p-12 relative overflow-y-auto overflow-x-hidden no-scrollbar">
        <div className="mb-2 shrink-0">
          <div className="flex items-baseline gap-4 mb-2">
            <h2 className="text-[120px] font-black tracking-tighter leading-none text-theme-text" style={{ fontFamily: 'var(--font-montserrat)' }}>
              {String(selectedDate.getDate()).padStart(2, '0')}
            </h2>
            <span className="text-4xl font-black text-theme-muted tracking-tight lowercase" style={{ fontFamily: 'var(--font-montserrat)' }}>
              {selectedDate.toLocaleString('en-US', { weekday: 'long' }).toLowerCase()}
            </span>
          </div>
        </div>

        <div className="mb-8 shrink-0">
          <div className="w-full h-px bg-theme-text opacity-5 mb-6" />
          <p className="text-theme-muted text-[11px] font-bold uppercase tracking-[0.4em] mb-2" style={{ fontFamily: 'var(--font-afacad)' }}>day info</p>
          <h3 className="text-3xl font-black text-theme-text tracking-tight lowercase" style={{ fontFamily: 'var(--font-montserrat)' }}>
            {dayOrderString}
          </h3>
        </div>

        <div className="relative z-20 w-full h-fit pb-10">
          <div className="p-8 rounded-[40px] bg-theme-surface/40 border border-theme-border backdrop-blur-md flex flex-col shadow-sm">
            <div className="flex items-center gap-4 mb-8 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-theme-highlight/10 flex items-center justify-center">
                <Info size={20} className="text-theme-highlight" />
              </div>
              <span className="text-theme-muted text-[10px] font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>details</span>
            </div>
            
            <div className="flex flex-col gap-6">
              {detailItems.map((item, i) => (
                <div key={i} className="flex flex-col gap-1 relative">
                  {i > 0 && (
                    <div className="w-full h-px bg-theme-text opacity-5 mb-4" />
                  )}
                  {item.title && (
                    <span className="text-xl font-black lowercase tracking-tight text-theme-text leading-tight" style={{ fontFamily: 'var(--font-montserrat)' }}>
                      {item.title}
                    </span>
                  )}
                  {item.content && (
                    <p className="text-[15px] font-medium text-theme-text opacity-50 lowercase tracking-tight leading-snug" style={{ fontFamily: 'var(--font-afacad)' }}>
                      {item.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute -bottom-16 -right-16 text-right opacity-[0.02] z-0 pointer-events-none rotate-12">
          <CalendarIcon size={320} />
        </div>
      </div>

      <div className="absolute bottom-8 right-8 pointer-events-none z-[60] text-right">
        <h1 className="text-theme-text font-regular lowercase leading-none select-none opacity-80" style={{ fontFamily: 'var(--font-afacad)', fontSize: '42px', letterSpacing: '-3px' }}>calendar</h1>
      </div>
    </div>
  );
}
