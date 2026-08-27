"use client";
import React from "react";
import dynamic from "next/dynamic";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useAcademiaData } from "@/hooks/useAcademiaData";
import { useIsMobile } from "@/hooks/use-mobile";

const CalendarMinimalist = dynamic(
  () => import("@/components/themes/minimalist/calendar/Calendar"),
  { loading: () => <div className="h-full w-full bg-theme-bg" /> }
);
const CalendarBrutalist = dynamic(
  () => import("@/components/themes/brutalist/calendar/Calendar"),
  { loading: () => <div className="h-full w-full bg-theme-bg" /> }
);
const DesktopCalendar = dynamic(
  () => import("@/components/desktop/calendar/Calendar"),
  { loading: () => <div className="h-full w-full bg-theme-bg" /> }
);

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
