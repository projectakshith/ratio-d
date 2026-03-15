"use client";
import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { migrateTheme, parseTheme } from "@/utils/theme/themeUtils";

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  uiStyle: "minimalist" | "brutalist";
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<string>("minimalist_minimalist-dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem("ratiod_theme");
      const migrated = migrateTheme(savedRaw);
      setThemeState(migrated);
      const { colorTheme } = parseTheme(migrated);
      document.documentElement.setAttribute("data-theme", colorTheme);
    } catch (error) {
      document.documentElement.setAttribute("data-theme", "minimalist-dark");
    } finally {
      setMounted(true);
    }
  }, []);

  const setTheme = (newTheme: string) => {
    const migrated = migrateTheme(newTheme);
    setThemeState(migrated);
    const { colorTheme } = parseTheme(migrated);
    document.documentElement.setAttribute("data-theme", colorTheme);
    try {
      localStorage.setItem("ratiod_theme", migrated);
    } catch (error) {}
  };

  const { uiStyle, isDark } = parseTheme(theme);

  const value = useMemo(() => ({
    theme,
    setTheme,
    uiStyle,
    isDark
  }), [theme, uiStyle, isDark]);

  if (!mounted) return <div className="h-[100dvh] w-full bg-[#111111]" />;

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
