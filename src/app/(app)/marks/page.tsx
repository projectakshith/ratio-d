"use client";
import React from "react";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import MarksMinimalist from "@/components/themes/minimalist/marks/Marks";
import MarksBrutalist from "@/components/themes/brutalist/marks/Marks";

export default function MarksPage() {
  const { userData } = useApp();
  const { uiStyle } = useTheme();

  if (uiStyle === "brutalist") {
    return (
      <MarksBrutalist 
        data={userData as any}
      />
    );
  }

  return (
    <MarksMinimalist 
      data={userData as any}
    />
  );
}
