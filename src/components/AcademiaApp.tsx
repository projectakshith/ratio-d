"use client";
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { BentoTile } from './BentoTile'; 
import Timetable from './Timetable'; 
import { BottomNav } from './BottomNav'; 
import SettingsPage from './SettingsPage';
import MobileAttendance from './MobileAttendance';

const attendanceData = {
  attendance: [
    {
      title: 'Artificial Intelligence',
      code: 'CS301',
      percent: '82',
      conducted: 46,
      absent: 8,
    },
    {
      title: 'System Design',
      code: 'CS302',
      percent: '68',
      conducted: 42,
      absent: 13,
    },
    {
      title: 'Operating Systems',
      code: 'CS303',
      percent: '91',
      conducted: 55,
      absent: 5,
    },
    {
      title: 'Computer Networks',
      code: 'CS304',
      percent: '74',
      conducted: 39,
      absent: 10,
    },
    {
      title: 'Database Management Systems',
      code: 'CS305',
      percent: '88',
      conducted: 48,
      absent: 6,
    },
    {
      title: 'Design and Analysis of Algorithms',
      code: 'CS306',
      percent: '63',
      conducted: 41,
      absent: 15,
    },
    {
      title: 'Machine Learning',
      code: 'CS401',
      percent: '79',
      conducted: 34,
      absent: 7,
    },
    {
      title: 'Software Engineering',
      code: 'CS402',
      percent: '85',
      conducted: 40,
      absent: 6,
    }
  ]
};


const PlaceholderPage = ({ title, color }: { title: string, color: string }) => (
  <div className={`h-full w-full flex items-center justify-center ${color} text-black`}>
    <h1 className="text-3xl font-bold">{title}</h1>
  </div>
);

const HomeDashboard = ({ onProfileClick }: { onProfileClick: () => void }) => {
  const [isAlertExpanded, setIsAlertExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useGSAP(() => {
    gsap.from(".bento-tile", {
      y: 50,
      opacity: 0,
      scale: 0.9,
      stagger: 0.1,
      duration: 0.8,
      ease: "power3.out",
      clearProps: "all",
    });
  }, { scope: containerRef });

  return (
    <div
      ref={containerRef}
      className="h-full w-full bg-black font-sans flex flex-col gap-1 overflow-hidden relative pb-[80px]"
    >
      {/* HERO TILE */}
      <BentoTile
        className={`bg-[#fdfdfd] shadow-sm flex flex-col rounded-t-none rounded-b-[40px] !p-6 transition-all duration-500 ease-in-out bento-tile relative overflow-hidden ${
          isAlertExpanded ? 'flex-[2]' : 'flex-[6]'
        }`}
      >
        <div className="absolute top-8 left-8 z-20 flex items-center gap-2 text-slate-900">
          <span className="text-2xl">❖</span>
          <span className="font-bold text-2xl tracking-tight">Ratio'd</span>
        </div>

        <div className="flex flex-col h-full justify-end pb-8 relative z-10">
          <h1 className="text-[clamp(32px,5vh,42px)] leading-[0.95] tracking-tight text-slate-900 font-medium">
            Hello 👋 Prethiv
          </h1>

          {!isAlertExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-2"
            >
              <div className="text-[clamp(32px,5vh,42px)] leading-[0.95] tracking-tight text-slate-900 flex items-center flex-wrap">
                <div
                  onClick={onProfileClick}
                  className="inline-block mr-2 w-[36px] h-[36px] rounded-full overflow-hidden bg-gray-200 border border-white shadow-sm relative -top-1 cursor-pointer active:scale-90 transition-transform z-50"
                >
                  <img
                    src="https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/avatars/c3/c33a1d7eec9e9ad8bfa7e82891e418b81dbc0fce_full.jpg"
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                </div>

                <span className="font-medium text-slate-800">your next</span>
              </div>

              <div className="text-[clamp(32px,5vh,42px)] leading-[0.95] tracking-tight text-slate-900">
                class is <span className="font-bold">Artificial</span>
              </div>
              <div className="text-[clamp(32px,5vh,42px)] leading-[0.95] tracking-tight text-slate-900 font-bold">
                Intelligence
              </div>
            </motion.div>
          )}
        </div>

        {!isAlertExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mt-4 w-full"
          >
            <div className="bg-[#f4f4f4] px-4 py-3 rounded-full text-xs font-bold flex items-center gap-2 text-slate-700">
              📈 Break in: 15m
            </div>
            <div className="bg-[#f4f4f4] px-4 py-3 rounded-full text-xs font-bold flex items-center gap-2 text-slate-700">
              🏆 System Design
            </div>
            <div className="ml-auto w-12 h-12 bg-[#f4f4f4] rounded-full flex items-center justify-center text-slate-900">
              ↗
            </div>
          </motion.div>
        )}
      </BentoTile>

      {/* STATS TILE */}
      <BentoTile
        onClick={() => setIsAlertExpanded(!isAlertExpanded)}
        className={`bg-[#fded9e] bento-tile !px-6 flex flex-col justify-center text-black rounded-[32px] transition-all duration-500 ease-in-out cursor-pointer overflow-hidden ${
          isAlertExpanded ? 'flex-[5] !justify-start !py-6' : 'flex-[1] !py-0'
        }`}
      >
        <div className="flex justify-between items-center w-full h-full">
          <p className="font-bold text-[15px] tracking-tight">
            Academic Alerts <span className="opacity-40"></span>
          </p>
          <div className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center">
            ⇄
          </div>
        </div>

        <AnimatePresence>
          {isAlertExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-2 text-sm"
            >
              <div className="bg-white/50 p-4 rounded-2xl">Sign IN (g-suit) </div>
            </motion.div>
          )}
        </AnimatePresence>
      </BentoTile>

      {/* PROGRESS TILE */}
      <BentoTile 
        className="bg-[#b2f3e6] bento-tile flex-[2.5] flex flex-col relative rounded-[32px] !p-7 overflow-hidden"
      >
        {/* Top Header Row */}
        <div className="flex justify-between items-start w-full z-10">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-black">
               <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
             </svg>
          </div>

          {/* Toggle Switch */}
          <div className="bg-black text-white p-1 rounded-full flex items-center text-[10px] font-bold">
             <div className="bg-[#b2f3e6] text-black px-3 py-1.5 rounded-full shadow-sm">
                Weeekly
             </div>
             <div className="px-3 py-1.5 text-gray-400">
                Monthly
             </div>
          </div>
        </div>

        {/* Content Row */}
        <div className="flex justify-between items-end mt-auto z-10">
           <div className="mb-1">
             <p className="text-[11px] font-bold uppercase text-black/50 mb-1">Your progress</p>
             <h2 className="text-[26px] font-bold leading-[1.1] text-black tracking-tight">
               You are doing <br /> well ☺
             </h2>
           </div>
           
           <div className="text-[72px] font-light leading-[0.8] tracking-tighter text-black">
             91%
           </div>
        </div>
      </BentoTile>
    </div>
  );
};

export default function AcademiaApp() {
  const [activeTab, setActiveTab] = useState<'marks' | 'attendance' | 'home' | 'timetable' | 'calendar'>('home');
  const [showSettings, setShowSettings] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeDashboard onProfileClick={() => setShowSettings(true)} />;
      case 'timetable':
        return <Timetable />;
      case 'marks':
        return <PlaceholderPage title="Marks" color="bg-indigo-200" />;
      case 'attendance':
        return <MobileAttendance data={attendanceData} />;

      case 'calendar':
        return <PlaceholderPage title="Calendar" color="bg-blue-200" />;
      default:
        return null;
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (showSettings) return;
    if (info.offset.x < -50 && activeTab === 'home') setActiveTab('timetable');
    if (info.offset.x > 50 && activeTab === 'timetable') setActiveTab('home');
  };

  return (
    <div className="h-[100dvh] w-full bg-black relative overflow-hidden">
      <motion.div
        className="h-full w-full"
        drag={showSettings ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showSettings && <SettingsPage onBack={() => setShowSettings(false)} />}
      </AnimatePresence>

      {!showSettings && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      )}
    </div>
  );
}
