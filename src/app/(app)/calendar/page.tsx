"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import CalendarMinimalist from "@/components/themes/minimalist/calendar/Calendar";
import CalendarBrutalist from "@/components/themes/brutalist/calendar/Calendar";
import DesktopCalendar from "@/components/desktop/calendar/Calendar";
import { useAcademiaData } from "@/hooks/useAcademiaData";
import { useIsMobile } from "@/hooks/use-mobile";

export default function CalendarPage() {
  const { userData } = useApp();
  const { uiStyle } = useTheme();
  const academia = useAcademiaData(userData as any);
  const isMobile = useIsMobile();

  if (isMobile === undefined) return <div className="h-full w-full bg-theme-bg" />;

  if (!isMobile) {
    return <DesktopCalendar />;
  }

  if (uiStyle === "brutalist") {
    return (
      <CalendarBrutalist 
        data={userData as any}
        academia={academia}
      />
    );
  }

  return (
    <CalendarMinimalist 
      data={userData as any}
      academia={academia}
    />
  );
}
