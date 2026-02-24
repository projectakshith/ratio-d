"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";

const DUMMY_SCHEDULE = [
  { time: "08:00", course: "TYPO", room: "L-102", active: true },
  { time: "09:00", course: "", room: "", active: false },
  { time: "10:00", course: "IXD", room: "S-04", active: true },
  { time: "11:00", course: "ARCH", room: "C-205", active: true },
  { time: "12:00", course: "", room: "", active: false },
  { time: "13:00", course: "", room: "", active: false },
  { time: "14:00", course: "ALGO", room: "L-08", active: true },
  { time: "15:00", course: "WEB", room: "L-11", active: true },
];

export default function Dashboard() {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  const dayName = today.toLocaleDateString("en-GB", { weekday: "long" });

  return (
    <div className="h-screen w-full bg-white text-black font-sans flex flex-col overflow-hidden selection:bg-black selection:text-white">
      <div className="px-4 pt-6 flex flex-col h-full gap-8">
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-4 gap-2 w-full">
            {DUMMY_SCHEDULE.map((slot, index) => (
              <div key={index} className="flex flex-col gap-1">
                <span className="text-[9px] font-bold tabular-nums opacity-30 pl-0.5">
                  {slot.time}
                </span>

                <div
                  className={`w-full h-14 flex flex-col justify-center items-center p-1.5 rounded-xl transition-all ${
                    slot.active
                      ? "bg-black text-white shadow-sm"
                      : "bg-[#F4F4F5]"
                  }`}
                >
                  {slot.active ? (
                    <>
                      <span className="font-bold text-[10px] uppercase tracking-tight leading-none text-center truncate w-full">
                        {slot.course}
                      </span>
                      <span className="text-[8px] font-bold uppercase tracking-wide opacity-50 mt-1">
                        {slot.room}
                      </span>
                    </>
                  ) : (
                    <div className="w-1.5 h-0.5 rounded-full bg-black/10" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-30 block mb-1 ml-1">
            {dayName}
          </span>
          <h1 className="text-[16vw] leading-[0.8] font-bold tracking-tighter -ml-1">
            {dateStr.split(" ")[0]}
            <span className="text-black/10">{dateStr.split(" ")[1]}</span>
          </h1>
        </motion.div>
      </div>
    </div>
  );
}
