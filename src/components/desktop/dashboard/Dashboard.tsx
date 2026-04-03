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

const NavIcon = ({ icon: Icon }: { icon: any }) => (
  <div className="p-2 text-white/80 hover:text-white transition-all cursor-pointer">
    <Icon size={20} strokeWidth={1.5} />
  </div>
);

export default function DesktopDashboard() {
  return (
    <div className="h-screen w-full bg-black flex flex-row p-1 font-sans overflow-hidden">
      <div className="flex-1 bg-[#1E1E1E] rounded-[20px] relative overflow-hidden">
        <div className="absolute bottom-8 left-10">
          <h1 className="text-2xl font-black tracking-tighter lowercase text-white opacity-90" style={{ fontFamily: 'var(--font-urbanosta)' }}>
            ratio'd
          </h1>
        </div>
      </div>

      <div className="w-[52px] h-full flex flex-col items-center py-6 justify-between">
        <div className="flex flex-col items-center gap-7">
          <NavIcon icon={LayoutDashboard} />
          <NavIcon icon={GraduationCap} />
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
