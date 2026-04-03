"use client";
import React from "react";
import { 
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Clock,
  Calendar,
  User
} from "lucide-react";

const NavIcon = ({ icon: Icon, active = false }: { icon: any, active?: boolean }) => (
  <div className={`p-2 rounded-full cursor-pointer transition-all duration-300 ${active ? 'bg-white text-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
    <Icon size={20} strokeWidth={1.5} />
  </div>
);

const AttentionCard = ({ shortName, fullName, attended, total, percent, margin, isSafe, recoveryDate }: any) => (
  <div className="flex items-center gap-6 px-8 py-3 rounded-xl border border-dotted border-white/10 bg-white/[0.01] w-full max-w-3xl">
    <div className="flex items-center gap-4">
      <span className={`text-2xl font-black tracking-tighter ${isSafe ? 'text-white' : 'text-[#FF4D4D]'}`} style={{ fontFamily: 'var(--font-montserrat)' }}>
        {margin}
      </span>
      <span className="text-[9px] font-black uppercase tracking-widest text-white/20 whitespace-nowrap" style={{ fontFamily: 'var(--font-montserrat)' }}>
        recover: {recoveryDate}
      </span>
    </div>

    <div className="h-4 w-px bg-white/5" />

    <div className="flex items-center gap-3 flex-1">
      <span className="text-white text-[10px] font-black uppercase tracking-widest leading-none" style={{ fontFamily: 'var(--font-montserrat)' }}>{shortName}</span>
      <span className="text-white/60 text-sm font-normal lowercase tracking-tight leading-none truncate" style={{ fontFamily: 'var(--font-afacad)' }}>{fullName}</span>
    </div>

    <div className="flex items-center gap-4 ml-auto">
      <span className="text-white/10 text-[9px] font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-montserrat)' }}>{attended}/{total}</span>
      <span className="text-white text-sm font-black tracking-tighter" style={{ fontFamily: 'var(--font-montserrat)' }}>{percent}%</span>
    </div>
  </div>
);

export default function DesktopAttendance() {
  return (
    <div className="h-screen w-full bg-black flex flex-row p-1 font-sans overflow-hidden">
      <div className="flex-1 bg-[#1E1E1E] rounded-[20px] relative overflow-hidden flex flex-col items-center pt-12 px-12">
        
        <div className="mb-8">
          <h2 className="text-white opacity-40 text-xl font-medium tracking-tight lowercase" style={{ fontFamily: 'var(--font-afacad)' }}>
            attention required
          </h2>
        </div>

        <div className="flex flex-col gap-2 w-full items-center">
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
          <AttentionCard 
            shortName="SC" 
            fullName="soft computing" 
            attended={27} 
            total={35} 
            percent="77.1" 
            margin={1} 
            isSafe={false} 
            recoveryDate="apr 19"
          />
        </div>

        <div className="absolute bottom-10 right-12">
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

        <div className="absolute bottom-10 left-10">
          <h1 className="text-2xl font-black tracking-tighter lowercase text-white opacity-20" style={{ fontFamily: 'var(--font-urbanosta)' }}>
            ratio'd
          </h1>
        </div>
      </div>

      <div className="w-[52px] h-full flex flex-col items-center py-6 justify-between">
        <div className="flex flex-col items-center gap-7">
          <NavIcon icon={LayoutDashboard} />
          <NavIcon icon={GraduationCap} active />
          <NavIcon icon={BookOpen} />
          <NavIcon icon={Clock} />
          <NavIcon icon={Calendar} />
        </div>
        
        <div className="pb-2">
          <NavIcon icon={User} />
        </div>
      </div>
    </div>
  );
}
