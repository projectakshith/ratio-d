"use client";
export const runtime = "edge";

import React from "react";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import AttendanceMinimalist from "@/components/themes/minimalist/attendance/Attendance";
import AttendanceBrutalist from "@/components/themes/brutalist/attendance/Attendance";
import DesktopAttendance from "@/components/desktop/attendance/Attendance";
import { useAcademiaData } from "@/hooks/useAcademiaData";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AttendancePage() {
  const { userData } = useApp();
  const { uiStyle } = useTheme();
  const academia = useAcademiaData(userData as any);
  const isMobile = useIsMobile();

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
