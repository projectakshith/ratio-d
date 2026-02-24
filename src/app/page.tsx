"use client";
import React, { useState, useEffect } from "react";
import LoginPage from "@/components/shared/LoginPage";
import AcademiaApp from "@/components/AcademiaApp";
import { ThemeProvider } from "@/context/ThemeContext";

export default function Home() {
  const [view, setView] = useState("loading");
  const [userData, setUserData] = useState(null);
  const [customDisplayName, setCustomDisplayName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const performLogin = async (username, password) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();
    if (!result.success) throw new Error("Login failed");

    localStorage.setItem("ratiod_data", JSON.stringify(result));
    localStorage.setItem(
      "ratiod_creds",
      JSON.stringify({ username, password }),
    );

    return result;
  };

  const refreshData = async (creds) => {
    setIsUpdating(true);
    try {
      const newData = await performLogin(creds.username, creds.password);
      setUserData(newData);
    } catch (err) {
      console.error("Auto-refresh failed:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const cachedData = localStorage.getItem("ratiod_data");
      const cachedCreds = localStorage.getItem("ratiod_creds");
      const cachedName = localStorage.getItem("ratiod_custom_name");

      if (cachedName) setCustomDisplayName(cachedName);

      if (cachedData) {
        setUserData(JSON.parse(cachedData));
        setView("app");

        if (cachedCreds) {
          refreshData(JSON.parse(cachedCreds));
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
    localStorage.removeItem("ratiod_data");
    localStorage.removeItem("ratiod_creds");
    localStorage.removeItem("ratiod_custom_name");
    setUserData(null);
    setCustomDisplayName("");
    setView("login");
  };

  if (view === "loading")
    return <div className="h-screen w-full bg-[#050505]" />;

  return (
    <ThemeProvider>
      <main className="bg-[#050505] min-h-screen">
        {view === "login" ? (
          <LoginPage
            onLogin={(data, creds) => {
              setUserData(data);
              setView("app");
              localStorage.setItem("ratiod_data", JSON.stringify(data));
              if (creds)
                localStorage.setItem("ratiod_creds", JSON.stringify(creds));
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
    </ThemeProvider>
  );
}
