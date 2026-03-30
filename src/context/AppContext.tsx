"use client";
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { EncryptionUtils } from "@/utils/shared/Encryption";
import { useRouter } from "next/navigation";
import { AcademiaData } from "@/types";
import { compareData, DataDiff } from "@/utils/shared/diffUtils";
import { sendNotification } from "@/utils/shared/notifs";
import { fetchWithLoadBalancer } from "@/utils/backendProxy";
import { UpdateHistoryItem } from "@/types";

import { getScheduleStatus } from "@/utils/academia/academiaLogic";
import calendarDataJson from "@/data/calendar_data.json";

interface AppContextType {
  userData: AcademiaData | null;
  setUserData: (data: AcademiaData | null) => void;
  customDisplayName: string;
  setCustomDisplayName: (name: string) => void;
  isUpdating: boolean;
  setIsUpdating: (val: boolean) => void;
  isOffline: boolean;
  isBackendError: boolean;
  setIsBackendError: (val: boolean) => void;
  backendErrorMsg: string | null;
  setBackendErrorMsg: (msg: string | null) => void;
  refreshData: (creds: any, existingData: any) => Promise<any>;
  performLogin: (creds: any) => Promise<any>;
  loginPromise: Promise<any> | null;
  setLoginPromise: (promise: Promise<any> | null) => void;
  logout: () => Promise<void>;
  latestDiff: DataDiff | null;
  setLatestDiff: (diff: DataDiff | null) => void;
  updateHistory: UpdateHistoryItem[];
  setUpdateHistory: (history: UpdateHistoryItem[]) => void;
  isUpdateHistoryOpen: boolean;
  setIsUpdateHistoryOpen: (open: boolean) => void;
  deferredPrompt: any;
  canInstall: boolean;
  setCanInstall: (val: boolean) => void;
  setDeferredPrompt: (val: any) => void;
  showWelcome: boolean;
  setShowWelcome: (val: boolean) => void;
  profileSeed: string;
  setProfileSeed: (seed: string) => void;
  calendarData: any[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState<any>(null);
  const [customDisplayName, setCustomDisplayName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isBackendError, setIsBackendError] = useState(false);
  const [backendErrorMsg, setBackendErrorMsg] = useState<string | null>(null);
  const [latestDiff, setLatestDiff] = useState<DataDiff | null>(null);
  const [updateHistory, setUpdateHistory] = useState<UpdateHistoryItem[]>([]);
  const [isUpdateHistoryOpen, setIsUpdateHistoryOpen] = useState(false);
  const [loginPromise, setLoginPromise] = useState<Promise<any> | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState<boolean>(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [profileSeed, setProfileSeed] = useState<string>("");
  const updateInProgress = React.useRef(false);
  const sessionNotificationsSent = React.useRef<Set<string>>(new Set());
  const classNotificationsSent = React.useRef<Set<string>>(new Set());
  const hasRefreshed = React.useRef(false);
  const hasPrecached = React.useRef(false);
  const router = useRouter();

  const cleanupHistory = (history: UpdateHistoryItem[]) => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setHours(0, 0, 0, 0);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 1); // Yesterday at 00:00
    
    return history.filter(item => item.timestamp >= twoDaysAgo.getTime());
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem("ratio_update_history");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        const cleaned = cleanupHistory(parsed);
        setUpdateHistory(cleaned);
        localStorage.setItem("ratio_update_history", JSON.stringify(cleaned));
      } catch (e) {
        setUpdateHistory([]);
      }
    }
  }, []);

  useEffect(() => {
    if (!userData?.schedule) return;

    const checkClassNotifications = () => {
      const todayDate = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const calendar = calendarDataJson as any[];
      const todayEntry = calendar.find((item) => item.date === todayDate);
      const effectiveDayOrder =
        todayEntry && todayEntry.order !== "-"
          ? todayEntry.order
          : userData?.dayOrder || "1";

      const status = getScheduleStatus(userData.schedule, effectiveDayOrder);
      if (!status.nextClass) return;

      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const diff = ((status.nextClass as any).startMinutes || 0) - currentMins;
      const nextClassName = (status.nextClass as any).course || "Class";
      const marker15 = `${nextClassName}-15`;
      const marker5 = `${nextClassName}-5`;

      if (diff <= 15 && diff > 5 && !classNotificationsSent.current.has(marker15)) {
        sendNotification(`Next: ${nextClassName}`, `⏳ Starts in ${diff} min`, nextClassName);
        classNotificationsSent.current.add(marker15);
      } else if (diff <= 5 && diff >= 0 && !classNotificationsSent.current.has(marker5)) {
        sendNotification(
          `Next: ${nextClassName}`,
          `📍 ${(status.nextClass as any).room || "No Room"} • ⏳ Starts in ${diff} min`,
          nextClassName
        );
        classNotificationsSent.current.add(marker5);
      }
    };

    checkClassNotifications();
    const interval = setInterval(checkClassNotifications, 60000);
    return () => clearInterval(interval);
  }, [userData]);

  useEffect(() => {
    if (typeof window !== "undefined" && "caches" in window && !hasPrecached.current) {
      hasPrecached.current = true;
      const coreRoutes = ["/", "/attendance", "/marks", "/timetable", "/calendar"];
      coreRoutes.forEach(route => {
        router.prefetch(route);
        fetch(route).catch(() => {});
      });
    }
  }, [router]);

  const calendarData = useMemo(() => {
    return (calendarDataJson as any[]).map(item => ({
      ...item,
      date: new Date(item.date),
      isHoliday: item.dayOrder === "Holiday" || item.dayOrder === "Sunday"
    }));
  }, []);

  const logout = useCallback(async () => {
    await EncryptionUtils.flushAllStorage();
    sessionNotificationsSent.current.clear();
    setUserData(null);
    router.replace("/login");
  }, [router]);

  const performLogin = useCallback(async (creds: any) => {
    setIsBackendError(false);
    setBackendErrorMsg(null);
    const promise = (async () => {
      try {
        const response = await fetchWithLoadBalancer("/login", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Student-Key": creds.username,
            "X-Ratio-App": "true"
          },
          body: JSON.stringify(creds),
        });

        if (response.status === 503 || response.status === 429) {
          setIsBackendError(true);
          try {
            const data = await response.json();
            if (data.detail) setBackendErrorMsg(data.detail);
          } catch {}
          throw new Error("Backend error");
        }
        
        const data = await response.json();
        if (!response.ok || !data.success) {
          if (typeof data.detail === "object" && data.detail !== null) {
            throw data.detail;
          }
          throw new Error(data.detail || "Login failed");
        }

        if (data.cookies) {
          EncryptionUtils.saveEncrypted("academia_cookies", data.cookies);
          delete data.cookies;
        }

        EncryptionUtils.saveEncrypted("ratio_credentials", {
          username: creds.username,
          password: creds.password,
        });

        EncryptionUtils.setSessionCookie();
        setUserData(data);
        localStorage.setItem("ratio_data", JSON.stringify(data));

        return data;
      } catch (err) {
        throw err;
      }
    })();

    setLoginPromise(promise);
    return promise;
  }, []);

  const refreshData = useCallback(async (creds: any, existingData: any) => {
    if (updateInProgress.current) return existingData;
    updateInProgress.current = true;
    setIsUpdating(true);
    setIsBackendError(false);
    setBackendErrorMsg(null);
    try {
      const savedCookies = EncryptionUtils.loadDecrypted("academia_cookies");
      const response = await fetchWithLoadBalancer("/refresh", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Student-Key": creds.username,
          "X-Ratio-App": "true"
        },
        body: JSON.stringify({ ...creds, cookies: savedCookies }),
      });

      if (response.status === 503 || response.status === 429) {
        setIsBackendError(true);
        try {
          const data = await response.json();
          if (data.detail) setBackendErrorMsg(data.detail);
        } catch {}
        return existingData;
      }

      const result = await response.json();
      if (!result.success) {
        if (response.status === 401) {
          await logout();
        }
        return existingData;
      }

      EncryptionUtils.setSessionCookie();
      
      let updatedCookies = savedCookies;
      if (result.cookies) {
        EncryptionUtils.saveEncrypted("academia_cookies", result.cookies);
        updatedCookies = result.cookies;
        delete result.cookies;
      }

      const hasOldData = (existingData?.attendance?.length > 0) || (existingData?.marks?.length > 0);
      
      const diff = hasOldData ? compareData(existingData, { ...existingData, ...result }) : null;
      
      let mergedData = {
        ...existingData,
        ...result,
        cookies: updatedCookies,
      };
      
      if (diff) {
        setLatestDiff(diff);
        const timestamp = Date.now();
        const newHistoryItem: UpdateHistoryItem = {
          id: `update-${timestamp}`,
          timestamp,
          diff,
        };
        
        setUpdateHistory(prev => {
          const updated = cleanupHistory([newHistoryItem, ...prev]);
          localStorage.setItem("ratio_update_history", JSON.stringify(updated));
          return updated;
        });

        const changedCourseIds = new Set([
          ...diff.attendanceChanges.map(a => a.course),
          ...diff.newMarks.map(m => m.course)
        ]);

        mergedData.attendance = mergedData.attendance?.map((a: any) => ({
          ...a,
          updatedAt: changedCourseIds.has(a.title || a.course || a.code) ? Date.now() : (a.updatedAt || 0)
        }));

        mergedData.marks = mergedData.marks?.map((m: any) => ({
          ...m,
          updatedAt: changedCourseIds.has(m.courseTitle || m.courseCode) ? Date.now() : (m.updatedAt || 0)
        }));
      }

      setUserData(mergedData);
      localStorage.setItem("ratio_data", JSON.stringify(mergedData));
      return mergedData;
    } catch {
      return existingData;
    } finally {
      setIsUpdating(false);
      updateInProgress.current = false;
    }
  }, [logout]);

  useEffect(() => {
    const cachedData = localStorage.getItem("ratio_data");
    const cachedName = localStorage.getItem("ratiod_custom_name");
    const cachedSeed = localStorage.getItem("ratio_profile_seed");

    if (cachedName) setCustomDisplayName(cachedName);

    let parsed: any = null;
    if (cachedData) {
      try {
        parsed = JSON.parse(cachedData);
        setUserData(parsed);
        
        const creds = EncryptionUtils.loadDecrypted("ratio_credentials");
        if (creds && !hasRefreshed.current) {
          hasRefreshed.current = true;
          refreshData(creds, parsed);
        }
      } catch {
      }
    }

    if (cachedSeed) {
      setProfileSeed(cachedSeed);
    } else if (parsed && parsed.profile && parsed.profile.name) {
      const initialSeed = parsed.profile.name;
      setProfileSeed(initialSeed);
      localStorage.setItem("ratio_profile_seed", initialSeed);
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);

    const installPromptHandler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", installPromptHandler);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", installPromptHandler);
    };
  }, []);

  useEffect(() => {
    if (userData?.profile?.name && !localStorage.getItem("ratio_profile_seed")) {
      const initialSeed = userData.profile.name;
      setProfileSeed(initialSeed);
      localStorage.setItem("ratio_profile_seed", initialSeed);
    }
  }, [userData]);

  useEffect(() => {
    if (!latestDiff) return;

    latestDiff.attendanceChanges.forEach((change) => {
      const notifId = `att-${change.course}-${change.newMargin}-${change.newPercent}`;
      if (sessionNotificationsSent.current.has(notifId)) return;

      const direction = change.diff > 0 ? "Increased" : "Decreased";
      const icon = change.diff > 0 ? "📈" : "📉";
      const label = change.newPercent >= 75 ? "Margin" : "Required";
      
      sendNotification(
        `Attendance ${direction}`,
        `${icon} ${change.course}: ${label} ${change.oldMargin} -> ${change.newMargin}`,
        `attendance-${change.course}`,
      );
      sessionNotificationsSent.current.add(notifId);
    });

    latestDiff.newMarks.forEach((mark) => {
      const notifId = `mark-${mark.course}-${mark.test}-${mark.score}`;
      if (sessionNotificationsSent.current.has(notifId)) return;

      sendNotification(
        `New Marks: ${mark.course}`,
        `📝 ${mark.test}: ${mark.score}/${mark.max} scored!`,
        `marks-${mark.course}-${mark.test}`,
      );
      sessionNotificationsSent.current.add(notifId);
    });

  }, [latestDiff]);

const value = useMemo(() => ({
    userData,
    setUserData,
    customDisplayName,
    setCustomDisplayName,
    isUpdating,
    setIsUpdating,
    isOffline,
    isBackendError,
    setIsBackendError,
    backendErrorMsg,
    setBackendErrorMsg,
    refreshData,
    performLogin,
    loginPromise,
    setLoginPromise,
    logout,
    latestDiff,
    setLatestDiff,
    updateHistory,
    setUpdateHistory,
    isUpdateHistoryOpen,
    setIsUpdateHistoryOpen,
    deferredPrompt,
    canInstall,
    setCanInstall,
    setDeferredPrompt,
    showWelcome,
    setShowWelcome,
    profileSeed,
    setProfileSeed,
    calendarData,
  }), [userData, customDisplayName, isUpdating, isOffline, isBackendError, backendErrorMsg, refreshData, performLogin, loginPromise, logout, latestDiff, updateHistory, isUpdateHistoryOpen, deferredPrompt, canInstall, showWelcome, profileSeed, calendarData]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
