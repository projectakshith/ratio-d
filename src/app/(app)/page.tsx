"use client";
import React, { useState, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import DashboardMinimalist from "@/components/themes/minimalist/dashboard/Dashboard";
import DashboardBrutalist from "@/components/themes/brutalist/Dashboard";
import { useAcademiaData } from "@/hooks/useAcademiaData";
import { useAppLayout } from "@/context/AppLayoutContext";
import { EncryptionUtils } from "@/utils/shared/Encryption";

export default function DashboardPage() {
  const { userData, customDisplayName, refreshData, isUpdating } = useApp();
  const { uiStyle, isDark } = useTheme();
  const { onOpenSettings } = useAppLayout();
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const academia = useAcademiaData(userData as any);

  const handleRefresh = useCallback(async () => {
    const creds = EncryptionUtils.loadDecrypted("ratio_credentials");
    if (creds && userData) {
      await refreshData(creds, userData);
    }
  }, [userData, refreshData]);

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
        onRefresh={handleRefresh}
        isRefreshing={isUpdating}
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
      onRefresh={handleRefresh}
      isRefreshing={isUpdating}
    />
  );
}
