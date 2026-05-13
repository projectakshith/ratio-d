"use client";
import React, { useState, useEffect } from "react";
import { ReactLenis } from "lenis/react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import {
  Pencil, Bell, Palette, Lock, Cloud, LogOut, Check, X,
  User, BookOpen, RefreshCw, PartyPopper, Clock, ChevronRight,
  UserCircle2, BarChart3, Calendar, CheckCircle2, ServerOff,
  Database, MapPin, ArrowRight, MessageSquare, Star,
} from "lucide-react";
import { requestNotificationPermission } from "@/utils/shared/notifs";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { EncryptionUtils } from "@/utils/shared/Encryption";
import {
  COLOR_THEMES, parseTheme, buildTheme, getThemeDisplayName,
  type UiStyle, type ColorTheme,
} from "@/utils/theme/themeUtils";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { UpdateHistoryItem } from "@/types";
import { fetchWithLoadBalancer } from "@/utils/backendProxy";

type RightPanel = null | "themes" | "courses" | "history" | "privacy" | "whatsnew" | "edit" | "feedback";

const WhatsappIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A14.142 14.142 0 0012 0C5.383 0 0 5.383 0 12c0 2.112.551 4.17 1.595 5.987L0 24l6.155-1.614A11.954 11.954 0 0012 24c6.617 0 12-5.383 12-12 0-3.204-1.248-6.216-3.514-8.482z" />
  </svg>
);

const NavRow = ({
  icon, label, active = false, onClick, value, isToggle = false, toggleActive = false,
}: {
  icon: React.ReactNode; label: string; active?: boolean; onClick: () => void;
  value?: string; isToggle?: boolean; toggleActive?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 group ${
      active
        ? "bg-theme-emphasis text-theme-bg shadow-sm"
        : "text-theme-text hover:bg-theme-surface/80"
    }`}
  >
    <div className="flex items-center gap-3.5">
      <span className={`transition-colors ${active ? "text-theme-bg/70" : "text-theme-muted group-hover:text-theme-text"}`}>
        {icon}
      </span>
      <span
        className="text-[13px] font-medium tracking-tight"
        style={{ fontFamily: "var(--font-afacad)" }}
      >
        {label}
      </span>
    </div>
    <div className="flex items-center gap-2.5">
      {value && (
        <span
          className={`text-[10px] font-bold uppercase tracking-wider ${active ? "text-theme-bg/50" : "text-theme-muted"}`}
          style={{ fontFamily: "var(--font-afacad)" }}
        >
          {value}
        </span>
      )}
      {isToggle ? (
        <div
          className={`w-9 h-5 rounded-full relative transition-all duration-300 ${
            toggleActive ? "bg-theme-highlight" : active ? "bg-theme-bg/25" : "bg-theme-text/20"
          }`}
        >
          <div
            className={`absolute top-[3px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-all duration-300 ${
              toggleActive ? "right-[3px]" : "left-[3px]"
            }`}
          />
        </div>
      ) : (
        <ChevronRight
          size={13}
          strokeWidth={2}
          className={active ? "text-theme-bg/50" : "text-theme-muted"}
        />
      )}
    </div>
  </button>
);

const Divider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 px-1 pt-0.5">
    <span
      className="text-[9px] font-black uppercase tracking-[0.35em] text-theme-muted whitespace-nowrap"
      style={{ fontFamily: "var(--font-montserrat)" }}
    >
      {label}
    </span>
    <div className="h-px flex-1 bg-theme-border" />
  </div>
);

const RightHeader = ({ label, sub }: { label: string; sub?: string }) => (
  <div className="shrink-0 px-8 pt-8 pb-6 border-b border-theme-border">
    {sub && (
      <p
        className="text-[9px] font-black uppercase tracking-[0.35em] text-theme-muted mb-1.5"
        style={{ fontFamily: "var(--font-montserrat)" }}
      >
        {sub}
      </p>
    )}
    <h2
      className="text-[2.2rem] font-black tracking-tighter leading-none lowercase"
      style={{ fontFamily: "var(--font-montserrat)" }}
    >
      {label}
    </h2>
  </div>
);

const BEZIER = [0.16, 1, 0.3, 1] as const;

const panelVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: BEZIER } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.14 } },
};

const ProfileCard = ({ profile, onClose }: { profile: any; onClose: () => void }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [15, -15]);
  const rotateY = useTransform(x, [-100, 100], [-15, 15]);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
    >
      <motion.div
        style={{ x, y, rotateX, rotateY, perspective: 1000 }}
        drag
        dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
        dragElastic={0.1}
        className="relative w-full max-w-sm aspect-[3/4.5] rounded-[32px] overflow-hidden bg-theme-bg flex flex-col shadow-2xl touch-none border border-theme-border"
      >
        <div className="h-[50%] w-full relative overflow-hidden">
          <svg viewBox="0 0 500 500" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-90">
            <defs>
              <linearGradient id="arc-grad-s" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--theme-highlight)" />
                <stop offset="100%" stopColor="var(--theme-secondary)" />
              </linearGradient>
            </defs>
            <path d="M0,0 L500,0 L500,320 C420,320 380,180 250,180 C120,180 80,320 0,320 Z" fill="url(#arc-grad-s)" />
          </svg>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_70%)]" />
        </div>
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-theme-text/5 hover:bg-theme-text/10 flex items-center justify-center text-theme-text/40 transition-colors z-20"
        >
          <X size={20} />
        </button>
        <div className="px-8 flex flex-col justify-start pt-4 pointer-events-none">
          <h2
            className="text-4xl font-black text-theme-text leading-[0.9] tracking-tighter lowercase mb-1"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            {profile.name}
          </h2>
          <p className="text-[11px] font-bold text-theme-text/30 uppercase tracking-[0.15em] leading-tight">
            {profile.dept || profile.program} student
          </p>
        </div>
        <div className="px-8 mt-6 flex-1 pointer-events-none">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "batch", value: String(profile.batch) === "1/2" ? "2" : (profile.batch || "N/A") },
              { label: "semester", value: profile.semester || "N/A" },
              { label: "section", value: profile.section?.replace(/[()]/g, "") || "N/A" },
            ].map(({ label, value }) => (
              <div key={label}>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-theme-text/30 block mb-0.5">{label}</span>
                <span className="text-[13px] font-bold text-theme-text opacity-80 truncate block">{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-8 pb-8 flex justify-between items-end pointer-events-none">
          <div className="flex items-center border border-theme-border rounded-lg overflow-hidden h-7">
            <span className="px-2 text-[9px] font-black text-theme-text/50 border-r border-theme-border h-full flex items-center">SRMIST</span>
            <div className="px-1.5 h-full flex items-center bg-theme-text/[0.03]">
              <div className="grid grid-cols-3 gap-0.5">
                {[...Array(9)].map((_, i) => <div key={i} className="w-0.5 h-0.5 bg-theme-text/20 rounded-full" />)}
              </div>
            </div>
            <span className="px-2 text-[9px] font-bold text-theme-text/50 border-l border-theme-border h-full flex items-center tracking-tight">
              {profile.regNo}
            </span>
          </div>
          <span
            className="text-[14px] font-black text-theme-text lowercase tracking-tight"
            style={{ fontFamily: "var(--font-urbanosta)" }}
          >
            ratio'd
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function DesktopSettings() {
  const {
    userData, logout, customDisplayName, setCustomDisplayName,
    refreshData, isUpdating, profileSeed, setProfileSeed,
    updateHistory,
  } = useApp();
  const { theme, setTheme } = useTheme();

  const [rightPanel, setRightPanel] = useState<RightPanel>(null);
  const [tempName, setTempName] = useState("");
  const [tempSeed, setTempSeed] = useState(profileSeed);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackHover, setFeedbackHover] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [feedbackCount, setFeedbackCount] = useState(() => parseInt(localStorage.getItem("ratiod_feedback_count") || "0"));

  const { colorTheme: initialColor } = parseTheme(selectedTheme);
  const [colorTheme, setColorTheme] = useState<ColorTheme>(initialColor);

  const profileName = customDisplayName || userData?.profile?.name || "student";
  const profileRegNo = userData?.profile?.regNo || "";

  useEffect(() => {
    if ("Notification" in window) setNotifEnabled(Notification.permission === "granted");
  }, []);

  const handleApply = () => {
    if (tempName.trim()) {
      setCustomDisplayName(tempName.trim());
      localStorage.setItem("ratiod_custom_name", tempName.trim());
    }
    setProfileSeed(tempSeed);
    localStorage.setItem("ratio_profile_seed", tempSeed);
    setRightPanel(null);
  };

  const handleNotifToggle = async () => {
    if (!window.isSecureContext) { alert("Notifications require HTTPS."); return; }
    if (Notification.permission === "denied") { alert("Permission blocked. Please reset site permissions."); return; }
    const granted = await requestNotificationPermission();
    setNotifEnabled(granted);
  };

  const handleThemeSelect = (style: UiStyle, color: string) => {
    const combined = buildTheme(style, color as any);
    setSelectedTheme(combined);
    setColorTheme(color as ColorTheme);
    setTimeout(() => setTheme(combined), 280);
  };

  const handleSync = async () => {
    const creds = await EncryptionUtils.loadDecrypted("ratio_credentials");
    if (creds && userData) {
      await refreshData(creds, userData);
      window.location.reload();
    }
  };

  const open = (panel: RightPanel) => {
    if (panel !== "feedback") {
      setFeedbackStatus("idle");
      setFeedbackRating(0);
      setFeedbackMessage("");
      setFeedbackHover(0);
    }
    setRightPanel(prev => prev === panel ? null : panel);
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackRating || feedbackStatus === "sending") return;
    setFeedbackStatus("sending");
    const name = customDisplayName || userData?.profile?.name || "anon";
    try {
      const res = await fetchWithLoadBalancer("/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [{
            title: "feedback drop",
            description: feedbackMessage.trim() || "no message",
            color: 0x85a818,
            fields: [
              { name: "rating", value: `${"★".repeat(feedbackRating)}${"☆".repeat(5 - feedbackRating)} ${feedbackRating}/5`, inline: true },
              { name: "from", value: name, inline: true },
            ],
            footer: { text: `ratio'd · ${new Date().toLocaleString("en-IN")}` },
          }],
        }),
      });
      if (res.ok) {
        const next = feedbackCount + 1;
        localStorage.setItem("ratiod_feedback_count", String(next));
        setFeedbackCount(next);
        setFeedbackStatus("sent");
      } else {
        setFeedbackStatus("error");
      }
    } catch {
      setFeedbackStatus("error");
    }
  };

  const courses = userData?.courses || {};
  const groupedCourses = Object.values(courses).reduce((acc: Record<string, any[]>, cur: any) => {
    const c = cur.credits || "0";
    if (!acc[c]) acc[c] = [];
    if (!acc[c].find((x: any) => x.code === cur.code)) acc[c].push(cur);
    return acc;
  }, {});
  const creditGroups = Object.keys(groupedCourses).sort((a, b) => Number(b) - Number(a));

  const defaultThemes = COLOR_THEMES.filter(t => ["default", "minimalist-dark", "brutalist"].includes(t.id));
  const namedThemes = COLOR_THEMES.filter(t => !["default", "minimalist-dark", "brutalist", "yam"].includes(t.id));

  const grouped = updateHistory.reduce((acc, item) => {
    const d = new Date(item.timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    let label = "earlier";
    if (d.toDateString() === today.toDateString()) label = "today";
    else if (d.toDateString() === yesterday.toDateString()) label = "yesterday";
    if (!acc[label]) acc[label] = [];
    acc[label].push(item);
    return acc;
  }, {} as Record<string, UpdateHistoryItem[]>);
  const historySections = ["today", "yesterday", "earlier"].filter(s => grouped[s]?.length > 0);

  const updates = [
    { icon: <Clock size={15} />, title: "History Logging", desc: "track every attendance shift and mark update from the last 48 hours", isNew: true },
    { icon: <UserCircle2 size={15} />, title: "Avatar Customisation", desc: "randomise your profile avatar until you find the right one", isNew: true },
    { icon: <Calendar size={15} />, title: "Recover Dates", desc: "see exactly which dates you need to attend to hit your targets", isNew: true },
    { icon: <BarChart3 size={15} />, title: "OD/ML Prediction", desc: "more accurate logic for predicting leaves and od/ml", isNew: true },
    { icon: <CheckCircle2 size={15} />, title: "Bug Fixes", desc: "fixed sum bugs and improved stability", isNew: false },
  ];

  return (
    <div className="relative h-full w-full flex flex-row overflow-hidden">

      <div
        className="w-[300px] shrink-0 h-full flex flex-col border-r border-theme-border"
        style={{ backgroundColor: "color-mix(in srgb, var(--theme-surface), transparent 55%)" }}
      >
        <div className="px-6 pt-7 pb-5 border-b border-theme-border shrink-0">
          <button
            onClick={() => setShowProfileCard(true)}
            className="w-14 h-14 rounded-2xl overflow-hidden bg-theme-surface border border-theme-border shadow-md hover:scale-105 transition-transform mb-4"
          >
            <UserAvatar seed={profileSeed} className="w-full h-full" />
          </button>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h3
                className="text-[18px] font-black tracking-tighter lowercase leading-tight truncate"
                style={{ fontFamily: "var(--font-montserrat)" }}
              >
                {profileName.toLowerCase()}
              </h3>
              <p
                className="text-[9px] font-bold uppercase tracking-[0.25em] text-theme-muted mt-0.5 truncate"
                style={{ fontFamily: "var(--font-afacad)" }}
              >
                {profileRegNo || "student"}
              </p>
            </div>
            <button
              onClick={() => open("edit")}
              className={`shrink-0 p-2.5 rounded-xl border transition-all ${
                rightPanel === "edit"
                  ? "bg-theme-emphasis text-theme-bg border-theme-emphasis"
                  : "bg-theme-surface border-theme-border text-theme-muted hover:text-theme-text"
              }`}
            >
              <Pencil size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 relative">
          <ReactLenis
            options={{ orientation: "vertical", smoothWheel: true }}
            className="absolute inset-0 overflow-y-auto no-scrollbar px-4 py-5"
          >
            <div className="space-y-1.5">
              <Divider label="Dashboard" />
              <div className="relative space-y-0.5">
                <div className="absolute -left-3 top-3 bottom-3 w-px bg-theme-text/30 rounded-full" />
                <NavRow icon={<Bell size={15} />} label="Notifications" isToggle toggleActive={notifEnabled} onClick={handleNotifToggle} />
                <NavRow icon={<Palette size={15} />} label="Themes" active={rightPanel === "themes"} onClick={() => open("themes")} value={getThemeDisplayName(selectedTheme)} />
                <NavRow icon={<BookOpen size={15} />} label="Course Details" active={rightPanel === "courses"} onClick={() => open("courses")} />
                <NavRow icon={<Cloud size={15} />} label="Sync Data" onClick={handleSync} value={isUpdating ? "syncing..." : ""} />
                <NavRow icon={<Clock size={15} />} label="History Log" active={rightPanel === "history"} onClick={() => open("history")} />
              </div>
            </div>

            <div className="space-y-1.5 mt-12">
              <Divider label="Discover" />
              <div className="relative space-y-0.5">
                <div className="absolute -left-3 top-3 bottom-3 w-px bg-theme-text/30 rounded-full" />
                <NavRow icon={<PartyPopper size={15} />} label="What's New" active={rightPanel === "whatsnew"} onClick={() => open("whatsnew")} />
                <NavRow icon={<MessageSquare size={15} />} label="Feedback" active={rightPanel === "feedback"} onClick={() => open("feedback")} />
                <NavRow icon={<Lock size={15} />} label="Privacy" active={rightPanel === "privacy"} onClick={() => open("privacy")} />
                <button
                  onClick={() => window.open("https://chat.whatsapp.com/D7wymoQ1zrQKqf4Qs4gw91", "_blank")}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all text-theme-text hover:bg-theme-surface/80 group"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-theme-muted group-hover:text-theme-text transition-colors"><WhatsappIcon size={15} /></span>
                    <span className="text-[13px] font-medium tracking-tight" style={{ fontFamily: "var(--font-afacad)" }}>Community</span>
                  </div>
                  <ChevronRight size={13} strokeWidth={2} className="text-theme-muted" />
                </button>
              </div>
            </div>
          </ReactLenis>
        </div>

        <div className="px-4 py-4 border-t border-theme-border shrink-0">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-theme-secondary hover:bg-theme-secondary/10 transition-all group"
          >
            <LogOut size={15} className="shrink-0" />
            <span className="text-[13px] font-medium" style={{ fontFamily: "var(--font-afacad)" }}>log out</span>
          </button>
        </div>
      </div>

      <div className="flex-1 relative h-full overflow-hidden" style={{ backgroundColor: "color-mix(in srgb, var(--theme-surface), transparent 80%)" }}>
        <AnimatePresence mode="wait">

          {!rightPanel && (
            <motion.div key="empty" {...panelVariants} className="absolute inset-0 flex flex-col">
              <div className="flex-1 flex items-center justify-center select-none">
                {userData?.profile && (
                  <div className="relative w-[300px] rounded-[32px] overflow-hidden border border-theme-border shadow-2xl" style={{ height: "450px" }}>
                    <div className="absolute inset-0 bg-theme-bg" />

                    <div className="absolute inset-x-0 top-0 bottom-[50%]">
                      <svg viewBox="0 0 500 500" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-90">
                        <defs>
                          <linearGradient id="arc-grad-ep" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--theme-highlight)" />
                            <stop offset="100%" stopColor="var(--theme-secondary)" />
                          </linearGradient>
                        </defs>
                        <path d="M0,0 L500,0 L500,320 C420,320 380,180 250,180 C120,180 80,320 0,320 Z" fill="url(#arc-grad-ep)" />
                      </svg>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_70%)]" />
                    </div>

                    <div className="absolute inset-0 flex flex-col pointer-events-none">
                      <div className="h-[50%]" />
                      <div className="flex-1 flex flex-col px-8 pt-4 pb-8">
                        <h2
                          className="text-4xl font-black text-theme-text leading-[0.9] tracking-tighter lowercase mb-1"
                          style={{ fontFamily: "var(--font-montserrat)" }}
                        >
                          {(customDisplayName || userData.profile.name).toLowerCase()}
                        </h2>
                        <p className="text-[11px] font-bold text-theme-text/30 uppercase tracking-[0.15em] leading-tight">
                          {userData.profile.dept} student
                        </p>
                        <div className="mt-6 grid grid-cols-3 gap-4">
                          {[
                            { label: "batch", value: String(userData.profile.batch) === "1/2" ? "2" : (userData.profile.batch || "N/A") },
                            { label: "semester", value: userData.profile.semester || "N/A" },
                            { label: "section", value: (userData.profile.section || "N/A").replace(/[()]/g, "") },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-theme-text/30 block mb-0.5">{label}</span>
                              <span className="text-[13px] font-bold text-theme-text opacity-80 truncate block">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-end mt-auto">
                          <div className="flex items-center border border-theme-border rounded-lg overflow-hidden h-7">
                            <span className="px-2 text-[9px] font-black text-theme-text/50 border-r border-theme-border h-full flex items-center">SRMIST</span>
                            <div className="px-1.5 h-full flex items-center bg-theme-text/[0.03]">
                              <div className="grid grid-cols-3 gap-0.5">
                                {[...Array(9)].map((_, i) => <div key={i} className="w-0.5 h-0.5 bg-theme-text/20 rounded-full" />)}
                              </div>
                            </div>
                            <span className="px-2 text-[9px] font-bold text-theme-text/50 border-l border-theme-border h-full flex items-center tracking-tight">
                              {userData.profile.regNo}
                            </span>
                          </div>
                          <span className="text-[14px] font-black text-theme-text lowercase tracking-tight" style={{ fontFamily: "var(--font-urbanosta)" }}>
                            ratio'd
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="shrink-0 px-10 pb-8 flex items-center justify-between">
                <p className="text-[10px] text-theme-muted/30" style={{ fontFamily: "var(--font-afacad)" }}>
                  by{" "}
                  <a href="https://www.instagram.com/akshithfilms/" target="_blank" rel="noopener noreferrer" className="hover:text-theme-muted transition-colors pointer-events-auto">Akshith</a>
                  {" & "}
                  <a href="https://www.instagram.com/_prethiv/" target="_blank" rel="noopener noreferrer" className="hover:text-theme-muted transition-colors pointer-events-auto">Prethiv</a>
                </p>
                <div className="flex items-center gap-2 text-theme-muted/30 pointer-events-auto">
                  <a
                    href="https://github.com/projectakshith/ratio-d"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold hover:text-theme-muted transition-colors"
                    style={{ fontFamily: "var(--font-afacad)" }}
                  >
                    github
                  </a>
                  <span className="text-[11px] opacity-40 leading-none">|</span>
                  <a
                    href="https://chat.whatsapp.com/D7wymoQ1zrQKqf4Qs4gw91"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold hover:text-theme-muted transition-colors"
                    style={{ fontFamily: "var(--font-afacad)" }}
                  >
                    community
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          {rightPanel === "edit" && (
            <motion.div key="edit" {...panelVariants} className="absolute inset-0 flex flex-col">
              <RightHeader label="edit profile" sub="identity" />
              <div className="flex-1 flex items-start justify-start p-8">
                <div className="w-full max-w-sm space-y-7">
                  <div className="flex items-center gap-5">
                    <div className="w-[88px] h-[88px] rounded-[28px] overflow-hidden bg-theme-surface border border-theme-border shrink-0">
                      <UserAvatar seed={tempSeed} className="w-full h-full scale-110" />
                    </div>
                    <div className="space-y-2">
                      <p
                        className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted"
                        style={{ fontFamily: "var(--font-montserrat)" }}
                      >
                        avatar
                      </p>
                      <button
                        onClick={() => setTempSeed(Math.random().toString(36).substring(7))}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-theme-surface/60 border border-theme-border text-[10px] font-black uppercase tracking-[0.2em] hover:bg-theme-surface transition-all"
                      >
                        <RefreshCw size={11} /> randomize
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p
                      className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted"
                      style={{ fontFamily: "var(--font-montserrat)" }}
                    >
                      display name
                    </p>
                    <input
                      autoFocus
                      type="text"
                      placeholder={(profileName || "student").split(" ")[0].toLowerCase()}
                      className="w-full bg-theme-surface/60 border border-theme-border rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-theme-text/40 font-medium transition-colors"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleApply();
                        if (e.key === "Escape") setRightPanel(null);
                      }}
                    />
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      onClick={handleApply}
                      className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl bg-theme-emphasis text-theme-bg font-black text-[11px] uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all"
                    >
                      <Check size={13} strokeWidth={3} /> apply
                    </button>
                    <button
                      onClick={() => { setRightPanel(null); setTempName(""); }}
                      className="flex-1 py-3 rounded-xl bg-theme-surface/60 border border-theme-border text-theme-muted font-black text-[11px] uppercase tracking-widest hover:bg-theme-surface transition-all"
                    >
                      cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {rightPanel === "themes" && (
            <motion.div key="themes" {...panelVariants} className="absolute inset-0 flex flex-col">
              <RightHeader label={getThemeDisplayName(selectedTheme)} sub="appearance" />
              <ReactLenis
                options={{ orientation: "vertical", smoothWheel: true }}
                className="flex-1 overflow-y-auto no-scrollbar px-8 py-6 space-y-8 pb-12"
              >
                <div className="space-y-3">
                  <p
                    className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    Default Presets
                  </p>
                  <div className="grid grid-cols-1 gap-2 max-w-lg">
                    {defaultThemes.map((ct) => {
                      const isActive = colorTheme === ct.id;
                      return (
                        <button
                          key={ct.id}
                          onClick={() => handleThemeSelect(ct.id === "brutalist" ? "brutalist" : "minimalist", ct.id)}
                          className={`w-full relative flex items-center gap-4 p-3.5 rounded-[18px] border-[1.5px] transition-all hover:scale-[1.01] active:scale-[0.99] ${
                            isActive
                              ? "border-theme-highlight bg-theme-highlight/10"
                              : "border-theme-border bg-theme-surface/40 hover:bg-theme-surface/70"
                          }`}
                        >
                          <div className="flex gap-1.5 shrink-0">
                            {ct.swatches.map((s, i) => <div key={i} className="w-5 h-5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: s }} />)}
                          </div>
                          <div className="flex flex-col items-start min-w-0 flex-1 text-left">
                            <span className={`text-[13px] font-bold leading-tight ${isActive ? "text-theme-highlight" : "text-theme-text"}`}>
                              {ct.name}{ct.id !== "brutalist" ? " (minimalist)" : ""}
                            </span>
                            <span className="text-[11px] text-theme-muted mt-0.5">{ct.description}</span>
                          </div>
                          <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 opacity-60 ${ct.isDark ? "bg-black/30 text-white" : "bg-black/10 text-black"}`}>
                            {ct.isDark ? "dark" : "light"}
                          </span>
                          {isActive && <Check size={15} strokeWidth={3} className="text-theme-highlight shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <p
                    className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    Named Collections
                  </p>
                  <div className="grid grid-cols-1 gap-2 max-w-lg">
                    {namedThemes.map((ct) => {
                      const isActive = colorTheme === ct.id;
                      return (
                        <button
                          key={ct.id}
                          onClick={() => handleThemeSelect("minimalist", ct.id)}
                          className={`w-full relative flex items-center gap-4 p-3.5 rounded-[18px] border-[1.5px] transition-all hover:scale-[1.01] active:scale-[0.99] ${
                            isActive
                              ? "border-theme-highlight bg-theme-highlight/10"
                              : "border-theme-border bg-theme-surface/40 hover:bg-theme-surface/70"
                          }`}
                        >
                          <div className="flex gap-1.5 shrink-0">
                            {ct.swatches.map((s, i) => <div key={i} className="w-5 h-5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: s }} />)}
                          </div>
                          <div className="flex flex-col items-start min-w-0 flex-1 text-left">
                            <span className={`text-[13px] font-bold ${isActive ? "text-theme-highlight" : "text-theme-text"}`}>{ct.name}</span>
                            <span className="text-[11px] text-theme-muted mt-0.5">{ct.description}</span>
                          </div>
                          <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 opacity-60 ${ct.isDark ? "bg-black/30 text-white" : "bg-black/10 text-black"}`}>
                            {ct.isDark ? "dark" : "light"}
                          </span>
                          {isActive && <Check size={15} strokeWidth={3} className="text-theme-highlight shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </ReactLenis>
            </motion.div>
          )}

          {rightPanel === "courses" && (
            <motion.div key="courses" {...panelVariants} className="absolute inset-0 flex flex-col">
              <RightHeader label="courses" sub="academic" />
              <ReactLenis
                options={{ orientation: "vertical", smoothWheel: true }}
                className="flex-1 overflow-y-auto no-scrollbar px-8 py-6 pb-12"
              >
                {creditGroups.length > 0 ? (
                  creditGroups.map((credits) => (
                    <div key={credits} className="mb-9">
                      <div className="flex items-center gap-3 mb-4">
                        <span
                          className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted whitespace-nowrap"
                          style={{ fontFamily: "var(--font-afacad)" }}
                        >
                          {credits} credit courses
                        </span>
                        <div className="h-px flex-1 bg-theme-border" />
                      </div>
                      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                        {groupedCourses[credits].map((course: any, idx: number) => (
                          <motion.div
                            key={course.code}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className="relative px-5 pt-4 pb-4 rounded-[20px] bg-theme-surface/30 border border-theme-border overflow-hidden flex flex-col min-h-[140px]"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <span
                                className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-muted"
                                style={{ fontFamily: "var(--font-afacad)" }}
                              >
                                {course.code}
                              </span>
                              <span
                                className="text-[8px] font-bold uppercase tracking-widest text-theme-muted bg-theme-bg/60 px-2 py-0.5 rounded-full"
                                style={{ fontFamily: "var(--font-afacad)" }}
                              >
                                {course.raw_type || course.type}
                              </span>
                            </div>
                            <h3
                              className="text-[15px] font-black leading-[1.1] tracking-tighter lowercase line-clamp-2 mb-auto"
                              style={{ fontFamily: "var(--font-montserrat)" }}
                            >
                              {course.name.toLowerCase()}
                            </h3>
                            <div className="flex justify-between items-end mt-4">
                              <div className="flex items-center gap-1.5">
                                <MapPin size={10} className="text-theme-muted shrink-0" />
                                <span
                                  className="text-[10px] font-bold uppercase"
                                  style={{ fontFamily: "var(--font-afacad)" }}
                                >
                                  {course.room || "N/A"}
                                </span>
                              </div>
                              <span
                                className="text-[10px] text-theme-muted capitalize truncate ml-2 max-w-[110px]"
                                style={{ fontFamily: "var(--font-afacad)" }}
                              >
                                {course.faculty.toLowerCase()}
                              </span>
                            </div>
                            <div className="absolute top-0 right-0 w-20 h-20 bg-theme-highlight/5 rounded-full -mr-10 -mt-10 blur-xl pointer-events-none" />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-theme-muted gap-3">
                    <BookOpen size={36} opacity={0.2} />
                    <p className="text-[12px] font-medium">no courses found.</p>
                  </div>
                )}
              </ReactLenis>
            </motion.div>
          )}

          {rightPanel === "history" && (
            <motion.div key="history" {...panelVariants} className="absolute inset-0 flex flex-col">
              <RightHeader label="updates log" sub="history" />
              <ReactLenis
                options={{ orientation: "vertical", smoothWheel: true }}
                className="flex-1 overflow-y-auto no-scrollbar px-8 py-6 pb-12"
              >
                {historySections.length > 0 ? (
                  <div className="space-y-10 max-w-xl">
                    {historySections.map(section => (
                      <div key={section}>
                        <div className="flex items-center gap-3 mb-6">
                          <span
                            className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-highlight shrink-0"
                            style={{ fontFamily: "var(--font-montserrat)" }}
                          >
                            {section}
                          </span>
                          <div className="flex-1 h-px bg-theme-text/10 rounded-full" />
                        </div>
                        <div className="space-y-4">
                          {grouped[section].map((item: UpdateHistoryItem) => (
                            <div key={item.id} className="space-y-3">
                              {item.diff.attendanceChanges?.map((change: any, i: number) => {
                                const wasSafe = change.oldPercent >= 75;
                                const nowSafe = change.newPercent >= 75;
                                const degraded = (wasSafe && !nowSafe) || (wasSafe && nowSafe && change.newMargin < change.oldMargin) || (!wasSafe && !nowSafe && change.newMargin > change.oldMargin);
                                return (
                                  <div
                                    key={`att-${i}`}
                                    className="border border-theme-border rounded-[20px] p-5 bg-theme-surface/30"
                                  >
                                    <div className="flex items-center justify-between mb-4">
                                      <span
                                        className="text-[15px] font-black lowercase truncate max-w-[65%]"
                                        style={{ fontFamily: "var(--font-montserrat)" }}
                                      >
                                        {change.course}
                                      </span>
                                      <span
                                        className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-theme-border bg-theme-text/5 opacity-60"
                                        style={{ fontFamily: "var(--font-afacad)" }}
                                      >
                                        attendance
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span
                                          className="text-[2rem] font-black opacity-30 leading-none tracking-tighter"
                                          style={{ fontFamily: "var(--font-montserrat)" }}
                                        >
                                          {change.oldMargin}
                                        </span>
                                        <p
                                          className="text-[8px] font-bold uppercase tracking-widest opacity-30 mt-0.5"
                                          style={{ fontFamily: "var(--font-afacad)" }}
                                        >
                                          {wasSafe ? "margin" : "recover"}
                                        </p>
                                      </div>
                                      <ArrowRight size={24} className="text-theme-highlight opacity-40 mx-4" />
                                      <div className="text-right">
                                        <span
                                          className={`text-[2.8rem] font-black leading-none tracking-tighter ${degraded ? "text-theme-secondary" : "text-theme-highlight"}`}
                                          style={{ fontFamily: "var(--font-montserrat)" }}
                                        >
                                          {change.newMargin}
                                        </span>
                                        <p
                                          className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${degraded ? "text-theme-secondary/60" : "text-theme-highlight/60"}`}
                                          style={{ fontFamily: "var(--font-afacad)" }}
                                        >
                                          {nowSafe ? "margin" : "recover"} • {change.newPercent.toFixed(0)}%
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              {item.diff.newMarks?.map((mark: any, i: number) => (
                                <div
                                  key={`mark-${i}`}
                                  className="border border-theme-border rounded-[20px] p-5 bg-theme-surface/30"
                                >
                                  <div className="flex items-center justify-between mb-4">
                                    <span
                                      className="text-[15px] font-black lowercase truncate max-w-[65%]"
                                      style={{ fontFamily: "var(--font-montserrat)" }}
                                    >
                                      {mark.course}
                                    </span>
                                    <span
                                      className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-theme-border bg-theme-text/5 opacity-60"
                                      style={{ fontFamily: "var(--font-afacad)" }}
                                    >
                                      marks
                                    </span>
                                  </div>
                                  <div className="flex items-end justify-between">
                                    <div>
                                      <span
                                        className="text-[2.8rem] font-black leading-none tracking-tighter"
                                        style={{ fontFamily: "var(--font-montserrat)" }}
                                      >
                                        {mark.score}
                                      </span>
                                      <p
                                        className="text-[9px] font-bold uppercase tracking-widest opacity-50 mt-0.5"
                                        style={{ fontFamily: "var(--font-afacad)" }}
                                      >
                                        /{mark.max} • {mark.test}
                                      </p>
                                    </div>
                                    <div
                                      className="px-3 py-1.5 rounded-xl bg-theme-highlight text-theme-bg text-[9px] font-black uppercase tracking-widest"
                                      style={{ fontFamily: "var(--font-montserrat)" }}
                                    >
                                      published
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 opacity-20">
                    <Clock size={40} strokeWidth={1} />
                    <span
                      className="text-[10px] font-black uppercase tracking-[0.3em] mt-5"
                      style={{ fontFamily: "var(--font-montserrat)" }}
                    >
                      no history found
                    </span>
                  </div>
                )}
              </ReactLenis>
            </motion.div>
          )}

          {rightPanel === "whatsnew" && (
            <motion.div key="whatsnew" {...panelVariants} className="absolute inset-0 flex flex-col">
              <RightHeader label="what's new." sub="changelog" />
              <ReactLenis
                options={{ orientation: "vertical", smoothWheel: true }}
                className="flex-1 overflow-y-auto no-scrollbar px-8 py-6 pb-12"
              >
                <div className="space-y-7 max-w-lg">
                  {updates.map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-8 h-8 rounded-xl bg-theme-surface/60 border border-theme-border flex items-center justify-center text-theme-highlight shrink-0 mt-0.5">
                        {item.icon}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <h3
                            className="text-[12px] font-black uppercase tracking-[0.15em]"
                            style={{ fontFamily: "var(--font-montserrat)" }}
                          >
                            {item.title}
                          </h3>
                          {item.isNew && (
                            <span
                              className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-theme-highlight text-theme-bg"
                              style={{ fontFamily: "var(--font-montserrat)" }}
                            >
                              new
                            </span>
                          )}
                        </div>
                        <p className="text-[11.5px] text-theme-muted leading-relaxed" style={{ fontFamily: "var(--font-afacad)" }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ReactLenis>
            </motion.div>
          )}

          {rightPanel === "privacy" && (
            <motion.div key="privacy" {...panelVariants} className="absolute inset-0 bg-[#111111] text-[#F0EDE5] flex flex-col">
              <div className="shrink-0 px-8 pt-8 pb-6 border-b border-white/10">
                <span
                  className="text-[10px] font-black lowercase tracking-tighter opacity-30 block mb-2"
                  style={{ fontFamily: "var(--font-urbanosta)" }}
                >
                  ratio'd
                </span>
                <h2
                  className="text-[2.2rem] font-black tracking-tighter leading-none lowercase"
                  style={{ fontFamily: "var(--font-montserrat)" }}
                >
                  how it works.
                </h2>
              </div>
              <ReactLenis
                options={{ orientation: "vertical", smoothWheel: true }}
                className="flex-1 overflow-y-auto no-scrollbar px-8 py-6 pb-12"
              >
                <div className="space-y-8 max-w-lg">
                  {[
                    { icon: <Lock size={14} className="text-white/50" />, title: "AES-256 Encryption", desc: "When you log in, we use window.crypto to generate a unique 32-byte key locally on your device. Your Academia credentials and session cookies are encrypted using AES-256 before touching localStorage." },
                    { icon: <ServerOff size={14} className="text-white/50" />, title: "Stateless Proxy", desc: "No user database. Our backend acts as a stateless proxy — it authenticates with the SRM portal, parses HTML to JSON, and immediately drops the session data." },
                    { icon: <Database size={14} className="text-white/50" />, title: "Local-First Caching", desc: "All parsed data (attendance, marks, schedule) is cached in localStorage for offline access. Clearing your browser acts as a permanent kill switch." },
                  ].map(({ icon, title, desc }) => (
                    <div key={title} className="flex gap-4">
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5">{icon}</div>
                      <div className="space-y-1.5">
                        <h3
                          className="text-[12px] font-black uppercase tracking-[0.15em]"
                          style={{ fontFamily: "var(--font-montserrat)" }}
                        >
                          {title}
                        </h3>
                        <p className="text-[11.5px] opacity-50 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                  <p
                    className="text-[9px] opacity-20 text-center leading-relaxed pt-4"
                    style={{ fontFamily: "var(--font-montserrat)", whiteSpace: "pre-line" }}
                  >
                    we built this for fun.{"\n"}we don't own the data, and we don't own the portal.{"\n"}use it at your own risk, gng.
                  </p>
                </div>
              </ReactLenis>
            </motion.div>
          )}

          {rightPanel === "feedback" && (
            <motion.div key="feedback" {...panelVariants} className="absolute inset-0 flex flex-col">
              <RightHeader label="give sum feedback gng" sub="feedback" />
              <div className="flex-1 flex items-start p-8">
                <div className="w-full max-w-sm space-y-7">
                  {feedbackCount >= 5 ? (
                    <div className="flex flex-col gap-3 pt-2">
                      <span
                        className="text-[3rem] font-black tracking-tighter lowercase leading-none"
                        style={{ fontFamily: "var(--font-montserrat)" }}
                      >
                        chill.
                      </span>
                      <p className="text-[12px] text-theme-muted" style={{ fontFamily: "var(--font-afacad)" }}>
                        stop spamming dawg.
                      </p>
                    </div>
                  ) : feedbackStatus === "sent" ? (
                    <div className="flex flex-col gap-4 pt-2">
                      <span
                        className="text-[3rem] font-black tracking-tighter lowercase leading-none"
                        style={{ fontFamily: "var(--font-montserrat)" }}
                      >
                        dropped.
                      </span>
                      <p className="text-[12px] text-theme-muted" style={{ fontFamily: "var(--font-afacad)" }}>
                        we got it. thanks gng.
                      </p>
                      {feedbackCount < 5 && (
                        <button
                          onClick={() => { setFeedbackStatus("idle"); setFeedbackRating(0); setFeedbackMessage(""); }}
                          className="w-fit flex items-center gap-2 px-4 py-2 rounded-xl bg-theme-surface/60 border border-theme-border text-[10px] font-black uppercase tracking-[0.2em] hover:bg-theme-surface transition-all"
                        >
                          send another
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <p
                          className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted"
                          style={{ fontFamily: "var(--font-montserrat)" }}
                        >
                          rating
                        </p>
                        <div className="flex gap-0.5" onMouseLeave={() => setFeedbackHover(0)}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              onMouseEnter={() => setFeedbackHover(s)}
                              onClick={() => setFeedbackRating(s)}
                              className="p-1 transition-transform hover:scale-110 active:scale-95"
                            >
                              <Star
                                size={26}
                                strokeWidth={1.5}
                                style={{
                                  color: s <= (feedbackHover || feedbackRating) ? "var(--theme-highlight)" : "var(--theme-border)",
                                  fill: s <= (feedbackHover || feedbackRating) ? "var(--theme-highlight)" : "transparent",
                                  transition: "color 0.12s, fill 0.12s",
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <textarea
                          rows={4}
                          placeholder="show some love or roast us"
                          className="w-full bg-theme-surface/60 border border-theme-border rounded-xl px-4 py-3 text-[13px] focus:outline-none focus:border-theme-text/40 transition-colors resize-none"
                          style={{ fontFamily: "var(--font-afacad)" }}
                          value={feedbackMessage}
                          onChange={(e) => setFeedbackMessage(e.target.value)}
                        />
                        <p
                          className="text-[10px] text-theme-muted/60"
                          style={{ fontFamily: "var(--font-afacad)" }}
                        >
                          we'll grab your name with this
                        </p>
                      </div>

                      {feedbackStatus === "error" && (
                        <p className="text-[11px] text-theme-secondary" style={{ fontFamily: "var(--font-afacad)" }}>
                          something went cooked. try again.
                        </p>
                      )}

                      <div className="flex gap-2.5">
                        <button
                          onClick={handleFeedbackSubmit}
                          disabled={!feedbackRating || feedbackStatus === "sending"}
                          className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl bg-theme-emphasis text-theme-bg font-black text-[11px] uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {feedbackStatus === "sending" ? "dropping..." : "drop it"}
                        </button>
                        <button
                          onClick={() => setRightPanel(null)}
                          className="flex-1 py-3 rounded-xl bg-theme-surface/60 border border-theme-border text-theme-muted font-black text-[11px] uppercase tracking-widest hover:bg-theme-surface transition-all"
                        >
                          cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showProfileCard && userData?.profile && (
          <ProfileCard profile={userData.profile} onClose={() => setShowProfileCard(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
