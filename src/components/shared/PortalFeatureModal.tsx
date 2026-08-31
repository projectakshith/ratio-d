"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, X, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function PortalFeatureModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { setPortalAuthOpen, userData } = useApp();

  useEffect(() => {
    if (userData?.isPortal) {
      localStorage.setItem("ratiod_seen_portal_feature_v1", "true");
      return;
    }
    const hasSeen = localStorage.getItem("ratiod_seen_portal_feature_v1");
    if (!hasSeen) {
      const t = setTimeout(() => setIsOpen(true), 1200);
      return () => clearTimeout(t);
    }
  }, [userData?.isPortal]);

  if (userData?.isPortal) return null;

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("ratiod_seen_portal_feature_v1", "true");
  };

  const handleOpenLogin = () => {
    handleClose();
    setPortalAuthOpen(true);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment key="portal-feature">
          <motion.div
            key="portal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[999]"
            onClick={handleClose}
          />
          <div key="portal-container" className="fixed inset-0 flex items-center justify-center z-[1000] p-6 pointer-events-none">
            <motion.div
              key="portal-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-sm bg-theme-bg border border-theme-border rounded-[32px] overflow-hidden shadow-2xl pointer-events-auto flex flex-col"
            >
              <div className="relative h-32 bg-theme-surface border-b border-theme-border flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-theme-highlight/20 to-transparent opacity-60" />
                <motion.div 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="w-16 h-16 bg-theme-bg rounded-2xl flex items-center justify-center shadow-xl border border-theme-border relative z-10"
                >
                  <ShieldCheck className="text-theme-highlight" size={32} />
                </motion.div>
                
                <button 
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 bg-theme-bg/50 backdrop-blur-md rounded-full text-theme-muted hover:text-theme-text transition-colors z-20"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-4 text-center">
                <div>
                  <h2 className="text-2xl font-black lowercase tracking-tighter text-theme-text" style={{ fontFamily: 'var(--font-montserrat)' }}>
                    student portal
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-theme-highlight mt-1" style={{ fontFamily: 'var(--font-montserrat)' }}>
                    backup attendance source
                  </p>
                </div>

                <p className="text-sm font-bold text-theme-muted leading-relaxed" style={{ fontFamily: 'var(--font-afacad)' }}>
                  academia servers acting up? you can now sign in directly via student portal to fetch your latest attendance numbers.
                </p>

                <div className="flex flex-col gap-2.5 mt-2">
                  <button
                    onClick={handleOpenLogin}
                    className="w-full py-4 rounded-2xl bg-theme-highlight text-theme-bg font-black uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-theme-highlight/20"
                    style={{ fontFamily: 'var(--font-montserrat)' }}
                  >
                    <span>sign in via portal</span>
                    <ArrowRight size={16} />
                  </button>
                  <button
                    onClick={handleClose}
                    className="w-full py-2.5 rounded-2xl bg-transparent text-theme-muted font-bold lowercase text-xs hover:text-theme-text transition-colors"
                    style={{ fontFamily: 'var(--font-afacad)' }}
                  >
                    maybe later
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
}
