import { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";

export function useDashboardAlerts(academia: any, isTargetAudience: boolean) {
  const { calendarData: contextCalendarData } = useApp();

  const exams = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return contextCalendarData
      .filter((ev: any) => {
        return ev.date >= now && ev.type === "exam" && isTargetAudience;
      })
      .sort(
        (a: any, b: any) =>
          a.date.getTime() - b.date.getTime(),
      )
      .slice(0, 2)
      .map((ev: any, i: number) => ({
        id: `exam-${i}`,
        title: "Assessment",
        desc: ev.description,
        type: "exam",
        date: ev.date.toLocaleDateString(),
      }));
  }, [contextCalendarData, isTargetAudience]);

  const upcomingBreaks = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return contextCalendarData
      .filter((ev: any) => {
        return (
          ev.date.getTime() > now.getTime() &&
          ev.description.toLowerCase().includes("holiday")
        );
      })
      .sort(
        (a: any, b: any) =>
          a.date.getTime() - b.date.getTime(),
      )
      .slice(0, 2)
      .map((ev: any, i: number) => ({
        id: `holiday-${i}`,
        title: "Upcoming Break",
        desc: ev.description,
        type: "holiday",
        date: ev.date.toLocaleDateString(),
      }));
  }, [contextCalendarData]);

  const allAlerts = useMemo(
    () => [...exams, ...upcomingBreaks],
    [exams, upcomingBreaks],
  );

  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);

  useEffect(() => {
    if (allAlerts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAlertIndex((prev) => (prev + 1) % allAlerts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [allAlerts]);

  return { exams, upcomingBreaks, allAlerts, currentAlertIndex };
}
