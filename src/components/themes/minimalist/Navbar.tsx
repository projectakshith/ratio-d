"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Haptics } from "@/utils/shared/haptics";

export default function Navbar() {
  const pathname = usePathname();
  const tabs = [
    { id: "marks", label: "marks", path: "/marks" },
    { id: "attendance", label: "attnd", path: "/attendance" },
    { id: "home", label: "home", path: "/" },
    { id: "timetable", label: "time", path: "/timetable" },
    { id: "calendar", label: "cal", path: "/calendar" },
  ];

  return (
    <nav
      className="px-6 py-8 flex justify-between items-center bg-theme-bg border-t border-theme-border"
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.path;
        return (
          <Link
            key={tab.id}
            href={tab.path}
            onClick={() => {
              Haptics.light();
            }}
            className={`text-[10px] font-bold uppercase tracking-[0.15em] transition-colors duration-300 ${
              isActive ? "text-theme-text" : "text-theme-subtle"
            }`}
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
