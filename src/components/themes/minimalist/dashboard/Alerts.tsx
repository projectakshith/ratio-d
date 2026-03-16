"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Plus, Trash2 } from "lucide-react";

interface AlertsProps {
  isOpen: boolean;
  onClose: () => void;
  exams: any[];
  upcomingBreaks: any[];
}

export default function Alerts({
  isOpen,
  onClose,
  exams,
  upcomingBreaks,
}: AlertsProps) {
  const [personalNotes, setPersonalNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [canDragClose, setCanDragClose] = useState(true);

  useEffect(() => {
    const savedPrivate = localStorage.getItem("ratio_private_notes");
    if (savedPrivate) {
      try {
        setPersonalNotes(JSON.parse(savedPrivate));
      } catch (e) {}
    }
  }, []);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const newNoteObj = { id: Date.now(), text: newNote, date: "just now" };
    const updatedNotes = [newNoteObj, ...personalNotes];
    setPersonalNotes(updatedNotes);
    localStorage.setItem("ratio_private_notes", JSON.stringify(updatedNotes));
    setNewNote("");
    window.dispatchEvent(new Event("private_notes_updated"));
  };

  const handleDeleteNote = (id: number) => {
    const updated = personalNotes.filter((n) => n.id !== id);
    setPersonalNotes(updated);
    localStorage.setItem("ratio_private_notes", JSON.stringify(updated));
    window.dispatchEvent(new Event("private_notes_updated"));
  };

  const handleAlertsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setCanDragClose(e.currentTarget.scrollTop <= 0);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.02,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -20, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 450, damping: 30 } as const,
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          drag={canDragClose ? "y" : false}
          dragDirectionLock
          dragConstraints={{ top: 0, bottom: 500 }}
          dragElastic={{ top: 0, bottom: 0.8 }}
          onDragEnd={(e, info) => {
            if (info.offset.y > 100 || info.velocity.y > 500) {
              onClose();
            }
          }}
          className="fixed inset-0 bg-theme-bg z-[60] flex flex-col px-6 pt-10 pb-6 overflow-hidden"
        >
          <div
            className="w-12 h-1.5 bg-theme-text-10 rounded-full mx-auto mb-6 shrink-0"
          />
          <div className="flex justify-between items-start w-full shrink-0 mb-6">
            <div className="flex flex-col">
              <span
                className="text-[32px] leading-[1] font-black uppercase tracking-[0.15em] text-theme-text"
                style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
              >
                ALERTS
              </span>
              <span
                className="text-[10px] font-bold lowercase tracking-[0.2em] text-[#85a818] mt-1.5"
                style={{ fontFamily: "var(--font-afacad), sans-serif" }}
              >
                official & personal
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-theme-surface flex items-center justify-center text-theme-text active:scale-95 transition-all shrink-0"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          <motion.div
            onScroll={handleAlertsScroll}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-10 pb-4"
          >
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex items-center gap-3 w-full">
                <span
                  className="text-[11px] font-bold lowercase tracking-[0.2em] text-[#85a818] whitespace-nowrap"
                  style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                >
                  my private notes
                </span>
                <div className="flex-1 h-[1.5px] bg-[#85a818]/20 rounded-full" />
              </div>
              {personalNotes.length === 0 ? (
                <motion.div
                  variants={itemVariants}
                  className="w-full flex flex-col items-center justify-center py-6 gap-2 opacity-30"
                >
                  <div
                    className={`w-full h-px bg-theme-text-10 rounded-full`}
                  />
                  <div
                    className={`w-3/4 h-px bg-theme-text-10 rounded-full`}
                  />
                  <div
                    className={`w-1/2 h-px bg-theme-text-10 rounded-full`}
                  />
                </motion.div>
              ) : (
                personalNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    variants={itemVariants}
                    className="bg-theme-card border-theme-subtle border-[1.5px] rounded-[20px] p-4 flex flex-col shadow-sm relative group"
                  >
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-theme-surface text-theme-subtle flex items-center justify-center hover:text-[#FF4D4D] hover:bg-[#FF4D4D]/5 active:scale-95 transition-all z-10"
                    >
                      <Trash2 size={14} />
                    </button>
                    <span
                      className="text-[15px] font-bold text-theme-text lowercase leading-snug mb-3 pr-8"
                      style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                    >
                      {note.text}
                    </span>
                    <span
                      className="text-[10px] font-bold tracking-widest uppercase text-theme-muted"
                      style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                    >
                      {note.date}
                    </span>
                  </motion.div>
                ))
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 w-full">
                <span
                  className="text-[11px] font-bold lowercase tracking-[0.25em] text-[#8b5cf6] whitespace-nowrap"
                  style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                >
                  assessments
                </span>
                <div className="flex-1 h-[1.5px] bg-[#8b5cf6]/20 rounded-full" />
              </div>
              {exams.length === 0 ? (
                <motion.div
                  variants={itemVariants}
                  className="w-full flex flex-col items-center justify-center py-6 gap-2 opacity-30"
                >
                  <div
                    className={`w-full h-px bg-theme-text-10 rounded-full`}
                  />
                  <div
                    className={`w-3/4 h-px bg-theme-text-10 rounded-full`}
                  />
                  <div
                    className={`w-1/2 h-px bg-theme-text-10 rounded-full`}
                  />
                </motion.div>
              ) : (
                exams.map((alert) => (
                  <motion.div
                    key={alert.id}
                    variants={itemVariants}
                    className="bg-theme-card border-[#8b5cf6]/15 border-[1.5px] rounded-[20px] p-5 flex flex-col relative overflow-hidden shadow-sm"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[100px] bg-[#8b5cf6]/5 pointer-events-none" />
                    <div className="flex items-center gap-3 mb-4 z-10">
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0 bg-[#8b5cf6] text-white"
                        style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                      >
                        exam
                      </span>
                      <span
                        className="text-[12px] font-bold text-theme-muted tracking-wider uppercase"
                        style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                      >
                        {alert.date}
                      </span>
                    </div>
                    <span
                      className="text-[20px] font-black tracking-wide text-theme-text leading-tight mb-4 z-10"
                      style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                    >
                      {alert.title}
                    </span>
                    <div className="flex flex-col gap-2.5 z-10">
                      {alert.desc
                        .split(" / ")
                        .map((sub: string, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 bg-theme-surface border-theme-subtle rounded-xl p-3 border"
                          >
                            {alert.desc.includes("/") && (
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-[#8b5cf6]" />
                            )}
                            <span
                              className="text-[15px] font-bold text-theme-text lowercase leading-snug"
                              style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                            >
                              {sub.trim()}
                            </span>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 w-full">
                <span
                  className="text-[11px] font-bold lowercase tracking-[0.25em] text-[#FF4D4D] whitespace-nowrap"
                  style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                >
                  upcoming breaks
                </span>
                <div className="flex-1 h-[1.5px] bg-[#FF4D4D]/20 rounded-full" />
              </div>
              {upcomingBreaks.length === 0 ? (
                <motion.div
                  variants={itemVariants}
                  className="w-full flex flex-col items-center justify-center py-6 gap-2 opacity-30"
                >
                  <div
                    className={`w-full h-px bg-theme-text-10 rounded-full`}
                  />
                  <div
                    className={`w-3/4 h-px bg-theme-text-10 rounded-full`}
                  />
                  <div
                    className={`w-1/2 h-px bg-theme-text-10 rounded-full`}
                  />
                </motion.div>
              ) : (
                upcomingBreaks.map((alert) => (
                  <motion.div
                    key={alert.id}
                    variants={itemVariants}
                    className="bg-theme-card border-[#FF4D4D]/15 border-[1.5px] rounded-[20px] p-5 flex flex-col relative overflow-hidden shadow-sm"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[100px] bg-[#FF4D4D]/5 pointer-events-none" />
                    <div className="flex items-center gap-3 mb-4 z-10">
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0 bg-[#FF4D4D] text-white"
                        style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                      >
                        holiday
                      </span>
                      <span
                        className="text-[12px] font-bold text-theme-muted tracking-wider uppercase"
                        style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                      >
                        {alert.date}
                      </span>
                    </div>
                    <span
                      className="text-[20px] font-black tracking-wide text-theme-text leading-tight mb-4 z-10"
                      style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                    >
                      {alert.title}
                    </span>
                    <div className="flex flex-col gap-2.5 z-10">
                      {alert.desc
                        .split(" / ")
                        .map((sub: string, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 bg-theme-surface border-theme-subtle rounded-xl p-3 border"
                          >
                            {alert.desc.includes("/") && (
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-[#FF4D4D]" />
                            )}
                            <span
                              className="text-[15px] font-bold text-theme-text lowercase leading-snug"
                              style={{ fontFamily: "var(--font-afacad), sans-serif" }}
                            >
                              {sub.trim()}
                            </span>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          <div
            className="mt-auto shrink-0 pt-4 bg-theme-bg border-t border-theme-subtle"
          >
            <div
                className="flex items-center gap-2 p-1.5 rounded-[20px] bg-theme-surface border-theme-subtle border transition-colors focus-within:border-opacity-30"
            >
              <div
                  className="w-10 h-10 rounded-[14px] flex items-center justify-center bg-theme-surface text-theme-muted shrink-0"
              >
                <Lock size={18} strokeWidth={2.5} />
              </div>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                placeholder="add a private note..."
                className="flex-1 bg-transparent outline-none px-2 text-[14px] font-bold placeholder:font-medium placeholder:opacity-25 lowercase text-theme-text"
                style={{
                  fontFamily: "var(--font-afacad), sans-serif",
                }}
              />
              <button
                onClick={handleAddNote}
                  className="w-10 h-10 rounded-[14px] flex items-center justify-center active:scale-95 transition-all shrink-0 bg-theme-text text-theme-bg shadow-sm"
              >
                <Plus size={20} strokeWidth={3} />
              </button>
            </div>
            <div className="flex justify-center mt-2 pb-2">
              <span
                className="text-[10px] font-bold tracking-[0.1em] lowercase text-theme-muted"
                style={{ fontFamily: "var(--font-afacad), sans-serif" }}
              >
                note will only be visible to you
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
