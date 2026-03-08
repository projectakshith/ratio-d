import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Pencil,
  Share2,
  Bell,
  Palette,
  Lock,
  Cloud,
  ChevronRight,
  LogOut,
  Check,
  TestTube,
} from "lucide-react";
import { requestNotificationPermission } from "@/utils/shared/notifs";
import { StudentProfile } from "@/types";
import {
  COLOR_THEMES,
  parseTheme,
  buildTheme,
  getThemeDisplayName,
  type UiStyle,
} from "@/utils/theme/themeUtils";

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
      ease: [0.6, 0.05, 0.01, 0.9],
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
      ease: [0.6, 0.05, 0.01, 0.9],
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
  onTestNotification?: () => void;
  onSelectTheme?: (id: string) => void;
  currentTheme?: string;
  isDark?: boolean;
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
            className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${
              isActive ? "bg-theme-highlight" : "bg-theme-surface"
            }`}
          >
            <div
              className={`absolute top-1 w-5 h-5 rounded-full transition-all duration-300 ${
                isActive
                  ? "right-1 bg-theme-bg"
                  : "left-1 bg-theme-text"
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

const SettingsPage = ({
  onBack,
  onLogout,
  profile,
  onUpdateName,
  onTestNotification,
  onSelectTheme,
  currentTheme = "minimalist_el",
  isDark = false,
}: SettingsPageProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState("");
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);

  const { uiStyle: currentUiStyle, colorTheme: currentColor } =
    parseTheme(selectedTheme);
  const [uiStyle, setUiStyle] = useState<UiStyle>(currentUiStyle);
  const [colorTheme, setColorTheme] = useState(currentColor);

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
    }, 300);
  };

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
                      <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[22px] bg-theme-surface transition-colors text-sm font-semibold">
                        <Share2 className="w-4 h-4" /> Share Profile
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
                />
                <SettingItem
                  icon={<Cloud className="w-5 h-5 opacity-80 text-theme-text" />}
                  label="Sync Data"
                />
                {onTestNotification && (
                  <SettingItem
                    icon={
                      <TestTube className="w-5 h-5 opacity-80 text-theme-highlight" />
                    }
                    label="Test Notification"
                    onClick={onTestNotification}
                  />
                )}
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
            className="w-full py-4 rounded-[26px] bg-theme-text text-theme-bg font-bold text-base hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" /> Log Out
          </button>
          <p className="text-xs text-center text-theme-muted">
            made by <span className="text-theme-text">Akshith Rajesh</span> and{" "}
            <span className="text-theme-text">Prethiv Sriman D</span>
          </p>
        </motion.div>
      </motion.div>

      {/* ── Theme Picker Panel ─────────────────────────────── */}
      <AnimatePresence>
        {showThemes && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[60] bg-theme-bg"
              onClick={() => setShowThemes(false)}
            />
            <motion.div
              variants={themePanelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-[70] bg-theme-bg text-theme-text flex flex-col"
            >
              <motion.div
                variants={themeItemVariants}
                className="pt-12 pb-6 px-6 flex items-center gap-4"
              >
                <button
                  onClick={() => setShowThemes(false)}
                  className="w-10 h-10 rounded-full bg-theme-surface flex items-center justify-center active:scale-90 transition-transform"
                >
                  <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
                </button>
                <h1 className="text-[26px] font-semibold tracking-tight">
                  Themes
                </h1>
              </motion.div>

              <div className="flex-1 overflow-y-auto px-6 pb-10">
                <div className="space-y-8 mt-2">

                  {/* ── Style Selector ── */}
                  <motion.div variants={themeItemVariants} className="space-y-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-theme-muted px-1">
                      Style
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {(["minimalist", "brutalist"] as UiStyle[]).map((s) => {
                        const isActive = uiStyle === s;
                        return (
                          <button
                            key={s}
                            onClick={() => setUiStyle(s)}
                            className={`flex flex-col items-start p-4 rounded-2xl border-[1.5px] transition-all active:scale-95 ${
                              isActive
                                ? "border-theme-highlight bg-theme-highlight/10"
                                : "border-theme-border bg-theme-surface"
                            }`}
                          >
                            <span
                              className={`text-[15px] font-bold capitalize ${
                                isActive
                                  ? "text-theme-highlight"
                                  : "text-theme-muted"
                              }`}
                            >
                              {s}
                            </span>
                            <span className="text-[11px] text-theme-muted mt-0.5">
                              {s === "minimalist"
                                ? "Clean & airy"
                                : "Raw & bold"}
                            </span>
                            {isActive && (
                              <Check
                                className="text-theme-highlight mt-2 self-end"
                                size={16}
                                strokeWidth={3}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* ── Color Themes Grid ── */}
                  {(() => {
                    const DEFAULT_IDS = ["default", "minimalist-dark", "brutalist"];
                    const defaultThemes = COLOR_THEMES.filter((ct) => DEFAULT_IDS.includes(ct.id));
                    const namedThemes  = COLOR_THEMES.filter((ct) => !DEFAULT_IDS.includes(ct.id));

                    const renderThemeButton = (ct: typeof COLOR_THEMES[number]) => {
                      const isActive = colorTheme === ct.id;
                      const [bgSwatch, primarySwatch, hlSwatch] = ct.swatches;
                      return (
                        <button
                          key={ct.id}
                          onClick={() => {
                            setColorTheme(ct.id);
                            handleThemeApply(uiStyle, ct.id);
                          }}
                          className={`w-full flex items-start gap-4 p-3.5 rounded-2xl border-[1.5px] transition-all active:scale-[0.98] ${
                            isActive
                              ? "border-theme-highlight bg-theme-highlight/10"
                              : "border-theme-border bg-theme-surface"
                          }`}
                        >
                          {/* Swatches */}
                          <div className="flex gap-1 shrink-0 mt-0.5">
                            {[bgSwatch, primarySwatch, hlSwatch].map((s, i) => (
                              <div
                                key={i}
                                className="w-6 h-6 rounded-full border border-black/10"
                                style={{ backgroundColor: s }}
                              />
                            ))}
                          </div>
                          {/* Labels */}
                          <div className="flex flex-col items-start min-w-0 flex-1">
                            <span
                              className={`text-[15px] font-bold leading-tight ${
                                isActive ? "text-theme-highlight" : "text-theme-text"
                              }`}
                            >
                              {ct.name}
                            </span>
                            <span className="text-[11px] text-theme-muted leading-snug mt-0.5">
                              {ct.deity}<br />{ct.description}
                            </span>
                          </div>
                          {/* Dark / Light badge */}
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
                    };

                    return (
                      <>
                        {/* Default presets */}
                        <motion.div variants={themeItemVariants} className="space-y-3">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-theme-muted px-1">
                            Default Presets
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            {defaultThemes.map(renderThemeButton)}
                          </div>
                        </motion.div>

                        {/* Named palettes */}
                        <motion.div variants={themeItemVariants} className="space-y-3">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-theme-muted px-1">
                            Color Palette
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            {namedThemes.map(renderThemeButton)}
                          </div>
                        </motion.div>
                      </>
                    );
                  })()}

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
