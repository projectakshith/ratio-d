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
  MoreVertical,
  Plus
} from "lucide-react";

const SidebarItem = ({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
  <div className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 ${active ? 'bg-[#C5FF41] text-black shadow-[0_0_20px_rgba(197,255,65,0.3)]' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}>
    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    <span className="font-semibold tracking-tight">{label}</span>
  </div>
);

const SubjectCard = ({ name, percent, conducted, present, color }: any) => (
  <div className="bg-[#0F0F0F] border border-zinc-800/50 rounded-[32px] p-6 flex flex-col gap-4 group hover:border-[#C5FF41]/30 transition-all cursor-pointer">
    <div className="flex items-center justify-between">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20`, color }}>
        <BookOpen size={20} />
      </div>
      <button className="text-zinc-600 hover:text-white transition-colors">
        <MoreVertical size={18} />
      </button>
    </div>
    
    <div>
      <h3 className="text-lg font-bold italic tracking-tight">{name}</h3>
      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mt-1">{present} / {conducted} Sessions</p>
    </div>

    <div className="mt-2">
      <div className="flex items-end justify-between mb-2">
        <p className="text-3xl font-black italic tracking-tighter">{percent}%</p>
        <p className={`text-[10px] font-black uppercase tracking-widest ${parseFloat(percent) >= 75 ? 'text-[#C5FF41]' : 'text-orange-500'}`}>
          {parseFloat(percent) >= 75 ? 'Safe' : 'At Risk'}
        </p>
      </div>
      <div className="w-full h-1.5 bg-zinc-800/50 rounded-full overflow-hidden">
        <div className="h-full bg-[#C5FF41] rounded-full" style={{ width: `${percent}%` }} />
      </div>
    </div>
  </div>
);

export default function DesktopAttendance() {
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
          <SidebarItem icon={GraduationCap} label="Attendance" active />
          <SidebarItem icon={BookOpen} label="Marks" />
          <SidebarItem icon={Calendar} label="Timetable" />
          <div className="mt-auto pt-8 border-t border-zinc-800/30">
            <SidebarItem icon={Settings} label="Settings" />
          </div>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col gap-6 overflow-hidden">
        <header className="flex items-center justify-between px-2 flex-shrink-0">
          <div>
            <h2 className="text-3xl font-black italic tracking-tighter">Attendance</h2>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">Academic Year 2025-26</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-5 py-3 bg-[#C5FF41] text-black rounded-2xl font-bold text-sm hover:scale-[1.02] transition-transform active:scale-95">
              <Plus size={18} strokeWidth={3} />
              <span>Add Prediction</span>
            </button>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900 border border-zinc-800 shadow-xl" />
          </div>
        </header>

        <div className="flex-1 grid grid-cols-3 gap-6 overflow-y-auto pr-2 custom-scrollbar content-start pb-8">
          <SubjectCard name="Compiler Design" percent="89" conducted="45" present="40" color="#9333EA" />
          <SubjectCard name="Computer Networks" percent="72" conducted="42" present="30" color="#FACC15" />
          <SubjectCard name="Software Engineering" percent="94" conducted="38" present="36" color="#FB923C" />
          <SubjectCard name="ML Ops & Systems" percent="81" conducted="40" present="32" color="#22D3EE" />
          <SubjectCard name="Deep Learning" percent="78" conducted="35" present="27" color="#F472B6" />
          <SubjectCard name="Cloud Computing" percent="85" conducted="40" present="34" color="#4ADE80" />
        </div>
      </main>
    </div>
  );
}
