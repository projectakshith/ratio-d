"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Zap,
  CloudOff,
  Fingerprint,
  Target,
  BookOpen,
  Smartphone,
  LayoutDashboard,
  Activity,
  CalendarDays,
  BatteryCharging,
  EyeOff,
  Calculator,
  Archive,
  Crosshair,
  Palette,
  Download,
  Share,
  PlusSquare,
  CheckCircle2,
} from "lucide-react";

const isDev = process.env.NODE_ENV === "development";

const slides = [
  {
    id: "core",
    bg: "bg-[#0c30ff]",
    text: "text-[#ceff1c]",
    title: "ratio'd",
    subtitle: "THE ENGINE",
    isLogoPhase: true,
    points: [
      {
        icon: Zap,
        label: "Bun-Powered Speed",
        desc: "Sub-second refresh endpoints. Built for absolute velocity.",
      },
      {
        icon: Smartphone,
        label: "Mobile-First Web App",
        desc: "Crafted specifically for your phone. Fast, fluid, and intuitive.",
      },
      {
        icon: CloudOff,
        label: "Offline Caching",
        desc: "Full offline mode. Your schedule and data, always accessible.",
      },
      {
        icon: BatteryCharging,
        label: "Battery Optimized",
        desc: "Ultra-lightweight background polling built for all-day campus life.",
      },
      {
        icon: Palette,
        label: "Dynamic Themes",
        desc: "Multiple styles, colors, and dark modes to fully customize your interface.",
      },
    ],
  },
  {
    id: "tech",
    bg: "bg-[#111111]",
    text: "text-[#F7F7F7]",
    title: "GHOST\nMODE",
    titleClass:
      "font-['Montserrat',sans-serif] font-black uppercase text-[4.5rem] md:text-[6.5rem] tracking-tighter leading-[0.85]",
    subtitle: "SYSTEM ARCHITECTURE",
    isLogoPhase: false,
    points: [
      {
        icon: ShieldCheck,
        label: "Encrypted Local-First",
        desc: "100% device-level storage encryption. Zero external databases.",
      },
      {
        icon: KeyRound,
        label: "Failproof Auth",
        desc: "Bypasses 'Session Expired' & concurrent login blocks seamlessly.",
      },
      {
        icon: Fingerprint,
        label: "Persistent State",
        desc: "Background auto-logins. You never see a login screen again.",
      },
      {
        icon: EyeOff,
        label: "Zero Telemetry",
        desc: "Absolute privacy. No trackers, no reporting back.",
      },
    ],
  },
  {
    id: "dashboard",
    bg: "bg-[#ceff1c]",
    text: "text-[#111111]",
    title: "OMNI\nDASH",
    titleClass:
      "font-['Montserrat',sans-serif] font-black uppercase text-[4.5rem] md:text-[6.5rem] tracking-tighter leading-[0.85]",
    subtitle: "THE COMMAND CENTER",
    isLogoPhase: false,
    points: [
      {
        icon: LayoutDashboard,
        label: "God's Eye View",
        desc: "A singular dashboard with absolutely everything you want in it.",
      },
      {
        icon: Activity,
        label: "Real-Time Tracking",
        desc: "Live syncing for attendance drops and marks the second they update.",
      },
      {
        icon: Target,
        label: "Predict & Target",
        desc: "Set custom class targets and accurately predict future attendance.",
      },
      {
        icon: Calculator,
        label: "Bunk Meter",
        desc: "Instantly calculates exactly how many classes you can afford to skip today.",
      },
    ],
  },
  {
    id: "features",
    bg: "bg-[#F7F7F7]",
    text: "text-[#0c30ff]",
    title: "STUDENT\nHUB",
    titleClass:
      "font-['Montserrat',sans-serif] font-black uppercase text-[4.5rem] md:text-[6.5rem] tracking-tighter leading-[0.85]",
    subtitle: "ACADEMIC ARSENAL",
    isLogoPhase: false,
    points: [
      {
        icon: CalendarDays,
        label: "Smart Calendar",
        desc: "Visual test schedule indicators and synced academic deadlines.",
      },
      {
        icon: BookOpen,
        label: "Unified Academics",
        desc: "Test details, Google assignments, and exams—all in one place.",
      },
      {
        icon: Archive,
        label: "Resource Vault",
        desc: "Instant access to syllabus and past papers precisely mapped to your courses.",
      },
      {
        icon: Crosshair,
        label: "Deadline Radar",
        desc: "Automatically extracts and ranks your upcoming submissions by urgency.",
      },
    ],
  },
];

function PwaSlideshow({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [introStage, setIntroStage] = useState(0);

  useEffect(() => {
    if (step === 0 && direction === 1) {
      setIntroStage(0);
      const t1 = setTimeout(() => setIntroStage(1), 1400);
      return () => clearTimeout(t1);
    } else if (step === 0 && direction === -1) {
      setIntroStage(1);
    }
  }, [step, direction]);

  const handleNext = () => {
    if (step < slides.length - 1) {
      setDirection(1);
      setStep((prev) => prev + 1);
    } else {
      if (onComplete) onComplete();
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.4 },
    }),
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.2 },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.8, filter: "blur(10px)" },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 200,
      } as const,
    },
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#111111] z-[999]">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={`slide-${step}`}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 350, damping: 35 }}
          className={`absolute inset-0 flex flex-col ${slides[step].bg} ${slides[step].text} px-8 pt-16 pb-32`}
        >
          {slides[step].isLogoPhase ? (
            <>
              <motion.div
                layout
                initial={{ height: "35vh" }}
                animate={{ height: introStage === 0 ? "35vh" : "0vh" }}
                transition={{ type: "spring", damping: 25, stiffness: 150 }}
              />
              <div className="relative">
                <motion.span
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: introStage === 1 ? 0.6 : 0,
                    y: introStage === 1 ? 0 : 10,
                  }}
                  className="text-[10px] font-bold uppercase tracking-[0.4em] mb-6 block"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {slides[step].subtitle}
                </motion.span>
                <motion.h1
                  layout
                  className="font-['Urbanosta',sans-serif] lowercase text-[5rem] md:text-[7rem] leading-[0.8] tracking-tighter"
                >
                  <motion.span
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="flex"
                  >
                    {slides[step].title.split("").map((char, index) => (
                      <motion.span
                        key={index}
                        variants={letterVariants}
                        className="inline-block"
                      >
                        {char}
                      </motion.span>
                    ))}
                  </motion.span>
                </motion.h1>
              </div>
              {introStage === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 space-y-9"
                >
                  {slides[step].points.map((point, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center shrink-0 border border-current/20">
                        <point.icon size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm uppercase tracking-wider">
                          {point.label}
                        </h3>
                        <p className="text-xs opacity-70 mt-1">{point.desc}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </>
          ) : (
            <>
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] mb-6 opacity-40">
                {slides[step].subtitle}
              </span>
              <h1
                className={slides[step].titleClass}
                style={{ whiteSpace: "pre-line" }}
              >
                {slides[step].title}
              </h1>
              <div className="mt-8 space-y-9">
                {slides[step].points.map((point, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center shrink-0 border border-current/20">
                      <point.icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm uppercase tracking-wider">
                        {point.label}
                      </h3>
                      <p className="text-xs opacity-70 mt-1">{point.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <motion.div
        animate={{ opacity: step === 0 ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        className={`absolute bottom-8 left-8 flex items-center h-14 font-['Urbanosta',sans-serif] lowercase text-2xl tracking-tighter z-[1000] pointer-events-none ${slides[step].text}`}
      >
        ratio'd
      </motion.div>

      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 items-center h-14 z-[1000] ${slides[step].text}`}
      >
        {slides.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 transition-all duration-300 ${
              i === step ? "w-10 bg-current" : "w-2 bg-current opacity-20"
            }`}
          />
        ))}
      </div>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleNext}
        className="absolute bottom-8 right-8 w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-lg pointer-events-auto z-[1000]"
      >
        <ArrowRight size={24} strokeWidth={3} />
      </motion.button>
    </div>
  );
}

export default function OnboardingPage({
  onComplete,
  onDevBypass,
  onFinish,
}: {
  onComplete?: () => void;
  onDevBypass?: () => void;
  onFinish?: () => void;
}) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [isPWA, setIsPWA] = useState<boolean | null>(null);
  const [forceOnboarding, setForceOnboarding] = useState<boolean>(false);
  const [os, setOs] = useState<"android" | "ios" | "other" | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState<boolean>(false);

  const handleComplete = onFinish || onComplete || onDevBypass;

  useEffect(() => {
    const checkPWAStatus = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes("android-app://");
      setIsPWA(isStandalone);
    };

    const checkDevice = () => {
      const ua = navigator.userAgent;
      setIsMobile(window.innerWidth < 768);

      if (/android/i.test(ua)) setOs("android");
      else if (
        /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
      )
        setOs("ios");
      else setOs("other");
    };

    const installPromptHandler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", installPromptHandler);
    window.addEventListener("resize", checkDevice);

    checkPWAStatus();
    checkDevice();

    return () => {
      window.removeEventListener("beforeinstallprompt", installPromptHandler);
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) {
      alert("Installation is almost ready. If it doesn't pop up, please wait a few seconds or use the browser menu to 'Add to Home Screen'.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setCanInstall(false);
    } else {
      setCanInstall(true);
    }
  };

  if (isPWA === null || isMobile === null) {
    return <div className="fixed inset-0 bg-[#0c30ff] z-[999]" />;
  }

  if (isPWA || forceOnboarding) {
    return <PwaSlideshow onComplete={onFinish || onComplete || onDevBypass} />;
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col justify-between p-8 pb-16 md:p-16 md:px-24 bg-[#0c30ff] overflow-hidden text-white relative">
      <header className="flex justify-between items-start w-full relative">
        <div className="relative inline-block">
          <h1
            className="text-5xl md:text-7xl lowercase tracking-tighter text-[#ceff1c]"
            style={{ fontFamily: "Urbanosta" }}
          >
            ratio'd
          </h1>
          {isDev && (
            <button
              onClick={() => setForceOnboarding(true)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-default"
              aria-hidden="true"
            />
          )}
        </div>

        {handleComplete && (
          <button
            onClick={() => setForceOnboarding(true)}
            className="opacity-0 absolute top-0 right-0 w-20 h-20 cursor-default"
            aria-hidden="true"
          />
        )}
      </header>

      <main className="w-full max-w-3xl mt-auto pb-16 md:pb-24">
        <AnimatePresence mode="wait">
          {!isMobile ? (
            <motion.div
              key="desktop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-[#ceff1c]">
                  <Smartphone size={14} />
                  <span className="font-mono text-[10px] uppercase tracking-widest">
                    Mobile Exclusive
                  </span>
                </div>

                <h2
                  className="text-4xl md:text-[3.5rem] text-white tracking-tight leading-[1.05]"
                  style={{ fontFamily: "Aonic" }}
                >
                  ratio'd is currently <br /> mobile-only.
                </h2>

                <p className="text-white/60 font-mono text-[11px] md:text-xs leading-relaxed max-w-md mt-2">
                  We're building the best experience for handhelds first.
                  <br />
                  Leave your email to get notified when we launch on
                  <br />
                  desktop.
                </p>
              </div>

              <div className="group relative border-b border-white mt-8 pb-2">
                <input
                  type="email"
                  className="w-full bg-transparent py-2 text-3xl md:text-5xl text-white outline-none placeholder:text-white/20 transition-colors"
                  placeholder="email@address.com"
                  style={{ fontFamily: "Aonic" }}
                />
                <button className="absolute right-0 bottom-4 text-white hover:text-[#ceff1c] transition-colors">
                  <ArrowRight size={24} />
                </button>
              </div>

              <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/40 mt-2 block">
                Join the waitlist — 001
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="mobile"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="space-y-10"
            >
              <div className="space-y-4">
                <p className="font-mono text-[8px] tracking-[0.3em] text-[#ceff1c]">
                  browser view lowkenuinely too smoll :/
                </p>
                <h2
                  className="text-5xl lowercase leading-tight"
                  style={{ fontFamily: "Aonic" }}
                >
                  drop ratio'd on your home screen.
                </h2>
              </div>

              {os === "android" ? (
                <button
                  onClick={handleAndroidInstall}
                  className="w-full group flex items-center justify-between border-t border-white pt-8"
                >
                  <span
                    className="text-5xl lowercase group-hover:text-[#ceff1c] transition-colors"
                    style={{ fontFamily: "Aonic" }}
                  >
                    Install App
                  </span>
                  <Download
                    size={48}
                    className={
                      canInstall
                        ? "group-hover:translate-y-2 transition-transform"
                        : ""
                    }
                  />
                </button>
              ) : (
                <div className="space-y-6 border-t border-white/20 pt-8">
                  <div className="flex items-center gap-4 text-white/80">
                    <div className="p-2 border border-white/20">
                      <Share size={20} />
                    </div>
                    <p className="text-sm font-mono uppercase">
                      1. Tap the 'Share' icon below
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-white/80">
                    <div className="p-2 border border-white/20">
                      <PlusSquare size={20} />
                    </div>
                    <p className="text-sm font-mono uppercase">
                      2. Select 'Add to Home Screen'
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-[#ceff1c]">
                    <div className="p-2 border border-white/20">
                      <CheckCircle2 size={20} />
                    </div>
                    <p className="text-sm font-mono uppercase">
                      3. Launch from your Home Screen
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
