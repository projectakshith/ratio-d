"use client";
import React from "react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const tabs = [
    { id: "marks", label: "marks" },
    { id: "attendance", label: "attnd" },
    { id: "home", label: "home" },
    { id: "timetable", label: "time" },
    { id: "calendar", label: "cal" },
  ];

  return (
    <nav className="px-6 py-8 flex justify-between items-center bg-[#F7F7F7] border-t border-[#111111]/5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`text-[10px] font-bold uppercase tracking-[0.15em] transition-colors duration-300 ${
            activeTab === tab.id ? "text-[#111111]" : "text-[#111111]/30"
          }`}
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
