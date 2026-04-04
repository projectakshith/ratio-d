"use client";
import React from "react";
import DesktopSidebar from "../DesktopSidebar";

const SubjectCard = ({ code, name, percent, attended, total, margin, isSafe, recoveryDate, isCritical, type }: any) => {
  const isPractical = type?.toLowerCase() === 'practical';
  
  let cardStyles = 'bg-white/[0.02] hover:bg-white/[0.04] border-white/5';
  let textStyles = 'text-white/90';
  let subTextStyles = 'text-white/20';
  let badgeStyles = 'border-white/10 bg-white/5 text-white/40';
  let lineStyles = 'bg-white/10';
  let statusColor = isSafe ? 'text-white' : 'text-[#FF4D4D]';

  if (isCritical) {
    cardStyles = 'bg-[#FF4D4D]/10 border-[#FF4D4D]/20 backdrop-blur-md';
    textStyles = 'text-[#FF4D4D]';
    subTextStyles = 'text-[#FF4D4D]/60';
    badgeStyles = 'border-[#FF4D4D]/20 bg-[#FF4D4D]/10 text-[#FF4D4D]';
    lineStyles = 'bg-[#FF4D4D]/20';
    statusColor = 'text-[#FF4D4D]';
  } else if (isPractical) {
    cardStyles = 'bg-[#0EA5E9]/10 border-[#0EA5E9]/20 backdrop-blur-md hover:bg-[#0EA5E9]/15';
    textStyles = 'text-[#0EA5E9]';
    subTextStyles = 'text-[#0EA5E9]/60';
    badgeStyles = 'border-[#0EA5E9]/20 bg-[#0EA5E9]/10 text-[#0EA5E9]';
    lineStyles = 'bg-[#0EA5E9]/20';
    statusColor = isSafe ? 'text-[#0EA5E9]' : 'text-[#FF4D4D]';
  }

  return (
    <div className={`relative flex items-center w-full rounded-[22px] transition-all duration-300 group mb-3 border ${cardStyles}`}>
      <div className="flex-1 py-5 flex flex-row items-center px-6 min-w-0 gap-5">
        <div className="flex flex-col items-center justify-center shrink-0 w-20 gap-1">
          <span className={`text-[15px] font-black uppercase tracking-[0.2em] leading-none ${subTextStyles}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
            {code}
          </span>
          <div className={`h-5 px-2 rounded-[6px] border flex items-center justify-center ${badgeStyles}`}>
            <span className="text-[8px] font-bold uppercase tracking-widest leading-none" style={{ fontFamily: 'var(--font-afacad)' }}>
              {type || 'Theory'}
            </span>
          </div>
        </div>

        <div className={`w-[1px] h-10 shrink-0 ${lineStyles}`} />

        <div className="flex-1 min-w-0">
          <span className={`text-[17px] font-bold lowercase tracking-tight truncate block ${textStyles}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
            {name}
          </span>
        </div>
      </div>

      <div className="flex items-center shrink-0 pr-8 gap-10">
        <div className="flex flex-col items-center justify-center w-20">
          <span className={`text-2xl font-black tracking-tighter leading-none ${statusColor}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
            {margin}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${subTextStyles}`} style={{ fontFamily: 'var(--font-afacad)' }}>
            {isSafe ? 'margin' : 'recover'}
          </span>
        </div>

        <div className={`w-[1px] h-8 ${lineStyles}`} />

        <div className="flex flex-col items-center justify-center w-24">
          <div className="flex items-baseline gap-0.5">
            <span className={`text-2xl font-black tracking-tighter leading-none ${textStyles}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
              {percent}
            </span>
            <span className={`text-xs font-black ${subTextStyles}`} style={{ fontFamily: 'var(--font-montserrat)' }}>%</span>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${subTextStyles}`} style={{ fontFamily: 'var(--font-afacad)' }}>
            {attended}/{total}
          </span>
        </div>
      </div>

      {recoveryDate && (
        <div className="absolute right-4 top-4">
          <span className="text-[#FF4D4D] text-[7px] font-black uppercase tracking-widest bg-[#FF4D4D]/10 px-2 py-1 rounded-full border border-[#FF4D4D]/10" style={{ fontFamily: 'var(--font-montserrat)' }}>
            {recoveryDate}
          </span>
        </div>
      )}
    </div>
  );
};

export default function DesktopAttendance() {
  return (
    <div className="h-screen w-full bg-black flex flex-row p-1 font-sans overflow-hidden">
      <div className="flex-1 bg-[#121212] rounded-[24px] relative overflow-hidden flex flex-col">
        
        <div className="flex-1 overflow-y-auto no-scrollbar pt-6 pb-24">
          <div className="w-full max-w-5xl mx-auto flex flex-col px-12">
            
            <div className="w-full flex flex-col gap-4 mb-12 p-8 rounded-[32px] border-2 border-dashed border-[#FF4D4D]/20 bg-[#FF4D4D]/[0.02]">
              <div className="flex items-center gap-6 mb-2">
                <span className="text-[#FF4D4D] text-[10px] font-black uppercase tracking-[0.5em] shrink-0" style={{ fontFamily: 'var(--font-montserrat)' }}>
                  attention required
                </span>
                <div className="flex-1 h-[1px] bg-[#FF4D4D]/20" />
              </div>

              <div className="w-full flex flex-col">
                <SubjectCard 
                  code="DBMS" 
                  name="database management systems" 
                  percent="71.4" 
                  attended={30}
                  total={42}
                  margin={3}
                  isSafe={false}
                  isCritical={true}
                  type="Theory"
                />
              </div>
            </div>

            <div className="py-8 flex items-center gap-6">
              <span className="text-white/20 text-[10px] font-black uppercase tracking-[0.5em] shrink-0" style={{ fontFamily: 'var(--font-montserrat)' }}>
                subjects
              </span>
              <div className="flex-1 h-[1px] bg-white/10" />
            </div>

            <div className="w-full flex flex-col">
              <SubjectCard 
                code="CD" 
                name="compiler design" 
                percent="88.9" 
                attended={40} 
                total={45} 
                margin={4} 
                isSafe={true} 
                type="Theory"
              />
              <SubjectCard 
                code="DAA" 
                name="design and analysis of algorithms" 
                percent="77.1" 
                attended={27} 
                total={35} 
                margin={1} 
                isSafe={true} 
                type="Practical"
              />
              <SubjectCard 
                code="ML" 
                name="machine learning" 
                percent="92.5" 
                attended={45} 
                total={50} 
                margin={8} 
                isSafe={true} 
                type="Theory"
              />
              <SubjectCard 
                code="OS" 
                name="operating systems" 
                percent="84.2" 
                attended={32} 
                total={38} 
                margin={5} 
                isSafe={true} 
                type="Theory"
              />
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none bg-gradient-to-t from-[#121212] via-[#121212] to-transparent z-20" />
        
        <div className="absolute bottom-10 left-10 pointer-events-none z-30">
          <h1 className="text-2xl font-black tracking-tighter lowercase text-white opacity-20" style={{ fontFamily: 'var(--font-urbanosta)' }}>
            ratio'd
          </h1>
        </div>
        
        <div className="absolute bottom-10 right-12 pointer-events-none z-30 text-right">
          <h1 
            className="text-white font-regular lowercase leading-none select-none opacity-80" 
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
