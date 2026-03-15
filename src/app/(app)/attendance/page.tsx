"use client";
import React from "react";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import AttendanceMinimalist from "@/components/themes/minimalist/attendance/Attendance";
import AttendanceBrutalist from "@/components/themes/brutalist/MobileAttendance";
import { useAcademiaData } from "@/hooks/useAcademiaData";

export default function AttendancePage() {
  const { userData } = useApp();
  const { uiStyle } = useTheme();
  const academia = useAcademiaData(userData as any);

  if (uiStyle === "brutalist") {
    return (
      <AttendanceBrutalist 
        data={userData as any}
        schedule={academia.effectiveSchedule}
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
