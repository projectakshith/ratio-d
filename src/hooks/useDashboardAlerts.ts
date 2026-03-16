import { useState, useEffect, useMemo } from "react";
import calendarDataJson from "@/data/calendar_data.json";

export function useDashboardAlerts(academia: any, isTargetAudience: boolean) {
  const exams = useMemo(() => {
    const calData = academia?.calendarData || calendarDataJson || [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return calData
      .filter((ev: any) => {
        const d = new Date(ev.date);
        d.setHours(0, 0, 0, 0);
        return d >= now && ev.type === "exam" && isTargetAudience;
      })
      .sort(
        (a: any, b: any) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      )
      .slice(0, 2)
      .map((ev: any, i: number) => ({
        id: `exam-${i}`,
        title: "Assessment",
        desc: ev.description,
        type: "exam",
        date: ev.date,
      }));
  }, [academia?.calendarData, isTargetAudience]);

  const upcomingBreaks = useMemo(() => {
    const calData = academia?.calendarData || calendarDataJson || [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return calData
      .filter((ev: any) => {
        const d = new Date(ev.date);
        d.setHours(0, 0, 0, 0);
        return (
          d.getTime() > now.getTime() &&
          ev.description.toLowerCase().includes("holiday")
        );
      })
      .sort(
        (a: any, b: any) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      )
      .slice(0, 2)
      .map((ev: any, i: number) => ({
        id: `holiday-${i}`,
        title: "Upcoming Break",
        desc: ev.description,
        type: "holiday",
        date: ev.date,
      }));
  }, [academia?.calendarData]);

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
