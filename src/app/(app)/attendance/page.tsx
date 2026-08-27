"use client";
import React from "react";
import dynamic from "next/dynamic";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useAcademiaData } from "@/hooks/useAcademiaData";
import { useIsMobile } from "@/hooks/use-mobile";

const AttendanceMinimalist = dynamic(
  () => import("@/components/themes/minimalist/attendance/Attendance"),
  { loading: () => <div className="h-full w-full bg-theme-bg" /> }
);
const AttendanceBrutalist = dynamic(
  () => import("@/components/themes/brutalist/attendance/Attendance"),
  { loading: () => <div className="h-full w-full bg-theme-bg" /> }
);
const DesktopAttendance = dynamic(
  () => import("@/components/desktop/attendance/Attendance"),
  { loading: () => <div className="h-full w-full bg-theme-bg" /> }
);

export default function AttendancePage() {
  const { userData } = useApp();
  const { uiStyle } = useTheme();
  const academia = useAcademiaData(userData as any);
  const isMobile = useIsMobile();

  if (isMobile === undefined) return <div className="h-full w-full bg-theme-bg" />;

  if (!isMobile) {
    return <DesktopAttendance />;
  }

  if (uiStyle === "brutalist") {
    return (
      <AttendanceBrutalist 
        data={userData as any}
        academia={academia}
      />
    );
  }

  return (
    <AttendanceMinimalist 
      data={userData as any}
      academia={academia}
    />
  );
}
