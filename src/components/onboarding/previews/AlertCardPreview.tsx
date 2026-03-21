"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellRing, Check, Activity } from "lucide-react";
import { requestNotificationPermission } from "@/utils/shared/notifs";

export default function AlertCardPreview({ onInteraction }: { onInteraction?: () => void }) {
  const [permission, setPermission] = useState<string>("default");
  const [hasHandled, setHasHandled] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
      if (Notification.permission !== "default") {
        setHasHandled(true);
        setIsRevealed(true);
        if (onInteraction) onInteraction();
      }
    }
  }, [onInteraction]);

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted ? "granted" : "denied");
    if (onInteraction) onInteraction();
    setTimeout(() => {
      setHasHandled(true);
      setTimeout(() => setIsRevealed(true), 800);
    }, 1000);
  };

  return (
    <div className="relative w-full max-w-[340px] h-[260px] flex items-center justify-center mb-2 self-center">
      <motion.div
        initial={{ x: 0, y: 0, rotate: 0, opacity: 0 }}
        animate={{ x: 0, y: 0, rotate: -2, opacity: 1 }}
        className="absolute w-[260px] bg-[#EADFD4] border-[#4A3A32]/10 border-[1.5px] rounded-[24px] p-5 flex flex-col shadow-xl z-10 overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {!isRevealed ? (
            <motion.div
              key="exam-card"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-[#4A3A32] text-[#EADFD4]">
                    exam
                  </span>
                  <span className="text-[10px] font-bold text-[#4A3A32]/40 uppercase tracking-widest">
                    tomorrow
                  </span>
                </div>
                <Activity size={14} className="text-[#4A3A32]/40" />
              </div>
              <span className="text-[18px] font-black tracking-tighter text-[#4A3A32] leading-tight mb-3" style={{ fontFamily: "var(--font-montserrat)" }}>
                discrete mathematics
              </span>
              <div className="bg-[#4A3A32]/5 rounded-xl p-3 border border-[#4A3A32]/10">
                <p className="text-[11px] font-bold text-[#4A3A32]/70 leading-relaxed">
                  ft-1 assessment @ 9:00 am
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="cse-card"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-[#4A3A32] text-[#EADFD4]">
                  cse 2nd yr
                </span>
                <BellRing size={14} className="text-[#4A3A32]/40" />
              </div>
              <span className="text-[18px] font-black tracking-tighter text-[#4A3A32] leading-tight mb-3" style={{ fontFamily: "var(--font-montserrat)" }}>
                built different
              </span>
              <div className="bg-[#4A3A32]/5 rounded-xl p-3 border border-[#4A3A32]/10">
                <p className="text-[11px] font-bold text-[#4A3A32]/70 leading-relaxed">
                  full syllabus alerts enabled for 2nd year cse gng.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {!hasHandled && (
          <motion.div
            initial={{ x: 20, y: -20, rotate: 4, opacity: 0 }}
            animate={{ x: 20, y: -20, rotate: 4, opacity: 1 }}
            exit={{ x: 400, y: -100, rotate: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="absolute w-[260px] bg-[#EADFD4] border-[#4A3A32]/10 border-[1.5px] rounded-[24px] p-5 flex flex-col shadow-2xl z-20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-[#4A3A32] text-[#EADFD4]">
                  alert
                </span>
                <span className="text-[10px] font-bold text-[#4A3A32]/40 uppercase tracking-widest">
                  now
                </span>
              </div>
              <Bell size={14} className="text-[#4A3A32]/40" />
            </div>
            
            <span className="text-[18px] font-black tracking-tighter text-[#4A3A32] leading-tight mb-1" style={{ fontFamily: "var(--font-montserrat)" }}>
              class starts now
            </span>
            <span className="text-[10px] font-bold text-[#4A3A32]/40 uppercase tracking-widest mb-4">
              room 402 • building 15
            </span>

            <AnimatePresence mode="wait">
              {permission === "default" ? (
                <motion.button
                  key="btn"
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEnable}
                  className="w-full py-3 bg-[#4A3A32] text-[#EADFD4] rounded-xl font-black lowercase text-[11px] tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  style={{ fontFamily: 'var(--font-montserrat)' }}
                >
                  allow notifs
                </motion.button>
              ) : (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full py-3 bg-[#4A3A32]/5 border border-[#4A3A32]/20 text-[#4A3A32] rounded-xl font-black lowercase text-[11px] flex items-center justify-center gap-2"
                  style={{ fontFamily: 'var(--font-montserrat)' }}
                >
                  <Check size={14} strokeWidth={3} /> {permission === 'granted' ? 'synced' : 'denied'}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
