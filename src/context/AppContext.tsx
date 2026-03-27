"use client";
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { EncryptionUtils } from "@/utils/shared/Encryption";
import { useRouter } from "next/navigation";
import { AcademiaData } from "@/types";
import { compareData, DataDiff } from "@/utils/shared/diffUtils";
import { sendNotification } from "@/utils/shared/notifs";

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
  refreshData: (creds: any, existingData: any) => Promise<any>;
  performLogin: (creds: any) => Promise<any>;
  loginPromise: Promise<any> | null;
  setLoginPromise: (promise: Promise<any> | null) => void;
  logout: () => void;
  latestDiff: DataDiff | null;
  setLatestDiff: (diff: DataDiff | null) => void;
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
  const [latestDiff, setLatestDiff] = useState<DataDiff | null>(null);
  const [loginPromise, setLoginPromise] = useState<Promise<any> | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState<boolean>(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [profileSeed, setProfileSeed] = useState<string>("");
  const updateInProgress = React.useRef(false);
  const sessionNotificationsSent = React.useRef<Set<string>>(new Set());
  const hasRefreshed = React.useRef(false);
  const router = useRouter();

  const calendarData = useMemo(() => {
    return (calendarDataJson as any[]).map(item => ({
      ...item,
      date: new Date(item.date),
      isHoliday: item.dayOrder === "Holiday" || item.dayOrder === "Sunday"
    }));
  }, []);

  const logout = useCallback(() => {
    EncryptionUtils.flushAllStorage();
    localStorage.removeItem("ratiod_custom_name");
    sessionNotificationsSent.current.clear();
    setUserData(null);
    router.replace("/login");
  }, [router]);

  const performLogin = useCallback(async (creds: any) => {
    setIsBackendError(false);
    const promise = (async () => {
      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(creds),
        });

        if (response.status === 503) {
          setIsBackendError(true);
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
    try {
      const savedCookies = EncryptionUtils.loadDecrypted("academia_cookies");
      const response = await fetch("/api/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...creds, cookies: savedCookies }),
      });

      if (response.status === 503) {
        setIsBackendError(true);
        return existingData;
      }

      const result = await response.json();
      if (!result.success) {
        if (response.status === 401) {
          logout();
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

      const endpoint = (existingData?.attendance && existingData?.marks) ? "refresh" : "login";
      let mergedData = endpoint === "login" ? { ...result, cookies: updatedCookies } : {
        ...existingData,
        ...result,
        cookies: updatedCookies,
      };

      const hasOldData = (existingData?.attendance?.length > 0) || (existingData?.marks?.length > 0);
      const diff = hasOldData ? compareData(existingData, mergedData) : null;
      
      if (diff) {
        setLatestDiff(diff);
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

    let parsed = null;
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
    } else if (parsed?.profile?.name) {
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
    refreshData,
    performLogin,
    loginPromise,
    setLoginPromise,
    logout,
    latestDiff,
    setLatestDiff,
    deferredPrompt,
    canInstall,
    setCanInstall,
    setDeferredPrompt,
    showWelcome,
    setShowWelcome,
    profileSeed,
    setProfileSeed,
    calendarData,
  }), [userData, customDisplayName, isUpdating, isOffline, isBackendError, refreshData, performLogin, loginPromise, logout, latestDiff, deferredPrompt, canInstall, showWelcome, profileSeed, calendarData]);

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
