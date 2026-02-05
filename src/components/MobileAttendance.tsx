import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import {
  AlertCircle,
  Zap,
  Calendar as CalendarIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import { flavorText } from "../utils/flavortext";

const Counter = ({ value, color }) => {
  const nodeRef = useRef(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    const controls = animate(prevValue.current, value, {
      duration: 0.8,
      ease: [0.34, 1.56, 0.64, 1],
      onUpdate: (v) => {
        node.textContent = Math.floor(v) + "%";
      },
    });
    prevValue.current = value;
    return () => controls.stop();
  }, [value]);

  return <span ref={nodeRef} className={color} />;
};

const MarginCounter = ({ value, color }) => {
  const nodeRef = useRef(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    const controls = animate(prevValue.current, value, {
      duration: 0.8,
      ease: [0.34, 1.56, 0.64, 1],
      onUpdate: (v) => {
        node.textContent = Math.floor(v).toString();
      },
    });
    prevValue.current = value;
    return () => controls.stop();
  }, [value]);

  return <span ref={nodeRef} className={color} />;
};

const MobileAttendance = ({ data, schedule }) => {
  const [calendarData, setCalendarData] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [predictMode, setPredictMode] = useState(false);
  const [introMode, setIntroMode] = useState(true);

  const [selectedDates, setSelectedDates] = useState([]);
  const [predType, setPredType] = useState("leave");
  const [calMonth, setCalMonth] = useState(new Date(2026, 0, 1));
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [rangeStart, setRangeStart] = useState(null);

  const itemRefs = useRef([]);
  const listContainerRef = useRef(null);
  const scrollTimeout = useRef(null);

  useEffect(() => {
    fetch("/calendar_data.json")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCalendarData(data);
      })
      .catch((err) => console.error(err));
  }, []);

  const effectiveSchedule = useMemo(() => {
    if (schedule) return schedule;
    if (data?.timetable) return data.timetable;
    if (data?.schedule) return data.schedule;
    if (data?.time_table) return data.time_table;
    return {};
  }, [data, schedule]);

  const rawAttendance = Array.isArray(data?.attendance) ? data.attendance : [];

  const baseAttendance = useMemo(() => {
    return rawAttendance
      .map((subject, index) => {
        const pct = parseFloat(subject?.percent || "0");
        let category = pct < 75 ? "cooked" : pct >= 85 ? "safe" : "danger";
        const list = flavorText.header?.[category] ||
          flavorText.header?.danger || ["..."];
        const stableBadge = list[Math.floor(index % list.length)].toLowerCase();

        const safeTitle =
          subject.title || subject.courseTitle || "Unknown Subject";

        return {
          id: index,
          title: safeTitle,
          rawTitle: safeTitle,
          code: String(subject?.code || ""),
          percentage: String(subject?.percent || "0"),
          conducted: parseInt(subject?.conducted || "4"),
          present:
            parseInt(subject?.conducted || "0") -
            parseInt(subject?.absent || "0"),
          badge: category,
          tagline: stableBadge,
        };
      })
      .sort((a, b) => parseFloat(a.percentage) - parseFloat(b.percentage));
  }, [rawAttendance]);

  const overallStats = useMemo(() => {
    if (baseAttendance.length === 0)
      return { pct: 0, badge: "safe", tagline: "all good", color: "#ceff1c" };

    let totalConducted = 0;
    let totalPresent = 0;

    baseAttendance.forEach((s) => {
      totalConducted += s.conducted;
      totalPresent += s.present;
    });

    const overallPct =
      totalConducted === 0 ? 0 : (totalPresent / totalConducted) * 100;

    let category =
      overallPct < 75 ? "cooked" : overallPct >= 85 ? "safe" : "danger";
    const list = flavorText.header?.[category] || ["..."];
    const badge = list[0].toLowerCase();

    let tagline = "you're doing great";
    if (category === "cooked") tagline = "academic comeback needed";
    if (category === "danger") tagline = "treading on thin ice";

    const color = category === "safe" ? "#ceff1c" : "#ff003c";

    return { pct: overallPct, badge, tagline, color };
  }, [baseAttendance]);

  useEffect(() => {
    if (baseAttendance.length > 0 && selectedId === null) {
      setSelectedId(baseAttendance[0].id);
    }
  }, [baseAttendance]);

  useEffect(() => {
    const timer = setTimeout(() => setIntroMode(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!predictMode) {
      setSelectedDates([]);
      setPredType("leave");
      setRangeStart(null);
      setIsRangeMode(false);
    }
  }, [predictMode]);

  const getImpactMap = () => {
    const impact = {};
    if (calendarData.length === 0) return impact;
    if (Object.keys(effectiveSchedule).length === 0) return impact;

    selectedDates.forEach((dateStr) => {
      const dayInfo = calendarData.find((c) => c.date === dateStr);
      if (
        dayInfo &&
        dayInfo.order &&
        dayInfo.order !== "-" &&
        !isNaN(parseInt(dayInfo.order))
      ) {
        const dayOrderKey = `Day ${dayInfo.order}`;
        const dayClasses = effectiveSchedule[dayOrderKey];

        if (dayClasses) {
          Object.values(dayClasses).forEach((cls) => {
            if (!cls.course) return;
            const matchedSubject = baseAttendance.find((s) => {
              const sCode = (s.code || "")
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "");
              const cCode = (cls.code || "")
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "");
              const sName = s.rawTitle.toLowerCase().replace(/[^a-z0-9]/g, "");
              const cName = cls.course.toLowerCase().replace(/[^a-z0-9]/g, "");
              return (
                (sCode && cCode && sCode === cCode) ||
                sName.includes(cName) ||
                cName.includes(sName)
              );
            });
            if (matchedSubject) {
              impact[matchedSubject.code] =
                (impact[matchedSubject.code] || 0) + 1;
            }
          });
        }
      }
    });
    return impact;
  };

  const predictionImpact = useMemo(
    () => getImpactMap(),
    [selectedDates, calendarData, effectiveSchedule, baseAttendance],
  );

  const getStatus = (pct, conducted, present) => {
    if (pct >= 75) {
      const margin = Math.floor(present / 0.75 - conducted);
      return {
        val: Math.max(0, margin),
        label: "margin",
        safe: true,
        textColor: "text-[#050505]",
        lineColor: "bg-[#050505]",
      };
    }
    const needed = Math.ceil((0.75 * conducted - present) / 0.25);
    return {
      val: Math.max(0, needed),
      label: "recover",
      safe: false,
      textColor: "text-[#050505]",
      lineColor: "bg-white",
    };
  };

  const processedList = useMemo(() => {
    const list = baseAttendance.map((subject) => {
      const sessions = predictionImpact[subject.code] || 0;
      const currentPresent = subject.present;
      const currentConducted = subject.conducted;

      const newPresent =
        predType === "attend" ? currentPresent + sessions : currentPresent;
      const newConducted = currentConducted + sessions;
      const newPct = newConducted === 0 ? 0 : (newPresent / newConducted) * 100;

      const currentStatus = getStatus(
        parseFloat(subject.percentage),
        currentConducted,
        currentPresent,
      );
      const newStatus = getStatus(newPct, newConducted, newPresent);

      return {
        ...subject,
        pred: {
          pct: newPct,
          status: newStatus,
          currentStatus: currentStatus,
          diffVal: newStatus.val - currentStatus.val,
          sessionsAffected: sessions > 0,
        },
      };
    });

    if (predictMode) {
      return list.sort((a, b) => {
        const scoreA = !a.pred.status.safe
          ? a.pred.status.val + 1000
          : -a.pred.status.val;
        const scoreB = !b.pred.status.safe
          ? b.pred.status.val + 1000
          : -b.pred.status.val;
        return scoreB - scoreA;
      });
    }

    return list.sort(
      (a, b) => parseFloat(a.percentage) - parseFloat(b.percentage),
    );
  }, [baseAttendance, predictionImpact, predType, predictMode]);

  useEffect(() => {
    if (predictMode && listContainerRef.current) {
      listContainerRef.current.scrollTop = 0;
      if (processedList.length > 0) {
        setSelectedId(processedList[0].id);
      }
    }
  }, [predictionImpact, predictMode]);

  const formatDateKey = (date) => {
    const dayStr = String(date.getDate()).padStart(2, "0");
    const monthStr = date.toLocaleString("en-US", { month: "short" });
    const yearStr = date.getFullYear();
    return `${dayStr} ${monthStr} ${yearStr}`;
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(
      calMonth.getFullYear(),
      calMonth.getMonth(),
      day,
    );
    const dateKey = formatDateKey(clickedDate);

    if (isRangeMode) {
      if (!rangeStart) {
        setRangeStart(clickedDate);
        if (!selectedDates.includes(dateKey))
          setSelectedDates([...selectedDates, dateKey]);
      } else {
        const start = rangeStart < clickedDate ? rangeStart : clickedDate;
        const end = rangeStart < clickedDate ? clickedDate : rangeStart;
        const newDates = [...selectedDates];

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const key = formatDateKey(d);
          if (!newDates.includes(key)) newDates.push(key);
        }
        setSelectedDates(newDates);
        setRangeStart(null);
        setIsRangeMode(false);
      }
    } else {
      if (selectedDates.includes(dateKey)) {
        setSelectedDates(selectedDates.filter((d) => d !== dateKey));
      } else {
        setSelectedDates([...selectedDates, dateKey]);
      }
    }
  };

  const changeMonth = (delta) => {
    setCalMonth(
      new Date(calMonth.getFullYear(), calMonth.getMonth() + delta, 1),
    );
  };

  const activeSubject =
    baseAttendance.find((s) => s.id === selectedId) || baseAttendance[0];
  const currentActiveStat = getStatus(
    parseFloat(activeSubject.percentage),
    activeSubject.conducted,
    activeSubject.present,
  );
  const bgColor = predictMode ? "#f0f0f0" : overallStats.color;

  const handleScroll = () => {
    if (predictMode || introMode || !listContainerRef.current) return;
    if (scrollTimeout.current) return;

    scrollTimeout.current = setTimeout(() => {
      const container = listContainerRef.current;
      if (!container) return;
      const triggerLine =
        container.getBoundingClientRect().top + container.offsetHeight * 0.3;
      let closestId = null;
      let minDistance = Infinity;

      itemRefs.current.forEach((el, index) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top - triggerLine);
        if (dist < minDistance) {
          minDistance = dist;
          closestId = processedList[index].id;
        }
      });

      if (closestId !== null && closestId !== selectedId) {
        setSelectedId(closestId);
        if (navigator.vibrate) navigator.vibrate(2);
      }
      scrollTimeout.current = null;
    }, 100);
  };

  const stopProp = (e) => e.stopPropagation();

  return (
    <div className="h-full w-full flex flex-col bg-[#f5f6fc] text-[#050505] font-sans relative overflow-hidden touch-pan-y">
      <div
        className="w-full relative z-30 shadow-xl overflow-hidden flex flex-col shrink-0"
        style={{
          backgroundColor: bgColor,
          height: introMode ? "100%" : predictMode ? "45%" : "50%",
          transition:
            "height 0.6s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.4s ease",
          willChange: "height",
        }}
      >
        <div className="absolute inset-0 pointer-events-none mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat opacity-20" />

        <AnimatePresence mode="wait">
          {introMode ? (
            <motion.div
              key="intro"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1 },
                exit: { opacity: 0, y: -40, transition: { duration: 0.25 } },
              }}
              className="absolute inset-0 flex flex-col justify-end items-start p-8 pb-32"
            >
              <h1
                className="text-6xl font-black lowercase tracking-tighter text-[#050505] mb-2"
                style={{ fontFamily: "Aonic" }}
              >
                {overallStats.badge}
              </h1>
              <p
                className="text-xl font-bold lowercase text-[#050505] leading-tight max-w-[80%]"
                style={{ fontFamily: "Aonic" }}
              >
                {overallStats.tagline}
              </p>
            </motion.div>
          ) : !predictMode ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full justify-between p-6 md:p-8 relative z-20"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 px-3 py-1 bg-black/5 rounded-full border border-black/5 backdrop-blur-sm">
                  {currentActiveStat.safe ? (
                    <Zap size={12} fill="black" />
                  ) : (
                    <AlertCircle size={12} fill="black" stroke="black" />
                  )}
                  <span className="font-mono text-[10px] lowercase tracking-widest font-bold text-black/60">
                    {activeSubject.badge}
                  </span>
                </div>
                <button
                  onClick={() => setPredictMode(true)}
                  className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full active:scale-95 transition-transform shadow-lg"
                >
                  <CalendarIcon size={12} />
                  <span className="font-mono text-[10px] lowercase tracking-widest font-bold">
                    predict
                  </span>
                </button>
              </div>

              <div className="my-auto flex flex-col justify-center">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-[22vw] md:text-[9rem] leading-none font-black tracking-tighter ${currentActiveStat.textColor}`}
                    style={{ fontFamily: "Urbanosta" }}
                  >
                    <MarginCounter
                      value={currentActiveStat.val}
                      color={currentActiveStat.textColor}
                    />
                    h
                  </span>
                  <span
                    className={`text-sm font-bold lowercase opacity-40 -translate-y-2 ${currentActiveStat.textColor}`}
                    style={{ fontFamily: "Aonic" }}
                  >
                    {currentActiveStat.label}
                  </span>
                </div>
              </div>

              <div className="pb-1">
                <h3
                  className={`text-2xl md:text-3xl font-bold lowercase leading-tight mb-3 line-clamp-1 ${currentActiveStat.textColor}`}
                  style={{ fontFamily: "Aonic" }}
                >
                  {activeSubject.title.toLowerCase()}
                </h3>
                <div className="w-full h-[4px] bg-black/10 mb-2 relative overflow-hidden rounded-full">
                  <motion.div
                    className={`h-full ${currentActiveStat.lineColor}`}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(parseFloat(activeSubject.percentage), 100)}%`,
                    }}
                    transition={{ duration: 0.8, ease: "circOut" }}
                  />
                </div>
                <span
                  className={`block text-[10px] font-mono font-bold lowercase mt-1 ${currentActiveStat.textColor} opacity-60`}
                >
                  {activeSubject.present}/{activeSubject.conducted} sessions
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="predict"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col h-full relative z-20 text-[#050505]"
            >
              <div className="flex justify-between items-center p-6 pb-0">
                <div className="flex items-center gap-2 opacity-60">
                  <CalendarIcon size={14} />
                  <span className="font-mono text-[10px] lowercase tracking-widest font-bold">
                    predict
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {isRangeMode && (
                    <span className="text-[9px] font-bold text-black/40 animate-pulse">
                      {rangeStart ? "Select end date" : "Select start date"}
                    </span>
                  )}
                  <button
                    onClick={() => setIsRangeMode(!isRangeMode)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${isRangeMode ? "bg-black text-[#ceff1c] border-black" : "bg-transparent text-black/60 border-black/10"}`}
                  >
                    {isRangeMode ? "Range On" : "Select Range"}
                  </button>
                  <button
                    onClick={() => setPredictMode(false)}
                    className="p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 flex flex-col px-6 pb-4 pt-2 overflow-hidden">
                <div className="bg-white/60 backdrop-blur-md rounded-3xl p-3 mb-2 flex-1 flex flex-col min-h-0 shadow-sm border border-black/5">
                  <div className="flex justify-between items-center mb-2 px-2">
                    <button
                      onClick={() => changeMonth(-1)}
                      className="p-1 hover:bg-black/5 rounded-full"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span
                      className="font-bold uppercase tracking-wide text-xs"
                      style={{ fontFamily: "Aonic" }}
                    >
                      {calMonth.toLocaleString("default", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <button
                      onClick={() => changeMonth(1)}
                      className="p-1 hover:bg-black/5 rounded-full"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 text-center mb-1">
                    {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-bold text-black/30"
                      >
                        {d}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-y-1 justify-items-center overflow-y-auto custom-scrollbar">
                    {Array.from({
                      length:
                        new Date(
                          calMonth.getFullYear(),
                          calMonth.getMonth(),
                          1,
                        ).getDay() === 0
                          ? 6
                          : new Date(
                              calMonth.getFullYear(),
                              calMonth.getMonth(),
                              1,
                            ).getDay() - 1,
                    }).map((_, i) => (
                      <div key={`e-${i}`} />
                    ))}
                    {Array.from({
                      length: new Date(
                        calMonth.getFullYear(),
                        calMonth.getMonth() + 1,
                        0,
                      ).getDate(),
                    }).map((_, i) => {
                      const d = i + 1;
                      const dateObj = new Date(
                        calMonth.getFullYear(),
                        calMonth.getMonth(),
                        d,
                      );
                      const dateKey = formatDateKey(dateObj);
                      const isSelected = selectedDates.includes(dateKey);
                      const isToday =
                        dateObj.toDateString() === new Date().toDateString();
                      const isRangeStart =
                        rangeStart &&
                        rangeStart.toDateString() === dateObj.toDateString();

                      return (
                        <button
                          key={dateKey}
                          onClick={() => handleDateClick(d)}
                          className={`w-8 h-8 flex items-center justify-center rounded-full text-[10px] font-bold transition-all relative
                                            ${
                                              isSelected
                                                ? "bg-[#050505] text-[#ceff1c] scale-105 shadow-md z-10"
                                                : isRangeStart
                                                  ? "bg-black/50 text-white"
                                                  : isToday
                                                    ? "bg-transparent text-[#050505] ring-2 ring-[#050505]"
                                                    : "text-black/60 hover:bg-black/5"
                                            }`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex bg-white shadow-sm border border-black/5 p-1 rounded-full w-full max-w-[200px] relative h-10">
                    <motion.div
                      layoutId="predToggle"
                      className={`absolute rounded-full h-[calc(100%-8px)] top-1 ${predType === "attend" ? "bg-[#050505]" : "bg-[#ff003c]"}`}
                      style={{
                        width: "calc(50% - 4px)",
                        left: predType === "attend" ? 4 : "50%",
                      }}
                    />
                    <button
                      onClick={() => setPredType("attend")}
                      className={`flex-1 text-[10px] font-black uppercase tracking-wider relative z-10 transition-colors ${predType === "attend" ? "text-white" : "text-black/40"}`}
                    >
                      Attend
                    </button>
                    <button
                      onClick={() => setPredType("leave")}
                      className={`flex-1 text-[10px] font-black uppercase tracking-wider relative z-10 transition-colors ${predType === "leave" ? "text-white" : "text-black/40"}`}
                    >
                      Leave
                    </button>
                  </div>
                  <div className="flex-1 flex justify-end items-center">
                    <div className="flex flex-col items-end">
                      <span
                        className="text-2xl font-black leading-none"
                        style={{ fontFamily: "Urbanosta" }}
                      >
                        {selectedDates.length}
                      </span>
                      <span className="text-[8px] font-bold uppercase opacity-50">
                        Sessions
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        ref={listContainerRef}
        onScroll={handleScroll}
        onTouchStart={stopProp}
        onTouchMove={stopProp}
        onTouchEnd={stopProp}
        className={`flex-1 overflow-y-auto bg-[#f5f6fc] custom-scrollbar pb-24 transition-all duration-700 ease-out snap-y snap-mandatory scroll-pt-4 ${introMode ? "opacity-0 translate-y-10 pointer-events-none" : "opacity-100 translate-y-0 pointer-events-auto"}`}
        style={{
          touchAction: "pan-y",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          overflowAnchor: "none",
        }}
      >
        <div className="px-6 py-6 flex flex-col gap-4">
          <span className="font-mono text-[10px] lowercase tracking-widest text-[#050505]/40 mb-2 block sticky top-0 bg-[#f5f6fc] z-10 py-2">
            /// {predictMode ? "predicted margin" : "watchlist"}
          </span>

          {processedList.map((subject, index) => {
            const isSelected = subject.id === selectedId;
            const predData = subject.pred;
            const isSafe = predData.status.safe;
            const affected = predData.sessionsAffected;
            const dStat = predData.currentStatus;

            const isDashboardMode = !predictMode;
            const isDimmed = isDashboardMode && !isSelected;

            const isPredictActive = predictMode && selectedDates.length > 0;
            const isPredictDimmed = predictMode && !isPredictActive;

            return (
              <div
                key={subject.id}
                ref={(el) => (itemRefs.current[index] = el)}
                onClick={() => {
                  if (!predictMode) setSelectedId(subject.id);
                }}
                className={`group relative w-full p-4 rounded-2xl cursor-pointer transition-all duration-300 ease-out border snap-start scroll-mt-16
                    ${
                      isDashboardMode
                        ? isSelected
                          ? "bg-white shadow-xl scale-[1.02] border-black/5 opacity-100 z-10"
                          : "bg-transparent border-transparent scale-100 opacity-50 grayscale hover:opacity-80"
                        : "bg-white shadow-sm border-transparent scale-100 opacity-100"
                    }
                    ${isPredictDimmed ? "opacity-50 grayscale" : ""}
                `}
                style={{ willChange: "transform, opacity" }}
              >
                <div className="flex justify-between items-end mb-3">
                  <h4
                    className="text-lg font-bold lowercase truncate max-w-[60%]"
                    style={{ fontFamily: "Aonic" }}
                  >
                    {subject.title.toLowerCase()}
                  </h4>
                  <div className="flex flex-col items-end min-w-[80px]">
                    <span
                      className={`text-2xl font-black leading-none ${predictMode ? (isSafe ? "text-[#050505]" : "text-[#ff003c]") : currentActiveStat.safe ? "text-[#050505]" : "text-[#ff003c]"}`}
                      style={{ fontFamily: "Urbanosta" }}
                    >
                      {predictMode
                        ? predData.status.val
                        : Math.floor(parseFloat(subject.percentage)) + "%"}
                    </span>

                    {predictMode && (
                      <div className="flex flex-col items-end mt-1">
                        <span
                          className={`text-[10px] font-bold lowercase ${isSafe ? "text-[#050505]" : "text-[#ff003c]"}`}
                        >
                          {predData.status.label}
                        </span>
                        {affected && predData.diffVal !== 0 && (
                          <span className="text-[9px] font-bold text-black/40 mt-0.5 font-mono">
                            {dStat.val}h &rarr; {predData.status.val}h
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full h-[2px] bg-[#050505]/5 relative mb-3 rounded-full overflow-hidden">
                  {predictMode && (
                    <div
                      className="h-full absolute top-0 left-0 bg-black/10"
                      style={{
                        width: `${Math.min(parseFloat(subject.percentage), 100)}%`,
                      }}
                    />
                  )}
                  <div
                    className={`h-full absolute top-0 left-0 transition-all duration-500 ${predictMode ? (isSafe ? "bg-[#050505]" : "bg-[#ff003c]") : currentActiveStat.safe ? "bg-[#050505]" : "bg-[#ff003c]"}`}
                    style={{
                      width: `${Math.min(predictMode ? predData.pct : parseFloat(subject.percentage), 100)}%`,
                    }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono tracking-wide text-[#050505]/50 lowercase">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${predictMode ? (isSafe ? "bg-[#ceff1c]" : "bg-[#ff003c]") : currentActiveStat.safe ? "bg-[#ceff1c]" : "bg-[#ff003c]"}`}
                    />
                    <span>{subject.code.toLowerCase()}</span>
                  </div>
                  {predictMode && (
                    <span className="font-bold flex items-center gap-1">
                      {affected && (
                        <span className="w-1 h-1 bg-black rounded-full animate-pulse" />
                      )}
                      {Math.floor(predData.pct)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <div className="h-24" />
        </div>
      </div>
    </div>
  );
};

export default MobileAttendance;
