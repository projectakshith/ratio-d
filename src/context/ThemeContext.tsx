"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "brutalist" | "retro" | "minimal";

interface ThemeContextType {
  activeTheme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeTheme, setActiveTheme] = useState<Theme>("brutalist");

  useEffect(() => {
    const saved = localStorage.getItem("app-theme") as Theme;
    if (saved) setActiveTheme(saved);
  }, []);

  const setTheme = (theme: Theme) => {
    setActiveTheme(theme);
    localStorage.setItem("app-theme", theme);
  };

  return (
    <ThemeContext.Provider value={{ activeTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
