"use client";
import React from "react";
import { 
  LayoutDashboard, 
  GraduationCap, 
  Calendar, 
  BookOpen, 
  Settings, 
  Search, 
  Bell,
  ArrowUpRight,
  TrendingUp
} from "lucide-react";

const SidebarItem = ({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
  <div className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 ${active ? 'bg-[#C5FF41] text-black shadow-[0_0_20px_rgba(197,255,65,0.3)]' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}>
    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    <span className="font-semibold tracking-tight">{label}</span>
  </div>
);

const MarkCard = ({ subject, marks, total, type, date }: any) => (
  <div className="bg-[#0F0F0F] border border-zinc-800/50 rounded-[32px] p-6 flex flex-col gap-4 group hover:border-[#C5FF41]/30 transition-all cursor-pointer">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-zinc-900 rounded-full text-zinc-400 border border-zinc-800/50">
        {type}
      </span>
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{date}</p>
    </div>
    
    <div>
      <h3 className="text-lg font-bold italic tracking-tight leading-tight">{subject}</h3>
    </div>

    <div className="mt-auto flex items-end justify-between">
      <div>
        <p className="text-4xl font-black italic tracking-tighter">{marks}<span className="text-xl text-zinc-600">/{total}</span></p>
        <div className="flex items-center gap-1.5 mt-1">
          <TrendingUp size={12} className="text-[#C5FF41]" />
          <p className="text-[10px] font-bold text-[#C5FF41] uppercase tracking-wider">Top 5%</p>
        </div>
      </div>
      <button className="p-3 bg-zinc-900 rounded-2xl text-zinc-500 group-hover:text-white group-hover:bg-[#C5FF41] group-hover:text-black transition-all">
        <ArrowUpRight size={20} strokeWidth={3} />
      </button>
    </div>
  </div>
);

export default function DesktopMarks() {
  return (
    <div className="flex h-screen w-full bg-[#050505] text-white p-6 gap-6 font-sans overflow-hidden">
      <aside className="w-72 flex flex-col gap-8 flex-shrink-0">
        <div className="px-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#C5FF41] rounded-xl flex items-center justify-center rotate-12 shadow-[0_0_30px_rgba(197,255,65,0.2)]">
            <span className="text-black font-black text-2xl -rotate-12 italic">r</span>
          </div>
          <h1 className="text-2xl font-black italic tracking-tighter">ratio'd</h1>
        </div>

        <nav className="flex flex-col gap-2">
          <SidebarItem icon={LayoutDashboard} label="Overview" />
          <SidebarItem icon={GraduationCap} label="Attendance" />
          <SidebarItem icon={BookOpen} label="Marks" active />
          <SidebarItem icon={Calendar} label="Timetable" />
          <div className="mt-auto pt-8 border-t border-zinc-800/30">
            <SidebarItem icon={Settings} label="Settings" />
          </div>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col gap-6 overflow-hidden">
        <header className="flex items-center justify-between px-2 flex-shrink-0">
          <div>
            <h2 className="text-3xl font-black italic tracking-tighter">Marks & Grades</h2>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">Semester 4 • Spring 2026</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="relative w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" 
                placeholder="Search assessments..." 
                className="w-full bg-[#0F0F0F] border border-zinc-800/50 rounded-2xl py-2.5 pl-11 pr-4 text-xs focus:outline-none transition-all"
              />
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900 border border-zinc-800 shadow-xl" />
          </div>
        </header>

        <div className="flex-1 grid grid-cols-3 gap-6 overflow-y-auto pr-2 custom-scrollbar content-start pb-8">
          <MarkCard subject="Compiler Design" marks="48" total="50" type="Midterm" date="24 Mar" />
          <MarkCard subject="Computer Networks" marks="19" total="20" type="Quiz" date="20 Mar" />
          <MarkCard subject="Software Engineering" marks="45" total="50" type="Assignment" date="18 Mar" />
          <MarkCard subject="ML Ops & Systems" marks="92" total="100" type="Term Paper" date="15 Mar" />
          <MarkCard subject="Deep Learning" marks="42" total="50" type="Midterm" date="12 Mar" />
          <MarkCard subject="Cloud Computing" marks="20" total="20" type="Lab Exam" date="10 Mar" />
        </div>
      </main>
    </div>
  );
}
