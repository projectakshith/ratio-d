"use client";
import React, { memo } from "react";
import { motion } from "framer-motion";
import {
  LayoutGrid,
  CheckCircle,
  Home,
  Calendar,
  GraduationCap,
} from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav = memo(({ activeTab, setActiveTab }: BottomNavProps) => {
  const tabs = [
    { id: "marks", icon: GraduationCap },
    { id: "attendance", icon: CheckCircle },
    { id: "home", icon: Home },
    { id: "timetable", icon: LayoutGrid },
    { id: "calendar", icon: Calendar },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pb-safe w-[90%] max-w-[400px]">
      {/* Floating Glass Pill */}
      <nav className="relative flex items-center justify-between p-1.5 bg-[#050505]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative w-14 h-14 flex items-center justify-center rounded-full outline-none tap-highlight-transparent"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {/* Gliding Indicator - Uses absolute positioning to prevent layout jitter */}
              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute inset-0 bg-[#ceff1c] rounded-full shadow-[0_0_15px_rgba(206,255,28,0.2)]"
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 35,
                    mass: 1,
                  }}
                />
              )}

              {/* Icon */}
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className={`relative z-10 transition-colors duration-300 ${
                  isActive
                    ? "text-[#050505]"
                    : "text-white/40 hover:text-white/80"
                }`}
              />
            </button>
          );
        })}
      </nav>
    </div>
  );
});

BottomNav.displayName = "BottomNav";
