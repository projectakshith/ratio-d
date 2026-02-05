import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Pencil, Share2, Bell, Lock, Cloud, 
  ChevronRight, LogOut, Check, TestTube, Palette, Sparkles
} from 'lucide-react';
import { requestNotificationPermission } from '../utils/notifs';

const THEMES = [
  { id: 'brutalisim-814', name: 'Brutalisim 814' },
  { id: 'elegant-484', name: 'Elegant 484' },
  { id: 'retro', name: 'Retro' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'classic', name: 'Classic' },
  { id: 'monochrome', name: 'Monochrome' },
  { id: 'catpuccin', name: 'Catpuccin' },
];

const backdropVariants = {
  hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
  visible: { opacity: 1, backdropFilter: 'blur(12px)', transition: { duration: 0.5 } },
  exit: { opacity: 0, backdropFilter: 'blur(0px)', transition: { duration: 0.3 } }
};

const panelVariants = {
  hidden: { x: '-100%' },
  visible: { x: '0%', transition: { duration: 0.7, ease: [0.6, 0.05, 0.01, 0.9] } },
  exit: { x: '-100%', transition: { duration: 0.4, ease: 'easeIn' } }
};

const subViewVariants = {
  enter: { x: '100%', opacity: 0 },
  center: { x: 0, opacity: 1, transition: { duration: 0.4, ease: [0.6, 0.05, 0.01, 0.9] } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.3 } }
};

const mainViewVariants = {
  center: { x: 0, opacity: 1, transition: { duration: 0.4 } },
  exit: { x: '-20%', opacity: 0, transition: { duration: 0.3 } }
};

const SettingsPage = ({ onBack, onLogout, profile, onUpdateName, onTestNotification, currentTheme, onThemeChange }) => {
  const [view, setView] = useState('main'); // 'main' or 'theme-picker'
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState("");
  const [notifEnabled, setNotifEnabled] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setNotifEnabled(Notification.permission === "granted");
    }
  }, []);

  const handleSave = () => {
    if (tempName.trim()) {
      onUpdateName(tempName.trim());
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

  return (
    <>
      <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 z-40 bg-black/40" onClick={onBack} />
      <motion.div variants={panelVariants} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 z-50 bg-black text-white flex flex-col overflow-hidden">
        
        <AnimatePresence mode="wait">
          {view === 'main' ? (
            <motion.div key="main-settings" variants={mainViewVariants} initial="exit" animate="center" exit="exit" className="flex flex-col h-full">
              {/* Header */}
              <div className="pt-12 pb-4 px-6 flex items-center gap-4">
                <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-transform">
                  <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
                </button>
                <h1 className="text-[26px] font-semibold tracking-tight">Settings</h1>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-8 space-y-12">
                  {/* Profile Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-white/5">
                        <img src="https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/avatars/c3/c33a1d7eec9e9ad8bfa7e82891e418b81dbc0fce_full.jpg" className="w-full h-full object-cover" alt="Profile" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold capitalize">{profile?.name ? profile.name.toLowerCase() : 'Student'}</h3>
                        <p className="text-xs uppercase tracking-widest text-white/50">{profile?.regNo || 'Student Account'}</p>
                      </div>
                    </div>
                    <div className="relative min-h-[52px]">
                      <AnimatePresence mode="wait">
                        {!isEditing ? (
                          <motion.div key="buttons" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex gap-3">
                            <button onClick={() => setIsEditing(true)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[22px] bg-white/5 hover:bg-white/10 transition-colors text-sm font-semibold">
                              <Pencil className="w-4 h-4" /> Edit Profile
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[22px] bg-white/5 hover:bg-white/10 transition-colors text-sm font-semibold">
                              <Share2 className="w-4 h-4" /> Share Profile
                            </button>
                          </motion.div>
                        ) : (
                          <motion.div key="input-stack" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex flex-col gap-3">
                            <input autoFocus type="text" placeholder="New display name..." className="w-full bg-white/10 border border-white/10 rounded-[22px] px-5 py-3 text-sm focus:outline-none focus:border-white/30 text-white" value={tempName} onChange={(e) => setTempName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
                            <div className="flex gap-2">
                              <button onClick={handleSave} className="flex-1 py-3 rounded-[22px] bg-white text-black font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"><Check className="w-4 h-4" /> Save</button>
                              <button onClick={() => { setIsEditing(false); setTempName(""); }} className="px-6 py-3 rounded-[22px] bg-white/5 text-white/60 text-sm font-semibold active:scale-95 transition-transform">Cancel</button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Preferences Section */}
                  <div className="space-y-4">
                    <p className="text-[11px] uppercase tracking-widest text-white/40">Preferences</p>
                    <div className="space-y-1">
                      <SettingItem 
                        icon={<Bell className="w-5 h-5 opacity-80" />} 
                        label="Notifications" 
                        toggle={true}
                        isActive={notifEnabled}
                        onClick={handleNotificationClick}
                      />
                      {/* Swapped Dark Mode for Theme Picker */}
                      <SettingItem 
                        icon={<Palette className="w-5 h-5 opacity-80" />} 
                        label="Change Theme" 
                        onClick={() => setView('theme-picker')}
                      />
                      <SettingItem icon={<Lock className="w-5 h-5 opacity-80" />} label="Privacy" />
                      <SettingItem icon={<Cloud className="w-5 h-5 opacity-80" />} label="Sync Data" />
                      {onTestNotification && (
                        <SettingItem icon={<TestTube className="w-5 h-5 opacity-80 text-[#ceff1c]" />} label="Test Notification" onClick={onTestNotification} />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 pt-4 border-t border-white/5 bg-black z-10 space-y-6">
                <button onClick={onLogout} className="w-full py-4 rounded-[26px] bg-white text-black font-bold text-base hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                  <LogOut className="w-5 h-5" /> Log Out
                </button>
                <p className="text-xs text-center text-white/40">made by <span className="text-white/60">Akshith Rajesh</span> and <span className="text-white/60">Prethiv Sriman D</span></p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="theme-picker" variants={subViewVariants} initial="enter" animate="center" exit="exit" className="flex flex-col h-full bg-black">
              {/* Theme View Header */}
              <div className="pt-12 pb-4 px-6 flex items-center gap-4">
                <button onClick={() => setView('main')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-transform">
                  <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
                </button>
                <h1 className="text-[26px] font-semibold tracking-tight">Themes</h1>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-2">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => onThemeChange?.(theme.id)}
                      className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all ${
                        currentTheme === theme.id ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5'
                      }`}
                    >
                      <span className={`text-[15px] font-medium ${currentTheme === theme.id ? 'text-white' : 'text-white/70'}`}>
                        {theme.name}
                      </span>
                      {currentTheme === theme.id && (
                        <div className="w-6 h-6 bg-[#ceff1c] rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-black" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  ))}
                  
                  <div className="pt-10 flex flex-col items-center gap-2 opacity-30">
                    <Sparkles className="w-5 h-5" />
                    <p className="text-xs italic">more themes coming soon</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

const SettingItem = ({ icon, label, toggle = false, isActive = false, onClick }) => (
  <div onClick={onClick} className="flex items-center justify-between px-2 py-4 rounded-xl active:bg-white/5 transition-colors cursor-pointer">
    <div className="flex items-center gap-4">
      <span className="text-lg">{icon}</span>
      <span className="text-[15px] font-medium text-white/90">{label}</span>
    </div>
    {toggle ? (
      <div className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${isActive ? 'bg-[#ceff1c]' : 'bg-white/10'}`}>
        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 ${isActive ? 'right-1 bg-black' : 'left-1'}`} />
      </div>
    ) : (
      <ChevronRight className="w-5 h-5 text-white/40" strokeWidth={2.5} />
    )}
  </div>
);

export default SettingsPage;