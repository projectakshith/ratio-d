"use client";
import React from "react";
import OnboardingPage from "@/components/onboarding";
import { useRouter } from "next/navigation";

export default function OnboardingRoute() {
  const router = useRouter();

  const handleComplete = () => {
    router.replace("/");
  };

  return <OnboardingPage onComplete={handleComplete} />;
}
