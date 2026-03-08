"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import Dashboard from "./Dashboard";
import { BottomNav } from "./BottomNav";
import Timetable from "./Timetable";
import MobileAttendance from "./MobileAttendance";
import CalendarPage from "./CalendarPage";
import MarksPage from "./MarksPage";
import { flavorText } from "@/utils/shared/flavortext";
import { AcademiaData } from "@/types";

interface BrutalistThemeProps {
  data: AcademiaData;
  academia: any;
  onLogout: () => void;
  customDisplayName?: string;
  onUpdateName?: (name: string) => void;
  onOpenSettings: () => void;
}

const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [textParts, setTextParts] = useState({ top: "", bottom: "" });

  useEffect(() => {
    const roasts = flavorText?.loading || [
      "loading system...",
      "optimizing bunks...",
    ];
    const fullText = roasts[Math.floor(Math.random() * roasts.length)];
    const words = fullText.split(" ");

    if (words.length > 2) {
      const splitPoint = Math.ceil(words.length / 3);
      setTextParts({
        top: words.slice(0, splitPoint).join(" "),
        bottom: words.slice(splitPoint).join(" "),
      });
    } else {
      setTextParts({ top: "system", bottom: fullText });
    }

    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ y: 0 }}
      exit={{ y: "-100%" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[100] bg-white flex flex-col p-10 pt-10 pointer-events-none"
    >
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col gap-1 mb-auto"
      >
        <span
          className="text-xl font-black lowercase tracking-tight text-black"
          style={{ fontFamily: "Urbanosta" }}
        >
          ratio'd
        </span>
        <div className="h-[1px] w-6 bg-black" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/20">
          alpha v1.0.4
        </span>
      </motion.div>

      <div className="mt-auto mb-24 w-full max-w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col"
        >
          <span
            className="text-[4.5vw] md:text-[1rem] font-black text-black/20 lowercase block leading-tight mb-1"
            style={{ fontFamily: "Akira" }}
          >
            {textParts.top}
          </span>
          <h2
            className="text-[8vw] md:text-[2.8rem] font-black text-black lowercase leading-[0.95] tracking-tighter break-words"
            style={{ fontFamily: "Akira" }}
          >
            {textParts.bottom}
          </h2>
        </motion.div>
        <div className="h-[2px] bg-black/5 mt-10 w-full relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-black"
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            transition={{ duration: 2.8, ease: "easeInOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default function BrutalistTheme({
  data,
  academia,
  customDisplayName,
  onOpenSettings,
}: BrutalistThemeProps) {
  const [[activeTab, direction], setTabState] = useState(["home", 0]);
  const [isLoading, setIsLoading] = useState(true);

  const setPage = (newTab: string) => {
    const tabs = ["marks", "attendance", "home", "timetable", "calendar"];
    const newIndex = tabs.indexOf(newTab);
    const currentIndex = tabs.indexOf(activeTab);
    setTabState([newTab, newIndex > currentIndex ? 1 : -1]);
  };

  return (
    <div className="h-[100dvh] w-full bg-theme-bg relative overflow-hidden">
      <LayoutGroup>
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <LoadingScreen
              key="loader"
              onComplete={() => setIsLoading(false)}
            />
          ) : (
            <motion.div
              key={activeTab}
              custom={direction}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute top-0 left-0 w-full h-full bg-theme-bg"
            >
              {activeTab === "home" && (
                <Dashboard
                  profile={data?.profile}
                  attendance={data?.attendance}
                  displayName={customDisplayName}
                  timeStatus={academia.timeStatus}
                  upcomingAlerts={academia.upcomingAlerts}
                  overallAttendance={academia.overallAttendance}
                  criticalAttendance={academia.criticalAttendance}
                  onProfileClick={onOpenSettings}
                />
              )}
              {activeTab === "timetable" && (
                <Timetable
                  schedule={academia.effectiveSchedule}
                  dayOrder={academia.effectiveDayOrder}
                  data={data}
                />
              )}
              {activeTab === "attendance" && (
                <MobileAttendance
                  data={data}
                  schedule={academia.effectiveSchedule}
                />
              )}
              {activeTab === "marks" && <MarksPage data={data} />}
              {activeTab === "calendar" && (
                <CalendarPage data={data} academia={academia} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>

      {!isLoading && (
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <BottomNav activeTab={String(activeTab)} setActiveTab={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
