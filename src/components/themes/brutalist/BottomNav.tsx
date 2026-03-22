"use client";
import React, { memo } from "react";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  CheckCircle,
  Home,
  Calendar,
  GraduationCap,
} from "lucide-react";

export const BottomNav = memo(() => {
  const pathname = usePathname();
  const router = useRouter();

  const getActiveTab = () => {
    if (pathname === "/") return "home";
    return pathname.split("/")[1];
  };

  const activeTab = getActiveTab();

  const tabs = [
    { id: "marks", icon: GraduationCap, path: "/marks" },
    { id: "attendance", icon: CheckCircle, path: "/attendance" },
    { id: "home", icon: Home, path: "/" },
    { id: "timetable", icon: LayoutGrid, path: "/timetable" },
    { id: "calendar", icon: Calendar, path: "/calendar" },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pb-safe w-[90%] max-w-[400px]">
      <nav className="relative flex items-center justify-between p-1.5 bg-[#050505]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.path)}
              className="relative w-14 h-14 flex items-center justify-center rounded-full outline-none tap-highlight-transparent"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
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


BottomNav.displayName = "BottomNav";
