"use client";
import React from "react";
import DesktopSidebar from "../DesktopSidebar";

export default function DesktopMarks() {
  return (
    <div className="h-screen w-full bg-black flex flex-row p-1 font-sans overflow-hidden">
      <div className="flex-1 bg-[#121212] rounded-[24px] relative overflow-hidden flex flex-col">
        
        <div className="flex-1 overflow-y-auto no-scrollbar pt-10 pb-48 px-12">
          <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
            
            <div className="w-full flex flex-col gap-4 mb-16 p-8 rounded-[32px] border-2 border-dashed border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-white/40 text-[11px] font-black uppercase tracking-[0.4em]" style={{ fontFamily: 'var(--font-montserrat)' }}>
                  recent assessments
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-6 rounded-[24px] bg-white/[0.02] border border-white/5">
                    <div className="h-4 w-24 bg-white/5 rounded-full mb-4" />
                    <div className="h-8 w-48 bg-white/10 rounded-lg mb-2" />
                    <div className="h-4 w-32 bg-white/5 rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full flex flex-col gap-4">
              <div className="flex items-center gap-4 mb-3 px-4">
                <span className="text-white/20 text-[11px] font-black uppercase tracking-[0.4em]" style={{ fontFamily: 'var(--font-montserrat)' }}>
                  all courses
                </span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-square p-6 rounded-[24px] bg-white/[0.01] border border-white/5 flex flex-col justify-between">
                    <div className="h-6 w-12 bg-white/10 rounded-md" />
                    <div className="h-4 w-full bg-white/5 rounded-full" />
                  </div>
                ))}
              </div>
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
            marks
          </h1>
        </div>
      </div>

      <DesktopSidebar />
    </div>
  );
}
