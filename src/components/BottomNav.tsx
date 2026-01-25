"use client";
import React from 'react';

interface BottomNavProps {
  activeTab: 'marks' | 'attendance' | 'home' | 'timetable' | 'calendar';
  setActiveTab: (tab: 'marks' | 'attendance' | 'home' | 'timetable' | 'calendar') => void;
}

export const BottomNav = ({ activeTab, setActiveTab }: BottomNavProps) => {

  const getIconClass = (tabName: string) => 
    `w-9 h-9 flex items-center justify-center rounded-[14px] transition-all duration-300 cursor-pointer
     ${activeTab === tabName 
        ? 'bg-white text-black shadow-lg scale-105'  
        : 'text-stone-500 hover:text-white' 
     }`;

  return (
    <div className="absolute bottom-0 left-0 w-full h-[80px] bg-black z-50 flex items-center justify-center pb-3">
      
      <div className="flex items-center justify-between w-[90%] max-w-[360px] px-2">
 
        <div 
            onClick={() => setActiveTab('marks')}
            className={getIconClass('marks')}
        >
 
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
        </div>
 
        <div 
            onClick={() => setActiveTab('attendance')}
            className={getIconClass('attendance')}
        >
 
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
        </div>
 
        <div 
            onClick={() => setActiveTab('home')}
            className={`w-[48px] h-[36px] rounded-[16px] flex items-center justify-center shadow-lg cursor-pointer transition-all duration-300 mx-2
            ${activeTab === 'home' 
                ? 'bg-[#f2f2f2] text-black scale-105' 
                : 'bg-white/10 text-stone-500 hover:text-white'}`}
        >
 
           <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="rotate-45">
                <rect x="6" y="6" width="12" height="12" rx="1" />
           </svg>
        </div>

 
        <div 
            onClick={() => setActiveTab('timetable')}
            className={getIconClass('timetable')}
        >
 
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
        </div>

        <div 
            onClick={() => setActiveTab('calendar')}
            className={getIconClass('calendar')}
        >

            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
        </div>

      </div>
    </div>
  );
};