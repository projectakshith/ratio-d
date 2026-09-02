"use client";
import React, { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";

const DashboardMinimalist = dynamic(
  () => import("@/components/themes/minimalist/dashboard/Dashboard"),
  { loading: () => <div className="h-full w-full bg-theme-bg" /> }
);
const DashboardBrutalist = dynamic(
  () => import("@/components/themes/brutalist/dashboard/Dashboard"),
  { loading: () => <div className="h-full w-full bg-theme-bg" /> }
);
const DesktopDashboard = dynamic(
  () => import("@/components/desktop/dashboard/Dashboard"),
  { loading: () => <div className="h-full w-full bg-theme-bg" /> }
);

import { useAcademiaData } from "@/hooks/useAcademiaData";
import { useAppLayout } from "@/context/AppLayoutContext";
import { EncryptionUtils } from "@/utils/shared/Encryption";
import { useIsMobile } from "@/hooks/use-mobile";

export default function DashboardPage() {
  const { userData, customDisplayName, refreshData, isUpdating } = useApp();
  const { uiStyle } = useTheme();
  const { onOpenSettings } = useAppLayout();
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const academia = useAcademiaData(userData as any);
  const isMobile = useIsMobile();

  const handleRefresh = useCallback(async () => {
    const creds = await EncryptionUtils.loadDecrypted("ratio_credentials");
    if (creds && userData) {
      await refreshData(creds as any, userData);
    }
  }, [userData, refreshData]);

  if (isMobile === undefined) {
    return <div className="h-full w-full bg-theme-bg" />;
  }

  if (!isMobile) {
    return <DesktopDashboard />;
  }

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
        data={userData}
        academia={academia}
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
