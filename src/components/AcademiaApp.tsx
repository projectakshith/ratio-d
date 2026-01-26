"use client";
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Zap, ArrowUpRight, Bell, ChevronRight } from 'lucide-react';

import { BentoTile } from './BentoTile'; 
import Timetable from './Timetable'; 
import { BottomNav } from './BottomNav'; 
import SettingsPage from './SettingsPage';
import MobileAttendance from './MobileAttendance';

const attendanceData = {
  attendance: [
    { title: 'artificial intelligence', code: 'cs301', percent: '82', conducted: 46, absent: 8 },
    { title: 'system design', code: 'cs302', percent: '68', conducted: 42, absent: 13 },
    { title: 'operating systems', code: 'cs303', percent: '91', conducted: 55, absent: 5 },
    { title: 'computer networks', code: 'cs304', percent: '74', conducted: 39, absent: 10 },
    { title: 'database management systems', code: 'cs305', percent: '88', conducted: 48, absent: 6 },
    { title: 'design and analysis of algorithms', code: 'cs306', percent: '63', conducted: 41, absent: 15 },
    { title: 'machine learning', code: 'cs401', percent: '79', conducted: 34, absent: 7 },
    { title: 'software engineering', code: 'cs402', percent: '85', conducted: 40, absent: 6 }
  ]
};

const HomeDashboard = ({ onProfileClick }: { onProfileClick: () => void }) => {
  const [isAlertExpanded, setIsAlertExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useGSAP(() => {
    gsap.from(".bento-tile", {
      y: 20,
      opacity: 0,
      stagger: 0.05,
      duration: 0.5,
      ease: "power2.out",
    });
  }, { scope: containerRef });

  const NoiseOverlay = () => (
    <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay" 
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
    />
  );

  return (
    <div
      ref={containerRef}
      className="h-full w-full bg-[#050505] flex flex-col overflow-hidden relative"
    >
      <BentoTile
        className={`bg-[#fdfdfd] flex flex-col rounded-t-none rounded-b-[48px] !p-10 relative overflow-hidden transition-all duration-700 ease-[0.23,1,0.32,1] ${
          isAlertExpanded ? 'flex-[2]' : 'flex-[7]'
        }`}
      >
        <NoiseOverlay />
        
        <div className="flex justify-between items-center w-full absolute top-12 left-0 px-10 z-20">
          <div className="flex items-center gap-2 text-black">
            <span className="text-xl">❖</span>
            <span className="text-xl font-black lowercase tracking-tight" style={{ fontFamily: 'Urbanosta' }}>ratio'd</span>
          </div>
        </div>

        <div className="flex flex-col h-full justify-end relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-[28px] font-bold lowercase tracking-tight text-black/20 leading-none" style={{ fontFamily: 'Aonic' }}>
              hello, <span className="text-black">prethiv</span>
            </h1>
            <button onClick={onProfileClick} className="w-9 h-9 rounded-full overflow-hidden border-2 border-black/5 active:scale-90 transition-transform shadow-sm">
               <img src="https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/avatars/c3/c33a1d7eec9e9ad8bfa7e82891e418b81dbc0fce_full.jpg" className="object-cover w-full h-full" alt="Profile" />
            </button>
          </div>

          {!isAlertExpanded && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
              <span className="text-[18px] font-bold lowercase tracking-tight text-black/40 leading-none" style={{ fontFamily: 'Aonic' }}>
                your next class is
              </span>
              
              <div className="text-[11vw] leading-[0.95] font-black tracking-tight text-black lowercase flex flex-col mt-3" style={{ fontFamily: 'Urbanosta' }}>
                <span className="text-[#3233ff]">artificial</span>
                <span>intelligence</span>
              </div>
            </motion.div>
          )}
        </div>

        {!isAlertExpanded && (
          <div className="flex items-center gap-1.5 mt-8 w-full">
            <div className="bg-black text-white px-3 py-2 rounded-xl text-[9px] font-bold lowercase border border-black/5 flex-shrink-0" style={{ fontFamily: 'Aonic' }}>
               ⭐ current: system design
            </div>
            <div className="bg-black/5 px-3 py-2 rounded-xl text-[9px] font-bold lowercase text-black/40 border border-black/5 flex-shrink-0" style={{ fontFamily: 'Aonic' }}>📈 break: 15m</div>
            <div className="bg-black/5 px-3 py-2 rounded-xl text-[9px] font-bold lowercase text-black/40 border border-black/5 flex-shrink-0" style={{ fontFamily: 'Aonic' }}>🏆 rm 302</div>
            <div className="ml-auto w-10 h-10 bg-black rounded-full flex items-center justify-center text-white active:scale-90 transition-transform flex-shrink-0">
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
              <p className="font-bold text-2xl tracking-normal lowercase" style={{ fontFamily: 'Aonic' }}>academic alerts</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
              <ChevronRight size={16} className={`transition-transform duration-500 ${isAlertExpanded ? 'rotate-90' : ''}`} />
            </div>
          </div>
          <AnimatePresence>
            {isAlertExpanded && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-2 relative z-10">
                <div className="bg-black text-[#ff003c] p-4 rounded-2xl font-bold text-[11px] lowercase tracking-normal shadow-2xl" style={{ fontFamily: 'Aonic' }}>
                  /// sign-in required (g-suite)
                </div>
                <div className="bg-white/10 p-4 rounded-2xl font-bold text-[11px] lowercase text-black/60 tracking-normal" style={{ fontFamily: 'Aonic' }}>
                  critical: low attendance in system design
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </BentoTile>

        <BentoTile className="bg-[#ceff1c] flex-1 min-h-[200px] flex flex-col relative rounded-t-[48px] rounded-b-none !p-8 !pb-32 overflow-hidden">
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
            
            <div className="bg-black/90 backdrop-blur-xl text-white p-1 rounded-full flex items-center text-[9px] font-bold uppercase tracking-[0.1em]" style={{ fontFamily: 'Aonic' }}>
                <div className="bg-[#ceff1c] text-black px-4 py-1.5 rounded-full shadow-sm">attendance</div>
                <div className="px-4 py-1.5 text-white/40">marks</div>
            </div>
          </div>

          <div className="flex justify-between items-end mt-auto z-10">
            <div>
              <p className="text-[10px] font-bold uppercase text-black/30 tracking-widest mb-1" style={{ fontFamily: 'Aonic' }}>progress</p>
              <h2 className="text-[34px] font-bold leading-[0.95] text-black tracking-normal lowercase" style={{ fontFamily: 'Aonic' }}>
                you are <br /> doing well
              </h2>
            </div>
            <div className="text-[88px] font-black leading-[0.7] tracking-[-0.04em] text-black" style={{ fontFamily: 'Urbanosta' }}>
              91<span className="text-[34px] opacity-20 tracking-normal">%</span>
            </div>
          </div>
        </BentoTile>
      </div>
    </div>
  );
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    zIndex: 1,
    position: 'absolute' as const
  }),
  center: {
    x: 0,
    zIndex: 1,
    position: 'absolute' as const
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    zIndex: 0,
    position: 'absolute' as const
  })
};


export default function AcademiaApp() {
  const tabs = ['marks', 'attendance', 'home', 'timetable', 'calendar'];
  const [[activeTab, direction], setTabState] = useState(['home', 0]);
  const [showSettings, setShowSettings] = useState(false);

  const setPage = (newTab: string) => {
    const newIndex = tabs.indexOf(newTab);
    const currentIndex = tabs.indexOf(activeTab);
    const dir = newIndex > currentIndex ? 1 : -1;
    setTabState([newTab, dir]);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <HomeDashboard onProfileClick={() => setShowSettings(true)} />;
      case 'timetable': return <Timetable />;
      case 'attendance': return <MobileAttendance data={attendanceData} />;
      default: return <div className="h-full w-full bg-[#050505]" />;
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
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
        {showSettings && <SettingsPage onBack={() => setShowSettings(false)} />}
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