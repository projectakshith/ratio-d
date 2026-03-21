"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./Navbar";
import { usePathname, useRouter } from "next/navigation";

interface MinimalThemeProps {
  children: React.ReactNode;
}

export default function MinimalTheme({ children }: MinimalThemeProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAlertsOpen] = useState(false);
  const [isSwipeDisabled] = useState(false);

  const paths = ["/marks", "/attendance", "/", "/timetable", "/calendar"];

  const getActiveTab = () => {
    if (pathname === "/") return "home";
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
        router.push(paths[currentIndex + 1]);
        setTouchStart(null);
      } else if (touchX > touchStart.x && currentIndex > 0) {
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
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute bottom-0 left-0 w-full z-50"
          >
            <Navbar />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
