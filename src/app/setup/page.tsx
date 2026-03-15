"use client";
import React from "react";
import InstallInstructions from "@/components/InstallInstructions";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();

  const handleDevBypass = () => {
    localStorage.setItem("ratiod_setup_bypassed", "true");
    const hasData = localStorage.getItem("ratio_data");
    router.replace(hasData ? "/" : "/login");
  };

  return <InstallInstructions onDevBypass={handleDevBypass} />;
}
