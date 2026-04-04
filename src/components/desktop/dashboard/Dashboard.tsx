"use client";
import React from "react";
import DesktopSidebar from "../DesktopSidebar";

export default function DesktopDashboard() {
  return (
    <div className="h-screen w-full bg-black flex flex-row p-1 font-sans overflow-hidden">
      <div className="flex-1 bg-[#121212] rounded-[24px] relative overflow-hidden flex flex-col items-center justify-center">
        <h1 className="text-white/20 text-xl font-medium tracking-tight lowercase" style={{ fontFamily: 'var(--font-afacad)' }}>
          dashboard
        </h1>
        
        <div className="absolute bottom-10 left-10 pointer-events-none">
          <h1 className="text-2xl font-black tracking-tighter lowercase text-white opacity-20" style={{ fontFamily: 'var(--font-urbanosta)' }}>
            ratio'd
          </h1>
        </div>
      </div>

      <DesktopSidebar />
    </div>
  );
}
