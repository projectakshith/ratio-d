"use client";
import React, { useState, useEffect } from "react";
import LoginPage from "@/components/shared/LoginPage";
import AcademiaApp from "@/components/AcademiaApp";
import { EncryptionUtils } from "@/utils/Encryption";

export default function Home() {
  const [view, setView] = useState("loading");
  const [userData, setUserData] = useState(null);
  const [customDisplayName, setCustomDisplayName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const performLogin = async (username, password) => {
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

  const refreshData = async (creds, existingData) => {
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
    } catch (err) {
      console.error("Auto-refresh failed:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      EncryptionUtils.cleanOldKeys();

      const cachedData = localStorage.getItem("ratio_data");
      const cachedCreds = EncryptionUtils.loadDecrypted("ratio_credentials");
      const cachedName = localStorage.getItem("ratiod_custom_name");

      if (cachedName) setCustomDisplayName(cachedName);

      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        setUserData(parsedData);
        setView("app");

        if (cachedCreds) {
          refreshData(cachedCreds, parsedData);
        }
      } else {
        setView("login");
      }
    };

    checkSession();
  }, []);

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

  if (view === "loading")
    return <div className="h-screen w-full bg-[#050505]" />;

  return (
    <main className="bg-[#050505] min-h-screen">
      {view === "login" ? (
        <LoginPage
          onLogin={(data) => {
            setUserData(data);
            setView("app");
          }}
        />
      ) : (
        <AcademiaApp
          data={userData}
          onLogout={handleLogout}
          customDisplayName={customDisplayName}
          onUpdateName={handleUpdateName}
        />
      )}
    </main>
  );
}
