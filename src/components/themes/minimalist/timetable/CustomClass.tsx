"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function CustomClass({
  isOpen,
  onClose,
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
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.6}
          dragListener={true}
          onDragEnd={(e, info) => {
            if (info.offset.y > 150 || info.velocity.y > 500) onClose();
          }}
          className="fixed inset-0 bg-theme-bg z-[60] flex flex-col px-6 pt-6 pb-6 overflow-hidden"
        >
          <div
            className="w-12 h-1.5 bg-theme-text-10 rounded-full mx-auto mb-6 shrink-0"
          />
          <div className="flex justify-between items-start w-full shrink-0 mb-10">
            <div className="flex flex-col">
              <span
                className="text-[32px] leading-[1] font-black uppercase tracking-[0.15em] text-theme-text"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                CUSTOM CLASS
              </span>
              <span
                className="text-[10px] font-bold lowercase tracking-[0.2em] text-theme-highlight mt-1.5"
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                custom schedule mapping
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-theme-surface flex items-center justify-center text-theme-text active:scale-95 transition-all shrink-0"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex flex-col gap-6 flex-1 w-full overflow-y-auto no-scrollbar pb-4">
            <div className="flex flex-col gap-2">
              <span
                className="text-[11px] font-bold uppercase tracking-widest text-theme-muted pl-1"
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                Subject Code
              </span>
              <input
                type="text"
                placeholder="e.g. DTM"
                value={newSub}
                onChange={(e) => setNewSub(e.target.value)}
                className="w-full bg-theme-surface border-theme-subtle text-theme-text placeholder:text-theme-faint border rounded-[16px] px-4 py-4 text-[16px] font-bold uppercase tracking-widest outline-none focus:[border-color:var(--theme-highlight)] transition-colors"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span
                className="text-[11px] font-bold uppercase tracking-widest text-theme-muted pl-1"
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                Room / Hall
              </span>
              <input
                type="text"
                placeholder="e.g. UB304"
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
                className="w-full bg-theme-surface border-theme-subtle text-theme-text placeholder:text-theme-faint border rounded-[16px] px-4 py-4 text-[16px] font-bold uppercase tracking-widest outline-none focus:[border-color:var(--theme-highlight)] transition-colors"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-2">
                <span
                  className="text-[11px] font-bold uppercase tracking-widest text-theme-muted pl-1"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  Start Time
                </span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-theme-surface border-theme-subtle text-theme-text border rounded-[16px] px-4 py-4 text-[16px] font-bold outline-none focus:[border-color:var(--theme-highlight)] transition-colors"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                />
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <span
                  className="text-[11px] font-bold uppercase tracking-widest text-theme-muted pl-1"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  End Time
                </span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-theme-surface border-theme-subtle text-theme-text border rounded-[16px] px-4 py-4 text-[16px] font-bold outline-none focus:[border-color:var(--theme-highlight)] transition-colors"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <span
                className="text-[11px] font-bold uppercase tracking-widest text-theme-muted pl-1 mb-1"
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                Class Type
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setNewType("theory")}
                  className={`flex-1 py-4 rounded-[16px] text-[13px] font-bold uppercase tracking-widest transition-all ${newType === "theory" ? "bg-theme-text text-theme-bg" : "bg-theme-surface text-theme-muted border border-theme-subtle"}`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Theory
                </button>
                <button
                  type="button"
                  onClick={() => setNewType("lab")}
                  className={`flex-1 py-4 rounded-[16px] text-[13px] font-bold uppercase tracking-widest transition-all ${newType === "lab" ? "bg-[#0EA5E9] text-white" : "bg-theme-surface text-theme-muted border border-theme-subtle"}`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Practical
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleAddClass}
            className="w-full bg-theme-highlight text-theme-bg py-5 rounded-[20px] text-[15px] font-black uppercase tracking-[0.2em] active:scale-[0.98] transition-all mt-auto shrink-0"
            style={{ fontFamily: "'Montserrat', sans-serif", boxShadow: '0 0 20px color-mix(in srgb, var(--theme-highlight) 35%, transparent)' }}
          >
            add to schedule
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
