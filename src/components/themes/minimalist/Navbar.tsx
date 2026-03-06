"use client";
import React from "react";

export default function Navbar({ activeTab, setActiveTab, isDark }: any) {
  const tabs = [
    { id: "marks", label: "marks" },
    { id: "attendance", label: "attnd" },
    { id: "home", label: "home" },
    { id: "timetable", label: "time" },
    { id: "calendar", label: "cal" },
  ];

  const bgClass = isDark ? "bg-[#111111]" : "bg-[#F7F7F7]";
  const borderClass = isDark ? "border-white/5" : "border-[#111111]/5";
  const activeText = isDark ? "text-white" : "text-[#111111]";
  const inactiveText = isDark ? "text-white/30" : "text-[#111111]/30";

  return (
    <nav
      className={`px-6 py-8 flex justify-between items-center ${bgClass} border-t ${borderClass}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`text-[10px] font-bold uppercase tracking-[0.15em] transition-colors duration-300 ${
            activeTab === tab.id ? activeText : inactiveText
          }`}
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
