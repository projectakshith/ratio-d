"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { ArrowRight } from "lucide-react";

export default function SyncStatusNotification() {
  const { latestDiff, setLatestDiff } = useApp();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (latestDiff) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => setLatestDiff(null), 600);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [latestDiff, setLatestDiff]);

  const handleManualClose = () => {
    setIsVisible(false);
    setTimeout(() => setLatestDiff(null), 600);
  };

  if (!latestDiff) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.8}
          onDragEnd={(e, info) => {
            if (info.offset.y > 120 || info.velocity.y > 600) handleManualClose();
          }}
          className="fixed inset-0 z-[10000] bg-theme-bg/95 backdrop-blur-3xl flex flex-col pointer-events-auto overflow-hidden"
        >
          <div 
            className="w-12 h-1.5 rounded-full mx-auto mt-4 shrink-0" 
            style={{ backgroundColor: 'var(--theme-text)', opacity: 0.6 }}
          />
          
          <div className="flex-1 overflow-y-auto no-scrollbar px-8 pt-10 pb-32">
            <div className="flex flex-col mb-12">
              <h1 className="text-[5.5rem] font-black tracking-tighter text-theme-text leading-[0.8] lowercase" style={{ fontFamily: "var(--font-montserrat)" }}>
                updates
              </h1>
            </div>

            <div className="space-y-12">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-theme-highlight shrink-0">attendance</span>
                  <div 
                    className="flex-1 h-[1.5px] rounded-full" 
                    style={{ backgroundColor: 'var(--theme-text)', opacity: 0.6 }}
                  />
                </div>
                
                <div className="space-y-5">
                  {latestDiff.attendanceChanges.length > 0 ? (
                    latestDiff.attendanceChanges.map((change, i) => {
                      const isOldSafe = change.oldPercent >= 75;
                      const isNewSafe = change.newPercent >= 75;
                      const oldLabel = isOldSafe ? "margin" : "recover";
                      const newLabel = isNewSafe ? "margin" : "recover";
                      
                      let isDegraded = false;
                      if (isOldSafe && !isNewSafe) isDegraded = true;
                      else if (isOldSafe && isNewSafe && change.newMargin < change.oldMargin) isDegraded = true;
                      else if (!isOldSafe && !isNewSafe && change.newMargin > change.oldMargin) isDegraded = true;

                      return (
                        <div 
                          key={`att-${i}`} 
                          className="border-[1.5px] rounded-[32px] p-6 flex flex-col gap-4"
                          style={{ borderColor: 'var(--theme-text)' }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[22px] font-black tracking-tight text-theme-text lowercase" style={{ fontFamily: "var(--font-montserrat)" }}>
                              {change.course}
                            </span>
                            <div 
                              className="px-3 py-1 rounded-full border"
                              style={{ backgroundColor: 'color-mix(in srgb, var(--theme-text) 10%, transparent)', borderColor: 'var(--theme-text)' }}
                            >
                              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-theme-text">
                                {change.isPractical ? "practical" : "theory"}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-center gap-10">
                            <div className="flex flex-col items-center">
                              <span className="text-4xl font-black text-theme-text opacity-60 tracking-tighter" style={{ fontFamily: "var(--font-montserrat)" }}>
                                {change.oldMargin}
                              </span>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-theme-text opacity-60 mt-1">{oldLabel}</span>
                            </div>

                            <ArrowRight size={24} className="text-theme-highlight" />

                            <div className="flex flex-col items-center">
                              <span className={`text-6xl font-black tracking-tighter leading-none ${isDegraded ? 'text-theme-secondary' : 'text-theme-highlight'}`} style={{ fontFamily: "var(--font-montserrat)" }}>
                                {change.newMargin}
                              </span>
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${isDegraded ? 'text-theme-secondary/60' : 'text-theme-highlight/60'} mt-1`}>{newLabel}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-[11px] font-bold uppercase tracking-widest text-theme-text opacity-60 px-1">no shifts detected</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-theme-highlight shrink-0">marks</span>
                  <div 
                    className="flex-1 h-[1.5px] rounded-full" 
                    style={{ backgroundColor: 'var(--theme-text)', opacity: 0.6 }}
                  />
                </div>

                <div className="space-y-5">
                  {latestDiff.newMarks.length > 0 ? (
                    latestDiff.newMarks.map((mark, i) => (
                      <div 
                        key={`mark-${i}`} 
                        className="border-[1.5px] rounded-[32px] p-6 flex flex-col gap-4"
                        style={{ borderColor: 'var(--theme-text)' }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[22px] font-black tracking-tight text-theme-text lowercase" style={{ fontFamily: "var(--font-montserrat)" }}>
                            {mark.course}
                          </span>
                          <div 
                            className="px-3 py-1 rounded-full border"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-text) 10%, transparent)', borderColor: 'var(--theme-text)' }}
                          >
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-theme-text">
                              {mark.isPractical ? "practical" : "theory"}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-end justify-between">
                          <div className="flex items-baseline gap-1">
                            <span className="text-6xl font-black tracking-tighter text-theme-text leading-none" style={{ fontFamily: "var(--font-montserrat)" }}>
                              {mark.score}
                            </span>
                            <span className="text-2xl font-bold text-theme-text opacity-60 tracking-tighter">/{mark.max}</span>
                          </div>
                          <div className="px-4 py-2 rounded-2xl bg-theme-highlight text-theme-bg text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_var(--theme-highlight)]">
                            {mark.test} published
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-[11px] font-bold uppercase tracking-widest text-theme-text opacity-60 px-1">no new marks published</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-theme-bg via-theme-bg to-transparent pointer-events-none">
            <button
              onClick={handleManualClose}
              className="w-full bg-theme-emphasis text-theme-bg py-6 rounded-[28px] text-[14px] font-black uppercase tracking-[0.4em] active:scale-[0.98] transition-all shadow-xl pointer-events-auto"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              dismiss
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
