"use client";
import React from "react";
import DesktopSidebar from "../DesktopSidebar";

export default function DesktopCalendar() {
  return (
    <div className="h-screen w-full bg-black flex flex-row p-1 font-sans overflow-hidden">
      <div className="flex-1 bg-[#121212] rounded-[24px] relative overflow-hidden flex flex-col">
        
        <div className="flex-1 overflow-y-auto no-scrollbar pt-10 pb-48 px-12">
          <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
            
            <div className="w-full grid grid-cols-7 gap-2 mb-16">
              {[...Array(35)].map((_, i) => (
                <div key={i} className="aspect-square rounded-[20px] bg-white/[0.02] border border-white/5 p-4 flex flex-col justify-between">
                  <div className="h-4 w-6 bg-white/5 rounded-md" />
                  <div className="h-2 w-full bg-white/[0.01] rounded-full" />
                </div>
              ))}
            </div>

          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none bg-gradient-to-t from-[#121212] via-[#121212] to-transparent z-20" />
        
        <div className="absolute bottom-10 left-10 pointer-events-none z-30">
          <h1 className="text-2xl font-black tracking-tighter lowercase text-white opacity-20" style={{ fontFamily: 'var(--font-urbanosta)' }}>
            ratio'd
          </h1>
        </div>
        
        <div className="absolute bottom-10 right-12 pointer-events-none z-30">
          <h1 
            className="text-white font-regular lowercase leading-none select-none" 
            style={{ 
              fontFamily: 'var(--font-afacad)', 
              fontSize: '55px', 
              letterSpacing: '-4px' 
            }}
          >
            calendar
          </h1>
        </div>
      </div>

      <DesktopSidebar />
    </div>
  );
}
