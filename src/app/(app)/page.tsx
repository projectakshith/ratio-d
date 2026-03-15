"use client";
import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import DashboardMinimalist from "@/components/themes/minimalist/dashboard/Dashboard";
import DashboardBrutalist from "@/components/themes/brutalist/Dashboard";
import { useAcademiaData } from "@/hooks/useAcademiaData";
import { useAppLayout } from "./layout";

export default function DashboardPage() {
  const { userData, customDisplayName } = useApp();
  const { uiStyle, isDark } = useTheme();
  const { onOpenSettings } = useAppLayout();
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const academia = useAcademiaData(userData as any);

  if (uiStyle === "brutalist") {
    return (
      <DashboardBrutalist 
        onProfileClick={onOpenSettings}
        profile={userData?.profile}
        attendance={userData?.attendance}
        displayName={customDisplayName || userData?.profile?.name}
        timeStatus={academia.timeStatus}
        upcomingAlerts={[]}
        overallAttendance={academia.overallAttendance}
        criticalAttendance={academia.criticalAttendance}
      />
    );
  }

  return (
    <DashboardMinimalist 
      data={userData as any}
      academia={academia}
      setActiveTab={() => {}}
      onOpenSettings={onOpenSettings}
      isAlertsOpen={isAlertsOpen}
      setIsAlertsOpen={setIsAlertsOpen}
      startEntrance={true}
      isDark={isDark}
    />
  );
}
