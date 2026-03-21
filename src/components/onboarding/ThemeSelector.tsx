"use client";
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { COLOR_THEMES, buildTheme } from "@/utils/theme/themeUtils";

interface ThemeSelectorProps {
  onComplete: () => void;
}

export default function ThemeSelector({ onComplete }: ThemeSelectorProps) {
  const { theme: currentTheme, setTheme } = useTheme();

  const haptic = (intensity = 10) => {
    if (typeof window !== "undefined" && window.navigator.vibrate) {
      window.navigator.vibrate(intensity);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("ratiod_theme");
    if (!saved || saved.includes("default")) {
      const defaultDark = buildTheme("minimalist", "minimalist-dark" as any);
      setTheme(defaultDark);
    }
  }, []);

  const handleThemePick = (colorId: string) => {
    haptic(15);
    const newTheme = buildTheme("minimalist", colorId as any);
    setTheme(newTheme);
  };

  const minimalistPresets = COLOR_THEMES.filter((t) =>
    ["default", "minimalist-dark"].includes(t.id),
  );

  const otherPresets = COLOR_THEMES.filter((t) =>
    ["brutalist", "steve"].includes(t.id),
  );
  
  const namedPallets = COLOR_THEMES.filter((t) =>
    !["default", "minimalist-dark", "brutalist", "steve"].includes(t.id),
  );

  const renderThemeButton = (t: any) => {
    const isMinimalistLight = t.id === "default";
    const isMinimalistDark = t.id === "minimalist-dark";
    const displayName = isMinimalistLight ? "Minimalist Light" : isMinimalistDark ? "Minimalist Dark" : t.name;

    return (
      <motion.button
        key={t.id}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleThemePick(t.id)}
        className={`p-5 rounded-[2rem] border-2 transition-all flex items-center justify-between w-full pointer-events-auto ${
          currentTheme.includes(t.id)
            ? "border-white bg-white text-[#0E2A47]"
            : "border-white/10 bg-white/5 text-white"
        }`}
      >
        <div className="flex flex-col items-start gap-1">
          <span className="font-black text-sm uppercase tracking-wider">
            {displayName}
          </span>
          <div className="flex flex-col items-start text-left">
            <span className="text-[9px] font-black uppercase tracking-widest opacity-30 leading-tight">
              {t.deity}
            </span>
          </div>
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
  };

  return (
    <div className="mt-2 flex-1 flex flex-col h-full pointer-events-none overflow-hidden">
      <p className="text-[11px] text-white/50 lowercase tracking-[0.1em] mb-8 px-6 leading-relaxed font-bold">
        try defaults (stable). change later in profile.
      </p>
      
      <div 
        className="flex-1 pointer-events-auto overflow-y-auto no-scrollbar pb-20 space-y-10 px-6"
        style={{ touchAction: "pan-y" }}
      >
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 px-1">
            Default Presets
          </h3>
          <div className="flex flex-col gap-3">
            {minimalistPresets.map(renderThemeButton)}
            <div className="h-px w-full bg-white/5 my-2" />
            {otherPresets.map(renderThemeButton)}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex flex-col">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                Named Pallets
              </h3>
              <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
                (for minimalist)
              </span>
            </div>
            <span className="text-[10px] font-mono text-white/10 font-bold tracking-tighter">
              &lt;/debaditiya&gt;
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {namedPallets.map(renderThemeButton)}
          </div>
        </div>

        <div className="pt-4 pb-10">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onComplete()}
            className="w-full py-5 bg-white text-[#0E2A47] rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl pointer-events-auto"
          >
            start using ratio'd
          </motion.button>
        </div>
      </div>
    </div>
  );
}
