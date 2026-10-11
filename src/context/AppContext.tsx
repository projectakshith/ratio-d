"use client";
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { EncryptionUtils, runMigration } from "@/utils/shared/Encryption";
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
  refreshData: (existingData: any) => Promise<any>;
  performLogin: (creds: any) => Promise<any>;
  performPortalLogin: (creds: any) => Promise<any>;
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
  portalAuthOpen: boolean;
  setPortalAuthOpen: (open: boolean) => void;
  portalAuthMode: "full" | "captcha_only";
  setPortalAuthMode: (mode: "full" | "captcha_only") => void;
  isCheckingPortal: boolean;
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
  const [portalAuthOpen, setPortalAuthOpen] = useState(false);
  const [portalAuthMode, setPortalAuthMode] = useState<"full" | "captcha_only">("full");
  const [isCheckingPortal, setIsCheckingPortal] = useState(false);
  const updateInProgress = React.useRef(false);
  const sessionNotificationsSent = React.useRef<Set<string>>(new Set());
  const classNotificationsSent = React.useRef<Set<string>>(new Set());
  const hasRefreshed = React.useRef(false);
  const hasPrecached = React.useRef(false);
  const router = useRouter();

  const cleanupHistory = (history: UpdateHistoryItem[]) => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setHours(0, 0, 0, 0);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 1);
    
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
      const now = new Date();
      const calendar = calendarDataJson as any[];
      const todayEntry = calendar.find((item) => {
        const d = new Date(item.date);
        return (
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });
      const effectiveDayOrder = (todayEntry?.order ?? userData?.dayOrder) as string | undefined;

      if (!effectiveDayOrder || !["1", "2", "3", "4", "5"].includes(effectiveDayOrder)) {
        return;
      }

      const status = getScheduleStatus(userData.schedule, effectiveDayOrder);
      if (!status.nextClass) return;

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
      const coreRoutes = ["/dashboard", "/attendance", "/marks", "/timetable", "/calendar"];
      coreRoutes.forEach(route => {
        router.prefetch(route);
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

  const checkConnectivity = useCallback(async (err: any) => {
    if (err?.name !== "AbortError" && err?.message !== "Failed to fetch") return;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      await fetch("https://1.1.1.1", { method: "HEAD", mode: "no-cors", signal: controller.signal });
      clearTimeout(timeoutId);
      setIsBackendError(true);
    } catch {
      setIsOffline(true);
    }
  }, []);

  const performLogin = useCallback(async (creds: any) => {
    setIsBackendError(false);
    setBackendErrorMsg(null);
    const promise = (async () => {
      try {
        const response = await fetchWithLoadBalancer("/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(creds),
        });

        if (response.status === 503 || response.status === 429 || response.status === 502 || response.status === 504) {
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
          await EncryptionUtils.saveEncrypted("academia_cookies", data.cookies);
          delete data.cookies;
        }

        await EncryptionUtils.saveEncrypted("ratio_credentials", {
          username: creds.username,
          password: creds.password,
        });

        EncryptionUtils.setSessionCookie();
        setUserData(data);
        localStorage.setItem("ratio_data", JSON.stringify(data));
        window.dispatchEvent(new Event("ratio_refresh_completed"));

        return data;
      } catch (err: any) {
        if (err.message === 'Backend error') {
          setIsBackendError(true);
        } else {
          await checkConnectivity(err);
        }
        throw err;
      }
    })();

    setLoginPromise(promise);
    return promise;
  }, [checkConnectivity]);

  const performPortalLogin = useCallback(async (creds: any) => {
    setIsBackendError(false);
    setBackendErrorMsg(null);
    const promise = (async () => {
      try {
        let digest = creds.cdigest;
        if (!digest && creds.captcha) {
          const capRes = await fetchWithLoadBalancer("/portal/captcha", { method: "POST" });
          const capData = await capRes.json().catch(() => ({}));
          if (!capRes.ok || !capData.session) {
            throw new Error(capData.detail || "Failed to load portal security check");
          }
          digest = capData.session;
        }

        const response = await fetchWithLoadBalancer("/portal/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: creds.username,
            password: creds.password,
            captcha: creds.captcha || undefined,
            cdigest: digest,
          }),
        });

        if (response.status === 503 || response.status === 429 || response.status === 502 || response.status === 504) {
          setIsBackendError(true);
          try {
            const data = await response.json();
            if (data.detail) setBackendErrorMsg(data.detail);
          } catch {}
          throw new Error("Backend error");
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
          const detail = data.detail;
          if (typeof detail === "object" && detail !== null) {
            if (detail.type === "WRONG_CAPTCHA" || detail.type === "CAPTCHA_REQUIRED") {
              const freshImage = detail.captcha_image || detail.image;
              const freshDigest = detail.cdigest || detail.session;
              if (freshImage && freshDigest) {
                throw {
                  type: "CAPTCHA_REQUIRED",
                  image: freshImage,
                  cdigest: freshDigest,
                  message: detail.message || "Invalid captcha. Please enter the new one.",
                };
              }
              const freshCapRes = await fetchWithLoadBalancer("/portal/captcha", { method: "POST" });
              const freshCapData = await freshCapRes.json().catch(() => ({}));
              throw {
                type: "CAPTCHA_REQUIRED",
                image: freshCapData.captcha_image || freshCapData.image,
                cdigest: freshCapData.session,
                message: detail.message || "Invalid captcha. Please enter the new one.",
              };
            }
            throw detail;
          }
          const isWrongCaptcha = typeof detail === "string" && (detail.toLowerCase().includes("captcha") || detail === "wrong captcha, try the new one");
          if (isWrongCaptcha) {
            const freshCapRes = await fetchWithLoadBalancer("/portal/captcha", { method: "POST" });
            const freshCapData = await freshCapRes.json().catch(() => ({}));
            throw {
              type: "CAPTCHA_REQUIRED",
              image: freshCapData.captcha_image || freshCapData.image,
              cdigest: freshCapData.session,
              message: "Invalid captcha. Please enter the security check characters.",
            };
          }
          throw new Error(typeof detail === "string" ? detail : "Login failed");
        }

        if (data.cookies) {
          await EncryptionUtils.saveEncrypted("portal_cookies", data.cookies);
          delete data.cookies;
        }

        await EncryptionUtils.saveEncrypted("portal_credentials", {
          username: creds.username,
          password: creds.password,
        });

        EncryptionUtils.setSessionCookie();
        data.isPortal = true;
        setUserData(data);
        localStorage.setItem("ratio_data", JSON.stringify(data));
        window.dispatchEvent(new Event("ratio_refresh_completed"));

        return data;
      } catch (err: any) {
        if (err.message === 'Backend error') {
          setIsBackendError(true);
        } else {
          await checkConnectivity(err);
        }
        throw err;
      }
    })();

    setLoginPromise(promise);
    return promise;
  }, [checkConnectivity]);

  const refreshData = useCallback(async (existingData: any) => {
    if (updateInProgress.current) return existingData;
    updateInProgress.current = true;
    setIsUpdating(true);
    setIsBackendError(false);
    setBackendErrorMsg(null);

    const reportError = (msg: string) => {
      setIsBackendError(true);
      setBackendErrorMsg(msg);
    };

    try {
      const [academiaCookies, academiaCreds, portalCookies, portalCreds] = (await Promise.all([
        EncryptionUtils.loadDecrypted("academia_cookies"),
        EncryptionUtils.loadDecrypted("ratio_credentials"),
        EncryptionUtils.loadDecrypted("portal_cookies"),
        EncryptionUtils.loadDecrypted("portal_credentials"),
      ])) as any[];

      const hasPortal = !!(portalCookies || portalCreds?.password);
      const hasAcademia = !!(academiaCookies || academiaCreds?.username);
      const needsAcademia = hasAcademia && (!hasPortal || !localStorage.getItem("ratio_timetable_synced"));
      if (!hasPortal && !needsAcademia) return existingData;

      let loggedOut = false;

      const refreshPortal = async () => {
        setIsCheckingPortal(true);
        try {
          const res = await fetchWithLoadBalancer("/portal/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cookies: portalCookies,
              username: portalCreds?.username,
              password: portalCreds?.password,
            }),
          }, 60000);
          const data = await res.json().catch(() => ({}));
          if (res.ok && data?.success && data.attendance?.length) {
            if (data.cookies) {
              await EncryptionUtils.saveEncrypted("portal_cookies", data.cookies);
              delete data.cookies;
            }
            return data;
          }
          if (res.status === 401 && portalCreds?.password) {
            setPortalAuthMode("captcha_only");
            setPortalAuthOpen(true);
          }
          reportError(typeof data?.detail === "string" ? data.detail : "student portal didn't sync");
          return null;
        } catch (err) {
          await checkConnectivity(err);
          reportError("student portal timed out");
          return null;
        } finally {
          setIsCheckingPortal(false);
        }
      };

      const refreshAcademia = async () => {
        const send = (withPassword: boolean) => fetchWithLoadBalancer("/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: academiaCreds?.username,
            cookies: academiaCookies,
            ...(withPassword ? { password: academiaCreds?.password } : {}),
          }),
        });
        try {
          let res = await send(false);
          let retried = false;
          if (res.status === 401 && academiaCreds?.password) {
            const err = await res.clone().json().catch(() => ({}));
            if (err?.detail?.type === "SESSION_EXPIRED") {
              res = await send(true);
              retried = true;
            }
          }
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data?.success) {
            const invalid = data?.detail === "Invalid Credentials" || data?.detail?.type === "INVALID_CREDENTIALS";
            if (res.status === 401 && !hasPortal && (retried || invalid)) {
              loggedOut = true;
              await logout();
              return null;
            }
            reportError(typeof data?.detail === "string" ? data.detail : hasPortal ? "timetable didn't sync" : "academia didn't sync");
            return null;
          }
          if (data.cookies) {
            await EncryptionUtils.saveEncrypted("academia_cookies", data.cookies);
            delete data.cookies;
          }
          return data;
        } catch (err) {
          await checkConnectivity(err);
          return null;
        }
      };

      const [portalData, academiaData] = await Promise.all([
        hasPortal ? refreshPortal() : null,
        needsAcademia ? refreshAcademia() : null,
      ]);

      if (loggedOut || (!portalData && !academiaData)) return existingData;

      const fresh: Record<string, any> = {};
      if (portalData) {
        fresh.attendance = portalData.attendance;
        fresh.isPortal = true;
        for (const key of ["monthly", "marks", "courses", "profile"]) {
          if (portalData[key]) fresh[key] = portalData[key];
        }
        if (portalData.schedule && !hasAcademia) fresh.schedule = portalData.schedule;
      }
      if (academiaData) {
        const { success, ...rest } = academiaData;
        if (!hasPortal) Object.assign(fresh, rest);
        else if (rest.schedule) {
          fresh.schedule = rest.schedule;
          localStorage.setItem("ratio_timetable_synced", "1");
        }
      }

      if (fresh.schedule) fresh.timetable = fresh.schedule;

      EncryptionUtils.setSessionCookie();

      const mergedData = { ...existingData, ...fresh };
      const hasOldData = (existingData?.attendance?.length > 0) || (existingData?.marks?.length > 0);
      const diff = hasOldData ? compareData(existingData, mergedData) : null;

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
      window.dispatchEvent(new Event("ratio_refresh_completed"));
      return mergedData;
    } finally {
      setIsUpdating(false);
      updateInProgress.current = false;
    }
  }, [logout, checkConnectivity]);

  useEffect(() => {
    const cachedData = localStorage.getItem("ratio_data");
    const cachedName = localStorage.getItem("ratiod_custom_name");
    const cachedSeed = localStorage.getItem("ratio_profile_seed");

    if (cachedName) setCustomDisplayName(cachedName);

    const onboarded = localStorage.getItem("ratiod_onboarded") === "true";
    if (onboarded) {
      document.cookie = "ratio_onboarded=true; path=/; max-age=31536000; SameSite=Lax";
    }

    let parsed: any = null;
    if (cachedData) {
      try {
        parsed = JSON.parse(cachedData);
        setUserData(parsed);

        runMigration().then(() => {
          if (!hasRefreshed.current) {
            hasRefreshed.current = true;
            refreshData(parsed);
          }
        });
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
    performPortalLogin,
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
    portalAuthOpen,
    setPortalAuthOpen,
    portalAuthMode,
    setPortalAuthMode,
    isCheckingPortal,
  }), [userData, customDisplayName, isUpdating, isOffline, isBackendError, backendErrorMsg, refreshData, performLogin, performPortalLogin, loginPromise, logout, latestDiff, updateHistory, isUpdateHistoryOpen, deferredPrompt, canInstall, showWelcome, profileSeed, calendarData, portalAuthOpen, portalAuthMode, isCheckingPortal]);

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
