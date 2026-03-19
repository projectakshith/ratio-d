"use client";
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { EncryptionUtils } from "@/utils/shared/Encryption";
import { useRouter } from "next/navigation";
import { AcademiaData } from "@/types";
import { compareData, DataDiff } from "@/utils/shared/diffUtils";

interface AppContextType {
  userData: AcademiaData | null;
  setUserData: (data: AcademiaData | null) => void;
  customDisplayName: string;
  setCustomDisplayName: (name: string) => void;
  isUpdating: boolean;
  setIsUpdating: (val: boolean) => void;
  isOffline: boolean;
  refreshData: (creds: any, existingData: any) => Promise<any>;
  logout: () => void;
  latestDiff: DataDiff | null;
  setLatestDiff: (diff: DataDiff | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState<any>(null);
  const [customDisplayName, setCustomDisplayName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [latestDiff, setLatestDiff] = useState<DataDiff | null>(null);
  const updateInProgress = React.useRef(false);
  const router = useRouter();

  const logout = useCallback(() => {
    EncryptionUtils.flushAllStorage();
    localStorage.removeItem("ratiod_custom_name");
    setUserData(null);
    router.replace("/login");
  }, [router]);

  const refreshData = useCallback(async (creds: any, existingData: any) => {
    if (updateInProgress.current) return existingData;
    updateInProgress.current = true;
    setIsUpdating(true);
    try {
      const savedCookies = EncryptionUtils.loadDecrypted("academia_cookies");
      const response = await fetch("/api/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...creds, cookies: savedCookies }),
      });

      const endpoint = (existingData?.attendance && existingData?.marks) ? "refresh" : "login";
      
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
    if (cachedName) setCustomDisplayName(cachedName);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        setUserData(parsed);
        
        const creds = EncryptionUtils.loadDecrypted("ratio_credentials");
        if (creds) {
          refreshData(creds, parsed);
        }
      } catch {
      }
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refreshData]);

  const value = useMemo(() => ({
    userData,
    setUserData,
    customDisplayName,
    setCustomDisplayName,
    isUpdating,
    setIsUpdating,
    isOffline,
    refreshData,
    logout,
    latestDiff,
    setLatestDiff,
  }), [userData, customDisplayName, isUpdating, isOffline, refreshData, logout, latestDiff]);

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
