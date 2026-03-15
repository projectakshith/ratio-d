"use client";
import React from "react";
import LoginPage from "@/components/shared/LoginPage";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";

export default function LoginRoute() {
  const { setUserData } = useApp();
  const router = useRouter();

  const handleLoginSuccess = (data: any) => {
    localStorage.setItem("ratiod_onboarded", "true");
    setUserData(data);
    localStorage.setItem("ratio_data", JSON.stringify(data));
    router.replace("/");
  };

  return (
    <div data-theme="default" className="w-full h-full bg-[#F7F7F7]">
      <LoginPage onLogin={handleLoginSuccess} />
    </div>
  );
}
