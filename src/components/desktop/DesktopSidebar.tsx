"use client";
import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Clock,
  Calendar,
  FileText
} from "lucide-react";
import { Haptics } from "@/utils/shared/haptics";
import { useAppLayout } from "@/context/AppLayoutContext";
import { useApp } from "@/context/AppContext";
import { UserAvatar } from "../shared/UserAvatar";

const BEZIER = [0.16, 1, 0.3, 1];

const NavIcon = ({ 
  icon: Icon, 
  active = false, 
  onClick, 
  label, 
  isExpanded,
  avatarSeed,
  isProfile = false
}: { 
  icon?: any, 
  active?: boolean, 
  onClick: () => void, 
  label: string, 
  isExpanded: boolean,
  avatarSeed?: string,
  isProfile?: boolean
}) => {
  if (isProfile) {
    return (
      <motion.div
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="group flex items-center justify-end w-full relative cursor-pointer h-14"
      >
        <div className="flex-1 h-full flex items-center justify-end overflow-hidden pr-4">
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3, ease: BEZIER }}
                className="text-[13px] font-bold uppercase tracking-widest whitespace-nowrap select-none text-theme-text"
                style={{ fontFamily: 'var(--font-afacad)' }}
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="w-[68px] h-full shrink-0 flex items-center justify-center relative">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-theme-surface border-none shadow-lg hover:scale-105 transition-transform">
            <UserAvatar seed={avatarSeed || ""} className="w-full h-full" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      whileTap={{ scale: 0.95 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="group flex items-center justify-end w-full relative cursor-pointer h-12"
    >
      <div className="flex-1 h-full flex items-center justify-end overflow-hidden pr-4">
        <AnimatePresence>
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3, ease: BEZIER }}
              className="text-[13px] font-bold uppercase tracking-widest whitespace-nowrap select-none text-theme-text"
              style={{ fontFamily: 'var(--font-afacad)' }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      
      <div className="w-[68px] h-full shrink-0 flex items-center justify-center relative">
        <AnimatePresence>
          {active && (
            <motion.div 
              layoutId="sidebar-active"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute w-12 h-12 bg-theme-emphasis rounded-2xl shadow-lg z-0"
            />
          )}
        </AnimatePresence>
        
        <div className={`relative z-10 flex items-center justify-center ${active ? 'text-theme-bg' : 'text-theme-muted group-hover:text-theme-text'}`}>
          <div className="transition-transform duration-500 group-hover:scale-110">
            {Icon && <Icon size={22} strokeWidth={active ? 2.5 : 2} />}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function DesktopSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { onOpenSettings } = useAppLayout();
  const { profileSeed } = useApp();
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setIsHovered(false);
  }, [pathname]);

  const navItems = [
    { icon: LayoutDashboard, path: "/dashboard", label: "dashboard" },
    { icon: GraduationCap, path: "/attendance", label: "attendance" },
    { icon: BookOpen, path: "/marks", label: "marks" },
    { icon: Clock, path: "/timetable", label: "timetable" },
    { icon: Calendar, path: "/calendar", label: "calendar" },
    { icon: FileText, path: "/pyqs", label: "pyqs" },
  ];

  const handleNav = (path: string) => {
    if (pathname === path) return;
    Haptics.selection();
    router.push(path);
  };

  return (
    <motion.div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{ 
        width: isHovered ? 240 : 68,
      }}
      transition={{ duration: 0.5, ease: BEZIER }}
      className="h-full relative shrink-0 z-[60] flex flex-col items-center py-8 justify-between overflow-visible rounded-[24px] border border-theme-border backdrop-blur-xl"
      style={{ 
        backgroundColor: 'color-mix(in srgb, var(--theme-bg), transparent 40%)'
      }}
    >
      <div className="w-full flex flex-col items-center gap-4">
        {navItems.map((item) => (
          <NavIcon 
            key={item.path}
            icon={item.icon} 
            label={item.label}
            isExpanded={isHovered}
            active={pathname === item.path}
            onClick={() => handleNav(item.path)}
          />
        ))}
      </div>
      
      <div className="w-full">
        <NavIcon 
          label="profile"
          isExpanded={isHovered}
          active={false}
          avatarSeed={profileSeed}
          isProfile={true}
          onClick={() => {
            Haptics.selection(); 
            onOpenSettings();
          }}
        />
      </div>
    </motion.div>
  );
}
