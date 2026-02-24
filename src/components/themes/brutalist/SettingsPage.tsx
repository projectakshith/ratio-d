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
  Sparkles,
} from "lucide-react";
import { requestNotificationPermission } from "@/utils/notifs";
import { StudentProfile } from "@/types";

const THEMES = [
  { id: "brutalisim-814", name: "Brutalisim 814" },
  { id: "elegant-484", name: "Elegant 484" },
  { id: "retro", name: "Retro" },
  { id: "minimal", name: "Minimal" },
  { id: "classic", name: "Classic" },
  { id: "monochrome", name: "Monochrome" },
  { id: "catpuccin", name: "Catpuccin" },
];

const backdropVariants = {
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

const panelVariants = {
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

const themePanelVariants = {
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

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

const themeItemVariants = {
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
}: SettingItemProps) => (
  <div
    onClick={onClick}
    className="flex items-center justify-between px-2 py-4 rounded-xl active:bg-white/5 transition-colors cursor-pointer"
  >
    <div className="flex items-center gap-4">
      <span className="text-lg">{icon}</span>
      <span className="text-[15px] font-medium text-white/90">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {value && <span className="text-sm text-white/50">{value}</span>}
      {toggle ? (
        <div
          className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${
            isActive ? "bg-[#ceff1c]" : "bg-white/10"
          }`}
        >
          <div
            className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 ${
              isActive ? "right-1 bg-black" : "left-1"
            }`}
          />
        </div>
      ) : (
        <ChevronRight className="w-5 h-5 text-white/40" strokeWidth={2.5} />
      )}
    </div>
  </div>
);

const SettingsPage = ({
  onBack,
  onLogout,
  profile,
  onUpdateName,
  onTestNotification,
  onSelectTheme,
  currentTheme = "brutalisim-814",
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
    onSelectTheme?.(themeId);
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
        className="fixed inset-0 z-50 bg-black text-white flex flex-col overflow-hidden"
      >
        <motion.div
          variants={itemVariants}
          className="pt-12 pb-4 px-6 flex items-center gap-4"
        >
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
          </button>
          <h1 className="text-[26px] font-semibold tracking-tight">Settings</h1>
        </motion.div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-8 space-y-12">
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-white/5">
                  <img
                    src="https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/avatars/c3/c33a1d7eec9e9ad8bfa7e82891e418b81dbc0fce_full.jpg "
                    className="w-full h-full object-cover"
                    alt="Profile"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold capitalize">
                    {profile?.name ? profile.name.toLowerCase() : "Student"}
                  </h3>
                  <p className="text-xs uppercase tracking-widest text-white/50">
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
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[22px] bg-white/5 hover:bg-white/10 transition-colors text-sm font-semibold"
                      >
                        <Pencil className="w-4 h-4" /> Edit Profile
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[22px] bg-white/5 hover:bg-white/10 transition-colors text-sm font-semibold">
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
                        className="w-full bg-white/10 border border-white/10 rounded-[22px] px-5 py-3 text-sm focus:outline-none focus:border-white/30 text-white"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSave()}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          className="flex-1 py-3 rounded-[22px] bg-white text-black font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                          <Check className="w-4 h-4" /> Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setTempName("");
                          }}
                          className="px-6 py-3 rounded-[22px] bg-white/5 text-white/60 text-sm font-semibold active:scale-95 transition-transform"
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
              <p className="text-[11px] uppercase tracking-widest text-white/40">
                Preferences
              </p>
              <div className="space-y-1">
                <SettingItem
                  icon={<Bell className="w-5 h-5 opacity-80" />}
                  label="Notifications"
                  toggle
                  isActive={notifEnabled}
                  onClick={handleNotificationClick}
                />

                <SettingItem
                  icon={<Palette className="w-5 h-5 opacity-80" />}
                  label="Select Theme"
                  onClick={() => setShowThemes(true)}
                  value={THEMES.find((t) => t.id === selectedTheme)?.name}
                />

                <SettingItem
                  icon={<Lock className="w-5 h-5 opacity-80" />}
                  label="Privacy"
                />
                <SettingItem
                  icon={<Cloud className="w-5 h-5 opacity-80" />}
                  label="Sync Data"
                />

                {onTestNotification && (
                  <SettingItem
                    icon={
                      <TestTube className="w-5 h-5 opacity-80 text-[#ceff1c]" />
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
          className="p-6 pt-4 border-t border-white/5 bg-black z-10 space-y-6"
        >
          <button
            onClick={onLogout}
            className="w-full py-4 rounded-[26px] bg-white text-black font-bold text-base hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" /> Log Out
          </button>
          <p className="text-xs text-center text-white/40">
            made by <span className="text-white/60">Akshith Rajesh</span> and{" "}
            <span className="text-white/60">Prethiv Sriman D</span>
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
              className="fixed inset-0 z-[60] bg-black"
              onClick={() => setShowThemes(false)}
            />
            <motion.div
              variants={themePanelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-[70] bg-black text-white flex flex-col"
            >
              <motion.div
                variants={themeItemVariants}
                className="pt-12 pb-6 px-6 flex items-center gap-4"
              >
                <button
                  onClick={() => setShowThemes(false)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-transform"
                >
                  <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
                </button>
                <h1 className="text-[26px] font-semibold tracking-tight">
                  Themes
                </h1>
              </motion.div>

              <div className="flex-1 overflow-y-auto px-6">
                <div className="space-y-1">
                  {THEMES.map((theme) => (
                    <motion.button
                      key={theme.id}
                      variants={themeItemVariants}
                      onClick={() => handleThemeSelect(theme.id)}
                      className={`w-full text-left py-4 px-2 rounded-xl transition-colors duration-200 ${
                        selectedTheme === theme.id
                          ? "text-white"
                          : "text-white/60 hover:text-white/80"
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-[17px] font-medium tracking-tight">
                        {theme.name}
                      </span>
                    </motion.button>
                  ))}
                </div>

                <motion.div
                  variants={themeItemVariants}
                  className="mt-12 flex flex-col items-center gap-3 text-white/30"
                >
                  <Sparkles className="w-5 h-5" />
                  <span className="text-xs italic">
                    more themes coming soon
                  </span>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SettingsPage;
