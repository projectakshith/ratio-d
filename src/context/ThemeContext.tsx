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

  const updateSystemThemeColor = () => {
    setTimeout(() => {
      const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--theme-bg').trim();
      if (bgColor) {
        let meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', 'theme-color');
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', bgColor);
        
        const isDarkTheme = bgColor.includes('111111') || bgColor.includes('050505') || bgColor === '#111111' || bgColor === '#050505' || bgColor.startsWith('#0') || bgColor.startsWith('#1');
        document.documentElement.style.colorScheme = isDarkTheme ? 'dark' : 'light';
      }
    }, 100);
  };

  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem("ratiod_theme");
      const migrated = migrateTheme(savedRaw);
      setThemeState(migrated);
      const { colorTheme } = parseTheme(migrated);
      document.documentElement.setAttribute("data-theme", colorTheme);
      updateSystemThemeColor();
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
    updateSystemThemeColor();
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
