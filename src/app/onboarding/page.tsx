"use client";
import React from "react";
import OnboardingPage from "@/components/OnboardingPage";
import { useRouter } from "next/navigation";

export default function OnboardingRoute() {
  const router = useRouter();

  const handleComplete = () => {
    localStorage.setItem("ratiod_onboarded", "true");
    router.replace("/setup");
  };

  return <OnboardingPage onComplete={handleComplete} />;
}
