"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { ArrowRight, Clock, X } from "lucide-react";
import { UpdateHistoryItem } from "@/types";

export default function UpdateHistory({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { updateHistory } = useApp();

  const grouped = updateHistory.reduce((acc, item) => {
    const date = new Date(item.timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let label = "earlier";
    if (date.toDateString() === today.toDateString()) label = "today";
    else if (date.toDateString() === yesterday.toDateString()) label = "yesterday";
    
    if (!acc[label]) acc[label] = [];
    acc[label].push(item);
    return acc;
  }, {} as Record<string, UpdateHistoryItem[]>);

  const sections = ["today", "yesterday"].filter(s => grouped[s] && grouped[s].length > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 240 }}
          className="fixed inset-0 z-[10001] bg-theme-bg flex flex-col pointer-events-auto"
        >
          <div className="flex items-center justify-between p-8 shrink-0">
            <button 
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-theme-surface border border-theme-border flex items-center justify-center text-theme-text active:scale-90 transition-transform"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-theme-surface border border-theme-border">
              <Clock size={14} className="text-theme-highlight" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text">history</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar px-8 pb-32">
            <div className="mb-12">
              <h1 className="text-[5rem] font-black tracking-tighter text-theme-text leading-[0.8] lowercase" style={{ fontFamily: "var(--font-montserrat)" }}>
                updates<br/>log
              </h1>
            </div>

            {sections.length > 0 ? (
              <div className="space-y-16">
                {sections.map(section => (
                  <div key={section} className="flex flex-col gap-8">
                    <div className="flex items-center gap-4">
                      <span className="text-[11px] font-black uppercase tracking-[0.3em] text-theme-highlight shrink-0">{section}</span>
                      <div className="flex-1 h-[1.5px] bg-theme-text/10 rounded-full" />
                    </div>

                    <div className="space-y-10">
                      {grouped[section].map((item, idx) => (
                        <div key={item.id} className="flex flex-col gap-6">
                          <div className="flex items-center gap-2 opacity-40">
                            <Clock size={10} />
                            <span className="text-[9px] font-bold uppercase tracking-widest">
                              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="space-y-6">
                            {/* Attendance Changes */}
                            {item.diff.attendanceChanges.map((change: any, i: number) => {
                              const isNewSafe = change.newPercent >= 75;
                              const newLabel = isNewSafe ? "margin" : "recover";
                              const isDegraded = (change.oldPercent >= 75 && change.newPercent < 75) || 
                                               (change.newPercent >= 75 && change.newMargin < change.oldMargin) ||
                                               (change.newPercent < 75 && change.newMargin > change.oldMargin);

                              return (
                                <div key={`att-${i}`} className="border-[1.5px] border-theme-border rounded-[28px] p-6 bg-theme-surface/30">
                                  <div className="flex items-center justify-between mb-4">
                                    <span className="text-lg font-black text-theme-text lowercase truncate max-w-[70%]">{change.course}</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-theme-text/5 opacity-60">attendance</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                      <span className="text-2xl font-black text-theme-text opacity-40">{change.oldPercent.toFixed(0)}%</span>
                                      <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">was</span>
                                    </div>
                                    <ArrowRight size={16} className="text-theme-highlight opacity-40" />
                                    <div className="flex flex-col items-end text-right">
                                      <span className={`text-4xl font-black ${isDegraded ? 'text-theme-secondary' : 'text-theme-highlight'}`}>{change.newPercent.toFixed(0)}%</span>
                                      <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">{newLabel} {change.newMargin}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Marks Changes */}
                            {item.diff.newMarks.map((mark: any, i: number) => (
                              <div key={`mark-${i}`} className="border-[1.5px] border-theme-border rounded-[28px] p-6 bg-theme-surface/30">
                                <div className="flex items-center justify-between mb-4">
                                  <span className="text-lg font-black text-theme-text lowercase truncate max-w-[70%]">{mark.course}</span>
                                  <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-theme-text/5 opacity-60">marks</span>
                                </div>
                                <div className="flex items-end justify-between">
                                  <div className="flex flex-col">
                                    <span className="text-4xl font-black text-theme-text leading-none">{mark.score}</span>
                                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-60 mt-1">/{mark.max} • {mark.test}</span>
                                  </div>
                                  <div className="px-3 py-1.5 rounded-xl bg-theme-highlight text-theme-bg text-[8px] font-black uppercase tracking-widest">
                                    published
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 opacity-20">
                <Clock size={48} strokeWidth={1} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] mt-6">no history found</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
