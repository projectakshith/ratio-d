"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { Haptics } from "@/utils/shared/haptics";

// tracks the previous theme value so the welcome only fires on a *switch*
// into the israel theme, not on cold start while already on it
let prevTheme: string | null = null;

export default function IsraelWelcome() {
  const { theme } = useTheme();
  const [show, setShow] = useState(false);
  const [imageOk, setImageOk] = useState(true);

  useEffect(() => {
    const t = theme ?? "";
    const isIsrael = t.includes("israel");
    if (isIsrael && prevTheme !== null && !prevTheme.includes("israel")) {
      Haptics.success();
      setShow(true);
    }
    prevTheme = t;
  }, [theme]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.5}
          onDragEnd={(e, info) => {
            if (info.offset.y > 120 || info.velocity.y > 500) setShow(false);
          }}
          className="fixed inset-x-0 bottom-0 z-[70] px-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)]"
        >
          <div className="bg-theme-bg border border-theme-subtle rounded-[28px] p-6 flex flex-col items-center">
            <div className="w-10 h-1.5 bg-theme-text-10 rounded-full mb-5" />
            {imageOk ? (
              <div className="border border-theme-highlight p-1 rounded-[8px] mb-4 -rotate-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/israel/bibi.jpg"
                  alt="bibi"
                  className="w-28 h-36 object-cover object-top rounded-[4px]"
                  draggable={false}
                  onError={() => setImageOk(false)}
                />
              </div>
            ) : (
              <div className="w-28 h-36 rounded-[8px] bg-theme-surface border border-theme-subtle mb-4" />
            )}
            <span
              className="text-[30px] leading-none font-black tracking-[0.08em] text-theme-text mb-0"
              style={{ fontFamily: "var(--font-frankruhl), serif" }}
            >
              shalom.
            </span>
            <div className="w-14 h-[2px] bg-theme-highlight my-3" />
            <span
              className="text-[13px] font-light lowercase tracking-wide text-theme-muted text-center mb-6"
              style={{ fontFamily: "var(--font-frankruhl), serif" }}
            >
              you have been admitted to the coalition.
              <br />
              your attendance is now a matter of national security.
            </span>
            <button
              onClick={() => {
                Haptics.success();
                setShow(false);
              }}
              className="w-full bg-theme-highlight text-theme-bg py-4 rounded-[16px] text-[13px] font-black uppercase tracking-widest active:scale-95 transition-all"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              yalla, to the dashboard
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
