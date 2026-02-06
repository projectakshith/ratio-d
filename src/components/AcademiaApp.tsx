"use client";
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Zap, ArrowUpRight, Bell, ChevronRight, Loader, AlertTriangle, GraduationCap } from "lucide-react";

import { BentoTile } from "./BentoTile";
import Timetable from "./Timetable";
import { BottomNav } from "./BottomNav";
import SettingsPage from "./SettingsPage";
import MobileAttendance from "./MobileAttendance";
import CalendarPage from "./CalendarPage";
import {
  requestNotificationPermission,
  sendNotification,
} from "../utils/notifs";
import calendarData from "../../public/calendar_data.json";
import MarksPage from './MarksPage';


const springTransition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 1
};

const accordionVariants = {
  hidden: { 
    opacity: 0, 
    height: 0, 
    marginTop: 0,
    transition: { 
      height: { duration: 0.3, ease: "easeInOut" }, 
      opacity: { duration: 0.2 } 
    }
  },
  visible: { 
    opacity: 1, 
    height: "auto", 
    marginTop: 24, 
    transition: { 
      height: { duration: 0.3, ease: "easeInOut" },
      opacity: { duration: 0.3, delay: 0.1 } 
    }
  },
  exit: { 
    opacity: 0, 
    height: 0, 
    marginTop: 0,
    transition: { 
      height: { duration: 0.3, ease: "easeInOut" },
      opacity: { duration: 0.15 } 
    }
  }
};

const parseTimeValues = (timeStr) => {
  if (!timeStr) return 0;
  let [h, m] = timeStr.split(":").map(Number);
  if (h < 7) h += 12;
  if (h === 12) h = 12;
  return h * 60 + m;
};

const getScheduleStatus = (schedule, activeDayOrder) => {
  const targetDay =
    activeDayOrder && activeDayOrder !== "-" ? activeDayOrder : "1";
  const dayKey = `Day ${targetDay}`;
  const todaySchedule = schedule?.[dayKey];

  if (!todaySchedule)
    return { status: "free", nextClass: null, currentClass: null };

  const now = new Date();
  const currentTimeVal = now.getHours() * 60 + now.getMinutes();

  const sortedSlots = Object.entries(todaySchedule)
    .map(([timeRange, details]) => {
      const [startStr, endStr] = timeRange.split(" - ");
      return {
        ...details,
        time: timeRange,
        startMinutes: parseTimeValues(startStr),
        endMinutes: parseTimeValues(endStr),
      };
    })
    .sort((a, b) => a.startMinutes - b.startMinutes);

  let currentClass = null;
  let nextClass = null;

  for (const slot of sortedSlots) {
    if (
      currentTimeVal >= slot.startMinutes &&
      currentTimeVal < slot.endMinutes
    ) {
      currentClass = slot;
    } else if (currentTimeVal < slot.startMinutes && !nextClass) {
      nextClass = slot;
    }
  }

  return { status: currentClass ? "busy" : "free", nextClass, currentClass };
};

const LoadingScreen = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-end">
      <motion.div
        layoutId="hero-white-card"
        initial={{ y: "100%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 bg-[#fdfdfd]"
      >
        <div className="flex justify-between items-center w-full absolute top-12 left-0 px-8 md:px-10 z-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
            className="flex items-center gap-3 text-black"
          >
            <img
              src="/icons/icon-192.png"
              className="w-6 h-6 object-contain"
              alt="Logo"
            />
            <span
              className="text-xl font-black lowercase tracking-tight"
              style={{ fontFamily: "Urbanosta" }}
            >
              ratio'd
            </span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

const HomeDashboard = ({
  onProfileClick,
  profile,
  schedule,
  attendance,
  marks,
  dayOrder,
  displayName,
  isLoading,
  onLoadingComplete,
}) => {
  const [isAlertExpanded, setIsAlertExpanded] = useState(false);
  const [isMetricExpanded, setIsMetricExpanded] = useState(false);
  const [metricMode, setMetricMode] = useState("attendance");
  
  const containerRef = useRef(null);
  const [timeStatus, setTimeStatus] = useState({
    nextClass: null,
    currentClass: null,
  });

  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startX = useRef(0);

  const upcomingAlerts = useMemo(() => {
    if (!calendarData) return [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return calendarData
      .map(item => ({ ...item, dateObj: new Date(item.date) }))
      .filter(item => !isNaN(item.dateObj) && item.dateObj >= now && item.type === 'exam')
      .sort((a, b) => a.dateObj - b.dateObj)
      .slice(0, 2);
  }, []);

  useEffect(() => {
    if (schedule) setTimeStatus(getScheduleStatus(schedule, dayOrder));
  }, [schedule, dayOrder]);

  const overallAttendance = useMemo(() => {
    if (!attendance || attendance.length === 0) return 0;
    const totalConducted = attendance.reduce(
      (acc, curr) => acc + curr.conducted,
      0,
    );
    const totalAbsent = attendance.reduce((acc, curr) => acc + curr.absent, 0);
    const totalPresent = totalConducted - totalAbsent;
    return totalConducted === 0
      ? 0
      : Math.round((totalPresent / totalConducted) * 100);
  }, [attendance]);

  const criticalAttendance = useMemo(() => {
    if (!attendance) return [];
    return attendance
        .map(subj => {
            const present = subj.conducted - subj.absent;
            const percent = subj.conducted === 0 ? 0 : (present / subj.conducted) * 100;
            const req = Math.ceil(3 * subj.conducted - 4 * present);
            
          
            const courseCode = subj.code || (subj.course ? subj.course.split(" ")[0] : "");
            const displayTitle = subj.title || SUBJECT_MAP[courseCode] || subj.course || "Subject";

            return { 
                ...subj, 
                percent, 
                required: req > 0 ? req : 0,
                displayName: displayTitle
            };
        })
        .filter(subj => subj.percent < 75);
  }, [attendance]);

  const overallMarks = useMemo(() => {
      if (!marks || marks.length === 0) return 0;
      return 0; 
  }, [marks]);

  const studentName =
    displayName || (profile?.name ? profile.name.split(" ")[0] : "Student");

  const nextSubject = timeStatus.nextClass?.course || "No more classes";
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

  const handleTouchStart = (e) => {
    if (containerRef.current?.scrollTop <= 0 && !isLoading) {
      startY.current = e.touches[0].clientY;
      startX.current = e.touches[0].clientX;
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || isLoading) return;
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const diffY = currentY - startY.current;
    const diffX = currentX - startX.current;

    if (Math.abs(diffX) > Math.abs(diffY)) return;

    if (containerRef.current?.scrollTop <= 0 && diffY > 0 && !isRefreshing) {
      if (diffY < 200) e.preventDefault();
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

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(onLoadingComplete, 1800);
      return () => clearTimeout(timer);
    }
  }, [isLoading, onLoadingComplete]);

  return (
    <div className="h-full w-full bg-[#050505] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[200px] bg-[#fdfdfd] z-0" />

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
          <motion.div
            layout
            initial={{ height: "100vh", borderRadius: 0 }}
            animate={{
              height: isLoading ? "100vh" : "auto",
              borderRadius: isLoading ? 0 : "0 0 48px 48px",
            }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={`bg-[#fdfdfd] flex flex-col relative overflow-hidden shrink-0 z-20 ${isAlertExpanded || isMetricExpanded ? "flex-[2]" : "flex-[7]"}`}
            style={{ padding: "32px 32px 40px 32px" }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 pointer-events-none" />

            <div className="flex justify-between items-center w-full relative z-20 mb-auto">
              <motion.div
                layout="position"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
                className="flex items-center gap-3 text-black"
              >
                <img
                  src="/icons/icon-192.png"
                  className="w-6 h-6 object-contain"
                  alt="Logo"
                />
                <span
                  className="text-xl font-black lowercase tracking-tight"
                  style={{ fontFamily: "Urbanosta" }}
                >
                  ratio'd
                </span>
              </motion.div>
            </div>

            <AnimatePresence>
              {!isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex flex-col relative z-10 mt-8"
                >
                  <motion.div layout="position" className="flex items-center gap-3 mb-10">
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
                        {timeStatus.nextClass
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
                          className="truncate text-[8vw] md:text-[6rem] leading-[1] font-black tracking-tighter -mt-1 md:-mt-2"
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
                        {timeStatus.currentClass
                          ? `⭐ current: ${timeStatus.currentClass.course}`
                          : "☕ currently free"}
                      </div>
                      {timeStatus.currentClass && (
                        <div
                          className="bg-black/5 px-3 py-2 rounded-xl text-[10px] md:text-[11px] font-bold lowercase text-black/60 border border-black/5 flex-shrink-0"
                          style={{ fontFamily: "Aonic" }}
                        >
                          📍 {timeStatus.currentClass.room}
                        </div>
                      )}
                      {timeStatus.nextClass && (
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
              )}
            </AnimatePresence>
          </motion.div>

          {!isLoading && (
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
                        if(isMetricExpanded) setIsMetricExpanded(false);
                    }}
                    className={`bg-[#ff003c] !px-8 flex flex-col text-white rounded-[32px] cursor-pointer overflow-hidden ${isAlertExpanded ? "h-[250px]" : "h-[75px]"}`}
                >
                    
                    <motion.div layout="position" className="flex justify-between items-center w-full relative z-10 py-0 -mt-1.5">
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
                        className={`transition-transform duration-500 ${isAlertExpanded ? "rotate-90" : ""}`}
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
                                <div key={i} className="bg-white p-3 rounded-xl flex flex-col gap-1 border border-black/5 shadow-sm mb-2 last:mb-0">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[12px] font-bold leading-tight text-black line-clamp-2" style={{ fontFamily: "Aonic" }}>{alert.description}</span>
                                        {alert.type === 'exam' && <span className="bg-[#ff003c] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md ml-2 flex-shrink-0">EXAM</span>}
                                    </div>
                                    <span className="text-[10px] font-bold text-black/40 uppercase tracking-wide" style={{ fontFamily: "Aonic" }}>
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
                        if(isAlertExpanded) setIsAlertExpanded(false);
                    }}
                    className={`bg-[#ceff1c] flex-1 flex flex-col relative -top-8  relative rounded-t-[48px] !px-5 !pb-[60vh] -mb-[40vh] overflow-hidden cursor-pointer ${isMetricExpanded ? "min-h-[400px]" : "min-h-[220px] md:min-h-[250px]"}`}
                >
                    <motion.div layout="position" className="flex justify-between items-start w-full z-10 pt-0 shrink-0">
                    <div className="w-11 h-11 bg-black rounded-full flex items-center justify-center shadow-xl">
                        {metricMode === 'attendance' ? (
                            <Zap size={20} className="text-[#ceff1c]" fill="currentColor" />
                        ) : (
                            <GraduationCap size={20} className="text-[#ceff1c]" fill="currentColor" />
                        )}
                    </div>
                    <div
                        className="bg-black/90 backdrop-blur-xl text-white p-1 rounded-full flex items-center text-[9px] md:text-[10px] font-bold uppercase tracking-[0.1em]"
                        style={{ fontFamily: "Aonic" }}
                        onClick={(e) => e.stopPropagation()} 
                    >
                        <div 
                            onClick={() => setMetricMode('attendance')}
                            className={`px-4 py-2 rounded-full cursor-pointer transition-colors ${metricMode === 'attendance' ? 'bg-[#ceff1c] text-black shadow-sm' : 'text-white/40 hover:text-white'}`}
                        >
                        attendance
                        </div>
                        <div 
                            onClick={() => setMetricMode('marks')}
                            className={`px-4 py-2 rounded-full cursor-pointer transition-colors ${metricMode === 'marks' ? 'bg-[#ceff1c] text-black shadow-sm' : 'text-white/40 hover:text-white'}`}
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
                                    <span className="text-[14px] font-bold text-black/40 lowercase" style={{ fontFamily: "Aonic" }}>
                                        {metricMode === 'attendance' ? 'needs attention' : 'academic status'}
                                    </span>
                                    <div className="h-[1px] flex-1 bg-black/10 ml-4"></div>
                                </div>
                                
                                {metricMode === 'attendance' ? (
                                    criticalAttendance.length > 0 ? (
                                        criticalAttendance.map((subj, i) => (
                                            <div key={i} className="bg-black/10 p-4 rounded-2xl flex items-center justify-between w-full">
                                                <span className="font-bold text-[13px] text-black w-[60%] leading-tight truncate" style={{ fontFamily: "Aonic" }}>
                                                {subj.displayName}
                                                </span>
                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-center gap-1 text-[#ff003c]">
                                                        <AlertTriangle size={14} />
                                                        <span className="font-black text-[14px] lowercase" style={{ fontFamily: "Aonic" }}>
                                                            {subj.required} required
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="bg-black/5 p-4 rounded-2xl text-center w-full">
                                            <span className="font-bold text-[12px] text-black/60" style={{ fontFamily: "Aonic" }}>attendance is safe</span>
                                        </div>
                                    )
                                ) : (
                                    <div className="bg-black/5 p-4 rounded-2xl text-center w-full">
                                        <span className="font-bold text-[12px] text-black/60" style={{ fontFamily: "Aonic" }}>no marks data available</span>
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
                                    {metricMode === 'attendance' ? 'overall' : 'average'}
                                    </p>
                                    <h2
                                    className="text-[28px] md:text-[34px] font-bold leading-[0.95] text-black tracking-normal lowercase"
                                    style={{ fontFamily: "Aonic" }}
                                    >
                                    {metricMode === 'attendance' ? (
                                        <>you are <br /> doing well</>
                                    ) : (
                                        <>academic <br /> performance</>
                                    )}
                                    </h2>
                                </div>
                                <div
                                    className="text-[80px] md:text-[88px] font-black leading-[0.7] tracking-[-0.04em] text-black"
                                    style={{ fontFamily: "Urbanosta" }}
                                >
                                    {metricMode === 'attendance' ? overallAttendance : "N/A"}
                                    <span className="text-[34px] opacity-20 tracking-normal">
                                    {metricMode === 'attendance' ? "%" : ""}
                                    </span>
                                </div>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>
                </BentoTile>
                </motion.div>
            </LayoutGroup>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default function AcademiaApp({
  data,
  onLogout,
  customDisplayName,
  onUpdateName,
}) {
  const tabs = ["marks", "attendance", "home", "timetable", "calendar"];
  const [[activeTab, direction], setTabState] = useState(["home", 0]);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const touchStart = useRef(null);

  const [testSchedule, setTestSchedule] = useState(null);
  const lastNotifiedRef = useRef(null);

  const { profile, attendance, schedule, marks } = data || {};

  const todayDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const todayEntry = calendarData.find((item) => item.date === todayDate);
  const effectiveDayOrder =
    todayEntry && todayEntry.order !== "-"
      ? todayEntry.order
      : data?.dayOrder || "1";

  const fullData = {
    ...data,
    dayOrder: effectiveDayOrder,
    calendar: calendarData,
  };

  const effectiveSchedule = testSchedule || schedule;

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.log(err));
    }
    requestNotificationPermission();
  }, []);

  const checkNotifications = useCallback(() => {
    if (!effectiveSchedule) return;
    const { nextClass } = getScheduleStatus(
      effectiveSchedule,
      effectiveDayOrder,
    );

    if (nextClass) {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const diff = nextClass.startMinutes - currentMins;

      if (
        diff >= 0 &&
        diff <= 15 &&
        lastNotifiedRef.current !== nextClass.course
      ) {
        sendNotification(
          `Next: ${nextClass.course}`,
          `📍 ${nextClass.room}  •  ⏳ Starts in ${diff} min`,
          nextClass.course,
        );
        lastNotifiedRef.current = nextClass.course;
      }
    }
  }, [effectiveSchedule, effectiveDayOrder]);

  useEffect(() => {
    const interval = setInterval(checkNotifications, 10000);
    checkNotifications();
    return () => clearInterval(interval);
  }, [checkNotifications]);

  const triggerTestClass = () => {
    const now = new Date();
    const future = new Date(now.getTime() + 1 * 60000);

    const timeStr = `${String(future.getHours()).padStart(2, "0")}:${String(future.getMinutes()).padStart(2, "0")}`;
    const endStr = `${String(future.getHours() + 1).padStart(2, "0")}:${String(future.getMinutes()).padStart(2, "0")}`;

    const targetDay =
      effectiveDayOrder && effectiveDayOrder !== "-" ? effectiveDayOrder : "1";
    const fakeKey = `Day ${targetDay}`;
    const randomCourse = `TEST CLASS ${Math.floor(Math.random() * 100)}`;

    const fakeSchedule = {
      ...schedule,
      [fakeKey]: {
        ...(schedule?.[fakeKey] || {}),
        [`${timeStr} - ${endStr}`]: {
          course: randomCourse,
          room: "TEST-VENUE",
          faculty: "System",
          slot: "A",
        },
      },
    };

    setTestSchedule(fakeSchedule);
    setTimeout(() => {
      setTestSchedule(null);
      lastNotifiedRef.current = null;
    }, 45000);
    alert(`Test class injected. Notification expected in <1m.`);
  };

  const setPage = (newTab) => {
    const newIndex = tabs.indexOf(newTab);
    const currentIndex = tabs.indexOf(activeTab);
    const dir = newIndex > currentIndex ? 1 : -1;
    setTabState([newTab, dir]);
  };

  const onTouchStart = (e) => {
    touchStart.current = e.targetTouches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (!touchStart.current) return;
    const endX = e.changedTouches[0].clientX;
    const diff = touchStart.current - endX;

    if (Math.abs(diff) > 50) {
      const currentIndex = tabs.indexOf(activeTab);
      if (diff > 0 && currentIndex < tabs.length - 1)
        setPage(tabs[currentIndex + 1]);
      if (diff < 0 && currentIndex > 0) setPage(tabs[currentIndex - 1]);
    }
    touchStart.current = null;
  };

  return (
    <div
      className="h-[100dvh] w-full bg-black relative overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
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
              className="absolute top-0 left-0 w-full h-full bg-[#050505] will-change-transform"
            >
              {activeTab === "home" && (
                <HomeDashboard
                  profile={profile}
                  schedule={effectiveSchedule}
                  attendance={attendance}
                  marks={marks}
                  dayOrder={effectiveDayOrder}
                  onProfileClick={() => setShowSettings(true)}
                  displayName={customDisplayName}
                  isLoading={isLoading}
                  onLoadingComplete={() => setIsLoading(false)}
                />
              )}
              {activeTab === "timetable" && (
                <Timetable
                  schedule={effectiveSchedule}
                  dayOrder={effectiveDayOrder}
                />
              )}
              {activeTab === "attendance" && (
                <MobileAttendance
                  data={{ attendance }}
                  schedule={effectiveSchedule}
                />
              )}
              {activeTab === 'marks' && <MarksPage data={data} />}
              {activeTab === 'calendar' && <CalendarPage data={fullData} />}
              
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>

      <AnimatePresence>
        {showSettings && (
          <SettingsPage
            onBack={() => setShowSettings(false)}
            onLogout={onLogout}
            profile={profile}
            onUpdateName={onUpdateName}
            onTestNotification={triggerTestClass}
          />
        )}
      </AnimatePresence>

      {!showSettings && !isLoading && (
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <BottomNav activeTab={String(activeTab)} setActiveTab={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}