"use client";
import React, { useState, useCallback } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { BottomNav } from "./BottomNav";
import { usePathname, useRouter } from "next/navigation";

interface BrutalistThemeProps {
  children: React.ReactNode;
  isSwipeDisabled?: boolean;
}

export default function BrutalistTheme({ children, isSwipeDisabled }: BrutalistThemeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const paths = ["/marks", "/attendance", "/", "/timetable", "/calendar"];

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isScrollingVertical, setIsScrollingVertical] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isSwipeDisabled) return;
    setIsScrollingVertical(false);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  }, [isSwipeDisabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
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
        try { if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(10); } catch (e) {}
        router.push(paths[currentIndex + 1]);
        setTouchStart(null);
      } else if (touchX > touchStart.x && currentIndex > 0) {
        try { if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(10); } catch (e) {}
        router.push(paths[currentIndex - 1]);
        setTouchStart(null);
      }
    }
  }, [pathname, router, touchStart, isScrollingVertical, paths, isSwipeDisabled]);

  const handleTouchEnd = useCallback(() => {
    setTouchStart(null);
    setIsScrollingVertical(false);
  }, []);

  return (
    <div 
      className="h-[100dvh] w-full bg-black relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: "pan-y" }}
    >
      <LayoutGroup>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-0 left-0 w-full h-full bg-[#050505]"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>

      {!isLoading && (
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <BottomNav />
          </div>
        </div>
      )}
    </div>
  );
}

