"use client";
import React, { useEffect } from "react";
import LoginPage from "@/components/shared/LoginPage";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { EncryptionUtils } from "@/utils/shared/Encryption";
import { motion } from "framer-motion";

export default function LoginRoute() {
  const { setUserData } = useApp();
  const router = useRouter();

  useEffect(() => {
    const hasSession = document.cookie.includes("ratio_session=");
    if (hasSession) {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        const isOnboarded = localStorage.getItem("ratiod_onboarded") === "true";
        router.replace(isOnboarded ? "/dashboard" : "/onboarding");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [router]);

  const handleLoginSuccess = (data: any) => {
    setUserData(data);
    localStorage.setItem("ratio_data", JSON.stringify(data));
    EncryptionUtils.setSessionCookie();

    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      const isOnboarded = localStorage.getItem("ratiod_onboarded") === "true";
      router.replace(isOnboarded ? "/dashboard" : "/onboarding");
    } else {
      localStorage.setItem("ratiod_onboarded", "true");
      router.replace("/dashboard");
    }
  };

  return (
    <div data-theme="gojo" className="w-full h-screen bg-[#0c30ff] relative overflow-hidden">
      <motion.div
        initial={{ left: "0%" }}
        animate={{ left: "-100%" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 w-full h-screen bg-[#ceff1c] z-[60] pointer-events-none"
      />
      <LoginPage onLogin={handleLoginSuccess} />
    </div>
  );
}
