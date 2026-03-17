"use client";
import React from "react";
import LoginPage from "@/components/shared/LoginPage";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";

export default function LoginRoute() {
  const { setUserData } = useApp();
  const router = useRouter();

  const handleLoginSuccess = (data: any) => {
    setUserData(data);
    localStorage.setItem("ratio_data", JSON.stringify(data));
    router.replace("/");
  };

  return (
    <div data-theme="gojo" className="w-full h-full bg-[#0c30ff]">
      <LoginPage onLogin={handleLoginSuccess} />
    </div>
  );
}
