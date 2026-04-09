"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import MarksMinimalist from "@/components/themes/minimalist/marks/Marks";
import MarksBrutalist from "@/components/themes/brutalist/marks/Marks";
import DesktopMarks from "@/components/desktop/marks/Marks";
import { useIsMobile } from "@/hooks/use-mobile";

export default function MarksPage() {
  const { userData } = useApp();
  const { uiStyle } = useTheme();
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <DesktopMarks />;
  }

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
