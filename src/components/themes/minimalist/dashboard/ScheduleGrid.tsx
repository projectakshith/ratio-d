"use client";
import React from "react";
import { motion } from "framer-motion";

interface ScheduleGridProps {
  displayGrid: any[];
  selectedDay: number;
  currentDayOrder: number;
  isHoliday: boolean;
}

const BEZIER = [0.34, 0.15, 0.16, 0.96];

const gridVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.02,
      delayChildren: 0.01,
    },
  },
};

const slotVariants = {
  hidden: { opacity: 0, y: -15, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      y: { duration: 0.35, ease: BEZIER },
      scale: { duration: 0.3, ease: BEZIER },
      opacity: { duration: 0.25, ease: "easeOut" },
    },
  },
};

export default function ScheduleGrid({
  displayGrid,
  selectedDay,
  currentDayOrder,
  isHoliday,
}: ScheduleGridProps) {
  const renderSlot = (slot: any, index: number) => {
    if (!slot.active) {
      return (
        <motion.div
          key={slot.id || index}
          variants={slotVariants}
          className="aspect-square rounded-[14px] flex items-center justify-center relative border-[1.5px] border-dashed"
          style={{
            borderColor: "color-mix(in srgb, var(--theme-text) 30%, transparent)",
            borderDasharray: "6 10"
          } as any}
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
      boxClass = "status-boxbg-safe status-border-safe shadow-md scale-105 z-10 opacity-100 backdrop-blur-sm";
      topText = "status-text-safe opacity-70";
      midText = "status-text-safe font-black";
      botText = "status-text-safe opacity-70";
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
      <motion.div
        key={`${slot.id}-${index}`}
        variants={slotVariants}
        className={`aspect-square rounded-[14px] border-[1.5px] flex flex-col items-center justify-center gap-[1px] min-[380px]:gap-[2px] p-1 min-[380px]:p-1.5 transition-all ${boxClass}`}
      >
        <span
          className={`text-[7px] min-[380px]:text-[8.5px] font-bold uppercase tracking-tight leading-none text-center truncate w-full px-1 mb-0.5 ${topText}`}
          style={{ fontFamily: "var(--font-afacad), sans-serif" }}
        >
          {slot.room}
        </span>
        <span
          className={`text-[12px] min-[380px]:text-[14px] min-[420px]:text-[15px] font-black uppercase tracking-tight leading-none overflow-hidden text-center w-full px-0.5 ${midText}`}
          style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
        >
          {slot.sub}
        </span>
        <span
          className={`text-[8px] min-[380px]:text-[9.5px] font-bold tracking-tighter leading-none text-center mt-0.5 ${botText}`}
          style={{ fontFamily: "var(--font-afacad), sans-serif" }}
        >
          {slot.time}
        </span>
      </motion.div>
    );
  };

  return (
    <motion.div 
      variants={gridVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-5 gap-[8px] mb-8 shrink-0 transition-all"
    >
      {displayGrid.map((slot, i) => renderSlot(slot, i))}
    </motion.div>
  );
}
