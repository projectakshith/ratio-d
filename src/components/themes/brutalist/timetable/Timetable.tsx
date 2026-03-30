"use client";
import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, User, ArrowRight, Layers, Clock } from "lucide-react";
import {
  getDayOverview,
  processSchedule,
} from "@/utils/dashboard/timetableLogic";
import { flavorText } from "@/utils/shared/flavortext";
import { useApp } from "@/context/AppContext";
import { UserAvatar } from "@/components/shared/UserAvatar";

export default function Timetable({ schedule, dayOrder, data }) {
  const { profileSeed } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeDayOrder, setActiveDayOrder] = useState(1);
  const [customClasses, setCustomClasses] = useState<Record<number, any[]>>({});
  const [mounted, setMounted] = useState(false);
  const [introMode, setIntroMode] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (dayOrder && dayOrder !== "-") {
      setActiveDayOrder(parseInt(dayOrder));
    }
    const fetchCustoms = () => {
      const stored = localStorage.getItem("ratio_custom_classes");
      if (stored) {
        try {
          setCustomClasses(JSON.parse(stored));
        } catch (e) {}
      }
    };
    fetchCustoms();
    window.addEventListener("custom_classes_updated", fetchCustoms);

    const timer = setTimeout(() => setIntroMode(false), 800);

    return () => {
      window.removeEventListener("custom_classes_updated", fetchCustoms);
      clearTimeout(timer);
    };
  }, [dayOrder]);

  const currentRoast = useMemo(() => {
    const roasts = flavorText.timetable || [
      "your schedule is looking tight.",
      "another day, another set of bunkers.",
      "may your classes be short and attendance high.",
      "the grind doesn't stop, but you can.",
    ];
    return roasts[Math.floor(Math.random() * roasts.length)];
  }, []);

  const courseMap = useMemo(() => {
    const map: any = {};
    if (data?.attendance) {
      data.attendance.forEach((sub: any) => {
        if (sub.code && sub.title) {
          const code = sub.code.trim();
          const isPrac = (sub.category || "").toLowerCase().includes("practical") || 
                        (sub.slot || "").toUpperCase().startsWith("P");
          
          if (!map[code] || isPrac) {
            map[code] = sub.title;
          }
        }
      });
    }
    return map;
  }, [data]);

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
    return processSchedule(
      schedule,
      customClasses,
      activeDayOrder,
      parseInt(dayOrder) || 1,
      courseMap,
    );
  }, [schedule, customClasses, activeDayOrder, dayOrder, courseMap]);

  if (!mounted) return null;

  return (
    <div className="h-screen w-full bg-[#050505] flex flex-col relative overflow-hidden font-sans">
      <div className="pt-16 px-8 absolute top-0 w-full z-0">
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
      </div>

      <motion.div
        layout
        animate={{
          top: isExpanded ? "0%" : "38%",
          height: isExpanded ? "100%" : "62%",
        }}
        transition={{ type: "spring", stiffness: 200, damping: 30 }}
        className={`absolute w-full bg-[#fdfdfd] flex flex-col shadow-[0_-30px_80px_rgba(0,0,0,0.9)] z-20 overflow-hidden rounded-t-[32px] transition-transform duration-700 ease-in-out ${
          introMode ? "translate-y-[60%]" : "translate-y-0"
        }`}
      >
        <div className="w-full bg-[#fdfdfd] z-30 pt-4 pb-2 sticky top-0">
          <div
            className="w-full flex justify-center mb-6 cursor-grab active:cursor-grabbing"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="w-12 h-1.5 bg-black/10 rounded-full"></div>
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
                  className={`flex-1 h-11 rounded-xl flex items-center justify-center text-lg font-bold transition-all
                    ${
                      activeDayOrder === num
                        ? "bg-black text-[#ceff1c] shadow-lg scale-105"
                        : "bg-white text-black/40 border border-black/5"
                    }
                  `}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-24 pt-2">
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {currentSchedule.length > 0 ? (
                currentSchedule.map((item: any, index: number) => {
                  if (item.type === "break") {
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-center py-2"
                      >
                        <span className="text-[10px] font-bold tracking-widest text-black/30 uppercase">
                          {item.title}
                        </span>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className={`w-full rounded-[24px] p-5 relative border transition-all duration-300
                        ${
                          item.isCurrent
                            ? "bg-white border-[#3b82f6] shadow-xl ring-1 ring-blue-100"
                            : "bg-white border-[#f0f0f0]"
                        }
                      `}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-2 rounded-lg ${item.isCurrent ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400"}`}
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
                          {item.slot || (item.type === "lab" ? "PRAC" : "THRY")}
                        </div>
                      </div>

                      <div className="mb-4">
                        <h3
                          className="text-lg font-bold text-black leading-tight lowercase mb-2"
                          style={{ fontFamily: "Aonic" }}
                        >
                          {item.name || item.course}
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
                              item.isCurrent ? "text-blue-500" : "text-black/20"
                            }
                          />
                          <span className="text-xs font-black text-black uppercase">
                            {item.room}
                          </span>
                        </div>

                        {item.isCurrent && (
                          <span className="flex items-center gap-1.5 text-[9px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-tighter animate-pulse">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                            In Progress
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                  <Layers size={48} className="mb-4" />
                  <h3 className="text-xl font-bold lowercase">free day</h3>
                  <p className="text-[10px] uppercase tracking-[0.2em]">
                    No classes scheduled
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {introMode && (
          <motion.div
            key="introOverlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col justify-end items-start p-8 pb-[60%] z-50 bg-[#050505]"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <h1
                className="text-6xl font-black lowercase tracking-tighter text-[#ceff1c] mb-2"
                style={{ fontFamily: "Aonic" }}
              >
                timetable
              </h1>
              <p
                className="text-xl font-bold lowercase text-white/80 leading-tight max-w-[80%] flex items-center gap-2"
                style={{ fontFamily: "Aonic" }}
              >
                <UserAvatar seed={profileSeed} className="w-6 h-6 shrink-0" />
                {currentRoast}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
