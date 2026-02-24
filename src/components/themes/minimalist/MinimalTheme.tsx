"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Dashboard from "./Dashboard";

export default function MinimalTheme(props: any) {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="h-full w-full bg-[#fdfdfd] flex flex-col font-sans">
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full"
            >
              <Dashboard
                data={props.data}
                timeStatus={props.academia.timeStatus}
                currentRoast={
                  props.academia.currentRoast || "analyzing aura..."
                }
              />
            </motion.div>
          )}
          {/* Add other minimalist pages here (Timetable, etc.) as we build them */}
        </AnimatePresence>
      </div>

      {/* Simplified Minimal Navigation */}
      <nav className="p-8 flex justify-between items-center bg-[#fdfdfd]">
        <button
          onClick={() => setActiveTab("home")}
          className={`text-[10px] font-black uppercase tracking-[0.2em] ${activeTab === "home" ? "text-black" : "text-black/20"}`}
        >
          now
        </button>
        <button
          onClick={() => setActiveTab("timetable")}
          className={`text-[10px] font-black uppercase tracking-[0.2em] ${activeTab === "timetable" ? "text-black" : "text-black/20"}`}
        >
          plan
        </button>
        <button
          onClick={() => props.onLogout()} // Passing from props
          className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/40"
        >
          exit
        </button>
      </nav>
    </div>
  );
}
