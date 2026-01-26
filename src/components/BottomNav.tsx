"use client";
import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { LayoutGrid, CheckCircle, Home, Calendar, GraduationCap } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav = memo(({ activeTab, setActiveTab }: BottomNavProps) => {
  const [width, setWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'marks', icon: GraduationCap },
    { id: 'attendance', icon: CheckCircle },
    { id: 'home', icon: Home },
    { id: 'timetable', icon: LayoutGrid },
    { id: 'calendar', icon: Calendar },
  ];

  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const x = useSpring(0, { stiffness: 250, damping: 25 });

  useEffect(() => {
    if (width > 0) {
      const tabWidth = width / tabs.length;
      x.set(tabWidth * activeIndex + tabWidth / 2);
    }
  }, [activeIndex, width, x, tabs.length]);

  const path = useTransform(x, (cx) => {
    const h = 85;    
    const w = width; 
    const r = 24;    
    
    if (w === 0) return "";

    const cupWidth = 120; 
    const cupDepth = 60;  
    const shoulder = 25;  

    return `
      M 0 ${h}
      L 0 ${r}
      Q 0 0 ${r} 0
      L ${cx - cupWidth / 2 - shoulder} 0
      C ${cx - cupWidth / 2} 0, ${cx - 40} ${cupDepth}, ${cx} ${cupDepth}
      C ${cx + 40} ${cupDepth}, ${cx + cupWidth / 2} 0, ${cx + cupWidth / 2 + shoulder} 0
      L ${w - r} 0
      Q ${w} 0 ${w} ${r}
      L ${w} ${h}
      Z
    `;
  });

  return (
    <div 
      ref={containerRef}
      className="fixed bottom-0 left-0 w-full z-[100] h-[85px] pb-safe"
    >

      <svg 
        className="absolute top-0 left-0 w-full h-full pointer-events-none"

        style={{ filter: "drop-shadow(0 -5px 10px rgba(0,0,0,0.2))" }}
      >
        <motion.path 
          d={path} 
          fill="#050505" 
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
          style={{ willChange: "d" }} 
        />
      </svg>


      <motion.div
        className="absolute top-0 left-0 z-50"
        style={{ 
          x: useTransform(x, (val) => val - 28),
          willChange: "transform" 
        }} 
      >
        <motion.button
          onClick={() => {}} 
          className="relative w-14 h-14 rounded-full bg-[#dfff00] text-black flex items-center justify-center -top-2"
          style={{ boxShadow: '0 0 25px rgba(223, 255, 0, 0.4)' }}
          whileTap={{ scale: 0.9 }}
          animate={{ rotate: activeIndex * 360 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
           {React.createElement(tabs[activeIndex].icon, { size: 26, strokeWidth: 2.5 })}
        </motion.button>
      </motion.div>


      <div className="relative w-full h-full flex items-center justify-around z-20">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)} 
              className="w-full h-full flex flex-col items-center justify-center group outline-none"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {!isActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                  className="text-[#555555] group-hover:text-white transition-colors duration-300"
                >
                  <Icon size={24} strokeWidth={2} />
                </motion.div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});
