"use client";
import React, { useState, useEffect, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import SettingsPage from "@/components/shared/SettingsPage";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useAcademiaData } from "@/hooks/useAcademiaData";

const BrutalistThemeLayout = dynamic(
  () => import("@/components/themes/brutalist/BrutalistTheme"),
  { loading: () => <div className="h-full w-full bg-theme-bg" /> }
);

const MinimalistThemeLayout = dynamic(
  () => import("@/components/themes/minimalist/MinimalTheme"),
  { loading: () => <div className="h-full w-full bg-theme-bg" /> }
);

import { AppLayoutContext } from "@/context/AppLayoutContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { userData, logout, customDisplayName, setCustomDisplayName, isUpdating } = useApp();
  const { theme, setTheme, uiStyle, isDark } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSwipeDisabled, setIsSwipeDisabled] = useState(false);
  const academia = useAcademiaData(userData as any);
  const router = useRouter();

  useEffect(() => {
    const isOnboarded = localStorage.getItem("ratiod_onboarded") === "true";
    if (!isOnboarded) {
      router.replace("/onboarding");
      return;
    }
  }, [router]);

  const handleUpdateName = (name: string) => {
    setCustomDisplayName(name);
    localStorage.setItem("ratiod_custom_name", name);
  };

  const sharedProps = {
    data: userData as any,
    academia,
    onLogout: logout,
    customDisplayName,
    onUpdateName: handleUpdateName,
    startEntrance: true,
    isDark,
    onOpenSettings: () => setIsSettingsOpen(true),
    isUpdating,
    isSwipeDisabled
  };

  return (
    <AppLayoutContext.Provider value={{ 
      onOpenSettings: () => setIsSettingsOpen(true),
      isSwipeDisabled,
      setIsSwipeDisabled
    }}>
      <div className="h-full w-full bg-theme-bg overflow-hidden relative">
        {uiStyle === "brutalist" ? (
          <BrutalistThemeLayout {...sharedProps}>
            {children}
          </BrutalistThemeLayout>
        ) : (
          <MinimalistThemeLayout {...sharedProps}>
            {children}
          </MinimalistThemeLayout>
        )}

        <AnimatePresence>
          {isSettingsOpen && (
            <SettingsPage
              onBack={() => setIsSettingsOpen(false)}
              onLogout={logout}
              profile={{
                name: customDisplayName || userData?.profile?.name || "Student",
                regNo: userData?.profile?.regNo || "",
              }}
              onUpdateName={handleUpdateName}
              onSelectTheme={(newTheme) => {
                setTheme(newTheme);
                setIsSettingsOpen(false);
              }}
              currentTheme={theme}
            />
          )}
        </AnimatePresence>
      </div>
    </AppLayoutContext.Provider>
  );
}
