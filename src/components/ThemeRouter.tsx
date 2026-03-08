"use client";
import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import SettingsPage from "@/components/shared/SettingsPage";
import { useAcademiaData } from "@/hooks/useAcademiaData";
import { migrateTheme, parseTheme } from "@/utils/theme/themeUtils";

const BrutalistTheme = dynamic(
  () => import("./themes/brutalist/BrutalistTheme"),
  {
    loading: () => <div className="h-[100dvh] w-full bg-theme-bg" />,
  },
);

const MinimalistTheme = dynamic(
  () => import("./themes/minimalist/MinimalTheme"),
  {
    loading: () => <div className="h-[100dvh] w-full bg-theme-bg" />,
  },
);

export default function ThemeRouter({
  data,
  onLogout,
  customDisplayName,
  onUpdateName,
  startEntrance,
  isUpdating,
}: any) {
  const [theme, setTheme] = useState<string>("minimalist_baal");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const academia = useAcademiaData(data);

  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem("ratiod_theme");
      const migrated = migrateTheme(savedRaw);
      setTheme(migrated);
      // Apply data-theme attribute so CSS variables resolve
      const { colorTheme } = parseTheme(migrated);
      document.documentElement.setAttribute("data-theme", colorTheme);
    } catch (error) {
      setTheme("minimalist_baal");
      document.documentElement.setAttribute("data-theme", "baal");
    } finally {
      setMounted(true);
    }
  }, []);

  const handleThemeChange = (newTheme: string) => {
    const migrated = migrateTheme(newTheme);
    setTheme(migrated);
    const { colorTheme } = parseTheme(migrated);
    document.documentElement.setAttribute("data-theme", colorTheme);
    try {
      localStorage.setItem("ratiod_theme", migrated);
    } catch (error) {}
    setIsSettingsOpen(false);
  };

  if (!mounted) {
    return <main className="h-[100dvh] w-full bg-theme-bg" />;
  }

  const { uiStyle, isDark } = parseTheme(theme);

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
    <main className="h-[100dvh] w-full bg-theme-bg overflow-hidden relative">
      {uiStyle === "brutalist" ? (
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
