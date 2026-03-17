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
          key={slot.id || index}
          className="aspect-square rounded-[14px] flex items-center justify-center relative border-[1.5px] border-dashed"
          style={{
            borderColor: "color-mix(in srgb, var(--theme-text) 25%, transparent)",
          }}
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
      boxClass = "bg-[#0EA5E9]/10 border-[#0EA5E9]/20";
      topText = "text-[#0EA5E9]/60";
      midText = "text-[#0EA5E9] font-black";
      botText = "text-[#0EA5E9]/60";
    } else if (slot.isCustom) {
      boxClass = "bg-theme-surface border-theme-border";
      topText = "text-theme-muted";
      midText = "text-theme-text font-black";
      botText = "text-theme-muted";
    }

    return (
      <div
        key={`${slot.id}-${index}`}
        className={`aspect-square rounded-[14px] border-[1.5px] flex flex-col items-center justify-center gap-[4px] p-1 transition-all ${boxClass}`}
      >
        <span
          className={`text-[10px] font-bold uppercase tracking-widest leading-none text-center ${topText}`}
          style={{ fontFamily: "var(--font-afacad), sans-serif" }}
        >
          {slot.room}
        </span>
        <span
          className={`text-[17px] font-black uppercase tracking-wider leading-none ${midText}`}
          style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
        >
          {slot.sub}
        </span>
        <span
          className={`text-[10.5px] font-bold tracking-tight leading-none text-center ${botText}`}
          style={{ fontFamily: "var(--font-afacad), sans-serif" }}
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
