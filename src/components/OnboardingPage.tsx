"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Download,
  Share,
  PlusSquare,
  Smartphone,
  CheckCircle2,
} from "lucide-react";

const OnboardingPage = () => {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [isPWA, setIsPWA] = useState<boolean>(false);
  const [os, setOs] = useState<"android" | "ios" | "other" | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState<boolean>(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://");
    setIsPWA(isStandalone);

    const checkDevice = () => {
      const ua = navigator.userAgent;
      setIsMobile(window.innerWidth < 768);

      if (/android/i.test(ua)) setOs("android");
      else if (
        /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
      )
        setOs("ios");
      else setOs("other");
    };

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setCanInstall(false);
    }
  };

  if (isMobile === null)
    return <div className="h-[100dvh] w-full bg-[#0c30ff]" />;

  if (isPWA) {
    return (
      <div className="h-[100dvh] w-full bg-[#0c30ff] flex flex-col justify-center items-center p-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <h1
            className="text-7xl text-[#ceff1c] lowercase mb-4"
            style={{ fontFamily: "Urbanosta" }}
          >
            ratio'd
          </h1>
          <p className="text-white font-mono uppercase tracking-widest text-xs mb-8">
            System Ready
          </p>
          <button className="flex items-center gap-4 border-2 border-[#ceff1c] px-8 py-4 text-[#ceff1c] hover:bg-[#ceff1c] hover:text-[#0c30ff] transition-all">
            <span className="text-2xl font-bold">ENTER APP</span>
            <ArrowRight />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col justify-between p-8 pb-16 md:p-16 md:px-24 bg-[#0c30ff] overflow-hidden text-white relative">
      <header className="flex justify-between items-start w-full">
        <h1
          className="text-5xl md:text-7xl lowercase tracking-tighter text-[#ceff1c]"
          style={{ fontFamily: "Urbanosta" }}
        >
          ratio'd
        </h1>
      </header>

      <main className="w-full max-w-3xl mt-auto pb-16 md:pb-24">
        <AnimatePresence mode="wait">
          {!isMobile ? (
            <motion.div
              key="desktop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-[#ceff1c]">
                  <Smartphone size={14} />
                  <span className="font-mono text-[10px] uppercase tracking-widest">
                    Mobile Exclusive
                  </span>
                </div>

                <h2
                  className="text-4xl md:text-[3.5rem] text-white tracking-tight leading-[1.05]"
                  style={{ fontFamily: "Aonic" }}
                >
                  ratio'd is currently <br /> mobile-only.
                </h2>

                <p className="text-white/60 font-mono text-[11px] md:text-xs leading-relaxed max-w-md mt-2">
                  We're building the best experience for handhelds first.
                  <br />
                  Leave your email to get notified when we launch on
                  <br />
                  desktop.
                </p>
              </div>

              <div className="group relative border-b border-white mt-8 pb-2">
                <input
                  type="email"
                  className="w-full bg-transparent py-2 text-3xl md:text-5xl text-white outline-none placeholder:text-white/20 transition-colors"
                  placeholder="email@address.com"
                  style={{ fontFamily: "Aonic" }}
                />
                <button className="absolute right-0 bottom-4 text-white hover:text-[#ceff1c] transition-colors">
                  <ArrowRight size={24} />
                </button>
              </div>

              <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/40 mt-2 block">
                Join the waitlist — 001
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="mobile"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="space-y-10"
            >
              <div className="space-y-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#ceff1c]">
                  Status: Web Browser
                </p>
                <h2
                  className="text-5xl lowercase leading-tight"
                  style={{ fontFamily: "Aonic" }}
                >
                  Install ratio'd to <br /> unlock full access.
                </h2>
              </div>

              {os === "android" ? (
                <button
                  onClick={handleAndroidInstall}
                  className={`w-full group flex items-center justify-between border-t border-white pt-8 ${!canInstall ? "opacity-50 grayscale cursor-not-allowed" : ""}`}
                >
                  <span
                    className="text-5xl lowercase group-hover:text-[#ceff1c] transition-colors"
                    style={{ fontFamily: "Aonic" }}
                  >
                    {canInstall ? "Install App" : "App Ready"}
                  </span>
                  <Download
                    size={48}
                    className={canInstall ? "group-hover:translate-y-2 transition-transform" : ""}
                  />
                </button>
              ) : (
                <div className="space-y-6 border-t border-white/20 pt-8">
                  <div className="flex items-center gap-4 text-white/80">
                    <div className="p-2 border border-white/20">
                      <Share size={20} />
                    </div>
                    <p className="text-sm font-mono uppercase">
                      1. Tap the 'Share' icon below
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-white/80">
                    <div className="p-2 border border-white/20">
                      <PlusSquare size={20} />
                    </div>
                    <p className="text-sm font-mono uppercase">
                      2. Select 'Add to Home Screen'
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-[#ceff1c]">
                    <CheckCircle2 size={20} />
                    <p className="text-sm font-mono uppercase">
                      3. Launch from your Home Screen
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default OnboardingPage;
