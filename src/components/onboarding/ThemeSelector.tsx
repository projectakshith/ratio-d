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

  const defaultPresets = COLOR_THEMES.filter((t) =>
    ["default", "minimalist-dark", "brutalist"].includes(t.id),
  );
  
  const namedPalettes = COLOR_THEMES.filter((t) =>
    ["gabriel", "el", "steve", "lucifer"].includes(t.id),
  );

  const renderThemeButton = (t: any) => (
    <motion.button
      key={t.id}
      whileTap={{ scale: 0.98 }}
      onClick={() => handleThemePick(t.id)}
      className={`p-5 rounded-[2rem] border-2 transition-all flex items-center justify-between w-full ${
        currentTheme.includes(t.id)
          ? "border-white bg-white text-[#0E2A47]"
          : "border-white/10 bg-white/5 text-white"
      }`}
    >
      <div className="flex flex-col items-start gap-1">
        <span className="font-black text-sm uppercase tracking-wider">
          {t.name}
        </span>
        <p className="text-[10px] opacity-60 text-left leading-tight">
          {t.description}
        </p>
      </div>
      <div className="flex gap-1.5 bg-black/20 p-2 rounded-full">
        {t.swatches.map((s: string, i: number) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full border border-white/10"
            style={{ backgroundColor: s }}
          />
        ))}
      </div>
    </motion.button>
  );

  return (
    <div className="mt-2 flex-1 flex flex-col pointer-events-none h-full">
      <p className="text-[11px] text-white/50 uppercase tracking-[0.2em] mb-8 px-1 leading-relaxed font-bold">
        you can try the default ones first and change it later by clicking on profile
      </p>
      
      <div className="flex-1 pointer-events-auto overflow-y-auto no-scrollbar pb-32 space-y-10">
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 px-1">
            Default Presets
          </h3>
          <div className="flex flex-col gap-3">
            {defaultPresets.map(renderThemeButton)}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 px-1">
            Named Palettes
          </h3>
          <div className="flex flex-col gap-3">
            {namedPalettes.map(renderThemeButton)}
          </div>
        </div>
      </div>
    </div>
  );
}
