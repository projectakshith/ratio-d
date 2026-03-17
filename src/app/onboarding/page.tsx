"use client";
import React from "react";
import OnboardingPage from "@/components/OnboardingPage";
import { useRouter } from "next/navigation";

export default function OnboardingRoute() {
  const router = useRouter();

  const handleComplete = () => {
    router.replace("/login");
  };

  return <OnboardingPage onComplete={handleComplete} />;
}
