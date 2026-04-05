"use client";
import React, { useState, useEffect } from "react";
import LandingPageContent from "@/components/landing/LandingPageContent";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-screen w-full bg-[#0c30ff]" />;

  return <LandingPageContent />;
}
