"use client";
import React, { useState, useCallback } from "react";
import { useApp } from "@/context/AppContext";

export const runtime = "edge";

import { useTheme } from "@/context/ThemeContext";
import DashboardMinimalist from "@/components/themes/minimalist/dashboard/Dashboard";
import DashboardBrutalist from "@/components/themes/brutalist/dashboard/Dashboard";
import { useAcademiaData } from "@/hooks/useAcademiaData";
import { useAppLayout } from "@/context/AppLayoutContext";
import { EncryptionUtils } from "@/utils/shared/Encryption";

export default function DashboardPage() {
  const { userData, customDisplayName, refreshData, isUpdating } = useApp();
  const { uiStyle } = useTheme();
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
        calendarData={academia.calendarData}
        upcomingAlerts={[]}
        overallAttendance={academia.overallAttendance}
        criticalAttendance={academia.criticalAttendance}
        overallMarks={(academia as any).overallMarks || 0}
        recentMarks={(academia as any).recentMarks || []}
        onRefresh={handleRefresh}
        isRefreshing={isUpdating}
      />
    );
  }

  return (
    <DashboardMinimalist 
      data={userData as any}
      academia={academia}
      onOpenSettings={onOpenSettings}
      isAlertsOpen={isAlertsOpen}
      setIsAlertsOpen={setIsAlertsOpen}
      startEntrance={true}
      onRefresh={handleRefresh}
      isRefreshing={isUpdating}
    />
  );
}
