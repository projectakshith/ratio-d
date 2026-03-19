"use client";
import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { COLOR_THEMES, buildTheme } from "@/utils/theme/themeUtils";

interface ThemeSelectorProps {
  onComplete: () => void;
}

export default function ThemeSelector({ onComplete }: ThemeSelectorProps) {
  const { theme: currentTheme, setTheme } = useTheme();

  const handleThemePick = (colorId: string) => {
    const newTheme = buildTheme("minimalist", colorId as any);
    setTheme(newTheme);
    
    
  };

  return (
    <div className="mt-8 flex-1 flex flex-col pointer-events-none">
      <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto no-scrollbar pb-8 pointer-events-auto">
        {COLOR_THEMES.filter((t) =>
          [
            "minimalist-dark",
            "brutalist",
            "gabriel",
            "el",
            "steve",
            "lucifer",
          ].includes(t.id),
        ).map((t) => (
          <motion.button
            key={t.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleThemePick(t.id)}
            className={`p-4 rounded-3xl border-2 transition-all flex flex-col justify-between h-32 ${
              currentTheme.includes(t.id)
                ? "border-[#111111] bg-[#111111] text-white"
                : "border-[#111111]/10 bg-white/20 text-[#111111]"
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <span className="font-bold text-xs uppercase tracking-tighter">
                {t.name}
              </span>
              <div className="flex gap-1">
                {t.swatches.map((s, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: s }}
                  />
                ))}
              </div>
            </div>
            <p className="text-[10px] opacity-60 text-left leading-tight">
              {t.description}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
