"use client";

import React, { useState, useMemo } from "react";
import { MEAL_TIMINGS, WEEKLY_MENU } from "@/data/messMenu";
import { DayOfWeek, MealType } from "@/types/mess";
import { Coffee, Utensils, CupSoda, ChefHat, X, UtensilsCrossed } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ReactLenis } from "lenis/react";
import { Haptics } from "@/utils/shared/haptics";

export const DAYS: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const MEALS = [
  { id: "breakfast" as MealType, label: "Breakfast", icon: Coffee },
  { id: "lunch" as MealType, label: "Lunch", icon: Utensils },
  { id: "snacks" as MealType, label: "Snacks", icon: CupSoda },
  { id: "dinner" as MealType, label: "Dinner", icon: ChefHat },
];

export const getFoodEmoji = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("bread") || n.includes("pav")) return "🍞";
  if (n.includes("butter")) return "🧈";
  if (n.includes("jam")) return "🍓";
  if (n.includes("egg") || n.includes("omlet")) return "🥚";
  if (n.includes("milk") || n.includes("tea") || n.includes("coffee")) return "☕";
  if (n.includes("chicken")) return "🍗";
  if (n.includes("mutton") || n.includes("meat")) return "🍖";
  if (n.includes("fish")) return "🐟";
  if (n.includes("rice") || n.includes("pulao") || n.includes("briyani") || n.includes("pulav") || n.includes("bath")) return "🍚";
  if (n.includes("dosa") || n.includes("idly") || n.includes("pongal") || n.includes("uthappam")) return "🥞";
  if (n.includes("chapathi") || n.includes("paratha") || n.includes("poori") || n.includes("luchi") || n.includes("bhatura")) return "🫓";
  if (n.includes("salad")) return "🥗";
  if (n.includes("fruit") || n.includes("banana")) return "🍌";
  if (n.includes("ice cream") || n.includes("sweet") || n.includes("halwa") || n.includes("jamun") || n.includes("payasam")) return "🍨";
  if (n.includes("juice")) return "🥤";
  if (n.includes("dal") || n.includes("sambar") || n.includes("rasam") || n.includes("kuruma") || n.includes("kootu")) return "🍲";
  if (n.includes("chips") || n.includes("fryums")) return "🥨";
  return "🍛";
};

export function getCurrentMealAndDay(): { currentDay: DayOfWeek; currentMeal: MealType } {
  const now = new Date();
  const dayIndex = now.getDay();
  // In JS: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const currentDay: DayOfWeek = dayIndex === 0 ? "sunday" : DAYS[dayIndex - 1];

  const minutes = now.getHours() * 60 + now.getMinutes();
  let currentMeal: MealType = "breakfast";
  if (minutes < 9 * 60 + 30) {
    currentMeal = "breakfast";
  } else if (minutes < 14 * 60) {
    currentMeal = "lunch";
  } else if (minutes < 18 * 60) {
    currentMeal = "snacks";
  } else if (minutes < 21 * 60 + 30) {
    currentMeal = "dinner";
  } else {
    currentMeal = "breakfast"; // late night defaults to tomorrow morning's breakfast
  }

  return { currentDay, currentMeal };
}

interface MessContentProps {
  onClose?: () => void;
  isModal?: boolean;
}

export function MessContent({ onClose, isModal = false }: MessContentProps) {
  const initial = useMemo(() => getCurrentMealAndDay(), []);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(initial.currentDay);
  const [selectedMeal, setSelectedMeal] = useState<MealType>(initial.currentMeal);

  const meals = WEEKLY_MENU[selectedDay]?.meals || {};
  const currentItems = meals[selectedMeal] || [];
  const timing = MEAL_TIMINGS[selectedMeal];

  return (
    <div className={`flex flex-col h-full w-full bg-theme-bg ${isModal ? "overflow-hidden" : "max-w-2xl mx-auto px-6 pt-10 pb-6"}`}>
      {/* Header */}
      <div className="flex justify-between items-start w-full shrink-0 mb-6">
        <div className="flex flex-col">
          <span
            className="text-[32px] leading-[1] font-black uppercase tracking-[0.15em] text-theme-text"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            MESS MENU
          </span>
          <span
            className="text-[10px] font-bold lowercase tracking-[0.2em] text-theme-highlight mt-1.5"
            style={{ fontFamily: "'Afacad', sans-serif" }}
          >
            srm ist ktr campus • weekly schedule
          </span>
        </div>

        {onClose && (
          <button
            onClick={() => {
              Haptics.selection();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-theme-surface flex items-center justify-center text-theme-text transition-all shrink-0 active:scale-95"
            aria-label="Close"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Day Selector */}
      <div className="grid grid-cols-7 gap-1.5 w-full shrink-0 mb-3">
        {DAYS.map((day) => {
          const isSelected = selectedDay === day;
          const isToday = day === initial.currentDay;
          return (
            <button
              key={day}
              type="button"
              onClick={() => {
                Haptics.selection();
                setSelectedDay(day);
              }}
              className={`py-2.5 rounded-[16px] flex flex-col items-center justify-center transition-all ${
                isSelected
                  ? "bg-theme-emphasis text-theme-bg shadow-sm"
                  : "bg-theme-surface text-theme-muted hover:text-theme-text border border-theme-subtle"
              }`}
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              <span className={`text-[12px] font-black uppercase ${isSelected ? "text-theme-bg" : "text-theme-text"}`}>
                {day.substring(0, 3)}
              </span>
              <span
                className={`text-[8px] font-bold uppercase tracking-wider mt-0.5 ${
                  isSelected ? "text-theme-bg opacity-75" : isToday ? "text-theme-highlight font-black" : "text-theme-muted opacity-60"
                }`}
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                {isToday ? "today" : "day"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Meal Selector */}
      <div className="grid grid-cols-4 gap-2 w-full shrink-0 mb-4">
        {MEALS.map((meal) => {
          const isSelected = selectedMeal === meal.id;
          const Icon = meal.icon;
          return (
            <button
              key={meal.id}
              type="button"
              onClick={() => {
                Haptics.selection();
                setSelectedMeal(meal.id);
              }}
              className={`py-3 rounded-[16px] flex flex-col items-center justify-center gap-1 transition-all ${
                isSelected
                  ? "bg-theme-emphasis text-theme-bg shadow-sm"
                  : "bg-theme-surface text-theme-muted hover:text-theme-text border border-theme-subtle"
              }`}
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              <Icon
                size={16}
                strokeWidth={2.5}
                className={isSelected ? "text-theme-bg" : "text-theme-muted"}
              />
              <span className={`text-[11px] font-black uppercase tracking-wider ${isSelected ? "text-theme-bg" : "text-theme-text"}`}>
                {meal.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Section Divider / Timings */}
      <div className="flex items-center gap-3 w-full shrink-0 mb-3 px-1">
        <span
          className="text-[11px] font-bold lowercase tracking-[0.2em] text-theme-highlight whitespace-nowrap"
          style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
        >
          {selectedDay} • {selectedMeal}
        </span>
        <div
          className="flex-1 h-[1.5px] rounded-full"
          style={{ backgroundColor: "color-mix(in srgb, var(--theme-text) 10%, transparent)" }}
        />
        <span
          className="text-[11px] font-bold text-theme-muted whitespace-nowrap"
          style={{ fontFamily: "var(--font-afacad), sans-serif" }}
        >
          ⏰ {timing?.label || `${timing?.start} – ${timing?.end}`}
        </span>
      </div>

      {/* Food List */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-2.5 pb-6">
        {currentItems.map((item, idx) => (
          <div
            key={`${selectedDay}-${selectedMeal}-${idx}`}
            className="w-full bg-theme-card border-theme-subtle border-[1.5px] rounded-[20px] p-3.5 px-4 flex items-center gap-4 shadow-sm"
          >
            <div className="w-[42px] h-[42px] rounded-[14px] bg-theme-surface flex items-center justify-center shrink-0 text-xl select-none">
              {getFoodEmoji(item)}
            </div>
            <span
              className="text-[15px] font-bold text-theme-text lowercase leading-snug truncate"
              style={{ fontFamily: "var(--font-afacad), sans-serif" }}
            >
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Mess() {
  return (
    <ReactLenis options={{ orientation: "vertical", smoothWheel: true }} className="h-full w-full overflow-y-auto no-scrollbar">
      <MessContent />
    </ReactLenis>
  );
}

export function MessModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.6}
        onDragEnd={(_e, info) => {
          if (info.offset.y > 150 || info.velocity.y > 500) {
            Haptics.medium();
            onClose();
          }
        }}
        className="fixed inset-0 bg-theme-bg z-[60] flex flex-col overflow-hidden px-6 pt-10 pb-6"
      >
        <div className="w-12 h-1.5 bg-theme-text-10 rounded-full mx-auto mb-6 shrink-0" />
        <MessContent onClose={onClose} isModal />
      </motion.div>
    </AnimatePresence>
  );
}
