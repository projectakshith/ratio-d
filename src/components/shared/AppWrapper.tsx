"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { WifiOff } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import MinecraftParticles from "./MinecraftParticles";
import MinecraftAmbience from "./MinecraftAmbience";
import SyncStatusNotification from "./SyncStatusNotification";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const { isOffline } = useApp();
  const [showSplash, setShowSplash] = useState(false);
  const [isFirstSplash, setIsFirstSplash] = useState(false);
  const [showBigOffline, setShowBigOffline] = useState(false);
  const hasPlayedSessionSplash = React.useRef(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;

    if (isStandalone && !hasPlayedSessionSplash.current) {
      hasPlayedSessionSplash.current = true;
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
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setShowBigOffline(false);
    };
    const handleOffline = () => {
      setShowBigOffline(true);
      setTimeout(() => setShowBigOffline(false), 3000);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <main className="bg-theme-bg min-h-[100dvh] w-full relative">
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
          >
            <div className="bg-[#FF4D4D] px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-white/20">
              <WifiOff size={12} className="text-white" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                Offline Mode
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className="w-full h-full min-h-[100dvh] relative z-10"
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

      <AnimatePresence mode="wait">
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
