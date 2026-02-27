"use client";
import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export default function MinimalHomepage({
  data,
  schedule,
  dayOrder,
  userName = "akshith",
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const overallAttendance = useMemo(() => {
    const rawAttendance = Array.isArray(data?.attendance)
      ? data.attendance
      : [];
    if (rawAttendance.length === 0) return 0;

    let totalConducted = 0;
    let totalPresent = 0;
    rawAttendance.forEach((s: any) => {
      totalConducted += parseInt(s.conducted || "0");
      totalPresent += parseInt(s.conducted || "0") - parseInt(s.absent || "0");
    });
    return totalConducted === 0 ? 0 : (totalPresent / totalConducted) * 100;
  }, [data]);

  const classStatus = useMemo(() => {
    if (!schedule || !dayOrder || dayOrder === "-")
      return { current: null, next: null };

    const dayKey = `Day ${dayOrder}`;
    const dayData = schedule[dayKey];
    if (!dayData) return { current: null, next: null };

    const rawItems = Object.values(dayData)
      .map((details: any) => {
        if (!details || !details.time) return null;
        const [startStr, endStr] = details.time.split(" - ");
        const parseTime = (str: string) => {
          if (!str) return 0;
          let [h, m] = str.split(":").map(Number);
          if (h < 8) h += 12;
          return h * 60 + m;
        };
        return {
          ...details,
          start: startStr,
          end: endStr,
          minutesStart: parseTime(startStr),
          minutesEnd: parseTime(endStr),
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.minutesStart - b.minutesStart);

    const mergedItems: any[] = [];
    rawItems.forEach((item: any) => {
      const lastItem = mergedItems[mergedItems.length - 1];
      if (
        lastItem &&
        lastItem.course === item.course &&
        lastItem.room === item.room &&
        lastItem.minutesEnd === item.minutesStart
      ) {
        lastItem.end = item.end;
        lastItem.minutesEnd = item.minutesEnd;
      } else {
        mergedItems.push({ ...item });
      }
    });

    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

    let current = null;
    let next = null;

    for (let i = 0; i < mergedItems.length; i++) {
      const item = mergedItems[i];
      if (nowMinutes >= item.minutesStart && nowMinutes < item.minutesEnd) {
        current = item;
      } else if (nowMinutes < item.minutesStart && !next) {
        next = item;
      }
    }

    return { current, next };
  }, [schedule, dayOrder, currentTime]);

  const gridStyles = [
    "border-[1.5px] border-black bg-white",
    "border-[1.5px] border-black bg-white",
    "border-[1.5px] border-dashed border-black/40 bg-transparent",
    "border-[1.5px] border-dashed border-black/40 bg-transparent",
    "border-[1.5px] border-dashed border-black/40 bg-transparent",
    "border-[1.5px] border-black bg-white",
    "border-[1.5px] border-black bg-white",
    "border-[1.5px] border-black bg-white",
    "border-[1.5px] border-black bg-white",
    "bg-black/10 border-transparent",
  ];

  return (
    <div className="h-full w-full flex flex-col bg-[#fcfcfc] text-[#050505] overflow-y-auto custom-scrollbar pb-32">
      <div className="flex justify-between items-start pt-14 px-8 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#050505] flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
          <span
            className="text-white text-xl font-bold uppercase"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {userName.charAt(0)}
          </span>
        </div>
        <div className="flex flex-col items-end text-right">
          <span
            className="text-sm lowercase font-medium tracking-wide opacity-60"
            style={{ fontFamily: "Afacad, sans-serif" }}
          >
            sup!
          </span>
          <span
            className="text-2xl font-bold lowercase tracking-tight leading-none"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {userName}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 px-8 mb-10">
        {gridStyles.map((style, i) => (
          <div
            key={i}
            className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-1 ${style}`}
          >
            {i === 0 && (
              <>
                <span
                  className="text-[10px] font-bold lowercase opacity-60"
                  style={{ fontFamily: "Afacad, sans-serif" }}
                >
                  att
                </span>
                <span
                  className="text-xs font-black tracking-tighter"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  {overallAttendance.toFixed(1)}%
                </span>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-end px-8 mb-4">
        <span
          className="text-[7.5rem] leading-[0.75] font-medium tracking-tighter"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          {dayOrder !== "-" ? String(dayOrder).padStart(2, "0") : "--"}
        </span>
        <span
          className="text-sm font-semibold lowercase tracking-wider opacity-60 mb-2"
          style={{ fontFamily: "Afacad, sans-serif" }}
        >
          day order
        </span>
      </div>

      <div className="px-6 mb-12">
        <h1
          className="text-[4.5rem] leading-none font-medium tracking-widest lowercase w-full flex justify-between"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          {Array.from("ratio'd.").map((char, index) => (
            <span key={index}>{char}</span>
          ))}
        </h1>
      </div>

      <div className="flex flex-col gap-4 px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full border-[1.5px] border-[#050505] rounded-[2rem] p-4 flex items-center gap-4 bg-white"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#050505]/5 flex items-center justify-center shrink-0 border border-black/5">
            <div className="w-4 h-4 rounded-full bg-[#050505] animate-pulse" />
          </div>
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <span
              className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1"
              style={{ fontFamily: "Afacad, sans-serif" }}
            >
              Current Class
            </span>
            <span
              className="text-base font-bold lowercase leading-tight truncate"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {classStatus.current ? classStatus.current.course : "Free period"}
            </span>
            {classStatus.current && (
              <span
                className="text-xs font-medium lowercase opacity-60 mt-0.5"
                style={{ fontFamily: "Afacad, sans-serif" }}
              >
                {classStatus.current.start} - {classStatus.current.room}
              </span>
            )}
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-black/5 transition-colors shrink-0">
            <Plus size={20} strokeWidth={1.5} />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="w-full border-[1.5px] border-[#050505] rounded-[2rem] p-4 flex items-center gap-4 bg-white"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#050505]/5 flex items-center justify-center shrink-0 border border-black/5">
            <div className="w-4 h-4 rounded-full border-[1.5px] border-[#050505]" />
          </div>
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <span
              className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1"
              style={{ fontFamily: "Afacad, sans-serif" }}
            >
              Next Up
            </span>
            <span
              className="text-base font-bold lowercase leading-tight truncate"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {classStatus.next ? classStatus.next.course : "Nothing scheduled"}
            </span>
            {classStatus.next && (
              <span
                className="text-xs font-medium lowercase opacity-60 mt-0.5"
                style={{ fontFamily: "Afacad, sans-serif" }}
              >
                {classStatus.next.start} - {classStatus.next.room}
              </span>
            )}
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-black/5 transition-colors shrink-0">
            <Plus size={20} strokeWidth={1.5} />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="w-full border-[1.5px] border-[#050505] rounded-[2rem] p-4 flex items-center gap-4 bg-white"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#050505]/5 flex items-center justify-center shrink-0 border border-black/5" />
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <span
              className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1"
              style={{ fontFamily: "Afacad, sans-serif" }}
            >
              System Alert
            </span>
            <span
              className="text-base font-bold lowercase leading-tight truncate"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {overallAttendance < 75
                ? "attendance is cooked."
                : "you're doing great."}
            </span>
            <span
              className="text-xs font-medium lowercase opacity-60 mt-0.5"
              style={{ fontFamily: "Afacad, sans-serif" }}
            >
              {overallAttendance < 75
                ? "academic comeback needed"
                : "maintain the streak"}
            </span>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-black/5 transition-colors shrink-0">
            <Plus size={20} strokeWidth={1.5} />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
