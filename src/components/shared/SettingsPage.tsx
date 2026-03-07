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
  Sun,
  Moon,
} from "lucide-react";
import { requestNotificationPermission } from "@/utils/shared/notifs";
import { StudentProfile } from "@/types";

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
  isDark?: boolean;
}

const SettingItem = ({
  icon,
  label,
  toggle = false,
  isActive = false,
  onClick,
  value,
  isDark,
}: SettingItemProps) => {
  const textClass = isDark ? "text-white/90" : "text-[#111111]/90";
  const subTextClass = isDark ? "text-white/50" : "text-[#111111]/50";
  const hoverClass = isDark ? "active:bg-white/5" : "active:bg-[#111111]/5";

  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-2 py-4 rounded-xl ${hoverClass} transition-colors cursor-pointer`}
    >
      <div className="flex items-center gap-4">
        <span className="text-lg">{icon}</span>
        <span className={`text-[15px] font-medium ${textClass}`}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className={`text-sm ${subTextClass}`}>{value}</span>}
        {toggle ? (
          <div
            className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${
              isActive
                ? "bg-[#ceff1c]"
                : isDark
                  ? "bg-white/10"
                  : "bg-[#111111]/10"
            }`}
          >
            <div
              className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 ${
                isActive ? "right-1 bg-black" : "left-1"
              }`}
            />
          </div>
        ) : (
          <ChevronRight
            className={`w-5 h-5 ${isDark ? "text-white/40" : "text-[#111111]/40"}`}
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
  currentTheme = "minimalist_dark",
  isDark = false,
}: SettingsPageProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState("");
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);

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

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId);
    setShowThemes(false);
    setTimeout(() => {
      onSelectTheme?.(themeId);
    }, 300);
  };

  const bgClass = isDark ? "bg-[#111111]" : "bg-[#F7F7F7]";
  const textClass = isDark ? "text-white" : "text-[#111111]";
  const subTextClass = isDark ? "text-white/50" : "text-[#111111]/50";
  const btnClass = isDark
    ? "bg-white/5 hover:bg-white/10"
    : "bg-[#111111]/5 hover:bg-[#111111]/10";
  const borderClass = isDark ? "border-white/10" : "border-[#111111]/10";

  const getThemeDisplayName = (id: string) => {
    if (id === "minimalist_light") return "Minimalist (Light)";
    if (id === "minimalist_dark") return "Minimalist (Dark)";
    if (id === "brutalist") return "Brutalist";
    return "Minimalist (Light)";
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
        className={`fixed inset-0 z-50 ${bgClass} ${textClass} flex flex-col overflow-hidden`}
      >
        <motion.div
          variants={itemVariants}
          className="pt-12 pb-4 px-6 flex items-center gap-4"
        >
          <button
            onClick={onBack}
            className={`w-10 h-10 rounded-full ${btnClass} flex items-center justify-center active:scale-90 transition-transform`}
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
          </button>
          <h1 className="text-[26px] font-semibold tracking-tight">Settings</h1>
        </motion.div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-8 space-y-12">
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-full overflow-hidden ${isDark ? "bg-white/5" : "bg-[#111111]/5"}`}
                >
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
                  <p
                    className={`text-xs uppercase tracking-widest ${subTextClass}`}
                  >
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
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[22px] ${btnClass} transition-colors text-sm font-semibold`}
                      >
                        <Pencil className="w-4 h-4" /> Edit Profile
                      </button>
                      <button
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[22px] ${btnClass} transition-colors text-sm font-semibold`}
                      >
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
                        className={`w-full ${isDark ? "bg-white/10 border-white/10" : "bg-[#111111]/10 border-[#111111]/10"} border rounded-[22px] px-5 py-3 text-sm focus:outline-none focus:border-opacity-30 ${textClass}`}
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSave()}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          className={`flex-1 py-3 rounded-[22px] ${isDark ? "bg-white text-black" : "bg-black text-white"} font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform`}
                        >
                          <Check className="w-4 h-4" /> Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setTempName("");
                          }}
                          className={`px-6 py-3 rounded-[22px] ${btnClass} ${subTextClass} text-sm font-semibold active:scale-95 transition-transform`}
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
              <p
                className={`text-[11px] uppercase tracking-widest ${subTextClass}`}
              >
                Preferences
              </p>
              <div className="space-y-1">
                <SettingItem
                  icon={<Bell className={`w-5 h-5 opacity-80 ${textClass}`} />}
                  label="Notifications"
                  toggle
                  isActive={notifEnabled}
                  onClick={handleNotificationClick}
                  isDark={isDark}
                />
                <SettingItem
                  icon={
                    <Palette className={`w-5 h-5 opacity-80 ${textClass}`} />
                  }
                  label="Select Theme"
                  onClick={() => setShowThemes(true)}
                  value={getThemeDisplayName(selectedTheme)}
                  isDark={isDark}
                />
                <SettingItem
                  icon={<Lock className={`w-5 h-5 opacity-80 ${textClass}`} />}
                  label="Privacy"
                  isDark={isDark}
                />
                <SettingItem
                  icon={<Cloud className={`w-5 h-5 opacity-80 ${textClass}`} />}
                  label="Sync Data"
                  isDark={isDark}
                />
                {onTestNotification && (
                  <SettingItem
                    icon={
                      <TestTube
                        className={`w-5 h-5 opacity-80 text-[#ceff1c]`}
                      />
                    }
                    label="Test Notification"
                    onClick={onTestNotification}
                    isDark={isDark}
                  />
                )}
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          variants={itemVariants}
          className={`p-6 pt-4 border-t ${borderClass} ${bgClass} z-10 space-y-6`}
        >
          <button
            onClick={onLogout}
            className={`w-full py-4 rounded-[26px] ${isDark ? "bg-white text-black" : "bg-black text-white"} font-bold text-base hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2`}
          >
            <LogOut className="w-5 h-5" /> Log Out
          </button>
          <p className={`text-xs text-center ${subTextClass}`}>
            made by <span className={textClass}>Akshith Rajesh</span> and{" "}
            <span className={textClass}>Prethiv Sriman D</span>
          </p>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showThemes && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`fixed inset-0 z-[60] ${bgClass}`}
              onClick={() => setShowThemes(false)}
            />
            <motion.div
              variants={themePanelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`fixed inset-0 z-[70] ${bgClass} ${textClass} flex flex-col`}
            >
              <motion.div
                variants={themeItemVariants}
                className="pt-12 pb-6 px-6 flex items-center gap-4"
              >
                <button
                  onClick={() => setShowThemes(false)}
                  className={`w-10 h-10 rounded-full ${btnClass} flex items-center justify-center active:scale-90 transition-transform`}
                >
                  <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
                </button>
                <h1 className="text-[26px] font-semibold tracking-tight">
                  Themes
                </h1>
              </motion.div>

              <div className="flex-1 overflow-y-auto px-6">
                <div className="space-y-8 mt-4">
                  <div className="space-y-4">
                    <p
                      className={`text-[11px] uppercase tracking-[0.2em] ${subTextClass} px-2`}
                    >
                      Minimalist
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleThemeSelect("minimalist_light")}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-[1.5px] transition-all ${selectedTheme === "minimalist_light" ? "border-[#85a818] bg-[#85a818]/5" : isDark ? "border-white/5 bg-white/5" : "border-black/5 bg-[#111111]/5"}`}
                      >
                        <div className="flex items-center gap-3">
                          <Sun
                            className={
                              selectedTheme === "minimalist_light"
                                ? "text-[#85a818]"
                                : subTextClass
                            }
                            size={20}
                          />
                          <span
                            className={`text-[16px] font-bold ${selectedTheme === "minimalist_light" ? textClass : subTextClass}`}
                          >
                            Light Mode
                          </span>
                        </div>
                        {selectedTheme === "minimalist_light" && (
                          <Check
                            className="text-[#85a818]"
                            size={20}
                            strokeWidth={3}
                          />
                        )}
                      </button>
                      <button
                        onClick={() => handleThemeSelect("minimalist_dark")}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-[1.5px] transition-all ${selectedTheme === "minimalist_dark" ? "border-[#85a818] bg-[#85a818]/5" : isDark ? "border-white/5 bg-white/5" : "border-black/5 bg-[#111111]/5"}`}
                      >
                        <div className="flex items-center gap-3">
                          <Moon
                            className={
                              selectedTheme === "minimalist_dark"
                                ? "text-[#85a818]"
                                : subTextClass
                            }
                            size={20}
                          />
                          <span
                            className={`text-[16px] font-bold ${selectedTheme === "minimalist_dark" ? textClass : subTextClass}`}
                          >
                            Dark Mode
                          </span>
                        </div>
                        {selectedTheme === "minimalist_dark" && (
                          <Check
                            className="text-[#85a818]"
                            size={20}
                            strokeWidth={3}
                          />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p
                      className={`text-[11px] uppercase tracking-[0.2em] ${subTextClass} px-2`}
                    >
                      Experimental
                    </p>
                    <button
                      onClick={() => handleThemeSelect("brutalist")}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border-[1.5px] transition-all ${selectedTheme === "brutalist" ? "border-[#85a818] bg-[#85a818]/5" : isDark ? "border-white/5 bg-white/5" : "border-black/5 bg-[#111111]/5"}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[16px] font-bold ${selectedTheme === "brutalist" ? textClass : subTextClass}`}
                        >
                          Brutalist
                        </span>
                      </div>
                      {selectedTheme === "brutalist" && (
                        <Check
                          className="text-[#85a818]"
                          size={20}
                          strokeWidth={3}
                        />
                      )}
                    </button>
                  </div>
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
