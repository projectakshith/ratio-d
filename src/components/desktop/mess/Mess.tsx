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
    <div className={`flex flex-col h-full w-full bg-theme-bg ${isModal ? "p-4 sm:p-6" : "p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={22} strokeWidth={2.5} className="text-theme-text" />
            <h1
              className="text-2xl sm:text-3xl font-black text-theme-text tracking-tight uppercase"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              mess menu
            </h1>
          </div>
          <p className="text-xs text-theme-muted font-bold mt-0.5 lowercase tracking-wider" style={{ fontFamily: "var(--font-afacad)" }}>
            srm ist ktr campus • weekly circular
          </p>
        </div>

        {onClose && (
          <button
            onClick={() => {
              Haptics.light();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-theme-surface border-[1.5px] border-theme-text flex items-center justify-center text-theme-text active:scale-95 transition-all shadow-sm"
            aria-label="Close"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Navigation Section */}
      <div className="space-y-3 mb-4 shrink-0">
        {/* Day Selector */}
        <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-2 px-2 sm:mx-0 sm:px-0">
          {DAYS.map((day) => {
            const isSelected = selectedDay === day;
            const isToday = day === initial.currentDay;
            return (
              <button
                key={day}
                onClick={() => {
                  Haptics.light();
                  setSelectedDay(day);
                }}
                className={`min-w-[48px] h-9 px-3.5 flex items-center justify-center rounded-full font-black transition-all text-xs tracking-wider uppercase shrink-0 border-[1.5px]
                  ${isSelected
                    ? "bg-theme-text text-theme-bg border-theme-text shadow-sm scale-105"
                    : "bg-theme-surface text-theme-text border-theme-text/30 hover:border-theme-text"
                  }
                `}
                style={{ fontFamily: "var(--font-montserrat)" }}
              >
                {day.substring(0, 3)}
                {isToday && <span className={`ml-1 w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? "bg-theme-bg" : "bg-theme-highlight"}`} />}
              </button>
            );
          })}
        </div>

        {/* Meal Selector */}
        <div className="flex bg-theme-surface border-[1.5px] border-theme-text rounded-2xl p-1 gap-1 shadow-sm">
          {MEALS.map((meal) => {
            const isSelected = selectedMeal === meal.id;
            const Icon = meal.icon;
            return (
              <button
                key={meal.id}
                onClick={() => {
                  Haptics.light();
                  setSelectedMeal(meal.id);
                }}
                className={`flex-1 py-2 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider
                  ${isSelected
                    ? "bg-theme-text text-theme-bg shadow-sm"
                    : "text-theme-text hover:bg-theme-bg/60"
                  }
                `}
                style={{ fontFamily: "var(--font-montserrat)" }}
              >
                <Icon size={14} strokeWidth={2.5} className={isSelected ? "text-theme-bg" : "text-theme-text"} />
                <span className="capitalize">{meal.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Meal Timing Pill */}
      <div className="flex items-center justify-between px-1 mb-3 shrink-0">
        <span className="text-sm font-black text-theme-text lowercase tracking-wider" style={{ fontFamily: "var(--font-montserrat)" }}>
          {selectedDay} • {selectedMeal}
        </span>
        <span className="text-xs font-bold text-theme-text bg-theme-surface px-3 py-1 rounded-full border-[1.5px] border-theme-text" style={{ fontFamily: "var(--font-afacad)" }}>
          ⏰ {timing?.label || `${timing?.start} – ${timing?.end}`}
        </span>
      </div>

      {/* Food List */}
      <div className="flex-1 overflow-y-auto no-scrollbar rounded-[24px] border-[1.5px] border-theme-text bg-theme-card shadow-sm">
        <ul className="divide-y-[1.5px] divide-theme-text/15">
          {currentItems.map((item, idx) => (
            <li
              key={`${selectedDay}-${selectedMeal}-${idx}`}
              className="flex items-center py-3.5 px-4 hover:bg-theme-text/5 transition-colors gap-3.5"
            >
              <span className="text-2xl leading-none select-none shrink-0">
                {getFoodEmoji(item)}
              </span>
              <span
                className="text-theme-text font-bold text-[15px] sm:text-base tracking-tight leading-snug lowercase"
                style={{ fontFamily: "var(--font-montserrat)" }}
              >
                {item}
              </span>
            </li>
          ))}
        </ul>
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
      <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            Haptics.light();
            onClose();
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ y: "100%", opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          drag="y"
          dragDirectionLock
          dragConstraints={{ top: 0, bottom: 400 }}
          dragElastic={{ top: 0, bottom: 0.5 }}
          onDragEnd={(_e, info) => {
            if (info.offset.y > 100 || info.velocity.y > 500) {
              Haptics.medium();
              onClose();
            }
          }}
          className="relative w-full sm:max-w-xl h-[85vh] sm:h-[75vh] bg-theme-bg rounded-t-[32px] sm:rounded-[32px] border-t-[2px] sm:border-[2px] border-theme-text shadow-2xl overflow-hidden flex flex-col z-10"
        >
          <div className="w-12 h-1.5 bg-theme-text/25 rounded-full mx-auto mt-3 shrink-0 sm:hidden" />
          <MessContent onClose={onClose} isModal />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
