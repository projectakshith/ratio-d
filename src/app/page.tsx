"use client";
import React, { useState, useEffect } from 'react';
import LoginPage from '@/components/LoginPage';
import AcademiaApp from '@/components/AcademiaApp';

export default function Home() {
  const [view, setView] = useState('loading');
  const [userData, setUserData] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const cachedData = localStorage.getItem("ratiod_data");
      const cachedCreds = localStorage.getItem("ratiod_creds");

      if (cachedData) {
        setUserData(JSON.parse(cachedData));
        setView('app');
        
        if (cachedCreds) {
          refreshData(JSON.parse(cachedCreds));
        }
      } else {
        setView('login');
      }
    };

    checkSession();
  }, []);

  const performLogin = async (username, password) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();
    if (!result.success) throw new Error("Login failed");

    localStorage.setItem("ratiod_data", JSON.stringify(result));
    localStorage.setItem("ratiod_creds", JSON.stringify({ username, password }));
    
    return result;
  };

  const refreshData = async (creds) => {
    setIsUpdating(true);
    try {
      const newData = await performLogin(creds.username, creds.password);
      setUserData(newData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ratiod_data");
    localStorage.removeItem("ratiod_creds");
    setUserData(null);
    setView('login');
  };

  if (view === 'loading') return <div className="h-screen w-full bg-[#050505]" />;

  return (
    <main className="bg-[#050505] min-h-screen">
      {view === 'login' ? (
        <LoginPage 
            onLogin={(data, creds) => {
                setUserData(data);
                setView('app');
                localStorage.setItem("ratiod_data", JSON.stringify(data));
                if(creds) localStorage.setItem("ratiod_creds", JSON.stringify(creds));
            }} 
        />
      ) : (
        <AcademiaApp 
          data={userData} 
          onLogout={handleLogout}
        />
      )}
    </main>
  );
}