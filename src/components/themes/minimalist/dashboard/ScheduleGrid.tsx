"use client";
import React from "react";

interface ScheduleGridProps {
  displayGrid: any[];
  selectedDay: number;
  currentDayOrder: number;
  isHoliday: boolean;
}

export default function ScheduleGrid({
  displayGrid,
  selectedDay,
  currentDayOrder,
  isHoliday,
}: ScheduleGridProps) {
  const renderSlot = (slot: any, index: number) => {
    if (!slot.active) {
      return (
        <div
          key={slot.id}
          className="aspect-square bg-theme-text-[0.03] rounded-[14px] border border-theme-text-[0.05] flex items-center justify-center opacity-40"
        />
      );
    }

    let boxClass = "bg-theme-surface border-theme-border";
    let topText = "text-theme-muted";
    let midText = "text-theme-text";
    let botText = "text-theme-muted";

    const isActuallyCurrent =
      slot.isCurrent &&
      String(selectedDay) === String(currentDayOrder) &&
      !isHoliday;

    if (isActuallyCurrent) {
      boxClass = "bg-theme-highlight border-theme-highlight shadow-[0_0_15px_var(--theme-highlight)] scale-105 z-10 opacity-100";
      topText = "text-theme-bg opacity-70";
      midText = "text-theme-bg font-black";
      botText = "text-theme-bg opacity-70";
    } else if (slot.isPractical) {
      boxClass = "bg-theme-primary/10 border-theme-primary/30";
      topText = "text-theme-primary/60";
      midText = "text-theme-primary";
      botText = "text-theme-primary/60";
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
