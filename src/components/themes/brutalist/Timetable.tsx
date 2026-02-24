"use client";
import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, User, Clock, Layers } from "lucide-react";

export default function Timetable({ schedule, dayOrder }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeDayOrder, setActiveDayOrder] = useState(1);
  const [introMode, setIntroMode] = useState(true);

  useEffect(() => {
    if (dayOrder && dayOrder !== "-") {
      setActiveDayOrder(parseInt(dayOrder));
    }
    const timer = setTimeout(() => setIntroMode(false), 800);
    return () => clearTimeout(timer);
  }, [dayOrder]);

  const dateDisplay = useMemo(() => {
    const d = new Date();
    return {
      date: d.getDate(),
      month: d.toLocaleString("default", { month: "short" }).toUpperCase(),
      day: d.toLocaleString("default", { weekday: "long" }).toUpperCase(),
      year: d.getFullYear(),
    };
  }, []);

  const currentSchedule = useMemo(() => {
    if (!schedule) return [];

    const dayKey = `Day ${activeDayOrder}`;
    const dayData = schedule[dayKey];
    if (!dayData) return [];

    const rawItems = Object.values(dayData)
      .map((details: any) => {
        if (!details || !details.time) return null;

        const [startStr, endStr] = details.time.split(" - ");

        const parseTime = (str) => {
          if (!str) return 0;
          let [h, m] = str.split(":").map(Number);
          if (h < 8) h += 12;
          return h * 60 + m;
        };

        return {
          ...details,
          start: startStr,
          end: endStr,
          minutesStart: parseTime(startStr),
          minutesEnd: parseTime(endStr),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.minutesStart - b.minutesStart);

    const mergedItems = [];
    rawItems.forEach((item) => {
      const lastItem: any = mergedItems[mergedItems.length - 1];

      if (
        lastItem &&
        lastItem.course === item.course &&
        lastItem.room === item.room &&
        lastItem.minutesEnd === item.minutesStart
      ) {
        lastItem.end = item.end;
        lastItem.minutesEnd = item.minutesEnd;
        lastItem.slot = `${lastItem.slot} + ${item.slot}`;
      } else {
        mergedItems.push({ ...item });
      }
    });

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const isToday = parseInt(dayOrder) === activeDayOrder;

    return mergedItems.map((item) => ({
      ...item,
      isNow:
        isToday &&
        nowMinutes >= item.minutesStart &&
        nowMinutes < item.minutesEnd,
      isPast: isToday && nowMinutes >= item.minutesEnd,
    }));
  }, [schedule, activeDayOrder, dayOrder]);

  return (
    <div className="h-screen w-full bg-[#050505] flex flex-col relative overflow-hidden font-sans">
      <motion.div
        layout
        initial={{ height: "100%" }}
        animate={{
          height: introMode ? "100%" : "38%",
        }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-full bg-[#050505] relative z-10 shrink-0 overflow-hidden shadow-xl"
      >
        <AnimatePresence mode="wait">
          {introMode ? (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col justify-end items-start p-8 pb-32"
            >
              <h1
                className="text-6xl font-black lowercase tracking-tighter text-white mb-2"
                style={{ fontFamily: "Aonic" }}
              >
                timetable
              </h1>
              <p
                className="text-xl font-bold lowercase text-white/60 leading-tight max-w-[80%]"
                style={{ fontFamily: "Aonic" }}
              >
                today's schedule
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pt-16 px-8 absolute top-0 w-full h-full"
            >
              <div className="flex flex-col text-white">
                <span
                  className="text-[#ceff1c] font-black text-sm tracking-[0.2em] uppercase mb-2 ml-1"
                  style={{ fontFamily: "Aonic" }}
                >
                  {dateDisplay.day}
                </span>
                <div className="flex items-baseline leading-[0.8]">
                  <h1
                    className="text-[130px] font-medium tracking-tighter text-white"
                    style={{ fontFamily: "Urbanosta" }}
                  >
                    {dateDisplay.date}
                  </h1>
                  <div className="flex flex-col ml-4 mb-3">
                    <span
                      className="text-4xl font-black text-white/30 uppercase"
                      style={{ fontFamily: "Aonic" }}
                    >
                      {dateDisplay.month}
                    </span>
                    <span className="text-xs text-white/20 font-bold font-mono tracking-widest mt-1">
                      {dateDisplay.year}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        layout
        initial={{ y: "100%" }}
        animate={{
          y: introMode ? "100%" : "0%",
          height: isExpanded ? "85%" : "62%",
        }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="absolute bottom-0 w-full bg-[#fdfdfd] flex flex-col shadow-[0_-30px_80px_rgba(0,0,0,0.5)] z-20 overflow-hidden rounded-t-[40px]"
      >
        <div className="w-full bg-[#fdfdfd] z-30 pt-4 pb-2 sticky top-0 shrink-0">
          <div
            className="w-full flex justify-center mb-6 cursor-grab active:cursor-grabbing py-2"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="w-12 h-1.5 bg-black/10 rounded-full transition-colors hover:bg-black/20"></div>
          </div>

          <div className="px-6 pb-2">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-black/40">
                Day Order
              </span>
              {parseInt(dayOrder) === activeDayOrder && (
                <span className="text-[9px] font-bold uppercase tracking-widest text-black bg-[#ceff1c] px-2 py-0.5 rounded-sm">
                  Today
                </span>
              )}
            </div>

            <div className="flex justify-between gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setActiveDayOrder(num)}
                  className={`flex-1 h-11 rounded-xl flex items-center justify-center text-lg font-bold transition-all duration-200
                    ${
                      activeDayOrder === num
                        ? "bg-black text-[#ceff1c] shadow-lg scale-105"
                        : "bg-white text-black/40 shadow-sm hover:bg-gray-50"
                    }
                  `}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-32 pt-2 custom-scrollbar">
          <div className="flex flex-col gap-3 min-h-full">
            <AnimatePresence mode="wait">
              {currentSchedule.length > 0 ? (
                <motion.div
                  key={activeDayOrder}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-3"
                >
                  {currentSchedule.map((item: any, index: number) => (
                    <div
                      key={`${activeDayOrder}-${index}`}
                      className={`w-full rounded-[24px] p-5 relative transition-all duration-200
                        ${
                          item.isNow
                            ? "bg-white shadow-[0_10px_30px_rgba(59,130,246,0.15)] ring-1 ring-blue-100"
                            : "bg-white shadow-sm"
                        }
                        ${
                          item.isPast
                            ? "opacity-50 grayscale-[0.5]"
                            : "opacity-100"
                        }
                      `}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-2 rounded-lg ${
                              item.isNow
                                ? "bg-blue-50 text-blue-600"
                                : "bg-gray-50 text-gray-400"
                            }`}
                          >
                            <Clock size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-lg font-bold text-black leading-none">
                              {item.start}
                            </span>
                            <span className="text-[10px] font-medium text-black/40 uppercase mt-1">
                              to {item.end}
                            </span>
                          </div>
                        </div>
                        <div className="text-[9px] font-bold text-black/40 uppercase tracking-widest bg-black/5 px-2 py-1 rounded">
                          {item.slot}
                        </div>
                      </div>

                      <div className="mb-4">
                        <h3
                          className="text-lg font-bold text-black leading-tight lowercase mb-2"
                          style={{ fontFamily: "Aonic" }}
                        >
                          {item.course}
                        </h3>
                        <div className="flex items-center gap-2">
                          <User size={12} className="text-black/30" />
                          <span className="text-[10px] font-bold uppercase tracking-wide text-black/50">
                            {item.faculty?.split("(")[0] || "Faculty N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <MapPin
                            size={14}
                            className={
                              item.isNow ? "text-blue-500" : "text-black/20"
                            }
                          />
                          <span className="text-xs font-black text-black uppercase">
                            {item.room}
                          </span>
                        </div>

                        {item.isNow && (
                          <span className="flex items-center gap-1.5 text-[9px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-tighter">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-20 opacity-30"
                >
                  <Layers size={48} className="mb-4" />
                  <h3 className="text-xl font-bold lowercase">free day</h3>
                  <p className="text-[10px] uppercase tracking-[0.2em]">
                    No classes scheduled
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
