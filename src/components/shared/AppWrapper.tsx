"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { WifiOff, ServerCrash, RefreshCw, CheckCircle2 } from "lucide-react";
import MinecraftParticles from "./MinecraftParticles";
import MinecraftAmbience from "./MinecraftAmbience";
import SyncStatusNotification from "./SyncStatusNotification";
import UpdateHistory from "./UpdateHistory";
import PortalLoginModal from "./PortalLoginModal";
import AnnouncementToast from "./AnnouncementToast";
import { useTabFocus } from "@/hooks/useTabFocus";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  useTabFocus();
  const { isOffline, isBackendError, setIsBackendError, backendErrorMsg, setBackendErrorMsg, showWelcome, setShowWelcome, userData, isUpdateHistoryOpen, setIsUpdateHistoryOpen, isUpdating, portalAuthOpen, setPortalAuthOpen, portalAuthMode, isCheckingPortal } = useApp();
  const [showSplash, setShowSplash] = useState(false);
  const [isFirstSplash, setIsFirstSplash] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const wasUpdating = React.useRef(false);
  const [showWifiPopup, setShowWifiPopup] = useState(false);
  const prevOffline = React.useRef(isOffline);

  useEffect(() => {
    if (isOffline && !prevOffline.current) {
      setShowWifiPopup(true);
    }
    prevOffline.current = isOffline;
  }, [isOffline]);

  const [syncText, setSyncText] = useState("syncing...");
  const [syncFailed, setSyncFailed] = useState(false);
  const [isSyncingPillVisible, setIsSyncingPillVisible] = useState(false);

  useEffect(() => {
    if (isUpdating) {
      wasUpdating.current = true;
      setIsSyncingPillVisible(true);
      setShowSyncSuccess(false);
      setSyncFailed(false);
      setSyncText("syncing...");

      const t1 = setTimeout(() => {
        setSyncText("session expired");
      }, 2500);

      const t2 = setTimeout(() => {
        setSyncText("re-authenticating...");
      }, 4000);

      const tSafety = setTimeout(() => {
        setSyncFailed(true);
        setSyncText("sync failed • check internet or try logging back in");
      }, 15000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(tSafety);
      };
    } else {
      if (wasUpdating.current) {
        wasUpdating.current = false;
        if (!isBackendError && !isOffline) {
          setIsSyncingPillVisible(false);
          setShowSyncSuccess(true);
          const timer = setTimeout(() => {
            setShowSyncSuccess(false);
          }, 2500);
          return () => clearTimeout(timer);
        } else {
          setIsSyncingPillVisible(false);
        }
      }
    }
  }, [isUpdating, isBackendError, isOffline]);

  const waitingWorkerRef = React.useRef<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const notifyUpdate = (worker?: ServiceWorker | null) => {
      if (worker) waitingWorkerRef.current = worker;
      const coreRoutes = ["/dashboard", "/attendance", "/marks", "/timetable", "/calendar", "/settings", "/login"];
      Promise.allSettled(coreRoutes.map((r) => fetch(r, { cache: "reload" }))).finally(() => {
        setUpdateAvailable(true);
      });
    };

    const wb = (window as any).workbox;
    if (wb) {
      wb.addEventListener("waiting", (event: any) => notifyUpdate(event.sw));
      wb.addEventListener("externalwaiting", (event: any) => notifyUpdate(event.sw));
    }

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      if (reg.waiting) {
        notifyUpdate(reg.waiting);
      }
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            notifyUpdate(newWorker);
          }
        });
      });
    });

    const onFocus = () => {
      navigator.serviceWorker.getRegistration().then((reg) => reg?.update().catch(() => {}));
    };
    window.addEventListener("focus", onFocus);

    const handleChunkError = (event: ErrorEvent) => {
      const msg = event.message || "";
      if (msg.includes("Loading chunk") || msg.includes("ChunkLoadError") || msg.includes("Failed to fetch dynamically imported module")) {
        window.location.reload();
      }
    };
    window.addEventListener("error", handleChunkError);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("error", handleChunkError);
    };
  }, []);

  const handleUpdate = () => {
    if (typeof window === "undefined") return;

    const wb = (window as any).workbox;
    if (wb && typeof wb.messageSkipWaiting === "function") {
      wb.messageSkipWaiting();
    } else if (waitingWorkerRef.current) {
      waitingWorkerRef.current.postMessage({ type: "SKIP_WAITING" });
    }

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    }, { once: true });

    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  useEffect(() => {
    const splashPlayed = sessionStorage.getItem("ratio_splash_played") === "true";
    if (splashPlayed) return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;

    if (isStandalone) {
      sessionStorage.setItem("ratio_splash_played", "true");
      const isOnboarded = localStorage.getItem("ratiod_onboarded") === "true";

      if (!isOnboarded) {
        setIsFirstSplash(true);
      }

      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "theme-color");
        document.head.appendChild(meta);
      }
      const prevColor = meta.getAttribute("content") || "#111111";
      meta.setAttribute("content", "#0c30ff");

      setShowSplash(true);
      const safetyTimer = setTimeout(() => {
        setShowSplash(false);
        meta!.setAttribute("content", prevColor);
      }, !isOnboarded ? 3500 : 800);
      return () => clearTimeout(safetyTimer);
    }
  }, []);

  useEffect(() => {
    if (isBackendError) {
      const timer = setTimeout(() => {
        setIsBackendError(false);
        setBackendErrorMsg(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isBackendError, setIsBackendError, setBackendErrorMsg]);

  useEffect(() => {
    if (showWelcome) {
      setShowSplash(false);
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome, setShowWelcome]);

  return (
    <main className="bg-theme-bg min-h-full w-full flex flex-col relative">
      <AnimatePresence>
        {isOffline && (
          <motion.div
            key="offline-status"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed left-0 right-0 z-[10001] flex justify-center pointer-events-none"
            style={{ top: "max(1rem, calc(env(safe-area-inset-top, 0px) + 0.5rem))" }}
          >
            <div className="bg-[#FF4D4D] px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-white/20 pointer-events-auto">
              <WifiOff size={12} className="text-white" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                Offline Mode
              </span>
            </div>
          </motion.div>
        )}
        {isBackendError && !isOffline && (
          <motion.div
            key="backend-status"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed left-0 right-0 z-[10001] flex justify-center pointer-events-none"
            style={{ top: "max(1rem, calc(env(safe-area-inset-top, 0px) + 0.5rem))" }}
          >
            <div 
              className="px-4 py-1.5 rounded-full shadow-lg flex items-center gap-3 border border-white/20 pointer-events-auto"
              style={{ backgroundColor: 'var(--theme-secondary)' }}
            >
              <div className="flex items-center gap-2">
                <ServerCrash size={12} className="text-white" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                  {backendErrorMsg || "Backend Servers Down"}
                </span>
              </div>
              {!userData?.isPortal && (
                <button
                  onClick={() => setPortalAuthOpen(true)}
                  className="px-2.5 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-[9px] font-black uppercase tracking-wider transition-colors"
                  style={{ fontFamily: 'var(--font-montserrat)' }}
                >
                  try student portal
                </button>
              )}
            </div>
          </motion.div>
        )}
        {isSyncingPillVisible && !isOffline && (
          <motion.div
            key="syncing-status"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed left-0 right-0 z-[10001] flex justify-center pointer-events-none"
            style={{ top: "max(1rem, calc(env(safe-area-inset-top, 0px) + 0.5rem))" }}
          >
            <div className={`px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2.5 border backdrop-blur-md pointer-events-auto transition-all ${syncFailed ? "bg-[#FF4D4D] border-white/20 text-white" : "bg-theme-surface/90 border-theme-border text-theme-text"}`}>
              <RefreshCw size={12} className={`shrink-0 ${syncFailed ? "text-white" : "text-theme-highlight animate-spin"}`} />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {syncText}
              </span>
              <AnimatePresence>
                {isCheckingPortal && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    className="text-[9px] font-mono text-theme-highlight flex items-center gap-1.5 opacity-90"
                  >
                    <span className="w-1 h-1 rounded-full bg-theme-highlight animate-pulse" />
                    portal
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
        {showSyncSuccess && !isOffline && !isSyncingPillVisible && (
          <motion.div
            key="sync-success-status"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed left-0 right-0 z-[10001] flex justify-center pointer-events-none"
            style={{ top: "max(1rem, calc(env(safe-area-inset-top, 0px) + 0.5rem))" }}
          >
            <div className="bg-theme-emphasis px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-theme-emphasis pointer-events-auto">
              <CheckCircle2 size={12} className="text-theme-bg" />
              <span className="text-[10px] font-black uppercase tracking-widest text-theme-bg">
                synced
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
      <AnnouncementToast />
      <UpdateHistory isOpen={isUpdateHistoryOpen} onClose={() => setIsUpdateHistoryOpen(false)} />
      <PortalLoginModal
        open={portalAuthOpen}
        onClose={() => setPortalAuthOpen(false)}
        onSuccess={() => {}}
        captchaOnly={portalAuthMode === "captcha_only"}
      />

      <AnimatePresence>
        {updateAvailable && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-24 left-0 right-0 z-[10001] flex justify-center px-6 pointer-events-none"
          >
            <div className="bg-theme-bg border border-theme-border p-2 pl-5 rounded-full shadow-2xl flex items-center gap-4 pointer-events-auto min-w-[240px] justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted">
                new version ready
              </span>
              <button
                onClick={handleUpdate}
                className="bg-theme-emphasis text-theme-bg px-4 py-2 rounded-full flex items-center gap-2 active:scale-95 transition-transform"
              >
                <RefreshCw size={12} strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-widest">refresh</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWelcome && (
          <motion.div
            key="welcome-overlay"
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

      <AnimatePresence>
        {showWifiPopup && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10002] pointer-events-auto"
              onClick={() => setShowWifiPopup(false)}
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-theme-bg border-t border-theme-border rounded-t-[32px] p-6 pb-12 z-[10003] shadow-2xl pointer-events-auto text-center"
            >
              <div className="w-12 h-1.5 bg-theme-text-10 rounded-full mx-auto mb-6 shrink-0" />
              <div className="text-5xl mb-4">🛜</div>
              <h3 
                className="text-lg font-black uppercase tracking-widest text-theme-text mb-2"
                style={{ fontFamily: 'var(--font-montserrat)' }}
              >
                offline. again.
              </h3>
              <p 
                className="text-xs text-theme-muted max-w-xs mx-auto lowercase mb-6 leading-relaxed"
                style={{ fontFamily: 'var(--font-afacad)' }}
              >
                you're completely off the grid. if you're on srmist wifi, you probably forgot to log in (again). go feed the captive portal.
              </p>
              <div className="flex flex-col gap-3">
                <a
                  href="https://iac.srmist.edu.in/Connect/PortalMain"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-theme-emphasis text-theme-bg font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform text-[11px]"
                  style={{ fontFamily: 'var(--font-montserrat)' }}
                >
                  login to srm wifi
                </a>
                <button
                  onClick={() => setShowWifiPopup(false)}
                  className="w-full py-4 bg-theme-surface border border-theme-border text-theme-text font-black uppercase tracking-[0.2em] rounded-xl active:scale-[0.98] transition-transform text-[11px]"
                  style={{ fontFamily: 'var(--font-montserrat)' }}
                >
                  whatever
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
