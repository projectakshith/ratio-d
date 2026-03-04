"use client";
import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import SettingsPage from "@/components/shared/SettingsPage";
import { useAcademiaData } from "@/hooks/useAcademiaData";

const BrutalistTheme = dynamic(
  () => import("./themes/brutalist/BrutalistTheme"),
  {
    loading: () => <div className="h-[100dvh] w-full bg-black" />,
  },
);

const MinimalistTheme = dynamic(
  () => import("./themes/minimalist/MinimalTheme"),
  {
    loading: () => <div className="h-[100dvh] w-full bg-[#F7F7F7]" />,
  },
);

export default function AcademiaApp({
  data,
  onLogout,
  customDisplayName,
  onUpdateName,
}: any) {
  const [theme, setTheme] = useState<"brutalist" | "minimalist">("minimalist");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const academia = useAcademiaData(data);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("ratiod_theme");
      if (savedTheme === "brutalist") {
        setTheme("brutalist");
      } else {
        setTheme("minimalist");
      }
    } catch (error) {
      setTheme("minimalist");
    } finally {
      setMounted(true);
    }
  }, []);

  const handleThemeChange = (newTheme: string) => {
    const exactTheme = newTheme.toLowerCase().includes("brutal")
      ? "brutalist"
      : "minimalist";
    setTheme(exactTheme);
    try {
      localStorage.setItem("ratiod_theme", exactTheme);
    } catch (error) {}
    setIsSettingsOpen(false);
  };

  if (!mounted) {
    return <main className="h-[100dvh] w-full bg-[#F7F7F7]" />;
  }

  const sharedProps = {
    data,
    academia,
    onLogout,
    customDisplayName,
    onUpdateName,
    onOpenSettings: () => setIsSettingsOpen(true),
  };

  return (
    <main className="h-[100dvh] w-full bg-[#F7F7F7] overflow-hidden relative">
      {theme === "brutalist" ? (
        <BrutalistTheme {...sharedProps} />
      ) : (
        <MinimalistTheme {...sharedProps} />
      )}

      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsPage
            onBack={() => setIsSettingsOpen(false)}
            onLogout={onLogout}
            profile={{
              name: customDisplayName || data?.profile?.name || "Student",
              regNo: data?.profile?.regNo || "",
            }}
            onUpdateName={onUpdateName}
            onSelectTheme={handleThemeChange}
            currentTheme={theme}
            onTestNotification={academia?.triggerTestClass}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
