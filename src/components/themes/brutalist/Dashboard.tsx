"use client";
import React, { useState, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Zap,
  ArrowUpRight,
  Bell,
  ChevronRight,
  Loader,
  AlertTriangle,
  GraduationCap,
} from "lucide-react";
import { BentoTile } from "./BentoTile";
import { StudentProfile, AttendanceRecord } from "@/types";

const springTransition: any = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 1,
};

const accordionVariants: any = {
  hidden: {
    opacity: 0,
    height: 0,
    marginTop: 0,
    transition: {
      height: { duration: 0.3, ease: "easeInOut" },
      opacity: { duration: 0.2 },
    },
  },
  visible: {
    opacity: 1,
    height: "auto",
    marginTop: 24,
    transition: {
      height: { duration: 0.3, ease: "easeInOut" },
      opacity: { duration: 0.3, delay: 0.1 },
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    marginTop: 0,
    transition: {
      height: { duration: 0.3, ease: "easeInOut" },
      opacity: { duration: 0.15 },
    },
  },
};

interface HomeDashboardProps {
  onProfileClick: () => void;
  profile?: StudentProfile;
  attendance?: AttendanceRecord[];
  displayName?: string;
  timeStatus?: {
    nextClass: any;
    currentClass: any;
  };
  upcomingAlerts?: any[];
  overallAttendance?: number;
  criticalAttendance?: any[];
}

const HomeDashboard = ({
  onProfileClick,
  profile,
  displayName,
  timeStatus = { nextClass: null, currentClass: null },
  upcomingAlerts = [],
  overallAttendance = 0,
  criticalAttendance = [],
}: HomeDashboardProps) => {
  const [isAlertExpanded, setIsAlertExpanded] = useState(false);
  const [isMetricExpanded, setIsMetricExpanded] = useState(false);
  const [metricMode, setMetricMode] = useState("attendance");
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startX = useRef(0);

  const studentName =
    displayName || (profile?.name ? profile.name.split(" ")[0] : "Student");

  const nextSubject = timeStatus?.nextClass?.course || "No more classes";
  const nextSubjectSplit = nextSubject.split(" ");
  const displayNext =
    nextSubjectSplit.length > 1
      ? {
          top: nextSubjectSplit
            .slice(0, Math.ceil(nextSubjectSplit.length / 2))
            .join(" "),
          bottom: nextSubjectSplit
            .slice(Math.ceil(nextSubjectSplit.length / 2))
            .join(" "),
        }
      : { top: nextSubject, bottom: "" };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      startX.current = e.touches[0].clientX;
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const diffY = currentY - startY.current;
    const diffX = currentX - startX.current;

    if (Math.abs(diffX) > Math.abs(diffY)) return;

    if (
      containerRef.current &&
      containerRef.current.scrollTop <= 0 &&
      diffY > 0 &&
      !isRefreshing
    ) {
      if (diffY < 200) {
        if (e.cancelable) e.preventDefault();
      }
      setPullY(Math.pow(diffY, 0.8));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (pullY > 80) {
      setIsRefreshing(true);
      setPullY(80);
      if (navigator.vibrate) navigator.vibrate(20);
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } else {
      setPullY(0);
    }
  };

  return (
    <div className="h-full w-full bg-[#050505] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[200px] bg-[#fdfdfd] z-0" />

      {/* Pull to Refresh Indicator */}
      <div
        className="absolute top-0 left-0 w-full flex justify-center pt-8 z-0 transition-opacity duration-300"
        style={{
          opacity: Math.min(pullY / 60, 1),
          transform: `translateY(${pullY * 0.3}px)`,
        }}
      >
        <Loader
          className="w-6 h-6 text-black/80"
          style={{
            animation: isRefreshing ? "spin 1s linear infinite" : "none",
            transform: `rotate(${pullY * 2}deg)`,
          }}
        />
      </div>

      <div
        ref={containerRef}
        className="h-full w-full relative z-10 overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <motion.div
          animate={{ y: pullY }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex flex-col min-h-full"
        >
          {/* Header Section */}
          <motion.div
            layout
            initial={{ height: "auto", borderRadius: 0 }}
            animate={{
              height: "auto",
              borderRadius: "0 0 48px 48px",
            }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={`bg-[#fdfdfd] flex flex-col relative overflow-hidden shrink-0 z-20 ${
              isAlertExpanded || isMetricExpanded ? "flex-[2]" : "flex-[7]"
            }`}
            style={{ padding: "32px 32px 40px 32px" }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 pointer-events-none" />
            <div className="flex justify-between items-center w-full relative z-20 mb-auto">
              <motion.div
                layout="position"
                className="flex items-center gap-3 text-black"
              >
                <span
                  className="text-xl font-black lowercase tracking-tight"
                  style={{ fontFamily: "Urbanosta" }}
                >
                  ratio'd
                </span>
              </motion.div>
            </div>

            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col relative z-10 mt-8"
              >
                <motion.div
                  layout="position"
                  className="flex items-center gap-3 mb-10"
                >
                  <h1
                    className="text-[24px] md:text-[28px] font-bold lowercase tracking-tight text-black/20 leading-none"
                    style={{ fontFamily: "Aonic" }}
                  >
                    hello, <span className="text-black">{studentName}</span>
                  </h1>
                  <button
                    onClick={onProfileClick}
                    className="w-9 h-9 rounded-full overflow-hidden border-2 border-black/5 active:scale-90 transition-transform shadow-sm"
                  >
                    <img
                      src="https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/avatars/c3/c33a1d7eec9e9ad8bfa7e82891e418b81dbc0fce_full.jpg"
                      className="object-cover w-full h-full"
                      alt="Profile"
                    />
                  </button>
                </motion.div>

                {!isAlertExpanded && !isMetricExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    className="flex flex-col"
                  >
                    <span
                      className="text-[16px] md:text-[18px] font-bold lowercase tracking-tight text-black/40 leading-none"
                      style={{ fontFamily: "Aonic" }}
                    >
                      {timeStatus?.nextClass
                        ? "your next class is"
                        : "you are all done"}
                    </span>
                    <div className="flex flex-col mt-2 w-full break-words">
                      <span
                        className="text-[#3233ff] truncate text-[4.5vw] md:text-[3rem] leading-[0.8] font-black tracking-tight"
                        style={{ fontFamily: "Akira" }}
                      >
                        {displayNext.top}
                      </span>
                      <span
                        className="truncate text-[8vw] md:text-[6rem] font-black tracking-tighter -mt-1 md:-mt-2"
                        style={{ fontFamily: "Akira" }}
                      >
                        {displayNext.bottom}
                      </span>
                    </div>
                  </motion.div>
                )}

                {!isAlertExpanded && !isMetricExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    className="flex flex-wrap items-center gap-2 mt-6 md:mt-8 w-full"
                  >
                    <div
                      className="bg-black text-white px-3 py-2 rounded-xl text-[10px] md:text-[11px] font-bold lowercase border border-black/5 flex-shrink-0"
                      style={{ fontFamily: "Aonic" }}
                    >
                      {timeStatus?.currentClass
                        ? `⭐ current: ${timeStatus.currentClass.course}`
                        : "☕ currently free"}
                    </div>
                    {timeStatus?.currentClass && (
                      <div
                        className="bg-black/5 px-3 py-2 rounded-xl text-[10px] md:text-[11px] font-bold lowercase text-black/60 border border-black/5 flex-shrink-0"
                        style={{ fontFamily: "Aonic" }}
                      >
                        📍 {timeStatus.currentClass.room}
                      </div>
                    )}
                    {timeStatus?.nextClass && (
                      <div
                        className="bg-black/5 px-3 py-2 rounded-xl text-[10px] md:text-[11px] font-bold lowercase text-black/60 border border-black/5 flex-shrink-0"
                        style={{ fontFamily: "Aonic" }}
                      >
                        ⏰ {timeStatus.nextClass.time}
                      </div>
                    )}
                    <div className="ml-auto w-10 h-10 bg-black rounded-full flex items-center justify-center text-white active:scale-90 transition-transform flex-shrink-0 shadow-lg">
                      <ArrowUpRight size={20} />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <LayoutGroup>
            <motion.div
              layout
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springTransition}
              className="px-1.5 w-full flex flex-col gap-10 flex-none mt-1.5 shrink-0"
            >
              <BentoTile
                as={motion.div}
                layout
                transition={springTransition}
                onClick={() => {
                  setIsAlertExpanded(!isAlertExpanded);
                  if (isMetricExpanded) setIsMetricExpanded(false);
                }}
                className={`bg-[#ff003c] !px-8 flex flex-col text-white rounded-[32px] cursor-pointer overflow-hidden ${
                  isAlertExpanded ? "h-[250px]" : "h-[75px]"
                }`}
              >
                <motion.div
                  layout="position"
                  className="flex justify-between items-center w-full relative z-10 py-0 -mt-1.5"
                >
                  <div className="flex items-center gap-3">
                    <Bell size={20} />
                    <p
                      className="font-bold text-xl md:text-2xl tracking-normal lowercase"
                      style={{ fontFamily: "Aonic" }}
                    >
                      academic alerts
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
                    <ChevronRight
                      size={16}
                      className={`transition-transform duration-500 ${
                        isAlertExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                </motion.div>
                <AnimatePresence>
                  {isAlertExpanded && (
                    <motion.div
                      key="alerts-content"
                      variants={accordionVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="w-full relative z-10"
                    >
                      {upcomingAlerts.length > 0 ? (
                        upcomingAlerts.map((alert, i) => (
                          <div
                            key={i}
                            className="bg-white p-3 rounded-xl flex flex-col gap-1 border border-black/5 shadow-sm mb-2 last:mb-0"
                          >
                            <div className="flex justify-between items-start">
                              <span
                                className="text-[12px] font-bold leading-tight text-black line-clamp-2"
                                style={{ fontFamily: "Aonic" }}
                              >
                                {alert.description}
                              </span>
                              {alert.type === "exam" && (
                                <span className="bg-[#ff003c] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md ml-2 flex-shrink-0">
                                  EXAM
                                </span>
                              )}
                            </div>
                            <span
                              className="text-[10px] font-bold text-black/40 uppercase tracking-wide"
                              style={{ fontFamily: "Aonic" }}
                            >
                              {alert.date} • {alert.day}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div
                          className="bg-black/20 p-4 rounded-2xl font-bold text-[11px] lowercase text-white tracking-normal"
                          style={{ fontFamily: "Aonic" }}
                        >
                          no upcoming exams
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </BentoTile>

              <BentoTile
                as={motion.div}
                layout
                transition={springTransition}
                onClick={() => {
                  setIsMetricExpanded(!isMetricExpanded);
                  if (isAlertExpanded) setIsAlertExpanded(false);
                }}
                className={`bg-[#ceff1c] flex-1 flex flex-col relative -top-8 rounded-t-[48px] !px-5 !pb-[60vh] -mb-[40vh] overflow-hidden cursor-pointer ${
                  isMetricExpanded
                    ? "min-h-[400px]"
                    : "min-h-[220px] md:min-h-[250px]"
                }`}
              >
                <motion.div
                  layout="position"
                  className="flex justify-between items-start w-full z-10 pt-0 shrink-0"
                >
                  <div className="w-11 h-11 bg-black rounded-full flex items-center justify-center shadow-xl">
                    {metricMode === "attendance" ? (
                      <Zap
                        size={20}
                        className="text-[#ceff1c]"
                        fill="currentColor"
                      />
                    ) : (
                      <GraduationCap
                        size={20}
                        className="text-[#ceff1c]"
                        fill="currentColor"
                      />
                    )}
                  </div>
                  <div
                    className="bg-black/90 backdrop-blur-xl text-white p-1 rounded-full flex items-center text-[9px] md:text-[10px] font-bold uppercase tracking-[0.1em]"
                    style={{ fontFamily: "Aonic" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      onClick={() => setMetricMode("attendance")}
                      className={`px-4 py-2 rounded-full cursor-pointer transition-colors ${
                        metricMode === "attendance"
                          ? "bg-[#ceff1c] text-black shadow-sm"
                          : "text-white/40 hover:text-white"
                      }`}
                    >
                      attendance
                    </div>
                    <div
                      onClick={() => setMetricMode("marks")}
                      className={`px-4 py-2 rounded-full cursor-pointer transition-colors ${
                        metricMode === "marks"
                          ? "bg-[#ceff1c] text-black shadow-sm"
                          : "text-white/40 hover:text-white"
                      }`}
                    >
                      marks
                    </div>
                  </div>
                </motion.div>
                <div className="flex flex-col w-full relative h-full">
                  <AnimatePresence mode="wait">
                    {isMetricExpanded ? (
                      <motion.div
                        key="expanded"
                        variants={accordionVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="w-full flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="text-[14px] font-bold text-black/40 lowercase"
                            style={{ fontFamily: "Aonic" }}
                          >
                            {metricMode === "attendance"
                              ? "needs attention"
                              : "academic status"}
                          </span>
                          <div className="h-[1px] flex-1 bg-black/10 ml-4"></div>
                        </div>
                        {metricMode === "attendance" ? (
                          criticalAttendance.length > 0 ? (
                            criticalAttendance.map((subj, i) => (
                              <div
                                key={i}
                                className="bg-black/10 p-4 rounded-2xl flex items-center justify-between w-full"
                              >
                                <span
                                  className="font-bold text-[13px] text-black w-[60%] leading-tight truncate"
                                  style={{ fontFamily: "Aonic" }}
                                >
                                  {subj.displayName}
                                </span>
                                <div className="flex flex-col items-end">
                                  <div className="flex items-center gap-1 text-[#ff003c]">
                                    <AlertTriangle size={14} />
                                    <span
                                      className="font-black text-[14px] lowercase"
                                      style={{ fontFamily: "Aonic" }}
                                    >
                                      {subj.required} required
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="bg-black/5 p-4 rounded-2xl text-center w-full">
                              <span
                                className="font-bold text-[12px] text-black/60"
                                style={{ fontFamily: "Aonic" }}
                              >
                                attendance is safe
                              </span>
                            </div>
                          )
                        ) : (
                          <div className="bg-black/5 p-4 rounded-2xl text-center w-full">
                            <span
                              className="font-bold text-[12px] text-black/60"
                              style={{ fontFamily: "Aonic" }}
                            >
                              no marks data available
                            </span>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="collapsed"
                        variants={accordionVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="flex justify-between items-end w-full absolute -bottom-22 left-0"
                      >
                        <div>
                          <p
                            className="text-[10px] font-bold uppercase text-black/30 tracking-widest mb-1"
                            style={{ fontFamily: "Aonic" }}
                          >
                            {metricMode === "attendance"
                              ? "overall"
                              : "average"}
                          </p>
                          <h2
                            className="text-[28px] md:text-[34px] font-bold leading-[0.95] text-black tracking-normal lowercase"
                            style={{ fontFamily: "Aonic" }}
                          >
                            {metricMode === "attendance" ? (
                              <>
                                you are <br /> doing well
                              </>
                            ) : (
                              <>
                                academic <br /> performance
                              </>
                            )}
                          </h2>
                        </div>
                        <div
                          className="text-[80px] md:text-[88px] font-black leading-[0.7] tracking-[-0.04em] text-black"
                          style={{ fontFamily: "Urbanosta" }}
                        >
                          {metricMode === "attendance"
                            ? overallAttendance
                            : "N/A"}
                          <span className="text-[34px] opacity-20 tracking-normal">
                            {metricMode === "attendance" ? "%" : ""}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </BentoTile>
            </motion.div>
          </LayoutGroup>
        </motion.div>
      </div>
    </div>
  );
};

export default HomeDashboard;
