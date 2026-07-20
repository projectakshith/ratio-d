"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LandingPage from "@/components/landing/LandingPage";

export default function Page() {
  const router = useRouter();
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    const hasSession = document.cookie.includes("ratio_session=");
    const isOnboarded = localStorage.getItem("ratiod_onboarded") === "true";
    
    if (hasSession && isOnboarded) {
      router.replace("/dashboard");
    } else {
      const isMobile = window.innerWidth < 768 || /android|iphone|ipad|ipod/i.test(navigator.userAgent);
      if (isMobile) {
        router.replace("/onboarding");
      } else {
        setShowLanding(true);
      }
    }
  }, [router]);

  if (!showLanding) {
    return <div className="h-screen w-full bg-[#0c30ff]" />;
  }

  return <LandingPage />;
}
