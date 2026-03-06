"use client";
import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import SettingsPage from "@/components/shared/SettingsPage";
import { useAcademiaData } from "@/hooks/useAcademiaData";

const BrutalistTheme = dynamic(
  () => import("./themes/brutalist/BrutalistTheme"),
  {
    loading: () => <div className="h-[100dvh] w-full bg-[#F7F7F7]" />,
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
  startEntrance,
}: any) {
  const [theme, setTheme] = useState<string>("minimalist_light");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const academia = useAcademiaData(data);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("ratiod_theme");
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        setTheme("minimalist_light");
      }
    } catch (error) {
      setTheme("minimalist_light");
    } finally {
      setMounted(true);
    }
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    try {
      localStorage.setItem("ratiod_theme", newTheme);
    } catch (error) {}
    setIsSettingsOpen(false);
  };

  if (!mounted) {
    return <main className="h-[100dvh] w-full bg-[#F7F7F7]" />;
  }

  const isDark = theme === "minimalist_dark";
  const themeMode = theme.startsWith("minimalist") ? "minimalist" : "brutalist";

  const sharedProps = {
    data,
    academia,
    onLogout,
    customDisplayName,
    onUpdateName,
    startEntrance,
    isDark,
    onOpenSettings: () => setIsSettingsOpen(true),
  };

  return (
    <main className="h-[100dvh] w-full bg-[#F7F7F7] overflow-hidden relative">
      {themeMode === "brutalist" ? (
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
            isDark={isDark}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
