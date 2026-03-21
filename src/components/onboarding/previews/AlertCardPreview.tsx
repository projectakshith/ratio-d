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
    }
  }, []);

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted ? "granted" : "denied");

    if (typeof window !== "undefined" && !window.isSecureContext) {
      alert("Notifications require HTTPS.");
    } else if (typeof window !== "undefined" && Notification.permission === "denied" && !granted) {
      alert("Permission blocked. Please reset site permissions in your browser settings.");
    }

    if (typeof window !== "undefined" && window.navigator.vibrate) {
      window.navigator.vibrate(15);
    }
    
    setHasHandled(true);
    if (onInteraction) onInteraction();
    setTimeout(() => setIsRevealed(true), 800);
  };

  return (
    <div className="relative w-full max-w-[340px] h-[260px] flex items-center justify-center mb-4 self-center">
      <motion.div
        initial={{ x: 0, y: 0, rotate: 0, opacity: 0 }}
        animate={{ x: 0, y: 0, rotate: -2, opacity: 1 }}
        className="absolute w-[260px] bg-[#EADFD4] border-[#4A3A32]/10 border-[1.5px] rounded-[24px] p-5 flex flex-col shadow-xl z-10 overflow-hidden"
      >
        <motion.div
          key="ct-card"
          initial={{ opacity: 1 }}
          className="flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-[#4A3A32] text-[#EADFD4]">
                alert
              </span>
              <span className="text-[10px] font-bold text-[#4A3A32]/40 uppercase tracking-widest">
                tomorrow
              </span>
            </div>
            <BellRing size={14} className="text-[#4A3A32]/40" />
          </div>
          <span className="text-[18px] font-black tracking-tighter text-[#4A3A32] leading-tight mb-3" style={{ fontFamily: "var(--font-montserrat)" }}>
            ct-2 tomorrow
          </span>
          <div className="bg-[#4A3A32]/5 rounded-xl p-3 border border-[#4A3A32]/10">
            <p className="text-[11px] font-bold text-[#4A3A32]/70 leading-relaxed lowercase">
              full syllabus exam @ 10:30 am
            </p>
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {!hasHandled && (
          <motion.div
            initial={{ x: 20, y: -20, rotate: 4, opacity: 0 }}
            animate={{ x: 20, y: -20, rotate: 4, opacity: 1 }}
            exit={{ x: 400, y: -100, rotate: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            onClick={handleEnable}
            className="absolute w-[260px] bg-[#EADFD4] border-[#4A3A32]/10 border-[1.5px] rounded-[24px] p-5 flex flex-col shadow-2xl z-20 cursor-pointer active:scale-95 transition-transform"
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

            <div
              className="w-full py-3 bg-[#4A3A32] text-[#EADFD4] rounded-xl font-black lowercase text-[11px] tracking-widest flex items-center justify-center gap-2"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              {permission === "default" ? "allow notifs" : permission === "granted" ? "synced" : "denied"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
