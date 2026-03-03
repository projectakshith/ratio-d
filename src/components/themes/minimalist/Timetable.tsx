"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, User, Plus, X } from "lucide-react";
import {
  buildCourseMap,
  processSchedule,
  getDayOverview,
  parseTimetableTime,
} from "@/utils/timetableLogic";

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "tween", ease: [0.25, 1, 0.5, 1], duration: 0.3 },
  },
};

export default function MinimalTimetable({ data, academia }: any) {
  const [mounted, setMounted] = useState(false);
  const schedule = academia?.effectiveSchedule || {};
  const dayOrder = parseInt(String(academia?.effectiveDayOrder)) || 1;

  const [activeDay, setActiveDay] = useState<number>(1);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [newSub, setNewSub] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("08:50");
  const [newType, setNewType] = useState<"theory" | "lab">("theory");

  const [customClasses, setCustomClasses] = useState<Record<number, any[]>>({});

  useEffect(() => {
    setMounted(true);
    if (!isNaN(dayOrder) && dayOrder >= 1 && dayOrder <= 5) {
      const todayData = schedule[`Day ${dayOrder}`] || {};
      let lastEnd = 0;
      Object.keys(todayData).forEach((time) => {
        const endStr = time.split("-")[1];
        if (endStr) {
          const endMins = parseTimetableTime(endStr);
          if (endMins > lastEnd) lastEnd = endMins;
        }
      });

      const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
      if (lastEnd > 0 && nowMins >= lastEnd) {
        setActiveDay(dayOrder < 5 ? dayOrder + 1 : 1);
      } else {
        setActiveDay(dayOrder);
      }
    }
    const updateCustomClasses = () => {
      const stored = localStorage.getItem("ratio_custom_classes");
      if (stored) {
        try {
          setCustomClasses(JSON.parse(stored));
        } catch (e) {}
      }
    };
    updateCustomClasses();
    window.addEventListener("custom_classes_updated", updateCustomClasses);
    return () =>
      window.removeEventListener("custom_classes_updated", updateCustomClasses);
  }, [dayOrder, schedule]);

  const courseMap = useMemo(() => buildCourseMap(data), [data]);

  const handleAddClass = () => {
    if (!newSub.trim() || !newRoom.trim() || !startTime || !endTime) return;

    const stored = localStorage.getItem("ratio_custom_classes");
    const currentCustoms = stored ? JSON.parse(stored) : {};

    const newClassItem = {
      id: `custom-${Date.now()}`,
      code: newSub,
      courseTitle: newSub,
      course: newSub,
      time: `${startTime} - ${endTime}`,
      room: newRoom,
      faculty: "user added",
      slot: newType === "lab" ? "P1" : "A1",
      type: newType,
      isCustom: true,
    };

    const updated = {
      ...currentCustoms,
      [activeDay]: [...(currentCustoms[activeDay] || []), newClassItem],
    };

    localStorage.setItem("ratio_custom_classes", JSON.stringify(updated));
    window.dispatchEvent(new Event("custom_classes_updated"));

    setNewSub("");
    setNewRoom("");
    setStartTime("08:00");
    setEndTime("08:50");
    setIsAddingClass(false);
  };

  const handleDeleteCustom = (day: number, timeStr: string) => {
    const stored = localStorage.getItem("ratio_custom_classes");
    if (!stored) return;
    const currentCustoms = JSON.parse(stored);

    if (currentCustoms[day]) {
      currentCustoms[day] = currentCustoms[day].filter(
        (c: any) => c.time !== timeStr,
      );
      localStorage.setItem(
        "ratio_custom_classes",
        JSON.stringify(currentCustoms),
      );
      window.dispatchEvent(new Event("custom_classes_updated"));
    }
  };

  const currentSchedule = useMemo(() => {
    return processSchedule(
      schedule,
      customClasses,
      activeDay,
      dayOrder,
      courseMap,
    );
  }, [schedule, customClasses, activeDay, dayOrder, courseMap]);

  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => {
        const currentClassElement = document.getElementById(
          "active-class-indicator",
        );
        if (currentClassElement) {
          currentClassElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [mounted, activeDay]);

  if (!mounted) return null;
  const overview = getDayOverview(currentSchedule);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .break-dotted {
            background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='20' ry='20' stroke='%23111111' stroke-width='2' stroke-dasharray='6%2c 12' stroke-dashoffset='0' stroke-linecap='round' opacity='0.15'/%3e%3c/svg%3e");
            border-radius: 20px;
          }
        `,
        }}
      />

      <div className="absolute inset-0 bg-[#F7F7F7]">
        <div
          ref={scrollContainerRef}
          className="h-full w-full overflow-y-auto no-scrollbar px-6 pt-10 pb-[280px] flex flex-col relative z-10"
        >
          <div className="w-full flex flex-col items-center mt-2 mb-8 shrink-0 relative">
            <span
              className="text-[12px] font-bold lowercase tracking-[0.3em] text-[#111111]/40 mb-3 text-center"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              current day order
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className="text-[7.5rem] leading-[0.8] font-black tracking-tighter text-[#111111] text-center"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {String(activeDay).padStart(2, "0")}
              </span>
              {activeDay !== dayOrder && (
                <span
                  className="text-[14px] font-bold text-[#111111]/40 lowercase tracking-widest"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  • upcoming
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col mb-8 w-full shrink-0">
            <button
              onClick={() => setIsAddingClass(true)}
              className="w-full border-[1.5px] border-[#111111] rounded-[24px] p-4 flex items-center justify-between bg-white shadow-sm active:scale-95 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#111111]" />
                <span
                  className="text-[14px] font-bold lowercase tracking-widest text-[#111111]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  custom class
                </span>
              </div>
              <Plus size={20} strokeWidth={2.5} className="text-[#111111]" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeDay}
              variants={listVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="flex flex-col w-full"
            >
              <motion.div
                variants={itemVariants}
                className="w-full bg-[#F2FFDB] border-[1.5px] border-[#85a818]/30 rounded-[24px] p-5 mb-8 flex items-center justify-between shadow-sm"
              >
                <div className="flex flex-col">
                  <span
                    className="text-[10px] font-bold lowercase tracking-[0.2em] text-[#4d6600]/60 mb-1"
                    style={{ fontFamily: "'Afacad', sans-serif" }}
                  >
                    day overview
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-[24px] font-black tracking-tighter text-[#4d6600]"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {overview.start}
                    </span>
                    <span
                      className="text-[14px] font-bold text-[#4d6600]/40"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      to
                    </span>
                    <span
                      className="text-[24px] font-black tracking-tighter text-[#4d6600]"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {overview.end}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className="text-[32px] leading-[0.8] font-black text-[#4d6600]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {overview.count}
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest text-[#4d6600]/60 mt-1.5"
                    style={{ fontFamily: "'Afacad', sans-serif" }}
                  >
                    classes
                  </span>
                </div>
              </motion.div>

              <div className="flex flex-col gap-4 w-full relative">
                <div className="absolute left-[23px] top-6 bottom-6 w-[2px] bg-[#111111]/5 rounded-full z-0" />

                {currentSchedule.map((item) => {
                  if (item.type === "break") {
                    return (
                      <motion.div
                        variants={itemVariants}
                        key={item.id}
                        className="flex items-center gap-4 w-full z-10"
                      >
                        <div className="w-12 flex justify-center shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#111111]/10 ring-4 ring-[#F7F7F7]" />
                        </div>
                        <div className="flex-1 break-dotted p-4 flex items-center justify-between">
                          <span
                            className="text-[14px] font-bold lowercase tracking-widest text-[#111111]/40"
                            style={{ fontFamily: "'Afacad', sans-serif" }}
                          >
                            {item.title}
                          </span>
                          <span
                            className="text-[11px] font-bold tracking-widest text-[#111111]/40"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            {item.time}
                          </span>
                        </div>
                      </motion.div>
                    );
                  }

                  const isLab = item.type === "lab";
                  const labTheme = isLab
                    ? "border-[#0EA5E9]/20 bg-[#E0F2FE]/50"
                    : "border-[#111111]/10 bg-white";
                  const currentTheme = item.isCurrent
                    ? "bg-[#111111] border-transparent shadow-lg scale-[1.02] transform-gpu"
                    : labTheme;
                  const textTheme = item.isCurrent
                    ? "text-white"
                    : isLab
                      ? "text-[#111111]"
                      : "text-[#111111]";
                  const subTextTheme = item.isCurrent
                    ? "text-white/60"
                    : isLab
                      ? "text-[#111111]/60"
                      : "text-[#111111]/50";

                  return (
                    <motion.div
                      variants={itemVariants}
                      key={item.id}
                      id={item.isCurrent ? "active-class-indicator" : undefined}
                      className="flex items-stretch gap-4 w-full z-10 relative"
                    >
                      <div className="w-12 flex justify-center pt-6 shrink-0 relative">
                        <div
                          className={`w-3.5 h-3.5 rounded-full ring-4 ring-[#F7F7F7] z-10 ${item.isCurrent ? "bg-[#85a818] animate-pulse shadow-[0_0_12px_rgba(133,168,24,0.8)]" : isLab ? "bg-[#0EA5E9]" : "bg-[#111111]"}`}
                        />
                        {item.isCurrent && (
                          <div className="absolute top-6 w-3.5 h-3.5 rounded-full bg-[#85a818] animate-ping opacity-50" />
                        )}
                      </div>

                      <div
                        className={`flex-1 border-[1.5px] rounded-[24px] p-5 flex flex-col transition-all relative ${currentTheme} ${!item.isCurrent && "shadow-sm"}`}
                      >
                        {item.isCustom && (
                          <button
                            onClick={() =>
                              handleDeleteCustom(activeDay, item.time)
                            }
                            className="absolute top-3 right-3 w-8 h-8 bg-[#FF4D4D]/10 text-[#FF4D4D] rounded-full flex items-center justify-center hover:bg-[#FF4D4D]/20 active:scale-95 transition-all z-20"
                          >
                            <X size={16} strokeWidth={2.5} />
                          </button>
                        )}

                        <div className="flex justify-between items-start mb-4 pr-10">
                          <div
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] ${item.isCurrent ? "bg-white/10" : isLab ? "bg-[#0EA5E9]/10" : "bg-[#F7F7F7]"}`}
                          >
                            <Clock
                              size={12}
                              className={
                                item.isCurrent
                                  ? "text-[#85a818]"
                                  : isLab
                                    ? "text-[#0EA5E9]"
                                    : "text-[#111111]/50"
                              }
                            />
                            <span
                              className={`text-[12px] font-bold tracking-widest ${textTheme}`}
                              style={{ fontFamily: "'Montserrat', sans-serif" }}
                            >
                              {item.time}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isLab && !item.isCurrent && (
                              <span
                                className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#0EA5E9] bg-[#0EA5E9]/10 px-2 py-1 rounded-md shrink-0 ml-2"
                                style={{ fontFamily: "'Afacad', sans-serif" }}
                              >
                                practical
                              </span>
                            )}
                            {item.isCurrent && (
                              <span
                                className="text-[9px] font-bold uppercase tracking-[0.25em] text-white bg-[#85a818] px-2 py-1 rounded-md shrink-0 ml-2"
                                style={{ fontFamily: "'Afacad', sans-serif" }}
                              >
                                live
                              </span>
                            )}
                          </div>
                        </div>

                        <span
                          className={`text-[24px] font-black uppercase tracking-widest leading-none mb-1 ${textTheme}`}
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          {item.code}
                        </span>
                        <span
                          className={`text-[14px] font-medium lowercase tracking-wide mb-5 ${subTextTheme}`}
                          style={{ fontFamily: "'Afacad', sans-serif" }}
                        >
                          {item.name}
                        </span>

                        <div
                          className={`flex items-center justify-between pt-4 mt-auto border-t ${item.isCurrent ? "border-white/10" : isLab ? "border-[#0EA5E9]/20" : "border-[#111111]/5"}`}
                        >
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <MapPin
                                size={12}
                                className={
                                  item.isCurrent
                                    ? "text-white/40"
                                    : isLab
                                      ? "text-[#0EA5E9]/50"
                                      : "text-[#111111]/30"
                                }
                              />
                              <span
                                className={`text-[11px] font-bold uppercase tracking-wider ${textTheme}`}
                                style={{
                                  fontFamily: "'Montserrat', sans-serif",
                                }}
                              >
                                {item.room}
                              </span>
                            </div>
                            <div
                              className={`w-1 h-1 rounded-full ${item.isCurrent ? "bg-white/20" : isLab ? "bg-[#0EA5E9]/30" : "bg-[#111111]/20"}`}
                            />
                            <div className="flex items-center gap-1.5">
                              <User
                                size={12}
                                className={
                                  item.isCurrent
                                    ? "text-white/40"
                                    : isLab
                                      ? "text-[#0EA5E9]/50"
                                      : "text-[#111111]/30"
                                }
                              />
                              <span
                                className={`text-[11px] font-bold lowercase tracking-wider ${item.isCurrent ? "text-white/80" : isLab ? "text-[#111111]" : "text-[#111111]/70"}`}
                                style={{ fontFamily: "'Afacad', sans-serif" }}
                              >
                                {item.faculty}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="fixed bottom-[85px] left-1/2 -translate-x-1/2 bg-[#111111]/95 backdrop-blur-md p-1.5 pr-2 rounded-full flex items-center gap-1 z-40 shadow-[0_8px_32px_rgba(17,17,17,0.3)] border border-white/10">
          <span
            className="text-[11px] font-bold text-white/40 ml-3 mr-1 tracking-widest"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            DO
          </span>
          <div className="w-[1.5px] h-5 bg-white/20 mx-1 rounded-full" />
          {[1, 2, 3, 4, 5].map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${
                activeDay === day
                  ? "bg-[#85a818] text-white scale-105 shadow-[0_0_12px_rgba(133,168,24,0.4)]"
                  : "bg-transparent text-white/40 hover:text-white hover:bg-white/10"
              }`}
            >
              <span
                className="text-[16px] font-black"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {day}
              </span>
            </button>
          ))}
        </div>

        {/* RESTORED EXACT WATERMARK OPACITY TO 100% and z-index 20 to sit beautifully behind items */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#F7F7F7] via-[#F7F7F7]/95 to-transparent px-6 pt-24 pb-[30px] z-20 flex justify-between items-end pointer-events-none">
          {"timetable".split("").map((char, i) => (
            <span
              key={i}
              className="text-[3.2rem] leading-[0.75] lowercase text-[#111111]"
              style={{ fontFamily: "'Afacad', sans-serif", fontWeight: 400 }}
            >
              {char}
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isAddingClass && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            className="fixed inset-0 bg-[#111111] z-[60] flex flex-col px-6 pt-10 pb-6 overflow-hidden"
          >
            <div className="flex justify-between items-start w-full shrink-0 mb-10">
              <div className="flex flex-col">
                <span
                  className="text-[32px] leading-[1] font-black uppercase tracking-[0.15em] text-white"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  ADD CLASS
                </span>
                <span
                  className="text-[10px] font-bold lowercase tracking-[0.2em] text-[#85a818] mt-1.5"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  custom schedule mapping
                </span>
              </div>
              <button
                onClick={() => setIsAddingClass(false)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-95 transition-all shrink-0"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex flex-col gap-6 flex-1 w-full">
              <div className="flex flex-col gap-2">
                <span
                  className="text-[11px] font-bold uppercase tracking-widest text-white/50 pl-1"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  Subject Code
                </span>
                <input
                  type="text"
                  placeholder="e.g. DTM"
                  value={newSub}
                  onChange={(e) => setNewSub(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-[16px] px-4 py-4 text-white text-[16px] font-bold placeholder:text-white/20 uppercase tracking-widest outline-none focus:border-[#85a818]/50 transition-colors"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span
                  className="text-[11px] font-bold uppercase tracking-widest text-white/50 pl-1"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  Room / Hall
                </span>
                <input
                  type="text"
                  placeholder="e.g. UB304"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-[16px] px-4 py-4 text-white text-[16px] font-bold placeholder:text-white/20 uppercase tracking-widest outline-none focus:border-[#85a818]/50 transition-colors"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-2">
                  <span
                    className="text-[11px] font-bold uppercase tracking-widest text-white/50 pl-1"
                    style={{ fontFamily: "'Afacad', sans-serif" }}
                  >
                    Start Time
                  </span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-[16px] px-4 py-4 text-white text-[16px] font-bold outline-none focus:border-[#85a818]/50 transition-colors [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <span
                    className="text-[11px] font-bold uppercase tracking-widest text-white/50 pl-1"
                    style={{ fontFamily: "'Afacad', sans-serif" }}
                  >
                    End Time
                  </span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-[16px] px-4 py-4 text-white text-[16px] font-bold outline-none focus:border-[#85a818]/50 transition-colors [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <span
                  className="text-[11px] font-bold uppercase tracking-widest text-white/50 pl-1 mb-1"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  Class Type
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => setNewType("theory")}
                    className={`flex-1 py-4 rounded-[16px] text-[13px] font-bold uppercase tracking-widest transition-all ${newType === "theory" ? "bg-white text-[#111111]" : "bg-white/5 text-white/50 border border-white/10"}`}
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Theory
                  </button>
                  <button
                    onClick={() => setNewType("lab")}
                    className={`flex-1 py-4 rounded-[16px] text-[13px] font-bold uppercase tracking-widest transition-all ${newType === "lab" ? "bg-[#0EA5E9] text-white" : "bg-white/5 text-white/50 border border-white/10"}`}
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Practical
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleAddClass}
              className="w-full bg-[#85a818] text-white py-5 rounded-[20px] text-[15px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(133,168,24,0.3)] active:scale-[0.98] transition-all mt-auto shrink-0"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              add to schedule
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
