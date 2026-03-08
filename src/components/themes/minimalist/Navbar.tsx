"use client";
import React from "react";

export default function Navbar({ activeTab, setActiveTab }: any) {
  const tabs = [
    { id: "marks", label: "marks" },
    { id: "attendance", label: "attnd" },
    { id: "home", label: "home" },
    { id: "timetable", label: "time" },
    { id: "calendar", label: "cal" },
  ];

  return (
    <nav
      className="px-6 py-8 flex justify-between items-center bg-theme-bg border-t border-theme-border"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`text-[10px] font-bold uppercase tracking-[0.15em] transition-colors duration-300 ${
            activeTab === tab.id ? "text-theme-text" : "text-theme-subtle"
          }`}
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
