"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import MarksMinimalist from "@/components/themes/minimalist/marks/Marks";
import MarksBrutalist from "@/components/themes/brutalist/marks/Marks";
import DesktopMarks from "@/components/desktop/marks/Marks";

export default function MarksPage() {
  const { userData } = useApp();
  const { uiStyle } = useTheme();

  return (
    <>
      <div className="md:hidden h-full w-full">
        {uiStyle === "brutalist" ? (
          <MarksBrutalist data={userData as any} />
        ) : (
          <MarksMinimalist data={userData as any} />
        )}
      </div>
      <div className="hidden md:block h-full w-full">
        <DesktopMarks />
      </div>
    </>
  );
}
