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
  const router = useRouter();

  const logout = useCallback(() => {
    EncryptionUtils.flushAllStorage();
    localStorage.removeItem("ratiod_custom_name");
    setUserData(null);
    setCustomDisplayName("");
    router.push("/onboarding");
  }, [router]);

  const refreshData = useCallback(async (creds: any, existingData: any) => {
    if (!creds || !existingData || isUpdating) return;
    setIsUpdating(true);
    try {
      const savedCookies = EncryptionUtils.loadDecrypted("academia_cookies");
      const isMissingData = 
        !existingData.courses || 
        Object.keys(existingData.courses).length === 0 ||
        !existingData.profile?.name ||
        !existingData.schedule || 
        Object.keys(existingData.schedule).length === 0;
      
      const endpoint = isMissingData ? "login" : "refresh";
      const response = await fetch(`/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: creds.username,
          password: creds.password,
          cookies: savedCookies,
        }),
      });

      if (response.status === 401) {
        logout();
        return;
      }

      const result = await response.json();
      if (!result.success) return;

      let updatedCookies = savedCookies;
      if (result.cookies) {
        EncryptionUtils.saveEncrypted("academia_cookies", result.cookies);
        updatedCookies = result.cookies;
        delete result.cookies;
      }

      let updatedData = endpoint === "login" ? { ...result, cookies: updatedCookies } : {
        ...existingData,
        attendance: result.attendance,
        marks: result.marks,
        cookies: updatedCookies,
      };

      const diff = compareData(existingData, updatedData);
      if (diff) {
        setLatestDiff(diff);
      }

      setUserData(updatedData);
      localStorage.setItem("ratio_data", JSON.stringify(updatedData));
      return updatedData;
    } catch (err) {
      return existingData;
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, logout]);

  useEffect(() => {
    const cachedData = localStorage.getItem("ratio_data");
    const cachedName = localStorage.getItem("ratiod_custom_name");
    if (cachedName) setCustomDisplayName(cachedName);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        setUserData(parsed);
        
        // Auto-refresh on load
        const creds = EncryptionUtils.loadDecrypted("ratio_credentials");
        if (creds) {
          refreshData(creds, parsed);
        }
      } catch (e) {}
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    if (typeof navigator !== 'undefined' && !navigator.onLine) setIsOffline(true);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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
