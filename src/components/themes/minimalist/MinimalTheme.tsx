"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Dashboard from "./Dashboard";
import MinimalAttendance from "./Attendance";
import MinimalMarks from "./Marks";
import MinimalTimetable from "./Timetable";
import Navbar from "./Navbar";

export default function MinimalTheme(props: any) {
  const [activeTab, setActiveTab] = useState("home");
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const tabs = ["marks", "attendance", "home", "timetable", "calendar"];

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
      setActiveTab(tabs[currentIndex + 1]);
    }

    if (isRightSwipe && currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
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
        <AnimatePresence mode="wait">
          {activeTab === "marks" && (
            <motion.div
              key="marks"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full overflow-hidden"
            >
              <MinimalMarks />
            </motion.div>
          )}

          {activeTab === "attendance" && (
            <motion.div
              key="attendance"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full overflow-hidden"
            >
              <MinimalAttendance />
            </motion.div>
          )}

          {activeTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full overflow-y-auto custom-scrollbar"
            >
              <Dashboard
                data={props.data}
                timeStatus={props.academia?.timeStatus}
                currentRoast={props.academia?.currentRoast || "analyzing..."}
              />
            </motion.div>
          )}

          {activeTab === "timetable" && (
            <motion.div
              key="timetable"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full overflow-hidden"
            >
              <MinimalTimetable />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {activeTab === "home" && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-0 left-0 w-full z-50"
          >
            <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
