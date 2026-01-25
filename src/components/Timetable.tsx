"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function Timetable() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDay, setSelectedDay] = useState<'today' | 'tomorrow'>('today');

  return (
    <div className="h-full w-full bg-black font-sans flex flex-col relative overflow-hidden">
      

      <div className="pt-20  px-8 mb-4 absolute top-0 w-full z-0">
        <h2 className="text-white text-3xl font-bold mb-6 tracking-wide">
            Timetable
        </h2>

        <div className="flex justify-between items-start">
            <div className="flex flex-col text-white">
                <span className="text-stone-400 font-medium text-lg mb-1">Sunday</span>
                <h1 className="text-[56px] leading-[0.9] font-medium tracking-tight">25.1</h1>
                <h1 className="text-[56px] leading-[0.9] font-medium tracking-tight">JAN</h1>
            </div>

            <div className="flex gap-4 h-[120px]">
                <div className="w-[1px] h-full bg-stone-700"></div>
                <div className="flex flex-col justify-between py-1 text-white">
                    <div>
                        <p className="text-xl font-semibold">1:20 PM</p>
                        <p className="text-stone-500 text-[11px] font-medium uppercase">India</p>
                    </div>
                    <div>
                        <p className="text-xl font-semibold">DO : 5</p>
                    </div>
                </div>
            </div>
        </div>
      </div>


      <motion.div 
        layout
        initial={{ y: "100%" }}
        animate={{ 
            y: 0,

            top: isExpanded ? '0%' : '34%', 
            bottom: '84px', 
            left: '0px',
            right: '0px',
            borderTopLeftRadius: isExpanded ? '0px' : '45px',
            borderTopRightRadius: isExpanded ? '0px' : '45px',
            borderBottomLeftRadius: '45px',
            borderBottomRightRadius: '45px',
        }} 
        transition={{ type: "spring", stiffness: 220, damping: 25 }}
        className={`absolute w-full bg-[#F4F4F4] flex flex-col gap-5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20 overflow-hidden
            ${isExpanded ? 'pt-12' : 'pt-6'} 
        `}
      >

        <div 
            className="w-full flex flex-col cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
        >
 
            <motion.div 
                className="w-full flex justify-center -mt-2 mb-4 px-6"
            >
                <div className="w-12 h-1.5 bg-gray-300/50 rounded-full"></div>
            </motion.div>

 
            <div className="flex justify-between items-center mb-1 px-7 shrink-0">
                
  
                <div className="flex items-center gap-2 p-1 bg-white/50 rounded-[20px] backdrop-blur-sm"
                     onClick={(e) => e.stopPropagation()} 
                >
                    <button 
                        onClick={() => setSelectedDay('today')}
                        className={`px-5 py-2 rounded-[16px] text-sm font-bold transition-all duration-200
                        ${selectedDay === 'today' 
                            ? 'bg-[#2C2C2C] text-white shadow-md' 
                            : 'text-stone-500 hover:text-stone-800 hover:bg-white/50'}`}
                    >
                        Today
                    </button>
                    <button 
                        onClick={() => setSelectedDay('tomorrow')}
                        className={`px-5 py-2 rounded-[16px] text-sm font-bold transition-all duration-200
                        ${selectedDay === 'tomorrow' 
                            ? 'bg-[#2C2C2C] text-white shadow-md' 
                            : 'text-stone-500 hover:text-stone-800 hover:bg-white/50'}`}
                    >
                        Tomorrow
                    </button>
                </div>

                <button className="bg-white px-4 py-2 rounded-full text-xs font-bold text-stone-600 shadow-sm border border-gray-100">
                    Show All
                </button>
            </div>
        </div>

 
        <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar pb-10 px-6 mt-2">
 
             <div className="w-full bg-[#EBC176] rounded-[32px] p-7 min-h-[180px] flex flex-col justify-between shadow-sm shrink-0">
                <div className="flex justify-between items-start">
                    <h3 className="text-[26px] font-bold text-[#3F2E12] leading-[1.1]">
                        Artificial <br/> Intelligence
                    </h3>
                    <div className="flex -space-x-3">
                        {/* <img className="w-10 h-10 rounded-full border-2 border-[#EBC176]" src="https://i.pravatar.cc/150?img=11" alt="" /> */}
                        {/* <img className="w-10 h-10 rounded-full border-2 border-[#EBC176]" src="https://i.pravatar.cc/150?img=3" alt="" /> */}
                    </div>
                </div>

                <div className="flex justify-between items-end mt-4">
                    <div>
                        <p className="text-[#3F2E12] text-lg font-medium">3:00 PM</p>
                        <p className="text-[#3F2E12]/60 text-sm font-medium">Start</p>
                    </div>
                    <div className="bg-[#594828] text-[#EBC176] px-5 py-2 rounded-full text-xs font-bold">
                        40 Min
                    </div>
                    <div className="text-right">
                        <p className="text-[#3F2E12] text-lg font-medium">3:40 PM</p>
                        <p className="text-[#3F2E12]/60 text-sm font-medium">End</p>
                    </div>
                </div>
            </div>
 
            <div className="w-full bg-[#B6C2C5] rounded-[32px] p-7 min-h-[160px] flex flex-col justify-between shadow-sm shrink-0">
                 <div className="flex justify-between items-start">
                    <h3 className="text-[26px] font-bold text-[#1A2629] leading-[1.1]">
                        System <br/> Designs
                    </h3>
                     <div className="flex -space-x-3">
                        {/* <img className="w-10 h-10 rounded-full border-2 border-[#B6C2C5]" src="https://i.pravatar.cc/150?img=8" alt="" />
                        <img className="w-10 h-10 rounded-full border-2 border-[#B6C2C5]" src="https://i.pravatar.cc/150?img=59" alt="" /> */}
                    </div>
                </div>

                <div className="flex justify-between items-end mt-2">
                    <div>
                        <p className="text-[#1A2629] text-lg font-medium">3:50 PM</p>
                    </div>
                     <div className="bg-[#3A494C] text-[#B6C2C5] px-5 py-2 rounded-full text-xs font-bold">
                        40 Min
                    </div>
                    <div className="text-right">
                        <p className="text-[#1A2629] text-lg font-medium">4:30 PM</p>
                    </div>
                </div>
            </div>
            
            <div className="h-10"></div>
        </div>
      </motion.div>
    </div>
  );
}