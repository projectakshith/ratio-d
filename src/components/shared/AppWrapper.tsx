"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { WifiOff } from "lucide-react";
import MinecraftParticles from "./MinecraftParticles";
import MinecraftAmbience from "./MinecraftAmbience";
import SyncStatusNotification from "./SyncStatusNotification";

let globalSplashPlayed = false;

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const { isOffline, showWelcome, setShowWelcome, userData } = useApp();
  const [showSplash, setShowSplash] = useState(false);
  const [isFirstSplash, setIsFirstSplash] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;

    if (isStandalone && !globalSplashPlayed) {
      globalSplashPlayed = true;

      if (sessionStorage.getItem("ratiod_just_onboarded") !== "true") {
        const isOnboarded = localStorage.getItem("ratiod_onboarded") === "true";
        if (!isOnboarded) {
          setIsFirstSplash(true);
        }
        setShowSplash(true);
        const safetyTimer = setTimeout(() => {
          setShowSplash(false);
        }, !isOnboarded ? 3500 : 800);
        return () => clearTimeout(safetyTimer);
      }
    }
  }, []);

  useEffect(() => {
    if (showWelcome) {
      setShowSplash(false);
      sessionStorage.removeItem("ratiod_just_onboarded");
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome, setShowWelcome]);

  return (
    <main className="bg-theme-bg fixed inset-0 w-full overflow-hidden flex flex-col">
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed top-4 left-0 right-0 z-[10001] flex justify-center pointer-events-none"
          >
            <div className="bg-[#FF4D4D] px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-white/20 pointer-events-auto">
              <WifiOff size={12} className="text-white" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                Offline Mode
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className="flex-1 relative z-10 w-full"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
        }}
      >
        {children}
      </div>

      <MinecraftParticles />
      <MinecraftAmbience />
      <SyncStatusNotification />

      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[10000] bg-theme-bg flex flex-col justify-center items-center px-8 pointer-events-auto"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col items-center text-center"
            >
              <span className="text-theme-muted text-sm font-bold uppercase tracking-[0.3em] mb-2">
                Welcome
              </span>
              <h2 
                className="text-4xl md:text-6xl font-black text-theme-text lowercase tracking-tighter leading-none"
                style={{ fontFamily: 'var(--font-montserrat)' }}
              >
                {userData?.profile?.name || "Student"}
              </h2>
            </motion.div>
          </motion.div>
        )}

        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 flex items-center justify-center z-[9999] bg-[#0c30ff]"
          >
            {isFirstSplash ? (
              <video
                autoPlay
                muted
                playsInline
                onEnded={() => setShowSplash(false)}
                className="w-full h-full object-cover object-center translate-x-4 scale-105"
              >
                <source src="/splash.mp4" type="video/mp4" />
              </video>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full h-full flex flex-col justify-end p-8 md:p-16"
              >
                <h1
                  className="text-6xl md:text-8xl lowercase tracking-tighter text-[#ceff1c]"
                  style={{ fontFamily: "Urbanosta, sans-serif" }}
                >
                  ratio'd
                </h1>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
