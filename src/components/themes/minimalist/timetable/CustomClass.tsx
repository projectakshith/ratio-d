"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface AddClassProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  newSub: string;
  setNewSub: (val: string) => void;
  newRoom: string;
  setNewRoom: (val: string) => void;
  startTime: string;
  setStartTime: (val: string) => void;
  endTime: string;
  setEndTime: (val: string) => void;
  newType: "theory" | "lab";
  setNewType: (val: "theory" | "lab") => void;
  handleAddClass: () => void;
}

export default function CustomClass({
  isOpen,
  onClose,
  isDark,
  newSub,
  setNewSub,
  newRoom,
  setNewRoom,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  newType,
  setNewType,
  handleAddClass,
}: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          className={`fixed inset-0 ${isDark ? "bg-[#111111]" : "bg-white"} z-[60] flex flex-col px-6 pt-10 pb-6 overflow-hidden`}
        >
          <div className="flex justify-between items-start w-full shrink-0 mb-10">
            <div className="flex flex-col">
              <span
                className={`text-[32px] leading-[1] font-black uppercase tracking-[0.15em] ${isDark ? "text-white" : "text-[#111111]"}`}
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
              onClick={onClose}
              className={`w-10 h-10 rounded-full ${isDark ? "bg-white/10 text-white" : "bg-[#111111]/5 text-[#111111]"} flex items-center justify-center active:scale-95 transition-all shrink-0`}
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex flex-col gap-6 flex-1 w-full">
            <div className="flex flex-col gap-2">
              <span
                className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? "text-white/50" : "text-[#111111]/50"} pl-1`}
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                Subject Code
              </span>
              <input
                type="text"
                placeholder="e.g. DTM"
                value={newSub}
                onChange={(e) => setNewSub(e.target.value)}
                className={`w-full ${isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" : "bg-[#111111]/5 border-[#111111]/10 text-[#111111] placeholder:text-[#111111]/20"} border rounded-[16px] px-4 py-4 text-[16px] font-bold uppercase tracking-widest outline-none focus:border-[#85a818]/50 transition-colors`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span
                className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? "text-white/50" : "text-[#111111]/50"} pl-1`}
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                Room / Hall
              </span>
              <input
                type="text"
                placeholder="e.g. UB304"
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
                className={`w-full ${isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" : "bg-[#111111]/5 border-[#111111]/10 text-[#111111] placeholder:text-[#111111]/20"} border rounded-[16px] px-4 py-4 text-[16px] font-bold uppercase tracking-widest outline-none focus:border-[#85a818]/50 transition-colors`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-2">
                <span
                  className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? "text-white/50" : "text-[#111111]/50"} pl-1`}
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  Start Time
                </span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={`w-full ${isDark ? "bg-white/5 border-white/10 text-white [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" : "bg-[#111111]/5 border-[#111111]/10 text-[#111111]"} border rounded-[16px] px-4 py-4 text-[16px] font-bold outline-none focus:border-[#85a818]/50 transition-colors`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                />
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <span
                  className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? "text-white/50" : "text-[#111111]/50"} pl-1`}
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  End Time
                </span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={`w-full ${isDark ? "bg-white/5 border-white/10 text-white [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" : "bg-[#111111]/5 border-[#111111]/10 text-[#111111]"} border rounded-[16px] px-4 py-4 text-[16px] font-bold outline-none focus:border-[#85a818]/50 transition-colors`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <span
                className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? "text-white/50" : "text-[#111111]/50"} pl-1 mb-1`}
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                Class Type
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setNewType("theory")}
                  className={`flex-1 py-4 rounded-[16px] text-[13px] font-bold uppercase tracking-widest transition-all ${newType === "theory" ? (isDark ? "bg-white text-[#111111]" : "bg-[#111111] text-white") : isDark ? "bg-white/5 text-white/50 border border-white/10" : "bg-[#111111]/5 text-[#111111]/50 border border-black/5"}`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Theory
                </button>
                <button
                  onClick={() => setNewType("lab")}
                  className={`flex-1 py-4 rounded-[16px] text-[13px] font-bold uppercase tracking-widest transition-all ${newType === "lab" ? "bg-[#0EA5E9] text-white" : isDark ? "bg-white/5 text-white/50 border border-white/10" : "bg-[#111111]/5 text-[#111111]/50 border border-black/5"}`}
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
  );
}
