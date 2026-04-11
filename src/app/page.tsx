"use client";
import React, { useState, useEffect } from "react";
import LandingPage from "@/components/landing/LandingPage";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRouter } from "next/navigation";

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const router = useRouter();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isMobile) {
      router.replace("/onboarding");
    }
  }, [mounted, isMobile, router]);

  if (!mounted || isMobile === undefined) return <div className="h-screen w-full bg-[#0c30ff]" />;

  if (isMobile) return <div className="h-screen w-full bg-[#0c30ff]" />;

  return <LandingPage />;
}
