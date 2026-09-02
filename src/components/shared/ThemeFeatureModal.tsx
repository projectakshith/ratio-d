"use client";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { COLOR_THEMES, buildTheme, parseTheme } from "@/utils/theme/themeUtils";
import { Haptics } from "@/utils/shared/haptics";

export default function ThemeFeatureModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const hasSeen = localStorage.getItem("ratiod_seen_theme_feature_v9");
    if (!hasSeen) {
      const t = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(t);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("ratiod_seen_theme_feature_v9", "true");
  };

  const { colorTheme: activeColorTheme } = parseTheme(theme);

  const handleSelectTheme = (colorId: string) => {
    if (activeColorTheme === colorId) return;
    Haptics.selection();
    setIsTransitioning(true);
    const newTheme = buildTheme("minimalist", colorId as any);
    setTheme(newTheme);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 320);
  };

  const defaultPresets = useMemo(() => 
    COLOR_THEMES.filter((t) => ["minimalist-dark", "default"].includes(t.id)),
    []
  );

  const collectionPresets = useMemo(() => 
    COLOR_THEMES.filter((t) => !["minimalist-dark", "default", "brutalist"].includes(t.id)),
    []
  );

  const renderThemeButton = (t: any) => {
    const isActive = activeColorTheme === t.id;
    const isMinimalistLight = t.id === "default";
    const isMinimalistDark = t.id === "minimalist-dark";
    const displayName = isMinimalistLight ? "minimalist light" : isMinimalistDark ? "minimalist dark" : t.name.toLowerCase();

    return (
      <motion.button
        key={t.id}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleSelectTheme(t.id)}
        className={`w-full py-5 px-5 min-h-[76px] rounded-[22px] border-2 transition-all duration-300 ease-out flex items-center justify-between pointer-events-auto text-left ${
          isActive
            ? "border-theme-highlight bg-theme-highlight/10 shadow-lg shadow-theme-highlight/5"
            : "border-theme-border bg-theme-surface/70 hover:bg-theme-surface hover:border-theme-text/20"
        }`}
      >
        <div className="flex flex-col items-start gap-1 min-w-0 flex-1 pr-4">
          <div className="flex items-center gap-2">
            <span
              className={`font-black text-[16px] lowercase tracking-tight leading-tight transition-colors duration-300 ${
                isActive ? "text-theme-highlight" : "text-theme-text"
              }`}
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              {displayName}
            </span>
            {isActive && (
              <div className="w-4 h-4 rounded-full bg-theme-highlight flex items-center justify-center text-theme-bg">
                <Check size={10} strokeWidth={3} />
              </div>
            )}
          </div>
          <span
            className="text-[12px] font-medium text-theme-muted lowercase leading-snug"
            style={{ fontFamily: "var(--font-afacad)" }}
          >
            {t.deity.toLowerCase()}{t.description ? ` • ${t.description.toLowerCase()}` : ""}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex gap-1.5 bg-black/20 p-2 rounded-full border border-white/5">
            {t.swatches.map((s: string, i: number) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full border border-black/20 shadow-sm"
                style={{ backgroundColor: s }}
              />
            ))}
          </div>
        </div>
      </motion.button>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="theme-feature-wrapper" className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
          <motion.div
            key="theme-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            key="theme-sheet"
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 400) {
                handleClose();
              }
            }}
            className="relative w-full sm:max-w-md bg-theme-bg border-t sm:border border-theme-border rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[80vh] transition-colors duration-400 ease-out z-10"
          >
            <div className="w-12 h-1.5 bg-theme-text-10 rounded-full mx-auto mt-3 mb-1 shrink-0 cursor-grab active:cursor-grabbing" />

            <motion.div
              animate={{ 
                filter: isTransitioning ? "blur(8px)" : "blur(0px)",
                opacity: isTransitioning ? 0.75 : 1 
              }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              <div className="pt-3 px-6 pb-4 flex items-start justify-between shrink-0">
                <div className="flex flex-col">
                  <h2
                    className="text-3xl font-black lowercase tracking-tighter text-theme-text leading-none transition-colors duration-300"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    themes
                  </h2>
                  <p
                    className="text-[13px] font-medium text-theme-muted mt-1.5 leading-tight transition-colors duration-300"
                    style={{ fontFamily: "var(--font-afacad)" }}
                  >
                    choose a palette. you can also switch anytime in your profile.
                  </p>
                </div>

                <button
                  onClick={handleClose}
                  className="w-9 h-9 rounded-full bg-theme-surface border border-theme-border flex items-center justify-center text-theme-muted hover:text-theme-text active:scale-90 transition-all shrink-0 mt-0.5"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-2 space-y-6">
                <div className="space-y-3">
                  <span
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted px-1 block transition-colors duration-300"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    defaults
                  </span>
                  <div className="flex flex-col gap-3.5">
                    {defaultPresets.map(renderThemeButton)}
                  </div>
                </div>

                <div className="space-y-3 pb-6">
                  <span
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted px-1 block transition-colors duration-300"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    collections
                  </span>
                  <div className="flex flex-col gap-3.5">
                    {collectionPresets.map(renderThemeButton)}
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="p-4 border-t border-theme-border bg-theme-bg/80 backdrop-blur-md shrink-0">
              <button
                onClick={handleClose}
                className="w-full py-4 rounded-[20px] bg-theme-highlight text-theme-bg font-black uppercase tracking-widest text-[13px] transition-all active:scale-[0.98] shadow-lg shadow-theme-highlight/20"
                style={{ fontFamily: "var(--font-montserrat)" }}
              >
                done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
