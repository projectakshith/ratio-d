"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Clock,
  Trophy,
  CornerDownLeft,
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Calendar,
  FileText,
  UtensilsCrossed,
  Settings,
  RefreshCw,
  Palette,
  Calculator,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useAppLayout } from "@/context/AppLayoutContext";
import {
  getBaseAttendance,
  getStatus,
} from "@/utils/attendance/attendanceLogic";
import { useAcademiaData } from "@/hooks/useAcademiaData";
import { COLOR_THEMES } from "@/utils/theme/themeUtils";

interface CommandItem {
  id: string;
  category: "navigation" | "action" | "subject" | "theme";
  title: string;
  subtitle?: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
  onSelect: () => void;
  // Subject specific info for detailed preview
  subjectData?: {
    subject: any;
    status: { val: number | null; label: string; safe: boolean };
    nextSession: any;
    marks: any;
  };
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { userData, refreshData, isUpdating } = useApp();
  const { theme, setTheme } = useTheme();
  const { onOpenSettings } = useAppLayout();
  const academia = useAcademiaData(userData as any);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global Spacebar and Esc shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isOpen) {
        const activeElement = document.activeElement;
        const isInput =
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          (activeElement as HTMLElement)?.isContentEditable;

        if (!isInput) {
          e.preventDefault();
          setIsOpen(true);
        }
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  const navigateTo = useCallback(
    (path: string) => {
      handleClose();
      router.push(path);
    },
    [router, handleClose]
  );

  // Navigation pages list
  const navPages = useMemo(
    () => [
      {
        id: "nav-dashboard",
        title: "dashboard",
        subtitle: "overview, upcoming classes & day order",
        path: "/dashboard",
        icon: LayoutDashboard,
        keywords: ["home", "schedule", "classes", "overview"],
      },
      {
        id: "nav-attendance",
        title: "attendance",
        subtitle: "view attendance, margin & bunk calculations",
        path: "/attendance",
        icon: GraduationCap,
        keywords: ["bunks", "margin", "absent", "present", "recover"],
      },
      {
        id: "nav-marks",
        title: "marks",
        subtitle: "internal marks, cycle tests & assessments",
        path: "/marks",
        icon: BookOpen,
        keywords: ["grades", "internals", "ct1", "ct2", "tests", "scores"],
      },
      {
        id: "nav-timetable",
        title: "timetable",
        subtitle: "weekly schedule & slot timings",
        path: "/timetable",
        icon: Clock,
        keywords: ["schedule", "routine", "classes", "slots", "hours"],
      },
      {
        id: "nav-calendar",
        title: "calendar",
        subtitle: "academic calendar, exams & holidays",
        path: "/calendar",
        icon: Calendar,
        keywords: ["holidays", "dates", "exams", "events"],
      },
      {
        id: "nav-mess",
        title: "mess menu",
        subtitle: "breakfast, lunch, snacks & dinner menu",
        path: "/mess",
        icon: UtensilsCrossed,
        keywords: ["food", "breakfast", "lunch", "dinner", "snacks", "hostel", "menu"],
      },
      {
        id: "nav-pyqs",
        title: "pyqs",
        subtitle: "previous year questions & study material",
        path: "/pyqs",
        icon: FileText,
        keywords: ["questions", "papers", "previous years", "exam"],
      },
    ],
    []
  );

  // Quick Action items
  const actionItems = useMemo(
    () => [
      {
        id: "act-settings",
        category: "action" as const,
        title: "open settings",
        subtitle: "themes, student details, sync & preferences",
        icon: Settings,
        keywords: ["settings", "preferences", "config", "account", "profile"],
        onSelect: () => {
          handleClose();
          onOpenSettings();
        },
      },
      {
        id: "act-refresh",
        category: "action" as const,
        title: "sync & refresh data",
        subtitle: isUpdating ? "refreshing now..." : "fetch latest attendance & marks from portal",
        icon: RefreshCw,
        badge: isUpdating ? "syncing" : undefined,
        keywords: ["refresh", "sync", "update", "reload", "fetch"],
        onSelect: () => {
          handleClose();
          if (userData && !isUpdating) {
            refreshData(userData);
          }
        },
      },
    ],
    [handleClose, onOpenSettings, isUpdating, userData, refreshData]
  );

  // Theme quick-switcher items
  const themeItems = useMemo(() => {
    return COLOR_THEMES.map((t) => ({
      id: `theme-${t.id}`,
      category: "theme" as const,
      title: `theme: ${t.name.toLowerCase()}`,
      subtitle: t.description.toLowerCase(),
      icon: Palette,
      badge: theme.includes(t.id) ? "active" : undefined,
      badgeColor: t.swatches[0],
      keywords: ["theme", "color", "mode", t.name.toLowerCase(), t.id],
      onSelect: () => {
        const style = theme.startsWith("brutalist_") ? "brutalist" : "minimalist";
        setTheme(`${style}_${t.id}`);
        handleClose();
      },
    }));
  }, [theme, setTheme, handleClose]);

  // Subject attendance items with recovery/margin calculated
  const subjectItems = useMemo(() => {
    if (!userData?.attendance) return [];

    const baseAttendance = getBaseAttendance(userData.attendance);
    const schedule = academia?.effectiveSchedule || userData?.timetable || {};

    return baseAttendance.map((subject) => {
      const pctVal = parseFloat(subject.percentage || "0");
      const status = getStatus(pctVal, subject.conducted, subject.present);

      let nextSession = null;
      for (let i = 1; i <= 5; i++) {
        const dayKey = `Day ${i}`;
        const daySchedule = schedule[dayKey];
        if (daySchedule) {
          const slots = Object.values(daySchedule).filter((s: any) => {
            const sCode = (s.courseCode || s.code || "").split("-")[0].trim().toLowerCase();
            return sCode === (subject.code || "").toLowerCase();
          });
          if (slots.length > 0) {
            nextSession = { day: dayKey, ...(slots[0] as any) };
            break;
          }
        }
      }

      const marks = (userData.marks || []).find((m: any) => {
        const mCode = (m.code || "").trim().toLowerCase();
        return mCode === (subject.code || "").toLowerCase();
      });

      return {
        id: `subject-${subject.code}`,
        category: "subject" as const,
        title: subject.title,
        subtitle: `${subject.code} • ${subject.type}`,
        icon: GraduationCap,
        badge: `${status.val ?? 0} ${status.label}`,
        badgeColor: status.safe ? "var(--theme-highlight)" : "#FF4D4D",
        keywords: [
          subject.title.toLowerCase(),
          (subject.code || "").toLowerCase(),
          subject.type?.toLowerCase() || "",
          status.label,
        ],
        onSelect: () => {
          navigateTo("/attendance");
        },
        subjectData: {
          subject,
          status,
          nextSession,
          marks,
        },
      };
    });
  }, [userData, academia, navigateTo]);

  // Filtered command items based on query
  const filteredItems: CommandItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      // Default initial view: page navigations + actions
      const navs: CommandItem[] = navPages.map((n) => ({
        id: n.id,
        category: "navigation",
        title: n.title,
        subtitle: n.subtitle,
        icon: n.icon,
        onSelect: () => navigateTo(n.path),
      }));
      return [...navs, ...actionItems];
    }

    const qTerms = q.split(" ").filter(Boolean);

    const matches = (keywords: string[]) =>
      qTerms.every((term) => keywords.some((kw) => kw.includes(term)));

    const matchedNavs: CommandItem[] = navPages
      .filter((n) => matches([n.title, n.subtitle, ...(n.keywords || [])]))
      .map((n) => ({
        id: n.id,
        category: "navigation",
        title: n.title,
        subtitle: n.subtitle,
        icon: n.icon,
        onSelect: () => navigateTo(n.path),
      }));

    const matchedSubjects = subjectItems.filter((s) =>
      matches([s.title, s.subtitle, ...(s.keywords || [])])
    );

    const matchedActions = actionItems.filter((a) =>
      matches([a.title, a.subtitle, ...(a.keywords || [])])
    );

    const matchedThemes = themeItems.filter((t) =>
      matches([t.title, t.subtitle, ...(t.keywords || [])])
    );

    return [...matchedNavs, ...matchedSubjects, ...matchedActions, ...matchedThemes];
  }, [query, navPages, subjectItems, actionItems, themeItems, navigateTo]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation (ArrowUp, ArrowDown, Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].onSelect();
      }
    }
  };

  const selectedItem = filteredItems[selectedIndex];
  const selectedSubject = selectedItem?.subjectData;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          <motion.div
            initial={{ y: -20, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="relative w-full max-w-2xl bg-theme-bg border border-white/10 rounded-[28px] shadow-2xl overflow-hidden flex flex-col"
            style={{
              maxHeight: "80vh",
              boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7)",
            }}
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-6 py-4 border-b border-white/10 shrink-0">
              <Search size={20} className="text-white/40 mr-3 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="type a page (attendance, marks, mess) or subject..."
                className="flex-1 bg-transparent border-none outline-none text-lg md:text-xl font-medium placeholder:text-white/20 caret-white text-white"
                style={{ fontFamily: "var(--font-afacad)" }}
              />
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] font-black uppercase text-white/40">
                  esc
                </span>
              </div>
            </div>

            {/* Results or Subject Detail View */}
            <div className="flex-1 overflow-y-auto no-scrollbar" ref={listRef}>
              {selectedSubject && (
                <div className="p-6 border-b border-white/10 bg-white/[0.02]">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col pr-4">
                      <span
                        className="text-white text-2xl font-black lowercase tracking-tight leading-tight mb-1"
                        style={{ fontFamily: "var(--font-montserrat)" }}
                      >
                        {selectedSubject.subject.title}
                      </span>
                      <span className="text-white/40 text-xs font-bold uppercase tracking-wider">
                        {selectedSubject.subject.code} • {selectedSubject.subject.type}
                      </span>
                    </div>

                    {/* Prominent Recovery / Margin Display */}
                    <div className="flex flex-col items-end shrink-0">
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className={`text-4xl font-black tracking-tight leading-none ${
                            selectedSubject.status.safe
                              ? "text-theme-highlight"
                              : "text-[#FF4D4D]"
                          }`}
                          style={{ fontFamily: "var(--font-montserrat)" }}
                        >
                          {selectedSubject.status.val ?? 0}
                        </span>
                        <span
                          className={`text-sm font-black uppercase tracking-wider ${
                            selectedSubject.status.safe
                              ? "text-theme-highlight"
                              : "text-[#FF4D4D]"
                          }`}
                        >
                          {selectedSubject.status.label}
                        </span>
                      </div>
                      <span className="text-white/40 text-xs font-semibold mt-1">
                        {selectedSubject.subject.percentage}% attendance
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2 text-white/30">
                        <Clock size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          next session
                        </span>
                      </div>
                      {selectedSubject.nextSession ? (
                        <div className="flex flex-col">
                          <span className="text-white text-sm font-bold leading-tight">
                            {selectedSubject.nextSession.day} • {selectedSubject.nextSession.time}
                          </span>
                          <span className="text-white/40 text-xs mt-0.5">
                            Room {selectedSubject.nextSession.room || "TBA"} • Slot {selectedSubject.nextSession.slot}
                          </span>
                        </div>
                      ) : (
                        <span className="text-white/20 text-xs font-medium italic">
                          not scheduled
                        </span>
                      )}
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2 text-white/30">
                        <Trophy size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          recent marks
                        </span>
                      </div>
                      {((selectedSubject.marks as any)?.assessments?.length || 0) > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {(selectedSubject.marks as any).assessments.slice(0, 2).map((m: any, i: number) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                              <span className="text-white/50 truncate mr-2">{m.title}</span>
                              <span className="text-white font-bold shrink-0">
                                {m.marks}/{m.total}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-white/20 text-xs font-medium italic">
                          no marks recorded
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Items List */}
              {filteredItems.length > 0 ? (
                <div className="py-2 px-3">
                  {filteredItems.map((item, index) => {
                    const isSelected = index === selectedIndex;
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.id}
                        onClick={() => item.onSelect()}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`flex items-center justify-between px-3.5 py-3 rounded-2xl cursor-pointer transition-all ${
                          isSelected
                            ? "bg-white/10 text-white"
                            : "hover:bg-white/5 text-white/70"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected ? "bg-white/15 text-white" : "bg-white/5 text-white/40"
                            }`}
                          >
                            <Icon size={18} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span
                              className="text-sm font-bold lowercase tracking-tight truncate text-white"
                              style={{ fontFamily: "var(--font-afacad)" }}
                            >
                              {item.title}
                            </span>
                            {item.subtitle && (
                              <span className="text-[11px] text-white/40 truncate">
                                {item.subtitle}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          {item.badge && (
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
                              style={{
                                color: item.badgeColor || "var(--theme-text)",
                                backgroundColor: item.badgeColor
                                  ? `color-mix(in srgb, ${item.badgeColor} 15%, transparent)`
                                  : "rgba(255, 255, 255, 0.08)",
                              }}
                            >
                              {item.badge}
                            </span>
                          )}
                          {isSelected && (
                            <CornerDownLeft size={14} className="text-white/60 ml-1" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-14 text-center">
                  <span className="text-white/20 text-xs font-bold uppercase tracking-widest">
                    no matches found for "{query}"
                  </span>
                </div>
              )}
            </div>

            {/* Quick Suggestions / Footer */}
            {!query.trim() && (
              <div className="px-6 py-3 border-t border-white/5 bg-white/[0.01] flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-white/20 text-[10px] font-bold uppercase tracking-wider shrink-0 mr-1">
                  quick jump:
                </span>
                {navPages.slice(0, 5).map((page) => (
                  <button
                    key={page.id}
                    onClick={() => navigateTo(page.path)}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-full text-[11px] font-semibold text-white/50 hover:text-white transition-all shrink-0"
                  >
                    {page.title}
                  </button>
                ))}
              </div>
            )}

            {/* Footer keyboard guidance */}
            <div className="px-6 py-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-white/30 shrink-0">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-black uppercase text-white/40">
                    ↑↓
                  </kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-black uppercase text-white/40">
                    ↵
                  </kbd>
                  select
                </span>
              </div>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-black uppercase text-white/40">
                  esc
                </kbd>
                close
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
