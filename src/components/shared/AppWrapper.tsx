"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { WifiOff } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import MinecraftParticles from "./MinecraftParticles";
import MinecraftAmbience from "./MinecraftAmbience";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const { isOffline } = useApp();
  const [showSplash, setShowSplash] = useState(true);
  const [showBigOffline, setShowBigOffline] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 1000);

    const isStandalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes("android-app://"));
    
    const cachedData = localStorage.getItem("ratio_data");
    const isOnboarded = localStorage.getItem("ratiod_onboarded") === "true";
    const isSetupBypassed = localStorage.getItem("ratiod_setup_bypassed") === "true";
    const isPublicPage = pathname === "/login" || pathname === "/onboarding" || pathname === "/setup";

    if (!isPublicPage) {
      if (!isOnboarded) {
        router.replace("/onboarding");
      } else if (!isStandalone && !isSetupBypassed) {
        router.replace("/setup");
      } else if (!cachedData) {
        router.replace("/login");
      }
    }

    return () => clearTimeout(splashTimer);
  }, [pathname, router]);

  useEffect(() => {
    if (isOffline) {
      setShowBigOffline(true);
      const timer = setTimeout(() => setShowBigOffline(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOffline]);

  return (
    <main className="bg-theme-bg min-h-screen w-full relative">
      <AnimatePresence mode="wait">
        {isOffline && (
          <motion.div
            key="offline-banner"
            initial={{ y: "-100%" }}
            animate={{ y: showBigOffline ? "0%" : "-100%" }}
            exit={{ y: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-0 left-0 right-0 z-[9999] flex flex-col items-center pointer-events-none"
          >
            <div className="bg-[#FF4D4D] w-full py-4 px-6 flex flex-col items-center justify-center shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-black/20" />
              <div className="flex flex-col items-center gap-2 mt-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md mb-1">
                  <WifiOff size={24} className="text-white" strokeWidth={2.5} />
                </div>
                <span
                  className="text-3xl font-black lowercase tracking-widest text-white leading-none"
                  style={{ fontFamily: "Aonic, sans-serif" }}
                >
                  Offline
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80 max-w-[250px] text-center leading-snug">
                  You are viewing cached data.
                </span>
              </div>
            </div>
            <div className="bg-[#FF4D4D] px-6 py-2 rounded-b-3xl shadow-lg mt-0 flex justify-center items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/90 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                waiting for connection
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full h-full min-h-screen relative z-10">
        {children}
      </div>

      <MinecraftParticles />
      <MinecraftAmbience />

      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 bg-theme-bg flex items-center justify-center z-[9999]"
          >
            <motion.h1
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl md:text-7xl lowercase tracking-tighter text-theme-highlight"
              style={{ fontFamily: "Urbanosta, sans-serif" }}
            >
              ratio'd
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
