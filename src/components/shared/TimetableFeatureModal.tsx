"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import DesktopTimetable, { DesktopTimetableRef } from "@/components/desktop/timetable/Timetable";

export default function TimetableFeatureModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const router = useRouter();
  const desktopTimetableRef = React.useRef<DesktopTimetableRef>(null);

  useEffect(() => {
    const hasSeen = localStorage.getItem("ratiod_seen_timetable_feature_v2");
    const isMobile = window.innerWidth < 768;
    
    if (!hasSeen && isMobile) {
      const t = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("ratiod_seen_timetable_feature_v2", "true");
  };

  const handleDownloadNow = async () => {
    setIsDownloading(true);
    try {
      await desktopTimetableRef.current?.download();
      handleClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999]"
            onClick={handleClose}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[1000] p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-sm bg-theme-bg border border-theme-border rounded-[32px] overflow-hidden shadow-2xl pointer-events-auto flex flex-col"
            >
              <div className="relative h-32 bg-theme-surface border-b border-theme-border flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-theme-emphasis/20 to-transparent opacity-50" />
                <motion.div 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-16 h-16 bg-theme-bg rounded-2xl flex items-center justify-center shadow-lg border border-theme-border relative z-10"
                >
                  <Download className="text-theme-emphasis" size={28} />
                </motion.div>
                
                <button 
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 bg-theme-bg/50 backdrop-blur-md rounded-full text-theme-muted hover:text-theme-text transition-colors z-20"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-3 text-center">
                <h2 className="text-2xl font-black lowercase tracking-tighter text-theme-text" style={{ fontFamily: 'var(--font-montserrat)' }}>
                  timetable download!
                </h2>
                <p className="text-sm font-bold text-theme-muted leading-relaxed" style={{ fontFamily: 'var(--font-afacad)' }}>
                  you can now download your timetable as a high-res image directly to your phone. it perfectly adapts to your current UI theme!
                </p>

                <div className="flex items-center gap-3 p-3 bg-theme-surface rounded-2xl mt-2 text-left border border-theme-border/50">
                  <div className="w-10 h-10 rounded-xl bg-theme-bg flex items-center justify-center shrink-0 shadow-sm border border-theme-border/50">
                    <ImageIcon size={18} className="text-theme-text opacity-70" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-widest text-theme-text/80" style={{ fontFamily: 'var(--font-montserrat)' }}>where?</span>
                    <span className="text-[11px] font-bold text-theme-muted" style={{ fontFamily: 'var(--font-afacad)' }}>grab it right here, or anytime later from the timetable page!</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <button
                    onClick={handleDownloadNow}
                    disabled={isDownloading}
                    className="w-full py-4 rounded-2xl bg-theme-emphasis text-theme-bg font-black uppercase tracking-widest text-xs transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                    style={{ fontFamily: 'var(--font-montserrat)' }}
                  >
                    {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    {isDownloading ? "saving..." : "download now"}
                  </button>
                  <button
                    onClick={handleClose}
                    className="w-full py-3 rounded-2xl bg-transparent text-theme-muted font-bold lowercase text-sm transition-colors active:bg-theme-surface"
                    style={{ fontFamily: 'var(--font-afacad)' }}
                  >
                    maybe later
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
          
          <div 
            className="fixed -top-[9999px] -left-[9999px] w-[1200px] h-[800px] pointer-events-none opacity-0 overflow-hidden z-0"
            style={{ WebkitTextSizeAdjust: 'none' }}
          >
            <DesktopTimetable ref={desktopTimetableRef} initialView="full" />
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
