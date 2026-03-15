"use client";
import React, { memo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  CheckCircle,
  Home,
  Calendar,
  GraduationCap,
} from "lucide-react";

export const BottomNav = memo(() => {
  const pathname = usePathname();
  
  const getActiveTab = () => {
    if (pathname === "/") return "home";
    return pathname.replace("/", "");
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
      <nav className="relative flex items-center justify-between p-1.5 bg-theme-bg/80 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <Link
              key={tab.id}
              href={tab.path}
              className="relative w-14 h-14 flex items-center justify-center rounded-full outline-none tap-highlight-transparent"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute inset-0 bg-theme-highlight rounded-full"
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
                    ? "text-theme-bg"
                    : "text-white/40 hover:text-white/80"
                }`}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
});

BottomNav.displayName = "BottomNav";
