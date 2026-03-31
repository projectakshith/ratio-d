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
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 250 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.6}
          onDragEnd={(e, info) => {
            if (info.offset.y > 150 || info.velocity.y > 600) onClose();
          }}
          className="fixed inset-0 z-[10001] bg-theme-bg flex flex-col pointer-events-auto overflow-hidden"
        >
          <div className="flex items-center justify-between p-8 pt-10 shrink-0">
            <button 
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-theme-surface border border-theme-border flex items-center justify-center text-theme-text active:scale-90 transition-transform"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-theme-surface border border-theme-border">
              <Clock size={14} className="text-theme-highlight" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text" style={{ fontFamily: "var(--font-montserrat)" }}>history</span>
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
                      <span className="text-[11px] font-black uppercase tracking-[0.3em] text-theme-highlight shrink-0" style={{ fontFamily: "var(--font-montserrat)" }}>{section}</span>
                      <div className="flex-1 h-[1.5px] bg-theme-text/10 rounded-full" />
                    </div>

                    <div className="space-y-10">
                      {grouped[section].map((item, idx) => (
                        <div key={item.id} className="flex flex-col gap-6">
                          <div className="space-y-6">
                            {item.diff.attendanceChanges.map((change: any, i: number) => {
                              const isOldSafe = change.oldPercent >= 75;
                              const isNewSafe = change.newPercent >= 75;
                              const oldLabel = isOldSafe ? "margin" : "recover";
                              const newLabel = isNewSafe ? "margin" : "recover";
                              
                              let isDegraded = false;
                              if (isOldSafe && !isNewSafe) isDegraded = true;
                              else if (isOldSafe && isNewSafe && change.newMargin < change.oldMargin) isDegraded = true;
                              else if (!isOldSafe && !isNewSafe && change.newMargin > change.oldMargin) isDegraded = true;

                              return (
                                <div key={`att-${i}`} className="border-[1.5px] border-theme-border rounded-[28px] p-6 bg-theme-surface/30">
                                  <div className="flex items-center justify-between mb-4">
                                    <span className="text-[18px] font-black text-theme-text lowercase truncate max-w-[70%]" style={{ fontFamily: "var(--font-montserrat)" }}>{change.course}</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-theme-border bg-theme-text/5 opacity-60" style={{ fontFamily: "var(--font-afacad)" }}>attendance</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                      <span className="text-[2.2rem] font-black text-theme-text opacity-40 leading-none tracking-tighter" style={{ fontFamily: "var(--font-montserrat)" }}>{change.oldMargin}</span>
                                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 mt-1" style={{ fontFamily: "var(--font-afacad)" }}>{oldLabel}</span>
                                    </div>
                                    <ArrowRight size={32} className="text-theme-highlight opacity-40" />
                                    <div className="flex flex-col items-end text-right">
                                      <span className={`text-[3.5rem] font-black leading-none tracking-tighter ${isDegraded ? 'text-theme-secondary' : 'text-theme-highlight'}`} style={{ fontFamily: "var(--font-montserrat)" }}>{change.newMargin}</span>
                                      <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isDegraded ? 'text-theme-secondary/60' : 'text-theme-highlight/60'}`} style={{ fontFamily: "var(--font-afacad)" }}>{newLabel} • {change.newPercent.toFixed(0)}%</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {item.diff.newMarks.map((mark: any, i: number) => (
                              <div key={`mark-${i}`} className="border-[1.5px] border-theme-border rounded-[28px] p-6 bg-theme-surface/30">
                                <div className="flex items-center justify-between mb-4">
                                  <span className="text-[18px] font-black text-theme-text lowercase truncate max-w-[70%]" style={{ fontFamily: "var(--font-montserrat)" }}>{mark.course}</span>
                                  <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-theme-border bg-theme-text/5 opacity-60" style={{ fontFamily: "var(--font-afacad)" }}>marks</span>
                                </div>
                                <div className="flex items-end justify-between">
                                  <div className="flex flex-col">
                                    <span className="text-[3.5rem] font-black text-theme-text leading-none tracking-tighter" style={{ fontFamily: "var(--font-montserrat)" }}>{mark.score}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1" style={{ fontFamily: "var(--font-afacad)" }}>/{mark.max} • {mark.test}</span>
                                  </div>
                                  <div className="px-4 py-2 rounded-2xl bg-theme-highlight text-theme-bg text-[10px] font-black uppercase tracking-widest" style={{ fontFamily: "var(--font-montserrat)" }}>
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
                <span className="text-[10px] font-black uppercase tracking-[0.3em] mt-6" style={{ fontFamily: "var(--font-montserrat)" }}>no history found</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
