"use client";
import React from "react";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import TimetableMinimalist from "@/components/themes/minimalist/timetable/Timetable";
import TimetableBrutalist from "@/components/themes/brutalist/timetable/Timetable";
import { useAcademiaData } from "@/hooks/useAcademiaData";

export default function TimetablePage() {
  const { userData } = useApp();
  const { uiStyle } = useTheme();
  const academia = useAcademiaData(userData as any);

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
