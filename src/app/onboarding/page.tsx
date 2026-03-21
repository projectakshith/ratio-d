"use client";
import React, { useEffect } from "react";
import OnboardingPage from "@/components/onboarding";
import { useRouter } from "next/navigation";

export default function OnboardingRoute() {
  const router = useRouter();

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;
    const isOnboarded = localStorage.getItem("ratiod_onboarded") === "true";
    const hasData = localStorage.getItem("ratio_data");
    const hasSession = document.cookie.includes("ratio_session=");

    if (isStandalone) {
      if (isOnboarded && hasData && hasSession) {
        router.replace("/");
      } else if (!hasData && !hasSession) {
        router.replace("/login");
      }
    }
  }, [router]);

  const handleComplete = () => {
    router.replace("/");
  };

  return <OnboardingPage onComplete={handleComplete} />;
}
