"use client";

import React, { useState, useMemo } from "react";
import { MEAL_TIMINGS, WEEKLY_MENU } from "@/data/messMenu";
import { DayOfWeek, MealType } from "@/types/mess";
import { X } from "lucide-react";
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

export const MEALS: { id: MealType; label: string }[] = [
  { id: "breakfast", label: "breakfast" },
  { id: "lunch", label: "lunch" },
  { id: "snacks", label: "snacks" },
  { id: "dinner", label: "dinner" },
];

export type FoodCategory = "mains" | "gravies" | "specials" | "extras";

export const CATEGORY_CONFIG: Record<
  FoodCategory,
  { label: string; priority: number }
> = {
  mains: { label: "mains", priority: 1 },
  gravies: { label: "gravies & curries", priority: 2 },
  specials: { label: "specials", priority: 3 },
  extras: { label: "sides & drinks", priority: 4 },
};

export function categorizeItem(item: string): FoodCategory {
  const l = item.toLowerCase();

  // Specials (Non-veg, eggs, paneer)
  if (
    l.includes("chicken") ||
    l.includes("mutton") ||
    l.includes("fish") ||
    l.includes("egg") ||
    l.includes("omlet") ||
    l.includes("paneer")
  ) {
    return "specials";
  }

  // Staples / Mains (Rice, Breads, Tiffin, Snacks)
  if (
    l.includes("rice") ||
    l.includes("pulao") ||
    l.includes("pulav") ||
    l.includes("briyani") ||
    l.includes("bath") ||
    l.includes("poori") ||
    l.includes("chapathi") ||
    l.includes("paratha") ||
    l.includes("bhatura") ||
    l.includes("luchi") ||
    l.includes("idly") ||
    l.includes("dosa") ||
    l.includes("uthappam") ||
    l.includes("pongal") ||
    l.includes("upma") ||
    l.includes("kichadi") ||
    l.includes("poha") ||
    l.includes("sevai") ||
    l.includes("noodles") ||
    l.includes("pastha") ||
    l.includes("vadai") ||
    l.includes("vada") ||
    l.includes("pav bhaji") ||
    l.includes("puff") ||
    l.includes("bun") ||
    l.includes("sundal") ||
    l.includes("bonda") ||
    l.includes("cake") ||
    l.includes("brownie") ||
    l.includes("muffin") ||
    l.includes("bajji")
  ) {
    return "mains";
  }

  // Beverages, Desserts, Condiments, Extras
  if (
    l.includes("tea") ||
    l.includes("coffee") ||
    l.includes("milk") ||
    l.includes("juice") ||
    l.includes("kanji") ||
    l.includes("sweet") ||
    l.includes("payasam") ||
    l.includes("halwa") ||
    l.includes("jamun") ||
    l.includes("ice cream") ||
    l.includes("fruit") ||
    l.includes("banana") ||
    l.includes("bread") ||
    l.includes("butter") ||
    l.includes("jam") ||
    l.includes("pickle") ||
    l.includes("fryum") ||
    l.includes("chips") ||
    l.includes("french fry") ||
    l.includes("salad") ||
    l.includes("curd") ||
    l.includes("raitha") ||
    l.includes("podi") ||
    l.includes("oil")
  ) {
    return "extras";
  }

  return "gravies";
}

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
  if (n.includes("paneer")) return "🧀";
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

  const segmentedMeals = useMemo(() => {
    const groups: Record<FoodCategory, string[]> = {
      mains: [],
      gravies: [],
      specials: [],
      extras: [],
    };
    for (const item of currentItems) {
      groups[categorizeItem(item)].push(item);
    }
    const order: FoodCategory[] = ["mains", "gravies", "specials", "extras"];
    return order
      .filter((cat) => groups[cat].length > 0)
      .map((cat) => ({
        category: cat,
        items: groups[cat],
      }));
  }, [currentItems]);

  return (
    <div className={`flex flex-col h-full w-full bg-theme-bg ${isModal ? "overflow-hidden" : "max-w-2xl mx-auto px-6 pt-10 pb-8"}`}>
      {/* Top Header */}
      <div className="flex justify-between items-start w-full shrink-0 mb-8">
        <div className="flex flex-col">
          <span
            className="text-[32px] leading-[1] font-black uppercase tracking-[0.15em] text-theme-text"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            MESS MENU
          </span>
          <span
            className="text-[10px] font-bold lowercase tracking-[0.2em] text-theme-highlight mt-2"
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

      {/* Active Day & Meal Info Banner */}
      <div className="flex items-center gap-3 w-full shrink-0 mb-4 px-1">
        <span
          className="text-[12px] font-bold lowercase tracking-[0.2em] text-theme-highlight whitespace-nowrap"
          style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
        >
          {selectedDay} • {selectedMeal}
        </span>
        <div
          className="flex-1 h-[1px] rounded-full"
          style={{
            backgroundColor: "color-mix(in srgb, var(--theme-text) 10%, transparent)",
          }}
        />
        <span
          className="text-[11px] font-bold text-theme-muted whitespace-nowrap"
          style={{ fontFamily: "var(--font-afacad), sans-serif" }}
        >
          ⏰ {timing?.label || `${timing?.start} – ${timing?.end}`}
        </span>
      </div>

      {/* Center: Scrollable Food Menu in a Single Spacious Card */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6 min-h-0">
        {segmentedMeals.length > 0 ? (
          <div className="w-full bg-theme-card border-theme-subtle border-[1.5px] rounded-[24px] overflow-hidden shadow-sm">
            {segmentedMeals.map(({ category, items }, catIdx) => (
              <div key={category} className="flex flex-col">
                {/* Segment Header */}
                <div
                  className={`flex items-center justify-between px-5 py-3.5 ${
                    catIdx > 0 ? "border-t" : ""
                  } bg-theme-surface/60`}
                  style={
                    catIdx > 0
                      ? {
                          borderTop: "1px solid color-mix(in srgb, var(--theme-text) 10%, transparent)",
                        }
                      : undefined
                  }
                >
                  <span
                    className="text-[11px] font-black uppercase tracking-[0.2em] text-theme-highlight"
                    style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                  >
                    {CATEGORY_CONFIG[category].label}
                  </span>
                  <span
                    className="text-[10px] font-bold text-theme-muted uppercase tracking-wider"
                    style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                  >
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </span>
                </div>

                {/* Items */}
                <div className="flex flex-col">
                  {items.map((item, idx) => (
                    <div
                      key={`${selectedDay}-${selectedMeal}-${category}-${idx}`}
                      className="flex items-center px-5 py-3.5 gap-4 hover:bg-theme-surface/40 transition-colors border-t"
                      style={{
                        borderTop: "1px solid color-mix(in srgb, var(--theme-text) 6%, transparent)",
                      }}
                    >
                      <span className="text-xl leading-none select-none shrink-0">
                        {getFoodEmoji(item)}
                      </span>
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
            ))}
          </div>
        ) : (
          <div className="w-full bg-theme-card border-theme-subtle border-[1.5px] rounded-[24px] py-10 text-center text-theme-muted text-sm font-medium">
            no menu items listed
          </div>
        )}
      </div>

      {/* Bottom Thumb Zone: Meal & Day Selectors */}
      <div
        className="shrink-0 pt-3.5 pb-2 flex flex-col gap-2.5 w-full mt-auto"
        style={{
          borderTop: "1px solid color-mix(in srgb, var(--theme-text) 10%, transparent)",
        }}
      >
        {/* Meal Selector - Segmented Pills */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-theme-surface border border-theme-subtle rounded-2xl w-full">
          {MEALS.map((meal) => {
            const isSelected = selectedMeal === meal.id;
            return (
              <button
                key={meal.id}
                type="button"
                onClick={() => {
                  Haptics.selection();
                  setSelectedMeal(meal.id);
                }}
                className={`py-2 px-1 rounded-xl flex items-center justify-center transition-all ${
                  isSelected
                    ? "bg-theme-emphasis text-theme-bg shadow-sm"
                    : "text-theme-muted hover:text-theme-text"
                }`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                <span
                  className={`text-[11px] font-bold lowercase tracking-wider ${
                    isSelected ? "text-theme-bg" : "text-theme-text"
                  }`}
                >
                  {meal.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Day Selector - Clean 7-Day Grid */}
        <div className="grid grid-cols-7 gap-1.5 w-full">
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
                className={`py-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? "bg-theme-emphasis text-theme-bg shadow-sm"
                    : "bg-theme-surface text-theme-muted hover:text-theme-text border border-theme-subtle"
                }`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                <span
                  className={`text-[11px] font-bold lowercase leading-tight ${
                    isSelected ? "text-theme-bg" : "text-theme-text"
                  }`}
                >
                  {day.substring(0, 3)}
                </span>
                {isToday && (
                  <span
                    className={`w-1 h-1 rounded-full mt-0.5 ${
                      isSelected ? "bg-theme-bg" : "bg-theme-highlight"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
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
        className="fixed inset-0 bg-theme-bg z-[60] flex flex-col overflow-hidden px-6 pt-10 pb-8"
      >
        <div className="w-12 h-1.5 bg-theme-text-10 rounded-full mx-auto mb-6 shrink-0" />
        <MessContent onClose={onClose} isModal />
      </motion.div>
    </AnimatePresence>
  );
}
