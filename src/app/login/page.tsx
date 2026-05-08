"use client";
import React, { useEffect } from "react";
import LoginPage from "@/components/shared/LoginPage";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { EncryptionUtils } from "@/utils/shared/Encryption";

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
      router.replace("/onboarding");
    } else {
      localStorage.setItem("ratiod_onboarded", "true");
      router.replace("/dashboard");
    }
  };

  return (
    <div data-theme="gojo" className="w-full h-full bg-[#0c30ff]">
      <LoginPage onLogin={handleLoginSuccess} />
    </div>
  );
}
