"use client";
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Zap, ArrowUpRight, Bell, ChevronRight } from 'lucide-react';

import { BentoTile } from './BentoTile'; 
import Timetable from './Timetable'; 
import { BottomNav } from './BottomNav'; 
import SettingsPage from './SettingsPage';
import MobileAttendance from './MobileAttendance';


const getScheduleStatus = (schedule) => {
  const now = new Date();
  const dayIndex = now.getDay(); 
  const dayKey = `Day ${dayIndex}`; 
  
  if (dayIndex === 0 || dayIndex === 6 || !schedule || !schedule[dayKey]) {
    return { status: 'free', nextClass: null, currentClass: null };
  }

  const todaySchedule = schedule[dayKey];
  const timeSlots = Object.keys(todaySchedule).sort(); 
  
  let currentClass = null;
  let nextClass = null;
  
  const currentTimeVal = now.getHours() * 60 + now.getMinutes();

  for (const slot of timeSlots) {
    const [start, end] = slot.split(' - ');
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    const startVal = startH * 60 + startM;
    const endVal = endH * 60 + endM;

    if (currentTimeVal >= startVal && currentTimeVal < endVal) {
      currentClass = { ...todaySchedule[slot], time: slot };
    } else if (currentTimeVal < startVal && !nextClass) {
      nextClass = { ...todaySchedule[slot], time: slot };
    }
  }

  return { status: currentClass ? 'busy' : 'free', nextClass, currentClass };
};

const HomeDashboard = ({ onProfileClick, profile, schedule, attendance }) => {
  const [isAlertExpanded, setIsAlertExpanded] = useState(false);
  const containerRef = useRef(null);
  const [timeStatus, setTimeStatus] = useState({ nextClass: null, currentClass: null });

  useGSAP(() => {
    gsap.from(".bento-tile", {
      y: 20,
      opacity: 0,
      stagger: 0.05,
      duration: 0.5,
      ease: "power2.out",
    });
  }, { scope: containerRef });

  useEffect(() => {
    if (schedule) {
      setTimeStatus(getScheduleStatus(schedule));
    }
  }, [schedule]);

  const overallPercent = useMemo(() => {
    if (!attendance || attendance.length === 0) return 0;
    const totalConducted = attendance.reduce((acc, curr) => acc + curr.conducted, 0);
    const totalAbsent = attendance.reduce((acc, curr) => acc + curr.absent, 0);
    const totalPresent = totalConducted - totalAbsent;
    return totalConducted === 0 ? 0 : Math.round((totalPresent / totalConducted) * 100);
  }, [attendance]);

  const NoiseOverlay = () => (
    <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay" 
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
    />
  );

  const studentName = profile?.name ? profile.name.split(' ')[0] : 'Student';
  const nextSubject = timeStatus.nextClass?.course || "No more classes";
  const nextSubjectSplit = nextSubject.split(' ');
  const displayNext = nextSubjectSplit.length > 1 
    ? { top: nextSubjectSplit.slice(0, Math.ceil(nextSubjectSplit.length/2)).join(' '), bottom: nextSubjectSplit.slice(Math.ceil(nextSubjectSplit.length/2)).join(' ') } 
    : { top: nextSubject, bottom: '' };

  return (
    <div
      ref={containerRef}
      className="h-full w-full bg-[#050505] flex flex-col overflow-hidden relative"
    >
      <BentoTile
        className={`bg-[#fdfdfd] flex flex-col rounded-t-none rounded-b-[48px] !p-8 md:!p-10 relative overflow-hidden transition-all duration-700 ease-[0.23,1,0.32,1] ${
          isAlertExpanded ? 'flex-[2]' : 'flex-[7]'
        }`}
      >
        <NoiseOverlay />
        
        <div className="flex justify-between items-center w-full absolute top-12 left-0 px-8 md:px-10 z-20">
          <div className="flex items-center gap-2 text-black">
            <span className="text-xl">❖</span>
            <span className="text-xl font-black lowercase tracking-tight" style={{ fontFamily: 'Urbanosta' }}>ratio'd</span>
          </div>
        </div>

        <div className="flex flex-col h-full justify-end relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-[24px] md:text-[28px] font-bold lowercase tracking-tight text-black/20 leading-none" style={{ fontFamily: 'Aonic' }}>
              hello, <span className="text-black">{studentName}</span>
            </h1>
            <button onClick={onProfileClick} className="w-9 h-9 rounded-full overflow-hidden border-2 border-black/5 active:scale-90 transition-transform shadow-sm">
               <img src="https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/avatars/c3/c33a1d7eec9e9ad8bfa7e82891e418b81dbc0fce_full.jpg" className="object-cover w-full h-full" alt="Profile" />
            </button>
          </div>

          {!isAlertExpanded && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
              <span className="text-[16px] md:text-[18px] font-bold lowercase tracking-tight text-black/40 leading-none" style={{ fontFamily: 'Aonic' }}>
                {timeStatus.nextClass ? "your next class is" : "you are all done"}
              </span>
              
              <div className="text-[11vw] md:text-[5rem] leading-[0.9] font-black tracking-tight text-black lowercase flex flex-col mt-2 md:mt-4 w-full break-words" style={{ fontFamily: 'Urbanosta' }}>
                <span className="text-[#3233ff] truncate">{displayNext.top}</span>
                <span className="truncate">{displayNext.bottom}</span>
              </div>
            </motion.div>
          )}
        </div>

        {!isAlertExpanded && (
          <div className="flex flex-wrap items-center gap-2 mt-6 md:mt-8 w-full">
            {timeStatus.currentClass ? (
              <div className="bg-black text-white px-3 py-2 rounded-xl text-[10px] md:text-[11px] font-bold lowercase border border-black/5 flex-shrink-0" style={{ fontFamily: 'Aonic' }}>
                 ⭐ current: {timeStatus.currentClass.course}
              </div>
            ) : (
               <div className="bg-black text-white px-3 py-2 rounded-xl text-[10px] md:text-[11px] font-bold lowercase border border-black/5 flex-shrink-0" style={{ fontFamily: 'Aonic' }}>
                 ☕ currently free
              </div>
            )}
            
            {timeStatus.currentClass && (
               <div className="bg-black/5 px-3 py-2 rounded-xl text-[10px] md:text-[11px] font-bold lowercase text-black/60 border border-black/5 flex-shrink-0" style={{ fontFamily: 'Aonic' }}>
                  📍 {timeStatus.currentClass.room}
               </div>
            )}

            {timeStatus.nextClass && (
               <div className="bg-black/5 px-3 py-2 rounded-xl text-[10px] md:text-[11px] font-bold lowercase text-black/60 border border-black/5 flex-shrink-0" style={{ fontFamily: 'Aonic' }}>
                  ⏰ {timeStatus.nextClass.time}
               </div>
            )}
            
            <div className="ml-auto w-10 h-10 bg-black rounded-full flex items-center justify-center text-white active:scale-90 transition-transform flex-shrink-0 shadow-lg">
              <ArrowUpRight size={20} />
            </div>
          </div>
        )}
      </BentoTile>

      <div className="px-1.5 w-full flex flex-col gap-1.5 flex-none mt-1.5">
        <BentoTile
          onClick={() => setIsAlertExpanded(!isAlertExpanded)}
          className={`bg-[#ff003c] !px-8 flex flex-col justify-center text-white rounded-[32px] transition-all duration-500 cursor-pointer overflow-hidden ${
            isAlertExpanded ? 'h-[250px]' : 'h-[75px]'
          }`}
        >
          <NoiseOverlay />
          <div className="flex justify-between items-center w-full relative z-10">
            <div className="flex items-center gap-3">
              <Bell size={20} />
              <p className="font-bold text-xl md:text-2xl tracking-normal lowercase" style={{ fontFamily: 'Aonic' }}>academic alerts</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
              <ChevronRight size={16} className={`transition-transform duration-500 ${isAlertExpanded ? 'rotate-90' : ''}`} />
            </div>
          </div>
          <AnimatePresence>
            {isAlertExpanded && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-2 relative z-10">
                <div className="bg-black text-[#ff003c] p-4 rounded-2xl font-bold text-[11px] lowercase tracking-normal shadow-2xl" style={{ fontFamily: 'Aonic' }}>
                  /// updates synced
                </div>
                <div className="bg-white/10 p-4 rounded-2xl font-bold text-[11px] lowercase text-white/80 tracking-normal" style={{ fontFamily: 'Aonic' }}>
                  no critical alerts at this moment
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </BentoTile>

        <BentoTile className="bg-[#ceff1c] flex-1 min-h-[220px] md:min-h-[250px] flex flex-col relative rounded-t-[48px] rounded-b-none !p-8 !pb-32 overflow-hidden">
          <NoiseOverlay />
          <div className="flex justify-between items-start w-full z-10">
            <div className="w-11 h-11 bg-black rounded-full flex items-center justify-center shadow-xl">
              <motion.div
                animate={{ opacity: [1, 0.6, 1], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Zap size={20} className="text-[#ceff1c]" fill="currentColor" />
              </motion.div>
            </div>
            
            <div className="bg-black/90 backdrop-blur-xl text-white p-1 rounded-full flex items-center text-[9px] md:text-[10px] font-bold uppercase tracking-[0.1em]" style={{ fontFamily: 'Aonic' }}>
                <div className="bg-[#ceff1c] text-black px-4 py-2 rounded-full shadow-sm cursor-pointer">attendance</div>
                <div className="px-4 py-2 text-white/40 cursor-pointer hover:text-white transition-colors">marks</div>
            </div>
          </div>

          <div className="flex justify-between items-end mt-auto z-10">
            <div>
              <p className="text-[10px] font-bold uppercase text-black/30 tracking-widest mb-1" style={{ fontFamily: 'Aonic' }}>overall</p>
              <h2 className="text-[28px] md:text-[34px] font-bold leading-[0.95] text-black tracking-normal lowercase" style={{ fontFamily: 'Aonic' }}>
                you are <br /> doing well
              </h2>
            </div>
            <div className="text-[80px] md:text-[88px] font-black leading-[0.7] tracking-[-0.04em] text-black" style={{ fontFamily: 'Urbanosta' }}>
              {overallPercent}<span className="text-[34px] opacity-20 tracking-normal">%</span>
            </div>
          </div>
        </BentoTile>
      </div>
    </div>
  );
};

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? '100%' : '-100%',
    zIndex: 1,
    position: 'absolute'
  }),
  center: {
    x: 0,
    zIndex: 1,
    position: 'absolute'
  },
  exit: (direction) => ({
    x: direction < 0 ? '100%' : '-100%',
    zIndex: 0,
    position: 'absolute'
  })
};

export default function AcademiaApp({ data, onLogout }) {
  const tabs = ['marks', 'attendance', 'home', 'timetable', 'calendar'];
  const [[activeTab, direction], setTabState] = useState(['home', 0]);
  const [showSettings, setShowSettings] = useState(false);
  
  const { profile, attendance, schedule, calendar } = data || {};

  const setPage = (newTab) => {
    const newIndex = tabs.indexOf(newTab);
    const currentIndex = tabs.indexOf(activeTab);
    const dir = newIndex > currentIndex ? 1 : -1;
    setTabState([newTab, dir]);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <HomeDashboard profile={profile} schedule={schedule} attendance={attendance} onProfileClick={() => setShowSettings(true)} />;
      case 'timetable': return <Timetable schedule={schedule} />;
      case 'attendance': return <MobileAttendance data={{ attendance }} />;
      default: return <div className="h-full w-full bg-[#050505]" />;
    }
  };

  const handleDragEnd = (_, info) => {
    if (showSettings) return;
    const currentIndex = tabs.indexOf(activeTab);
    const threshold = 50;
    
    if (info.offset.x < -threshold && currentIndex < tabs.length - 1) {
      setPage(tabs[currentIndex + 1]);
    }
    
    if (info.offset.x > threshold && currentIndex > 0) {
      setPage(tabs[currentIndex - 1]);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-black relative overflow-hidden">
      <motion.div
        className="h-full w-full relative"
        drag={showSettings ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ touchAction: "pan-y" }} 
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="absolute top-0 left-0 w-full h-full bg-[#050505] transform-gpu"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showSettings && (
          <SettingsPage 
            onBack={() => setShowSettings(false)} 
            onLogout={onLogout} 
          />
        )}
      </AnimatePresence>

      {!showSettings && (
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
            <div className="pointer-events-auto">
                <BottomNav activeTab={String(activeTab)} setActiveTab={setPage} />
            </div>
        </div>
      )}
    </div>
  );
}