"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Bell,
  CheckCircle,
  GraduationCap,
  User,
  X,
  Plus,
} from "lucide-react";

export default function MinimalHomepage({
  setActiveTab,
}: {
  setActiveTab?: (tab: string) => void;
}) {
  const userName = "akshith";
  const dayOrder = "01";
  const upcomingAttendance = "74.5";
  const upcomingSafe = parseFloat(upcomingAttendance) >= 75;

  const [mounted, setMounted] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [personalNotes, setPersonalNotes] = useState([
    { id: 1, text: "bring physics lab record on friday", date: "today" },
    { id: 2, text: "ask prof about ml assignment", date: "yesterday" },
  ]);

  const officialAlerts = [
    {
      id: 101,
      title: "CT-1 Schedule Released",
      desc: "Starts from Oct 12th. Check timetable.",
      type: "exam",
    },
    {
      id: 102,
      title: "Fee Payment Overdue",
      desc: "Last date to clear dues is tomorrow.",
      type: "admin",
    },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setPersonalNotes([
      { id: Date.now(), text: newNote, date: "just now" },
      ...personalNotes,
    ]);
    setNewNote("");
  };

  const timetableGrid = [
    {
      id: 1,
      sub: "dtm",
      room: "tp101",
      time: "8:00-8:50",
      active: true,
      isCurrent: true,
    },
    {
      id: 2,
      sub: "oops",
      room: "ub204",
      time: "8:50-9:40",
      active: true,
      isCurrent: false,
    },
    { id: 3, active: false },
    {
      id: 4,
      sub: "ml",
      room: "tp102",
      time: "10:40-11:30",
      active: true,
      isCurrent: false,
    },
    { id: 5, active: false },
    {
      id: 6,
      sub: "dsa",
      room: "ub205",
      time: "11:30-12:20",
      active: true,
      isCurrent: false,
    },
    { id: 7, active: false },
    {
      id: 8,
      sub: "os",
      room: "tp103",
      time: "1:30-2:20",
      active: true,
      isCurrent: false,
    },
    { id: 9, active: false },
    {
      id: 10,
      sub: "dbms",
      room: "tp104",
      time: "2:20-3:10",
      active: true,
      isCurrent: false,
    },
  ];

  if (!mounted) return null;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700;800;900&display=swap');

          .custom-dotted {
            background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='14' ry='14' stroke='%2311111150' stroke-width='2' stroke-dasharray='4%2c 8' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e");
            border-radius: 14px;
          }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `,
        }}
      />

      <div className="min-h-screen w-full flex flex-col bg-[#F7F7F7] text-[#111111] px-6 pt-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-between items-center mb-6 shrink-0"
        >
          <div className="w-[50px] h-[50px] rounded-[16px] bg-[#111111] flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
            <User size={22} color="white" />
          </div>
          <div className="flex flex-col items-end">
            <span
              className="text-[16px] font-semibold lowercase tracking-widest text-[#111111]/50 mb-[-4px]"
              style={{ fontFamily: "'Afacad', sans-serif" }}
            >
              sup!
            </span>
            <span
              className="text-[25px] leading-none font-medium lowercase tracking-tight text-[#111111]"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {userName}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-5 gap-[8px] mb-8 shrink-0"
        >
          {timetableGrid.map((slot) =>
            slot.active ? (
              <div
                key={slot.id}
                className={`aspect-square rounded-[14px] border-[1.5px] border-[#111111] flex flex-col items-center justify-center gap-[6px] p-1 transition-all
                  ${slot.isCurrent ? "bg-[#111111] shadow-[0_6px_16px_rgba(0,0,0,0.2)] scale-105 z-10" : "bg-white"}
                `}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest leading-none text-center
                    ${slot.isCurrent ? "text-white/80" : "text-[#111111]/50"}`}
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  {slot.room}
                </span>

                <span
                  className={`text-[17px] font-black uppercase tracking-wider leading-none
                    ${slot.isCurrent ? "text-white" : "text-[#111111]"}`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {slot.sub}
                </span>

                <span
                  className={`text-[9.5px] font-bold tracking-tight leading-none text-center
                    ${slot.isCurrent ? "text-white" : "text-[#111111]/70"}`}
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  {slot.time}
                </span>
              </div>
            ) : (
              <div
                key={slot.id}
                className="aspect-square bg-[#EFEFEF]/50 custom-dotted"
              />
            ),
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-col mb-8 shrink-0 w-full"
        >
          <div className="flex items-center gap-3 mb-2 w-full">
            <span
              className="text-[14px] font-bold lowercase tracking-[0.25em] text-[#111111]/50 whitespace-nowrap"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              next up
            </span>
            <div className="flex-1 h-[1.5px] bg-[#111111]/15 rounded-full" />
            <span
              className="text-[13px] font-black uppercase tracking-[0.2em] text-[#111111] whitespace-nowrap"
              style={{ fontFamily: "'Afacad', sans-serif" }}
            >
              DO {dayOrder}
            </span>
          </div>

          <div className="flex flex-col">
            <span
              className="text-[4.5rem] leading-[0.85] font-black tracking-tighter lowercase text-[#111111]"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              machine
            </span>
            <div className="flex items-baseline gap-3">
              <span
                className="text-[4.5rem] leading-[0.85] font-black tracking-tighter lowercase text-[#111111]"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                learning
              </span>
              <span
                className="text-[1.25rem] font-bold uppercase tracking-widest text-[#111111]/40"
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                tp102
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-5 w-full bg-white px-4 py-2.5 rounded-full border-[1.5px] border-[#111111]/10 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#111111] animate-pulse" />
              <span
                className="text-[14px] font-bold lowercase text-[#111111]/70"
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                current class •{" "}
                <strong className="text-[#111111] font-black">dtm</strong>
              </span>
            </div>
            <span
              className="text-[12px] font-bold lowercase text-[#111111]/40"
              style={{ fontFamily: "'Afacad', sans-serif" }}
            >
              ends at 8:50
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex flex-col gap-3 shrink-0 w-full"
        >
          <div
            onClick={() => setActiveTab && setActiveTab("attendance")}
            className={`w-full border-[1.5px] rounded-[24px] p-2 pr-5 flex items-center gap-4 shadow-sm transition-all active:scale-[0.98] cursor-pointer
            ${upcomingSafe ? "bg-white border-[#111111]/10" : "bg-[#FFEDED] border-[#FF4D4D]/30"}
          `}
          >
            <div
              className={`w-[50px] h-[50px] rounded-[18px] flex items-center justify-center shrink-0
              ${upcomingSafe ? "bg-[#F4F4F4]" : "bg-[#FF4D4D]/10"}
            `}
            >
              <CheckCircle
                size={20}
                strokeWidth={2.5}
                className={upcomingSafe ? "text-[#111111]" : "text-[#FF4D4D]"}
              />
            </div>
            <div className="flex-1 flex flex-col justify-center min-w-0 py-0.5">
              <span
                className={`text-[15px] font-bold lowercase leading-tight truncate mb-0.5
                  ${upcomingSafe ? "text-[#111111]" : "text-[#FF4D4D]"}
                `}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                machine learning
              </span>
              <span
                className={`text-[13px] font-medium lowercase truncate
                  ${upcomingSafe ? "text-[#111111]/50" : "text-[#FF4D4D]/70"}
                `}
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                {upcomingAttendance}% •{" "}
                {upcomingSafe ? "safe to bunk" : "attendance required"}
              </span>
            </div>
            <ChevronRight
              size={22}
              strokeWidth={2}
              className={`shrink-0 ${upcomingSafe ? "text-[#111111]/30" : "text-[#FF4D4D]/50"}`}
            />
          </div>

          <div
            onClick={() => setShowAlerts(true)}
            className="w-full bg-[#111111] text-white border-[1.5px] border-[#111111] rounded-[24px] p-2 pr-5 flex items-center gap-4 shadow-md active:scale-[0.98] transition-transform cursor-pointer"
          >
            <div className="w-[50px] h-[50px] rounded-[18px] bg-white/10 flex items-center justify-center shrink-0">
              <Bell size={20} strokeWidth={2.5} className="text-white" />
            </div>
            <div className="flex-1 flex flex-col justify-center min-w-0 py-0.5">
              <span
                className="text-[15px] font-bold lowercase leading-tight truncate mb-0.5 text-b"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                academic alerts
              </span>
              <span
                className="text-[13px] font-medium lowercase text-white/70 truncate"
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                attendance might be cooked.
              </span>
            </div>
            <ChevronRight
              size={22}
              strokeWidth={2}
              className="text-white/30 shrink-0"
            />
          </div>

          <div
            onClick={() => setActiveTab && setActiveTab("marks")}
            className="w-full bg-white border-[1.5px] border-[#111111]/10 rounded-[24px] p-2 pr-5 flex items-center gap-4 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
          >
            <div className="w-[50px] h-[50px] rounded-[18px] bg-[#F4F4F4] flex items-center justify-center shrink-0">
              <GraduationCap
                size={20}
                strokeWidth={2.5}
                className="text-[#111111]"
              />
            </div>
            <div className="flex-1 flex flex-col justify-center min-w-0 py-0.5">
              <span
                className="text-[15px] font-bold lowercase leading-tight text-[#111111] truncate mb-0.5"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                recent marks
              </span>
              <span
                className="text-[13px] font-medium lowercase text-[#111111]/50 truncate"
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                software eng • 18/20
              </span>
            </div>
            <ChevronRight
              size={22}
              strokeWidth={2}
              className="text-[#111111]/30 shrink-0"
            />
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showAlerts && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.8 }}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                setShowAlerts(false);
              }
            }}
            className="fixed inset-0 bg-[#111111] z-[60] flex flex-col px-6 pt-10 pb-6 overflow-hidden"
          >
            <div className="flex justify-between items-start w-full shrink-0 mb-6">
              <div className="flex flex-col">
                <span
                  className="text-[32px] leading-[1] font-black uppercase tracking-[0.15em] text-white"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  ALERTS
                </span>
                <span
                  className="text-[10px] font-bold lowercase tracking-[0.2em] text-white/40 mt-1.5"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  academic & personal
                </span>
              </div>
              <button
                onClick={() => setShowAlerts(false)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-95 transition-all shrink-0"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-8 pb-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 w-full">
                  <span
                    className="text-[11px] font-bold lowercase tracking-[0.25em] text-white/50 whitespace-nowrap"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    official
                  </span>
                  <div className="flex-1 h-[1px] bg-white/10 rounded-full" />
                </div>
                {officialAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-white/5 border border-white/10 rounded-[20px] p-4 flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span
                        className="text-[16px] font-black tracking-widest uppercase text-white"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {alert.title}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${alert.type === "exam" ? "bg-[#8b5cf6]/20 text-[#8b5cf6]" : "bg-[#ceff1c]/20 text-[#ceff1c]"}`}
                        style={{ fontFamily: "'Afacad', sans-serif" }}
                      >
                        {alert.type}
                      </span>
                    </div>
                    <span
                      className="text-[13px] font-medium text-white/60 lowercase"
                      style={{ fontFamily: "'Afacad', sans-serif" }}
                    >
                      {alert.desc}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 w-full">
                  <span
                    className="text-[11px] font-bold lowercase tracking-[0.25em] text-white/50 whitespace-nowrap"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    my notes
                  </span>
                  <div className="flex-1 h-[1px] bg-white/10 rounded-full" />
                </div>

                {personalNotes.length === 0 ? (
                  <span
                    className="text-[12px] font-medium text-white/30 lowercase text-center py-4"
                    style={{ fontFamily: "'Afacad', sans-serif" }}
                  >
                    no notes added yet.
                  </span>
                ) : (
                  personalNotes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-white/5 border border-white/10 rounded-[16px] p-3.5 flex flex-col"
                    >
                      <span
                        className="text-[14px] font-bold text-white/90 lowercase leading-snug mb-2"
                        style={{ fontFamily: "'Afacad', sans-serif" }}
                      >
                        {note.text}
                      </span>
                      <span
                        className="text-[10px] font-bold tracking-widest uppercase text-white/30"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {note.date}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-auto shrink-0 pt-4 bg-[#111111]">
              <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-[20px]">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                  placeholder="add a note..."
                  className="flex-1 bg-transparent text-white outline-none px-3 text-[14px] font-medium placeholder:text-white/30 lowercase"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                />
                <button
                  onClick={handleAddNote}
                  className="w-10 h-10 bg-[#ceff1c] text-[#111111] rounded-[14px] flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Plus size={20} strokeWidth={3} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
