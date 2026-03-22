"use client";
import React, { useState, useEffect } from "react";
import OnboardingPage from "@/components/onboarding";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function OnboardingRoute() {
  const router = useRouter();
  const { userData, loginPromise } = useApp();
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone;
      const isOnboarded = localStorage.getItem("ratiod_onboarded") === "true";
      const hasData = localStorage.getItem("ratio_data") || userData;
      const hasSession = document.cookie.includes("ratio_session=");

      if (isStandalone && isOnboarded && hasData && (hasSession || userData)) {
        router.replace("/");
      }
    };

    checkStatus();
  }, [router, userData]);

  const handleComplete = () => {
    setIsFinished(true);
    router.replace("/");
  };

  if (isFinished) return null;

  return <OnboardingPage onComplete={handleComplete} />;
}
