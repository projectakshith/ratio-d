"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Dashboard from "./Dashboard";
import MinimalAttendance from "./Attendance";
import MinimalMarks from "./Marks";
import MinimalTimetable from "./Timetable";
import MinimalCalendar from "./Calendar";
import Navbar from "./Navbar";

export default function MinimalTheme(props: any) {
  const [tabState, setTabState] = useState({ activeTab: "home", direction: 0 });
  const { activeTab, direction } = tabState;

  const tabs = ["marks", "attendance", "home", "timetable", "calendar"];

  const handleTabChange = (newTab: string) => {
    const currentIndex = tabs.indexOf(activeTab);
    const newIndex = tabs.indexOf(newTab);
    setTabState({
      activeTab: newTab,
      direction: newIndex > currentIndex ? 1 : -1,
    });
  };

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    const currentIndex = tabs.indexOf(activeTab);

    if (isLeftSwipe && currentIndex < tabs.length - 1) {
      handleTabChange(tabs[currentIndex + 1]);
    }
    if (isRightSwipe && currentIndex > 0) {
      handleTabChange(tabs[currentIndex - 1]);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "30%" : "-30%",
      opacity: 0,
      filter: "blur(8px)",
    }),
    center: {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "30%" : "-30%",
      opacity: 0,
      filter: "blur(8px)",
    }),
  };

  return (
    <div
      className="h-[100dvh] w-full bg-[#F7F7F7] flex flex-col overflow-hidden relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700;800;900&display=swap');
        `,
        }}
      />

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
              x: { type: "spring", stiffness: 600, damping: 45, mass: 0.8 },
              opacity: { duration: 0.12 },
              filter: { duration: 0.15 },
            }}
            className="h-full w-full absolute inset-0 overflow-hidden"
          >
            {activeTab === "marks" && <MinimalMarks />}
            {activeTab === "attendance" && <MinimalAttendance />}
            {activeTab === "home" && (
              <div className="h-full w-full overflow-y-auto no-scrollbar">
                <Dashboard
                  data={props.data}
                  timeStatus={props.academia?.timeStatus}
                  currentRoast={props.academia?.currentRoast || "analyzing..."}
                  setActiveTab={handleTabChange}
                  onOpenSettings={props.onOpenSettings}
                />
              </div>
            )}
            {activeTab === "timetable" && <MinimalTimetable />}
            {activeTab === "calendar" && <MinimalCalendar />}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {activeTab === "home" && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
            className="absolute bottom-0 left-0 w-full z-50"
          >
            <Navbar activeTab={activeTab} setActiveTab={handleTabChange} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
