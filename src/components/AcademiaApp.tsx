"use client";
import React, { useState } from "react";
import BrutalistTheme from "./themes/brutalist/BrutalistTheme";
import MinimalistTheme from "./themes/minimalist/MinimalTheme";
import { useAcademiaData } from "@/hooks/useAcademiaData";

export default function AcademiaApp({
  data,
  onLogout,
  customDisplayName,
  onUpdateName,
}: any) {
  const [theme, setTheme] = useState<"brutalist" | "minimalist">("minimalist");
  const academia = useAcademiaData(data);

  const sharedProps = {
    data,
    academia,
    onLogout,
    customDisplayName,
    onUpdateName,
    setTheme,
  };

  return (
    <main className="h-[100dvh] w-full bg-black overflow-hidden relative">
      {theme === "brutalist" ? (
        <BrutalistTheme {...sharedProps} />
      ) : (
        <MinimalistTheme {...sharedProps} />
      )}
    </main>
  );
}
