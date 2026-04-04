"use client";
import React from "react";
import DesktopSidebar from "../DesktopSidebar";

const AttentionCard = ({ shortName, fullName, attended, total, percent, margin, isSafe, recoveryDate }: any) => (
  <div className="flex items-center px-6 py-5 rounded-[20px] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 group border border-white/5">
    <div className="w-16 flex flex-col items-center shrink-0">
      <span className={`text-3xl font-black tracking-tighter leading-none ${isSafe ? 'text-white' : 'text-[#FF4D4D]'}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
        {margin}
      </span>
    </div>

    <div className="h-10 w-px bg-white/[0.05] mx-6" />

    <div className="flex-1 min-w-0 flex flex-col justify-center">
      <span className="text-white text-xl font-black lowercase tracking-tight leading-tight truncate" style={{ fontFamily: 'var(--font-montserrat)' }}>
        {fullName}
      </span>
      <span className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] mt-1" style={{ fontFamily: 'var(--font-montserrat)' }}>
        {shortName}
      </span>
    </div>

    <div className="w-48 px-4 shrink-0 flex items-center justify-center">
      {recoveryDate && (
        <div className="bg-white/5 border border-white/5 px-4 py-1.5 rounded-full whitespace-nowrap">
          <span className="text-white/40 text-[9px] font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>
            recover: {recoveryDate}
          </span>
        </div>
      )}
    </div>

    <div className="w-36 flex flex-col items-end shrink-0">
      <span className="text-white text-3xl font-black tracking-tighter leading-none" style={{ fontFamily: 'var(--font-montserrat)' }}>
        {percent}%
      </span>
      <span className="text-white/10 text-[10px] font-bold uppercase tracking-widest mt-1.5" style={{ fontFamily: 'var(--font-montserrat)' }}>
        {attended}/{total}
      </span>
    </div>
  </div>
);

export default function DesktopAttendance() {
  return (
    <div className="h-screen w-full bg-black flex flex-row p-1 font-sans overflow-hidden">
      <div className="flex-1 bg-[#121212] rounded-[24px] relative overflow-hidden flex flex-col">
        
        <div className="flex-1 overflow-y-auto no-scrollbar pt-10 pb-48 px-12">
          <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
            
            <div className="w-full flex flex-col gap-4 mb-16 p-8 rounded-[32px] border-2 border-dashed border-[#FF4D4D]/20 bg-[#FF4D4D]/[0.02]">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-[#FF4D4D] text-[11px] font-black uppercase tracking-[0.4em]" style={{ fontFamily: 'var(--font-montserrat)' }}>
                  attention required
                </span>
                <div className="flex-1 h-px bg-[#FF4D4D]/10" />
              </div>
              
              <div className="flex flex-col gap-3">
                <AttentionCard 
                  shortName="CD" 
                  fullName="compiler design" 
                  attended={40} 
                  total={45} 
                  percent="88.9" 
                  margin={2} 
                  isSafe={false} 
                  recoveryDate="apr 18"
                />
                <AttentionCard 
                  shortName="DBMS" 
                  fullName="database systems" 
                  attended={30} 
                  total={42} 
                  percent="71.4" 
                  margin={3} 
                  isSafe={false} 
                  recoveryDate="apr 20"
                />
              </div>
            </div>

            <div className="w-full flex flex-col gap-4">
              <div className="flex items-center gap-4 mb-3 px-4">
                <span className="text-white/20 text-[11px] font-black uppercase tracking-[0.4em]" style={{ fontFamily: 'var(--font-montserrat)' }}>
                  all subjects
                </span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              
              <div className="flex flex-col gap-3">
                <AttentionCard 
                  shortName="SC" 
                  fullName="soft computing" 
                  attended={27} 
                  total={35} 
                  percent="77.1" 
                  margin={1} 
                  isSafe={true} 
                />
                <AttentionCard 
                  shortName="ML" 
                  fullName="machine learning" 
                  attended={45} 
                  total={50} 
                  percent="90.0" 
                  margin={8} 
                  isSafe={true} 
                />
                <AttentionCard 
                  shortName="OS" 
                  fullName="operating systems" 
                  attended={38} 
                  total={40} 
                  percent="95.0" 
                  margin={12} 
                  isSafe={true} 
                />
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
            attendance
          </h1>
        </div>
      </div>

      <DesktopSidebar />
    </div>
  );
}
