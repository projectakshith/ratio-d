"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Clock, GraduationCap, Trophy, CornerDownLeft } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getBaseAttendance, getStatus, matchAttendance } from "@/utils/attendance/attendanceLogic";
import { useAcademiaData } from "@/hooks/useAcademiaData";
import { getAcronym } from "@/utils/dashboard/timetableLogic";

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { userData } = useApp();
  const academia = useAcademiaData(userData as any);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isOpen) {
        const activeElement = document.activeElement;
        const isInput = activeElement instanceof HTMLInputElement || 
                        activeElement instanceof HTMLTextAreaElement || 
                        (activeElement as HTMLElement)?.isContentEditable;
        
        if (!isInput) {
          e.preventDefault();
          setIsOpen(true);
        }
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const searchResults = useMemo(() => {
    if (!query.trim() || !userData?.attendance) return null;

    const baseAttendance = getBaseAttendance(userData.attendance);
    const searchTerms = query.toLowerCase().split(" ");

    const matched = baseAttendance.filter(a => {
      const title = (a.title || "").toLowerCase();
      const code = (a.code || "").toLowerCase();
      return searchTerms.every(term => title.includes(term) || code.includes(term));
    });

    if (matched.length === 0) return null;

    const subject = matched[0];
    const status = getStatus(parseFloat(subject.percentage), subject.conducted, subject.present);
    
    let nextSession = null;
    const schedule = academia?.effectiveSchedule || userData?.timetable || {};
    const todayOrder = academia?.effectiveDayOrder || "1";
    
    for (let i = 1; i <= 5; i++) {
      const dayKey = `Day ${i}`;
      const daySchedule = schedule[dayKey];
      if (daySchedule) {
        const slots = Object.values(daySchedule).filter((s: any) => {
          const sCode = (s.courseCode || s.code || "").split("-")[0].trim().toLowerCase();
          return sCode === subject.code.toLowerCase();
        });
        if (slots.length > 0) {
          nextSession = { day: dayKey, ...(slots[0] as any) };
          break;
        }
      }
    }

    const marks = (userData.marks || []).find((m: any) => {
      const mCode = (m.code || "").trim().toLowerCase();
      return mCode === subject.code.toLowerCase();
    });

    return { subject, status, nextSession, marks };
  }, [query, userData, academia]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setIsOpen(false); setQuery(""); }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ y: -20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-[#1A1A1A] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center px-6 py-5 border-b border-white/5">
              <Search size={20} className="text-white/20 mr-4" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="search anything..."
                className="flex-1 bg-transparent border-none outline-none text-xl font-medium placeholder:text-white/10 caret-white text-white command-palette-input"
                style={{ fontFamily: 'var(--font-afacad)' }}
              />
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-white/5 border border-white/5 rounded-md text-[10px] font-black uppercase text-white/20">esc</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {searchResults ? (
                <motion.div
                  key="results"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-8"
                >
                  <div className="flex justify-between items-start mb-10">
                    <div className="flex flex-col">
                      <span className="text-white text-3xl font-black lowercase tracking-tighter leading-none mb-2" style={{ fontFamily: 'var(--font-montserrat)' }}>
                        {searchResults.subject.title}
                      </span>
                      <span className="text-white/20 text-xs font-black uppercase tracking-[0.2em]">
                        {searchResults.subject.code} • {searchResults.subject.type}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-white text-4xl font-black tracking-tighter leading-none" style={{ fontFamily: 'var(--font-montserrat)' }}>
                        {searchResults.subject.percentage}%
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-widest mt-2 ${searchResults.status.safe ? 'text-theme-highlight' : 'text-[#FF4D4D]'}`}>
                        {searchResults.status.val} {searchResults.status.label}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/[0.02] border border-white/5 rounded-[24px] p-6">
                      <div className="flex items-center gap-3 mb-4 text-white/20">
                        <Clock size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">next session</span>
                      </div>
                      {searchResults.nextSession ? (
                        <div className="flex flex-col">
                          <span className="text-white text-lg font-bold leading-tight mb-1">
                            {(searchResults.nextSession as any).day} • {(searchResults.nextSession as any).time}
                          </span>
                          <span className="text-white/40 text-xs font-medium">
                            Room {(searchResults.nextSession as any).room} • {(searchResults.nextSession as any).slot}
                          </span>
                        </div>
                      ) : (
                        <span className="text-white/10 text-xs font-bold uppercase italic">not scheduled</span>
                      )}
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-[24px] p-6">
                      <div className="flex items-center gap-3 mb-4 text-white/20">
                        <Trophy size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">recent marks</span>
                      </div>
                      {((searchResults.marks as any)?.assessments?.length || 0) > 0 ? (
                        <div className="flex flex-col gap-2">
                          {(searchResults.marks as any).assessments.slice(0, 2).map((m: any, i: number) => (
                            <div key={i} className="flex justify-between items-center">
                              <span className="text-white/40 text-xs truncate mr-4">{m.title}</span>
                              <span className="text-white text-xs font-black">{m.marks}/{m.total}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-white/10 text-xs font-bold uppercase italic">no data</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between text-white/20">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <CornerDownLeft size={12} />
                        <span className="text-[10px] font-black uppercase tracking-widest">open details</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-[9px] font-black">P</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">prediction</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : query.trim() ? (
                <motion.div
                  key="no-results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-8 py-12 text-center"
                >
                  <span className="text-white/10 text-xs font-black uppercase tracking-[0.3em]">no matches found</span>
                </motion.div>
              ) : (
                <motion.div
                  key="initial"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-8 py-12 flex flex-col gap-4"
                >
                  <span className="text-white/10 text-[10px] font-black uppercase tracking-[0.3em] mb-2">suggestions</span>
                  <div className="flex flex-wrap gap-2">
                    {["attendance", "marks", "timetable", "gpa"].map(s => (
                      <button
                        key={s}
                        onClick={() => setQuery(s)}
                        className="px-4 py-2 bg-white/5 border border-white/5 rounded-full text-xs font-bold text-white/40 hover:text-white hover:bg-white/10 transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
