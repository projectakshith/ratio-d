"use client";
import React, { useEffect } from "react";
import OnboardingPage from "@/components/onboarding";
import { useRouter } from "next/navigation";

export default function OnboardingRoute() {
  const router = useRouter();

  useEffect(() => {
    const isOnboarded = localStorage.getItem("ratiod_onboarded") === "true";
    const hasData = localStorage.getItem("ratio_data");
    if (isOnboarded && hasData) {
      router.replace("/");
    }
  }, [router]);

  const handleComplete = () => {
    router.replace("/");
  };

  return <OnboardingPage onComplete={handleComplete} />;
}
