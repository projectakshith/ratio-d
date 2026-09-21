"use client";
import React from "react";
import dynamic from "next/dynamic";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";

const MarksMinimalist = dynamic(
  () => import("@/components/themes/minimalist/marks/Marks"),
  { loading: () => <div className="h-full w-full bg-theme-bg" /> }
);
const MarksBrutalist = dynamic(
  () => import("@/components/themes/brutalist/marks/Marks"),
  { loading: () => <div className="h-full w-full bg-theme-bg" /> }
);
const DesktopMarks = dynamic(
  () => import("@/components/desktop/marks/Marks"),
  { loading: () => <div className="h-full w-full bg-theme-bg" /> }
);

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
