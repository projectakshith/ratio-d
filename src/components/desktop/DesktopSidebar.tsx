"use client";
import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Clock,
  Calendar,
  User
} from "lucide-react";

const NavIcon = ({ icon: Icon, active = false, onClick }: { icon: any, active?: boolean, onClick: () => void }) => (
  <div 
    onClick={onClick}
    className={`p-2 rounded-full cursor-pointer transition-all duration-300 ${active ? 'bg-white text-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
  >
    <Icon size={20} strokeWidth={1.5} />
  </div>
);

export default function DesktopSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { icon: LayoutDashboard, path: "/dashboard" },
    { icon: GraduationCap, path: "/attendance" },
    { icon: BookOpen, path: "/marks" },
    { icon: Clock, path: "/timetable" },
    { icon: Calendar, path: "/calendar" },
  ];

  return (
    <div className="w-[52px] h-full flex flex-col items-center py-6 justify-between shrink-0">
      <div className="flex flex-col items-center gap-7">
        {navItems.map((item) => (
          <NavIcon 
            key={item.path}
            icon={item.icon} 
            active={pathname === item.path}
            onClick={() => router.push(item.path)}
          />
        ))}
      </div>
      
      <div className="pb-2">
        <NavIcon 
          icon={User} 
          active={pathname === "/settings"}
          onClick={() => router.push("/settings")}
        />
      </div>
    </div>
  );
}
