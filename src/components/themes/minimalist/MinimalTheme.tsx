"use client";
import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Dashboard from "./dashboard/Dashboard";
import Attendance from "./attendance/Attendance";
import Marks from "./marks/Marks";
import Timetable from "./timetable/Timetable";
import Calendar from "./calendar/Calendar";
import Navbar from "./Navbar";

import { AcademiaData } from "@/types";

interface MinimalThemeProps {
  data: AcademiaData;
  academia: any;
  onOpenSettings: () => void;
  startEntrance: boolean;
  isDark: boolean;
}

export default function MinimalTheme(props: MinimalThemeProps) {
  const [tabState, setTabState] = useState({ activeTab: "home", direction: 0 });
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isSwipeDisabled, setIsSwipeDisabled] = useState(false);
  const { activeTab, direction } = tabState;
  const isDark = props.isDark;

  const tabs = ["marks", "attendance", "home", "timetable", "calendar"];

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [isScrollingVertical, setIsScrollingVertical] = useState(false);

  const handleTabChange = (newTab: string) => {
    const currentIndex = tabs.indexOf(activeTab);
    const newIndex = tabs.indexOf(newTab);
    setTabState({
      activeTab: newTab,
      direction: newIndex > currentIndex ? 1 : -1,
    });
  };

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
      const currentIndex = tabs.indexOf(activeTab);
      if (touchX < touchStart.x && currentIndex < tabs.length - 1) {
        handleTabChange(tabs[currentIndex + 1]);
        setTouchStart(null);
      } else if (touchX > touchStart.x && currentIndex > 0) {
        handleTabChange(tabs[currentIndex - 1]);
        setTouchStart(null);
      }
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
    setIsScrollingVertical(false);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  const baseBg = isDark ? "bg-[#111111]" : "bg-[#F7F7F7]";

  return (
    <div
      className={`h-[100dvh] w-full ${baseBg} flex flex-col overflow-hidden relative`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ transform: "translateZ(0)", touchAction: "pan-y" }}
    >
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 500, damping: 50, mass: 1 },
              opacity: { duration: 0.2 },
            }}
            className="h-full w-full absolute inset-0 overflow-hidden"
            style={{ willChange: "transform, opacity" }}
          >
            {activeTab === "marks" && (
              <Marks
                data={props.data}
                setIsSwipeDisabled={setIsSwipeDisabled}
                isDark={isDark}
              />
            )}
            {activeTab === "attendance" && (
              <Attendance
                data={props.data}
                academia={props.academia}
                setIsSwipeDisabled={setIsSwipeDisabled}
                isDark={isDark}
              />
            )}
            {activeTab === "home" && (
              <div className="h-full w-full overflow-y-auto no-scrollbar">
                <Dashboard
                  data={props.data}
                  academia={props.academia}
                  setActiveTab={handleTabChange}
                  onOpenSettings={props.onOpenSettings}
                  isAlertsOpen={isAlertsOpen}
                  setIsAlertsOpen={setIsAlertsOpen}
                  setIsSwipeDisabled={setIsSwipeDisabled}
                  startEntrance={props.startEntrance}
                  isDark={isDark}
                />
              </div>
            )}
            {activeTab === "timetable" && (
              <Timetable
                data={props.data}
                academia={props.academia}
                setIsSwipeDisabled={setIsSwipeDisabled}
                startEntrance={props.startEntrance}
                isDark={isDark}
              />
            )}
            {activeTab === "calendar" && (
              <Calendar
                data={props.data}
                academia={props.academia}
                isDark={isDark}
              />
            )}
          </motion.div>
        </AnimatePresence>
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
            <Navbar activeTab={activeTab} setActiveTab={handleTabChange} isDark={isDark} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
