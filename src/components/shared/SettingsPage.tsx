"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import {
  ChevronLeft,
  Pencil,
  Bell,
  Palette,
  Lock,
  Cloud,
  ChevronRight,
  LogOut,
  Check,
  X,
  User,
} from "lucide-react";
import { requestNotificationPermission } from "@/utils/shared/notifs";
import { StudentProfile } from "@/types";
import { useApp } from "@/context/AppContext";
import { EncryptionUtils } from "@/utils/shared/Encryption";
import {
  COLOR_THEMES,
  parseTheme,
  buildTheme,
  getThemeDisplayName,
  type UiStyle,
  type ColorTheme,
} from "@/utils/theme/themeUtils";

const WhatsappIcon = ({ size = 20 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A14.142 14.142 0 0012 0C5.383 0 0 5.383 0 12c0 2.112.551 4.17 1.595 5.987L0 24l6.155-1.614A11.954 11.954 0 0012 24c6.617 0 12-5.383 12-12 0-3.204-1.248-6.216-3.514-8.482z"/>
  </svg>
);

const backdropVariants: any = {
  hidden: { opacity: 0, backdropFilter: "blur(0px)" },
  visible: {
    opacity: 1,
    backdropFilter: "blur(12px)",
    transition: { duration: 0.5 },
  },
  exit: {
    opacity: 0,
    backdropFilter: "blur(0px)",
    transition: { duration: 0.3 },
  },
};

const panelVariants: any = {
  hidden: { x: "-100%" },
  visible: {
    x: "0%",
    transition: {
      duration: 0.7,
      ease: [0.6, 0.05, 0.01, 0.9] as any,
      when: "beforeChildren",
      staggerChildren: 0.05,
    },
  },
  exit: { x: "-100%", transition: { duration: 0.4, ease: "easeIn" } },
};

const themePanelVariants: any = {
  hidden: { x: "100%" },
  visible: {
    x: "0%",
    transition: {
      duration: 0.5,
      ease: [0.6, 0.05, 0.01, 0.9] as any,
      when: "beforeChildren",
      staggerChildren: 0.05,
    },
  },
  exit: { x: "100%", transition: { duration: 0.35, ease: "easeIn" } },
};

const itemVariants: any = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

const themeItemVariants: any = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface SettingsPageProps {
  onBack: () => void;
  onLogout: () => void;
  profile?: StudentProfile;
  onUpdateName?: (name: string) => void;
  onSelectTheme?: (id: string) => void;
  currentTheme?: string;
}

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  toggle?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  value?: string;
}

const SettingItem = ({
  icon,
  label,
  toggle = false,
  isActive = false,
  onClick,
  value,
}: SettingItemProps) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between px-2 py-4 rounded-xl active:bg-theme-surface transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <span className="text-lg">{icon}</span>
        <span className="text-[15px] font-medium text-theme-text">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && (
          <span className="text-sm text-theme-muted">{value}</span>
        )}
        {toggle ? (
          <div
            className={`w-12 h-7 rounded-full relative transition-all duration-300 border-[1.5px] shadow-sm ${
              isActive 
                ? "bg-theme-highlight border-theme-highlight" 
                : "bg-theme-surface border-theme-border"
            }`}
          >
            <div
              className={`absolute top-0.5 w-[21px] h-[21px] rounded-full transition-all duration-300 shadow-md ${
                isActive
                  ? "right-0.5 bg-theme-bg"
                  : "left-0.5 bg-theme-text"
              }`}
            />
          </div>
        ) : (
          <ChevronRight
            className="w-5 h-5 text-theme-muted"
            strokeWidth={2.5}
          />
        )}
      </div>
    </div>
  );
};

const ProfileCard = ({ profile, onClose }: { profile: any; onClose: () => void }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [15, -15]);
  const rotateY = useTransform(x, [-100, 100], [-15, 15]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
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
               <linearGradient id="arc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                 <stop offset="0%" stopColor="var(--theme-highlight)" />
                 <stop offset="100%" stopColor="var(--theme-secondary)" />
               </linearGradient>
             </defs>
             <path 
               d="M0,0 L500,0 L500,320 C420,320 380,180 250,180 C120,180 80,320 0,320 Z" 
               fill="url(#arc-grad)" 
             />
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
          <h2 className="text-4xl font-black text-theme-text leading-[0.9] tracking-tighter lowercase mb-1" style={{ fontFamily: "var(--font-montserrat)" }}>
            {profile.name}
          </h2>
          <p className="text-[11px] font-bold text-theme-text/30 uppercase tracking-[0.15em] leading-tight">
            {profile.dept || profile.program} student
          </p>
        </div>

        <div className="px-8 mt-6 flex-1 pointer-events-none">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-theme-text/30 block mb-0.5">batch</span>
              <span className="text-[13px] font-bold text-theme-text opacity-80">{String(profile.batch) === "1/2" ? "2" : (profile.batch || "N/A")}</span>
            </div>
            <div>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-theme-text/30 block mb-0.5">semester</span>
              <span className="text-[13px] font-bold text-theme-text opacity-80">{profile.semester || "N/A"}</span>
            </div>
            <div>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-theme-text/30 block mb-0.5">section</span>
              <span className="text-[13px] font-bold text-theme-text opacity-80 truncate">{profile.section?.replace(/[()]/g, '') || "N/A"}</span>
            </div>
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

          <div className="flex flex-col items-end">
            <span className="text-[14px] font-black text-theme-text lowercase tracking-tight" style={{ fontFamily: "Urbanosta" }}>
              ratio'd
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

import PrivacyProtocol from "@/components/shared/PrivacyProtocol";

const SettingsPage = ({
  onBack,
  onLogout,
  profile,
  onUpdateName,
  onSelectTheme,
  currentTheme = "minimalist_minimalist-dark",
}: SettingsPageProps) => {
  const { userData, refreshData, isUpdating } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState("");
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);

  const { uiStyle: initialStyle, colorTheme: initialColor } = parseTheme(selectedTheme);
  const [uiStyle, setUiStyle] = useState<UiStyle>(initialStyle);
  const [colorTheme, setColorTheme] = useState<ColorTheme>(initialColor);

  useEffect(() => {
    if ("Notification" in window) {
      setNotifEnabled(Notification.permission === "granted");
    }
  }, []);

  const handleSave = () => {
    if (tempName.trim()) {
      onUpdateName?.(tempName.trim());
      setIsEditing(false);
      setTempName("");
    }
  };

  const handleNotificationClick = async () => {
    if (!window.isSecureContext) {
      alert("Notifications require HTTPS.");
      return;
    }
    if (Notification.permission === "denied") {
      alert("Permission blocked. Please reset site permissions.");
      return;
    }
    const granted = await requestNotificationPermission();
    setNotifEnabled(granted);
  };

  const handleThemeApply = (style: UiStyle, color: string) => {
    const combined = buildTheme(style, color as any);
    setSelectedTheme(combined);
    setShowThemes(false);
    setTimeout(() => {
      onSelectTheme?.(combined);
    }, 400);
  };

  const handleSync = async () => {
    const creds = EncryptionUtils.loadDecrypted("ratio_credentials");
    if (creds && userData) {
      await refreshData(creds, userData);
      window.location.reload();
    }
  };

  const defaultThemes = COLOR_THEMES.filter(t => ["default", "minimalist-dark", "brutalist"].includes(t.id));
  const namedThemes = COLOR_THEMES.filter(t => !["default", "minimalist-dark", "brutalist", "yam"].includes(t.id));

  return (
    <>
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onBack}
      />

      <motion.div
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-50 bg-theme-bg text-theme-text flex flex-col overflow-hidden"
      >
        <motion.div
          variants={itemVariants}
          className="pt-12 pb-4 px-6 flex items-center gap-4"
        >
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-theme-surface flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
          </button>
          <h1 className="text-[26px] font-semibold tracking-tight">Settings</h1>
        </motion.div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-8 space-y-12">
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-theme-surface">
                  <img
                    src="/image.png"
                    className="w-full h-full object-cover"
                    alt="Profile"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold capitalize">
                    {profile?.name ? profile.name.toLowerCase() : "Student"}
                  </h3>
                  <p className="text-xs uppercase tracking-widest text-theme-muted">
                    {profile?.regNo || "Student Account"}
                  </p>
                </div>
              </div>

              <div className="relative min-h-[52px]">
                <AnimatePresence mode="wait">
                  {!isEditing ? (
                    <motion.div
                      key="buttons"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex gap-3"
                    >
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[22px] bg-theme-surface transition-colors text-sm font-semibold"
                      >
                        <Pencil className="w-4 h-4" /> Edit Profile
                      </button>
                      <button 
                        onClick={() => setShowProfileCard(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[22px] bg-theme-surface transition-colors text-sm font-semibold"
                      >
                        <User className="w-4 h-4" /> Profile Card
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="input-stack"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex flex-col gap-3"
                    >
                      <input
                        autoFocus
                        type="text"
                        placeholder="New display name..."
                        className="w-full bg-theme-surface border border-theme-border rounded-[22px] px-5 py-3 text-sm focus:outline-none text-theme-text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSave()}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          className="flex-1 py-3 rounded-[22px] bg-theme-text text-theme-bg font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                          <Check className="w-4 h-4" /> Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setTempName("");
                          }}
                          className="px-6 py-3 rounded-[22px] bg-theme-surface text-theme-muted text-sm font-semibold active:scale-95 transition-transform"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4">
              <p className="text-[11px] uppercase tracking-widest text-theme-muted">
                Preferences
              </p>
              <div className="space-y-1">
                <SettingItem
                  icon={<Bell className="w-5 h-5 opacity-80 text-theme-text" />}
                  label="Notifications"
                  toggle
                  isActive={notifEnabled}
                  onClick={handleNotificationClick}
                />
                <SettingItem
                  icon={
                    <Palette className="w-5 h-5 opacity-80 text-theme-text" />
                  }
                  label="Select Theme"
                  onClick={() => setShowThemes(true)}
                  value={getThemeDisplayName(selectedTheme)}
                />
                <SettingItem
                  icon={<Lock className="w-5 h-5 opacity-80 text-theme-text" />}
                  label="Privacy"
                  onClick={() => setShowPrivacy(true)}
                />
                <SettingItem
                  icon={<Cloud className="w-5 h-5 opacity-80 text-theme-text" />}
                  label="Sync Data"
                  onClick={handleSync}
                  value={isUpdating ? "Syncing..." : ""}
                />
                <SettingItem
                  icon={<WhatsappIcon size={20} />}
                  label="WhatsApp Community"
                  onClick={() => window.open("https://chat.whatsapp.com/D7wymoQ1zrQKqf4Qs4gw91", "_blank")}
                />
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          variants={itemVariants}
          className="p-6 pt-4 border-t border-theme-border bg-theme-bg z-10 space-y-6"
        >
          <button
            onClick={onLogout}
            className="w-full py-4 rounded-[26px] bg-theme-emphasis text-theme-bg font-bold text-base hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" /> Log Out
          </button>
          <p className="text-xs text-center text-theme-muted">
            made by <a href="https://www.instagram.com/akshithfilms/" target="_blank" rel="noopener noreferrer" className="text-theme-text hover:underline">Akshith Rajesh</a> and <a href="https://www.instagram.com/_prethiv/" target="_blank" rel="noopener noreferrer" className="text-theme-text hover:underline">Prethiv Sriman D</a>
          </p>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showProfileCard && userData?.profile && (
          <ProfileCard 
            profile={userData.profile} 
            onClose={() => setShowProfileCard(false)} 
          />
        )}
      </AnimatePresence>

      <PrivacyProtocol isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />

      <AnimatePresence>
        {showThemes && (
          <>
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-[60] bg-black/20"
              onClick={() => setShowThemes(false)}
            />
            <motion.div
              variants={themePanelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-[70] bg-theme-bg flex flex-col overflow-hidden"
            >
              <div className="pt-12 pb-4 px-6 flex items-center gap-4">
                <button
                  onClick={() => setShowThemes(false)}
                  className="w-10 h-10 rounded-full bg-theme-surface flex items-center justify-center active:scale-90 transition-transform"
                >
                  <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
                </button>
                <h1 className="text-xl font-bold tracking-tight">Select Theme</h1>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="px-6 py-6 space-y-10 pb-20">
                  <motion.div variants={themeItemVariants} className="space-y-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-theme-muted px-1 text-left">
                      Default Presets
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {defaultThemes.map((ct) => {
                        const isActive = colorTheme === ct.id;
                        const [bgSwatch, primarySwatch, hlSwatch] = ct.swatches;
                        return (
                          <button
                            key={ct.id}
                            onClick={() => {
                              const targetStyle = ct.id === "brutalist" ? "brutalist" : "minimalist";
                              setUiStyle(targetStyle);
                              setColorTheme(ct.id);
                              handleThemeApply(targetStyle, ct.id);
                            }}
                            className={`w-full flex items-start gap-4 p-3.5 rounded-2xl border-[1.5px] transition-all active:scale-[0.98] ${
                              isActive
                                ? "border-theme-highlight bg-theme-highlight/10"
                                : "border-theme-border bg-theme-surface"
                            }`}
                          >
                            <div className="flex gap-1 shrink-0 mt-0.5">
                              {[bgSwatch, primarySwatch, hlSwatch].map((s, i) => (
                                <div
                                  key={i}
                                  className="w-6 h-6 rounded-full border border-black/10"
                                  style={{ backgroundColor: s }}
                                />
                              ))}
                            </div>
                            <div className="flex flex-col items-start min-w-0 flex-1 text-left">
                              <span
                                className={`text-[15px] font-bold leading-tight ${
                                  isActive ? "text-theme-highlight" : "text-theme-text"
                                }`}
                              >
                                {ct.name} {ct.id !== "brutalist" ? "(minimalist)" : ""}
                              </span>
                              <span className="text-[11px] text-theme-muted leading-snug mt-0.5">
                                {ct.deity}<br />{ct.description}
                              </span>
                            </div>
                            <span
                              className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
                                ct.isDark
                                  ? "bg-black/30 text-white/70"
                                  : "bg-black/10 text-black/50"
                              }`}
                            >
                              {ct.isDark ? "dark" : "light"}
                            </span>
                            {isActive && (
                              <Check
                                className="text-theme-highlight shrink-0 mt-0.5"
                                size={18}
                                strokeWidth={3}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>

                  <motion.div variants={themeItemVariants} className="space-y-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-theme-muted px-1 text-left">
                      Named Collections (Minimalist)
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {namedThemes.map((ct) => {
                        const isActive = colorTheme === ct.id;
                        const [bgSwatch, primarySwatch, hlSwatch] = ct.swatches;
                        return (
                          <button
                            key={ct.id}
                            onClick={() => {
                              setUiStyle("minimalist");
                              setColorTheme(ct.id);
                              handleThemeApply("minimalist", ct.id);
                            }}
                            className={`w-full flex items-start gap-4 p-3.5 rounded-2xl border-[1.5px] transition-all active:scale-[0.98] ${
                              isActive
                                ? "border-theme-highlight bg-theme-highlight/10"
                                : "border-theme-border bg-theme-surface"
                            }`}
                          >
                            <div className="flex gap-1 shrink-0 mt-0.5">
                              {[bgSwatch, primarySwatch, hlSwatch].map((s, i) => (
                                <div
                                  key={i}
                                  className="w-6 h-6 rounded-full border border-black/10"
                                  style={{ backgroundColor: s }}
                                />
                              ))}
                            </div>
                            <div className="flex flex-col items-start min-w-0 flex-1 text-left">
                              <span
                                className={`text-[15px] font-bold leading-tight ${
                                  isActive ? "text-theme-highlight" : "text-theme-text"
                                }`}
                              >
                                {ct.name}
                              </span>
                              <div className="flex flex-col items-start">
                                <span className="text-[10px] text-theme-muted uppercase tracking-widest">{ct.deity}</span>
                                <span className="text-[11px] text-theme-muted leading-tight">{ct.description}</span>
                              </div>
                            </div>
                            <span
                              className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
                                ct.isDark
                                  ? "bg-black/30 text-white/70"
                                  : "bg-black/10 text-black/50"
                              }`}
                            >
                              {ct.isDark ? "dark" : "light"}
                            </span>
                            {isActive && (
                              <Check
                                className="text-theme-highlight shrink-0 mt-0.5"
                                size={18}
                                strokeWidth={3}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SettingsPage;
