"use client";
import React, { useEffect } from "react";
import OnboardingPage from "@/components/onboarding";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function OnboardingRoute() {
  const router = useRouter();
  const { userData, loginPromise } = useApp();

  useEffect(() => {
    const checkStatus = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone;
      const isOnboarded = localStorage.getItem("ratiod_onboarded") === "true";
      const hasData = localStorage.getItem("ratio_data") || userData;
      const hasSession = document.cookie.includes("ratio_session=");

      if (isStandalone) {
        if (isOnboarded && hasData && (hasSession || userData)) {
          router.replace("/");
        } else if (!hasData && !hasSession && !loginPromise) {
          router.replace("/login");
        }
      }
    };

    checkStatus();
  }, [router, userData, loginPromise]);

  const handleComplete = () => {
    localStorage.setItem("ratiod_onboarded", "true");
    localStorage.setItem("ratiod_show_welcome", "true");
    window.location.href = "/";
  };

  return <OnboardingPage onComplete={handleComplete} />;
}
