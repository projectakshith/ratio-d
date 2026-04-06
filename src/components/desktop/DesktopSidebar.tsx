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
import { Haptics } from "@/utils/shared/haptics";

const NavIcon = ({ icon: Icon, active = false, onClick }: { icon: any, active?: boolean, onClick: () => void }) => (
  <div 
    onClick={onClick}
    className={`p-2.5 rounded-2xl cursor-pointer transition-all duration-300 ${
      active 
        ? 'bg-theme-emphasis text-theme-bg shadow-lg scale-110' 
        : 'text-theme-muted hover:text-theme-text hover:bg-theme-surface/40'
    }`}
  >
    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
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

  const handleNav = (path: string) => {
    Haptics.selection();
    router.push(path);
  };

  return (
    <div className="w-[72px] h-full flex flex-col items-center py-8 justify-between shrink-0 bg-transparent">
      <div className="flex flex-col items-center gap-6">
        {navItems.map((item) => (
          <NavIcon 
            key={item.path}
            icon={item.icon} 
            active={pathname === item.path}
            onClick={() => handleNav(item.path)}
          />
        ))}
      </div>
      
      <div className="pb-2">
        <NavIcon 
          icon={User} 
          active={pathname === "/settings"}
          onClick={() => handleNav("/settings")}
        />
      </div>
    </div>
  );
}
