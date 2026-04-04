"use client";
import React from "react";
import DesktopSidebar from "../DesktopSidebar";

export default function DesktopTimetable() {
  return (
    <div className="h-screen w-full bg-black flex flex-row p-1 font-sans overflow-hidden">
      <div className="flex-1 bg-[#121212] rounded-[24px] relative overflow-hidden flex flex-col">
        
        <div className="flex-1 overflow-y-auto no-scrollbar pt-10 pb-48 px-12">
          <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
            
            <div className="w-full grid grid-cols-5 gap-4 mb-16">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex flex-col gap-4">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-[20px] text-center">
                    <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Day {i}</span>
                  </div>
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <div key={j} className="h-24 rounded-[20px] bg-white/[0.02] border border-white/5 p-4 flex flex-col justify-between">
                      <div className="h-3 w-12 bg-white/5 rounded-full" />
                      <div className="h-5 w-full bg-white/10 rounded-md" />
                    </div>
                  ))}
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
            timetable
          </h1>
        </div>
      </div>

      <DesktopSidebar />
    </div>
  );
}
