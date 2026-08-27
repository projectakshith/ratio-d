"use client";
import React from "react";
import dynamic from "next/dynamic";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useAcademiaData } from "@/hooks/useAcademiaData";
import { useIsMobile } from "@/hooks/use-mobile";

const TimetableMinimalist = dynamic(
  () => import("@/components/themes/minimalist/timetable/Timetable"),
  { loading: () => <div className="h-full w-full bg-theme-bg" /> }
);
const TimetableBrutalist = dynamic(
  () => import("@/components/themes/brutalist/timetable/Timetable"),
  { loading: () => <div className="h-full w-full bg-theme-bg" /> }
);
const DesktopTimetable = dynamic(
  () => import("@/components/desktop/timetable/Timetable"),
  { loading: () => <div className="h-full w-full bg-theme-bg" /> }
);

export default function TimetablePage() {
  const { userData } = useApp();
  const { uiStyle } = useTheme();
  const academia = useAcademiaData(userData as any);
  const isMobile = useIsMobile();

  if (isMobile === undefined) return <div className="h-full w-full bg-theme-bg" />;

  if (!isMobile) {
    return <DesktopTimetable />;
  }

  if (uiStyle === "brutalist") {
    return (
      <TimetableBrutalist 
        data={userData as any}
        schedule={academia.effectiveSchedule}
        dayOrder={academia.effectiveDayOrder}
      />
    );
  }

  return (
    <TimetableMinimalist 
      data={userData as any}
      academia={academia}
      startEntrance={true}
    />
  );
}
