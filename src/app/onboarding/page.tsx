"use client";
import React, { useEffect } from "react";
import OnboardingPage from "@/components/onboarding";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function OnboardingRoute() {
  const router = useRouter();
  const { userData, loginPromise } = useApp();

  useEffect(() => {
    const isOnboarded = localStorage.getItem("ratiod_onboarded") === "true";
    const hasData = localStorage.getItem("ratio_data") || userData;
    const hasSession = document.cookie.includes("ratio_session=");

    if (isOnboarded && !hasSession && !userData) {
      router.replace("/login");
    } else if (isOnboarded && hasData && (hasSession || userData)) {
      router.replace("/dashboard");
    }

  }, [router, userData]);

  const handleComplete = () => {
    localStorage.setItem("ratiod_onboarded", "true");
    document.cookie = "ratio_onboarded=true; path=/; max-age=31536000; SameSite=Lax";
    const hasSession = document.cookie.includes("ratio_session=");
    router.replace(hasSession ? "/dashboard" : "/login");
  };

  return <OnboardingPage onComplete={handleComplete} />;
}
