"use client";
import React from "react";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import CalendarMinimalist from "@/components/themes/minimalist/calendar/Calendar";
import CalendarBrutalist from "@/components/themes/brutalist/calendar/Calendar";
import { useAcademiaData } from "@/hooks/useAcademiaData";

export default function CalendarPage() {
  const { userData } = useApp();
  const { uiStyle } = useTheme();
  const academia = useAcademiaData(userData as any);

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
