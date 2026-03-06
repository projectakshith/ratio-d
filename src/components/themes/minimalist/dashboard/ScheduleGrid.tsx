"use client";
import React from "react";

interface ScheduleGridProps {
  displayGrid: any[];
  isDark: boolean;
  selectedDay: number;
  currentDayOrder: number;
  isHoliday: boolean;
}

export default function ScheduleGrid({
  displayGrid,
  isDark,
  selectedDay,
  currentDayOrder,
  isHoliday,
}: ScheduleGridProps) {
  const renderSlot = (slot: any, index: number) => {
    if (!slot.active) {
      return (
        <div
          key={slot.id}
          className={`aspect-square ${isDark ? "bg-white/5" : "bg-[#EFEFEF]/50"} custom-dotted`}
        />
      );
    }

    let boxClass = isDark
      ? "bg-white/5 border-white/10"
      : "bg-white border-[#111111]/20";
    let topText = isDark ? "text-white/40" : "text-[#111111]/50";
    let midText = isDark ? "text-white" : "text-[#111111]";
    let botText = isDark ? "text-white/60" : "text-[#111111]/70";

    const isActuallyCurrent =
      slot.isCurrent &&
      String(selectedDay) === String(currentDayOrder) &&
      !isHoliday;

    if (isActuallyCurrent) {
      boxClass = isDark
        ? "bg-white border-white shadow-[0_6px_16px_rgba(255,255,255,0.2)] scale-105 z-10"
        : "bg-[#111111] border-[#111111] shadow-[0_6px_16px_rgba(0,0,0,0.2)] scale-105 z-10";
      topText = isDark ? "text-black/60" : "text-white/80";
      midText = isDark ? "text-black" : "text-white";
      botText = isDark ? "text-black/60" : "text-white/80";
    } else if (slot.isPractical) {
      boxClass = isDark
        ? "bg-[#0ea5e9]/10 border-[#0ea5e9]/30"
        : "bg-[#e0f2fe]/60 border-[#0EA5E9]/20";
      topText = isDark ? "text-[#0ea5e9]/60" : "text-[#0ea5e9]/70";
      midText = isDark ? "text-[#0ea5e9]" : "text-[#0ea5e9]";
      botText = isDark ? "text-[#0ea5e9]/60" : "text-[#0ea5e9]/70";
    }

    return (
      <div
        key={`${slot.id}-${index}`}
        className={`aspect-square rounded-[14px] border-[1.5px] flex flex-col items-center justify-center gap-[4px] p-1 transition-all ${boxClass}`}
      >
        <span
          className={`text-[10px] font-bold uppercase tracking-widest leading-none text-center ${topText}`}
          style={{ fontFamily: "'Afacad', sans-serif" }}
        >
          {slot.room}
        </span>
        <span
          className={`text-[17px] font-black uppercase tracking-wider leading-none ${midText}`}
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {slot.sub}
        </span>
        <span
          className={`text-[10.5px] font-bold tracking-tight leading-none text-center ${botText}`}
          style={{ fontFamily: "'Afacad', sans-serif" }}
        >
          {slot.time}
        </span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-5 gap-[8px] mb-8 shrink-0 transition-all">
      {displayGrid.map((slot, i) => renderSlot(slot, i))}
    </div>
  );
}
