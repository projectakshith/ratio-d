"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LoginPage from "@/components/shared/LoginPage";
import AcademiaApp from "@/components/AcademiaApp";
import OnboardingPage from "@/components/OnboardingPage";
import { EncryptionUtils } from "@/utils/Encryption";
import { WifiOff, Wifi } from "lucide-react";

export default function Home() {
  const [view, setView] = useState("loading");
  const [userData, setUserData] = useState<any>(null);
  const [customDisplayName, setCustomDisplayName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [isOffline, setIsOffline] = useState(false);
  const [showBigOffline, setShowBigOffline] = useState(false);
  const [justCameOnline, setJustCameOnline] = useState(false);

  useEffect(() => {
    EncryptionUtils.cleanOldKeys();

    const isStandalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone);

    const cachedData = localStorage.getItem("ratio_data");
    const cachedName = localStorage.getItem("ratiod_custom_name");

    if (cachedName) setCustomDisplayName(cachedName);

    let nextView = "loading";
    if (cachedData) {
      setUserData(JSON.parse(cachedData));
      nextView = isStandalone ? "app" : "onboarding";
    } else {
      nextView = isStandalone ? "login" : "onboarding";
    }

    const timer = setTimeout(() => {
      setView(nextView);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const performLogin = async (username: string, password: string) => {
    const savedCookies = EncryptionUtils.loadDecrypted("academia_cookies");

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        cookies: savedCookies,
      }),
    });

    const result = await response.json();
    if (!result.success) throw new Error("Login failed");

    if (result.cookies) {
      EncryptionUtils.saveEncrypted("academia_cookies", result.cookies);
      delete result.cookies;
    }

    localStorage.setItem("ratio_data", JSON.stringify(result));
    EncryptionUtils.saveEncrypted("ratio_credentials", { username, password });

    return result;
  };

  const refreshData = async (creds: any, existingData: any) => {
    setIsUpdating(true);
    try {
      const savedCookies = EncryptionUtils.loadDecrypted("academia_cookies");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/refresh`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: creds.username,
            password: creds.password,
            cookies: savedCookies,
          }),
        },
      );

      const result = await response.json();
      if (!result.success) throw new Error("Refresh failed");

      if (result.cookies) {
        EncryptionUtils.saveEncrypted("academia_cookies", result.cookies);
        delete result.cookies;
      }

      const updatedData = {
        ...existingData,
        attendance: result.attendance,
        marks: result.marks,
      };

      setUserData(updatedData);
      localStorage.setItem("ratio_data", JSON.stringify(updatedData));

      return updatedData;
    } catch (err) {
      return existingData;
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOffline(false);
      setShowBigOffline(false);
      setJustCameOnline(true);
      setTimeout(() => setJustCameOnline(false), 3000);

      if (view === "app") {
        const creds = EncryptionUtils.loadDecrypted("ratio_credentials");
        const data = localStorage.getItem("ratio_data");
        if (creds && data) refreshData(creds, JSON.parse(data));
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowBigOffline(true);
      setTimeout(() => setShowBigOffline(false), 2000);
    };

    if (!navigator.onLine) {
      handleOffline();
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [view]);

  useEffect(() => {
    if (view !== "app" || typeof window === "undefined") return;

    const cachedData = localStorage.getItem("ratio_data");
    const cachedCreds = EncryptionUtils.loadDecrypted("ratio_credentials");

    if (cachedData && cachedCreds && !isOffline) {
      refreshData(cachedCreds, JSON.parse(cachedData));
    }

    const interval = setInterval(
      () => {
        if (navigator.onLine) {
          const creds = EncryptionUtils.loadDecrypted("ratio_credentials");
          const data = localStorage.getItem("ratio_data");
          if (creds && data) {
            refreshData(creds, JSON.parse(data));
          }
        }
      },
      30 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [view, isOffline]);

  const handleUpdateName = (newName: string) => {
    setCustomDisplayName(newName);
    localStorage.setItem("ratiod_custom_name", newName);
  };

  const handleLogout = () => {
    EncryptionUtils.flushAllStorage();
    localStorage.removeItem("ratiod_custom_name");
    setUserData(null);
    setCustomDisplayName("");
    setView("login");
  };

  const handleDevBypass = () => {
    const cachedData = localStorage.getItem("ratio_data");
    setView(cachedData ? "app" : "login");
  };

  return (
    <main className="bg-[#050505] min-h-[100dvh] w-full relative overflow-hidden">
      <AnimatePresence>
        {isOffline && (
          <motion.div
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

      <AnimatePresence>
        {isOffline && !showBigOffline && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              delay: 0.1,
            }}
            className="fixed top-0 left-0 right-0 z-[9998] pointer-events-none flex justify-center items-start"
          >
            <div className="bg-[#FF4D4D] px-6 py-2 rounded-b-3xl shadow-md flex justify-center items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/90 flex items-center gap-2 text-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                waiting for connection
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {justCameOnline && !isOffline && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 24, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none flex justify-center"
          >
            <div className="bg-[#85a818] px-5 py-2.5 rounded-full shadow-lg flex items-center gap-3 border-[1.5px] border-black/10">
              <Wifi size={14} className="text-white" strokeWidth={3} />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
                Back Online
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {view === "loading" && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 bg-[#0c30ff] flex items-center justify-center z-50"
          >
            <motion.h1
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl md:text-7xl lowercase tracking-tighter text-[#ceff1c]"
              style={{ fontFamily: "Urbanosta, sans-serif" }}
            >
              ratio'd
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      {view === "onboarding" && (
        <>
          <button
            onClick={handleDevBypass}
            className="absolute top-0 right-0 w-24 h-24 z-[99] opacity-0"
            aria-label="Developer Bypass"
          />
          <OnboardingPage />
        </>
      )}

      {view === "login" && (
        <LoginPage
          onLogin={(data) => {
            setUserData(data);
            setView("app");
            localStorage.setItem("ratio_data", JSON.stringify(data));
          }}
        />
      )}

      {view === "app" && (
        <AcademiaApp
          data={userData}
          onLogout={handleLogout}
          customDisplayName={customDisplayName}
          onUpdateName={handleUpdateName}
          isUpdating={isUpdating}
        />
      )}
    </main>
  );
}
