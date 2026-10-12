"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./Navbar";
import { usePathname, useRouter } from "next/navigation";
import { Haptics } from "@/utils/shared/haptics";

interface MinimalThemeProps {
  children: React.ReactNode;
  isSwipeDisabled?: boolean;
}

const BEZIER = [0.34, 0.15, 0.16, 0.96] as const;

export default function MinimalTheme({ children, isSwipeDisabled }: MinimalThemeProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAlertsOpen] = useState(false);

  const paths = ["/marks", "/attendance", "/dashboard", "/timetable", "/calendar"];

  const getActiveTab = () => {
    if (pathname === "/dashboard" || pathname === "/") return "home";
    return pathname.replace("/", "");
  };

  const activeTab = getActiveTab();

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [isScrollingVertical, setIsScrollingVertical] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSwipeDisabled) return;
    setIsScrollingVertical(false);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isSwipeDisabled || !touchStart || isScrollingVertical) return;

    const touchX = e.targetTouches[0].clientX;
    const touchY = e.targetTouches[0].clientY;

    const dx = Math.abs(touchX - touchStart.x);
    const dy = Math.abs(touchY - touchStart.y);

    if (dy > dx && dy > 10) {
      setIsScrollingVertical(true);
      return;
    }

    if (dx > 70) {
      const currentIndex = paths.indexOf(pathname);
      if (touchX < touchStart.x && currentIndex < paths.length - 1) {
        Haptics.heavy();
        router.push(paths[currentIndex + 1]);
        setTouchStart(null);
      } else if (touchX > touchStart.x && currentIndex > 0) {
        Haptics.heavy();
        router.push(paths[currentIndex - 1]);
        setTouchStart(null);
      }
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
    setIsScrollingVertical(false);
  };

  const baseBg = "bg-theme-bg";

  return (
    <div
      className={`h-full w-full ${baseBg} flex flex-col overflow-hidden relative`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ transform: "translateZ(0)", touchAction: "pan-y" }}
    >
      <div className="flex-1 relative">
        {children}
      </div>

      <AnimatePresence>
        {activeTab === "home" && !isAlertsOpen && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.6, ease: BEZIER }}
            className="absolute bottom-0 left-0 w-full z-50 bg-theme-bg"
          >
            <Navbar />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
