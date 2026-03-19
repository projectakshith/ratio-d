"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  CloudOff,
  Smartphone,
  Activity,
  CalendarDays,
  EyeOff,
  Calculator,
  Palette,
  Download,
  Share,
  PlusSquare,
  CheckCircle2,
  Lock,
  X,
  MessageCircle,
  BookOpen,
  Bell,
  RefreshCw,
  Github,
  Instagram,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { COLOR_THEMES, buildTheme } from "@/utils/theme/themeUtils";

const isDev = process.env.NODE_ENV === "development";

const AlertCardPreview = () => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="w-full max-w-[320px] bg-white border-[#8b5cf6]/15 border-[1.5px] rounded-[24px] p-5 flex flex-col relative overflow-hidden shadow-xl mb-8 self-center"
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[100px] bg-[#8b5cf6]/5 pointer-events-none" />
      <div className="flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0 bg-[#8b5cf6] text-white">
            exam
          </span>
          <span className="text-[11px] font-bold text-black/40 tracking-wider uppercase">
            tomorrow
          </span>
        </div>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-8 h-8 rounded-full bg-[#8b5cf6]/10 flex items-center justify-center text-[#8b5cf6]"
        >
          <Bell size={14} />
        </motion.div>
      </div>
      <span
        className="text-[20px] font-black tracking-tight text-black leading-tight mb-4 z-10"
        style={{ fontFamily: "var(--font-montserrat)" }}
      >
        discrete mathematics
      </span>
      <div className="flex flex-col gap-2.5 z-10">
        <div className="flex items-start gap-3 bg-black/[0.03] border-black/5 rounded-xl p-3 border">
          <div className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-[#8b5cf6]" />
          <span className="text-[14px] font-bold text-black/70 lowercase leading-tight">
            ft-1 assessment @ 9:00 am
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const RefreshPreview = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [attendance, setAttendance] = useState(74.5);

  const handleRefresh = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setTimeout(() => {
      setAttendance(75.2);
      setIsSyncing(false);
    }, 450);
  };

  return (
    <div className="w-full max-w-[320px] space-y-4 mb-8 self-center">
      <div className="bg-white border-black/10 border-[1.5px] rounded-[24px] p-5 shadow-xl">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">
              Attendance
            </span>
            <motion.h3
              key={attendance}
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={`text-4xl font-black tracking-tighter ${attendance >= 75 ? "text-[#85a818]" : "text-black"}`}
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              {attendance}%
            </motion.h3>
          </div>
          <div
            className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${attendance >= 75 ? "bg-[#85a818] text-white" : "bg-black/5 text-black/40"}`}
          >
            {attendance >= 75 ? "Safe" : "Cooked"}
          </div>
        </div>
        <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${attendance}%` }}
            transition={{ type: "spring", stiffness: 100 }}
            className={`h-full rounded-full ${attendance >= 75 ? "bg-[#85a818]" : "bg-black/20"}`}
          />
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={handleRefresh}
        className="w-full py-4 bg-white border-black border-[2px] text-black rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
      >
        <motion.div
          animate={isSyncing ? { rotate: 360 } : {}}
          transition={
            isSyncing ? { repeat: Infinity, duration: 1, ease: "linear" } : {}
          }
        >
          <RefreshCw size={18} />
        </motion.div>
        {isSyncing ? "Syncing..." : "Refresh Now"}
      </motion.button>
    </div>
  );
};

const ScramblerPreview = () => {
  const [input, setInput] = useState("");
  const scramble = (text: string) => {
    if (!text) return "";
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let res = "U2FsdGVkX1";
    for (let i = 0; i < 15; i++)
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    return res + "...";
  };

  return (
    <div className="w-full max-w-[320px] space-y-4 mb-8 self-center text-white">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-3xl min-h-[70px] flex flex-col justify-center">
        <span className="text-[7px] font-mono uppercase tracking-widest opacity-40 mb-1">
          AES-256 encrypted stream
        </span>
        <p className="font-mono text-[10px] break-all text-[#ceff1c] opacity-80 leading-tight">
          {input ? scramble(input) : "Waiting for input..."}
        </p>
      </div>

      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="type your name to encrypt..."
          className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#ceff1c]/50 transition-colors"
        />
        <Lock
          size={18}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20"
        />
      </div>
    </div>
  );
};

const ChefCard = ({
  name,
  github,
  ig,
  isPlumTop = true,
}: {
  name: string;
  github: string;
  ig?: string;
  isPlumTop?: boolean;
}) => {
  const topBg = isPlumTop ? "bg-[#381932]" : "bg-[#FFF3E6]";
  const bottomBg = isPlumTop ? "bg-[#FFF3E6]" : "bg-[#381932]";
  const topText = isPlumTop ? "text-[#FFF3E6]" : "text-[#381932]";
  const bottomText = isPlumTop ? "text-[#381932]" : "text-[#FFF3E6]";

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="w-full flex flex-col rounded-[2rem] overflow-hidden shadow-2xl border-black/5 border"
    >
      <div
        className={`py-4 ${topBg} ${topText} flex items-center justify-center relative overflow-hidden`}
      >
        <span
          className="font-black uppercase tracking-tighter text-lg z-10"
          style={{ fontFamily: "var(--font-montserrat)" }}
        >
          {name}
        </span>
        <div className="absolute -right-2 -top-2 opacity-10 rotate-12">
          <Github size={40} />
        </div>
      </div>
      <div
        className={`py-3 ${bottomBg} ${bottomText} flex items-center justify-center gap-6`}
      >
        <a
          href={github}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:scale-110 transition-transform"
        >
          <Github size={20} />
        </a>
        {ig && (
          <a
            href={ig}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-110 transition-transform"
          >
            <Instagram size={20} />
          </a>
        )}
      </div>
    </motion.div>
  );
};

const ChefsPreview = () => {
  return (
    <div className="w-full max-w-[320px] grid grid-cols-1 gap-4 mb-8 self-center">
      <ChefCard
        name="Akshith"
        github="https://github.com/projectakshith"
        ig="https://www.instagram.com/akshithfilms/"
        isPlumTop={true}
      />
      <ChefCard
        name="Prethiv"
        github="https://github.com/wtfPrethiv"
        ig="https://www.instagram.com/_prethiv/"
        isPlumTop={false}
      />
      <ChefCard
        name="Debaditya"
        github="https://github.com/DebadityaMalakar"
        isPlumTop={true}
      />
    </div>
  );
};

interface OnboardingSlide {
  id: string;
  bg: string;
  text: string;
  title: string | React.ReactNode;
  subtitle: string;
  isLogoPhase: boolean;
  titleClass?: string;
  isPrivacySlide?: boolean;
  isCommunitySlide?: boolean;
  isThemeSlide?: boolean;
  interactiveComponent?: React.ReactNode;
  preview?: React.ReactNode;
  points: { icon: any; label: string; desc: string | React.ReactNode }[];
}

const slides: OnboardingSlide[] = [
  {
    id: "core",
    bg: "bg-[#0c30ff]",
    text: "text-[#ceff1c]",
    title: "ratio'd",
    subtitle: "built for speed",
    isLogoPhase: true,
    points: [
      {
        icon: Zap,
        label: "actually fast",
        desc: "refreshes in like a second. no lag, no mid portal errors.",
      },
      {
        icon: CloudOff,
        label: "works offline",
        desc: "access your schedule even when campus wifi is being mid.",
      },
      {
        icon: Smartphone,
        label: "gesture nav",
        desc: "smooth transitions and fluid navigation. built for handhelds.",
      },
    ],
  },
  {
    id: "unique",
    bg: "bg-[#FF4D4D]",
    text: "text-[#F7F7F7]",
    title: (
      <>
        <span className="text-[2rem] block leading-none">built</span>
        <span className="text-[4rem] md:text-[6rem] block leading-[0.8] tracking-tighter">
          different
        </span>
      </>
    ),
    titleClass:
      "font-['Montserrat',sans-serif] font-black uppercase tracking-tighter leading-[0.85]",
    subtitle: "not your average dashboard",
    isLogoPhase: false,
    interactiveComponent: <AlertCardPreview />,
    points: [
      {
        icon: Zap,
        label: "sub second refresh",
        desc: "our custom endpoints fetch your data in under a second. no cap.",
      },
      {
        icon: CloudOff,
        label: "offline caching",
        desc: "your schedule and marks are always there, even without wifi.",
      },
      {
        icon: BookOpen,
        label: "custom notes",
        desc: "built-in private notes for every subject. stay organized lowkey.",
      },
      {
        icon: Activity,
        label: "2nd yr cse alerts",
        desc: "full ft/ct details for 2nd yr cse. (other courses? send us details!)",
      },
    ],
  },
  {
    id: "speed",
    bg: "bg-[#8b5cf6]",
    text: "text-[#F7F7F7]",
    title: (
      <>
        <span className="text-[2rem] block leading-none">feel</span>
        <span className="text-[4rem] md:text-[6rem] block leading-[0.8] tracking-tighter">
          the speed
        </span>
      </>
    ),
    titleClass:
      "font-['Montserrat',sans-serif] font-black uppercase tracking-tighter leading-[0.85]",
    subtitle: "actually fast",
    isLogoPhase: false,
    interactiveComponent: <RefreshPreview />,
    points: [
      {
        icon: Zap,
        label: "sub second sync",
        desc: "tap the button above to see it in action. it's actually fast.",
      },
      {
        icon: Activity,
        label: "no more waiting",
        desc: "skip the academia portal lag. our custom endpoints fetch data directly.",
      },
      {
        icon: CloudOff,
        label: "instant offline",
        desc: "everything is cached instantly. access your marks even with zero bars.",
      },
    ],
  },
  {
    id: "privacy",
    bg: "bg-[#111111]",
    text: "text-[#F7F7F7]",
    title: (
      <>
        <span className="text-[2rem] block leading-none">lowkenuinely</span>
        <span className="text-[5rem] md:text-[6rem] block leading-[0.8]">
          private
        </span>
      </>
    ),
    titleClass:
      "font-['Montserrat',sans-serif] font-black uppercase tracking-tighter leading-[0.85]",
    subtitle: "the pinky promise",
    isLogoPhase: false,
    isPrivacySlide: true,
    interactiveComponent: <ScramblerPreview />,
    points: [
      {
        icon: Lock,
        label: "on device only",
        desc: "all your data stays on your phone. nowhere else.",
      },
      {
        icon: EyeOff,
        label: "no databases",
        desc: "we dont store anything so we literally cant see your marks.",
      },
      {
        icon: ShieldCheck,
        label: "aes encrypted",
        desc: "even if someone takes your phone, your data is locked down.",
      },
      {
        icon: Github,
        label: "open source",
        desc: (
          <a
            href="https://github.com/projectakshith/ratio-d"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-[#ceff1c]/30 hover:decoration-[#ceff1c] transition-all"
          >
            github.com/projectakshith/ratio-d
          </a>
        ),
      },
    ],
  },
  {
    id: "community",
    bg: "bg-[#8b5cf6]",
    text: "text-[#F7F7F7]",
    title: "the\nchefs",
    titleClass:
      "font-['Montserrat',sans-serif] font-black uppercase text-[4.5rem] md:text-[6.5rem] tracking-tighter leading-[0.85]",
    subtitle: "built by students for students",
    isLogoPhase: false,
    isCommunitySlide: true,
    preview: <ChefsPreview />,
    points: [
      {
        icon: Zap,
        label: "student run",
        desc: "built by students for students. no corporate bs.",
      },
    ],
  },
  {
    id: "themes",
    bg: "bg-[#ceff1c]",
    text: "text-[#111111]",
    title: "vibe\ncheck",
    titleClass:
      "font-['Montserrat',sans-serif] font-black uppercase text-[4.5rem] md:text-[6.5rem] tracking-tighter leading-[0.85]",
    subtitle: "pick your look",
    isLogoPhase: false,
    isThemeSlide: true,
    points: [],
  },
];

function PrivacyOverlay({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-[#0c30ff] text-[#ceff1c] z-[2000] p-8 flex flex-col"
        >
          <div className="flex justify-between items-center mb-12">
            <span className="font-mono text-[10px] uppercase tracking-[0.4em]">
              Privacy Protocol
            </span>
            <button
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10"
            >
              <X size={24} />
            </button>
          </div>

          <h2
            className="text-6xl font-black lowercase tracking-tighter leading-[0.9] mb-8"
            style={{ fontFamily: "Urbanosta" }}
          >
            how it
            <br />
            works
          </h2>

          <div className="space-y-8 flex-1 overflow-y-auto no-scrollbar">
            <div className="space-y-2">
              <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                <Lock size={16} /> Encryption
              </h3>
              <p className="text-sm opacity-80 leading-relaxed">
                When you log in, we generate a unique key on your device. Your
                Academia credentials and marks are scrambled using AES-256
                before being saved.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                <CloudOff size={16} /> Zero Servers
              </h3>
              <p className="text-sm opacity-80 leading-relaxed">
                We don't have a backend database for users. Your data goes from
                the portal to your phone's memory. That's it.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                <Smartphone size={16} /> Local Only
              </h3>
              <p className="text-sm opacity-80 leading-relaxed">
                Deleting the app or clearing browser cache permanently wipes all
                your data. We have no way to recover it because we never had it.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-8 w-full py-5 bg-[#ceff1c] text-[#0c30ff] font-black uppercase tracking-widest rounded-2xl"
          >
            got it
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ThemeSelector({ onComplete }: { onComplete: () => void }) {
  const { theme: currentTheme, setTheme } = useTheme();

  const handleThemePick = (colorId: string) => {
    const newTheme = buildTheme("minimalist", colorId as any);
    setTheme(newTheme);
  };

  return (
    <div className="mt-8 flex-1 flex flex-col">
      <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto no-scrollbar pb-8">
        {COLOR_THEMES.filter((t) =>
          [
            "minimalist-dark",
            "brutalist",
            "gabriel",
            "el",
            "steve",
            "lucifer",
          ].includes(t.id),
        ).map((t) => (
          <motion.button
            key={t.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleThemePick(t.id)}
            className={`p-4 rounded-3xl border-2 transition-all flex flex-col justify-between h-32 ${
              currentTheme.includes(t.id)
                ? "border-[#111111] bg-[#111111] text-white"
                : "border-[#111111]/10 bg-white/20 text-[#111111]"
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <span className="font-bold text-xs uppercase tracking-tighter">
                {t.name}
              </span>
              <div className="flex gap-1">
                {t.swatches.map((s, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: s }}
                  />
                ))}
              </div>
            </div>
            <p className="text-[10px] opacity-60 text-left leading-tight">
              {t.description}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function CommunityPreview() {
  return (
    <div className="relative w-full h-48 mt-4 flex flex-col justify-center items-center">
      {/* Subtle background glow */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white blur-[80px] rounded-full" />
      </div>

      <div className="relative w-full max-w-[280px] h-full flex flex-col gap-4">
        {/* User Bubble */}
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -5, x: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: -8, x: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.5,
          }}
          className="bg-white/10 backdrop-blur-xl border border-white/10 p-4 rounded-3xl rounded-bl-none self-start shadow-2xl"
        >
          <span className="text-[8px] font-black uppercase tracking-widest opacity-40 block mb-1">
            Student
          </span>
          <p className="text-[11px] leading-tight font-medium">
            yo, marks aren't updating...
          </p>
        </motion.div>

        {/* Dev Bubble */}
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: 5, x: 20 }}
          animate={{ scale: 1, opacity: 1, rotate: 6, x: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 1.8,
          }}
          className="bg-[#ceff1c] text-[#111111] p-4 rounded-3xl rounded-br-none self-end shadow-2xl relative z-10"
        >
          <span className="text-[8px] font-black uppercase tracking-widest opacity-40 block mb-1">
            Devs
          </span>
          <p className="text-[11px] leading-tight font-bold">
            fixed it. refresh blud!
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function PwaSlideshow({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [introStage, setIntroStage] = useState(0);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  useEffect(() => {
    if (step === 0) {
      setIntroStage(0);
      const t1 = setTimeout(() => setIntroStage(1), 800);
      return () => clearTimeout(t1);
    } else {
      setIntroStage(1);
    }
  }, [step]);

  const handleNext = () => {
    if (step < slides.length - 1) {
      setDirection(1);
      setStep((prev) => prev + 1);
    } else {
      if (onComplete) onComplete();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setDirection(-1);
      setStep((prev) => prev - 1);
    }
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
      filter: "blur(20px)",
      scale: 1.1,
    }),
    center: {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 } as const,
        opacity: { duration: 0.4 },
        filter: { duration: 0.4 },
      },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
      filter: "blur(20px)",
      scale: 0.9,
      transition: { duration: 0.4 },
    }),
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.9, filter: "blur(8px)" },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 250,
      } as const,
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
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
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.8}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);
            if (swipe < -swipeConfidenceThreshold) {
              handleNext();
            } else if (swipe > swipeConfidenceThreshold) {
              handlePrev();
            }
          }}
          className={`absolute inset-0 flex flex-col ${slides[step].bg} ${slides[step].text} px-8 pt-16 pb-32`}
        >
          {slides[step].isLogoPhase ? (
            <>
              <div className="mt-8 space-y-9 flex-1">
                <AnimatePresence>
                  {introStage === 1 && (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-9"
                    >
                      {slides[step].points.map((point, i) => (
                        <motion.div
                          key={i}
                          variants={itemVariants}
                          className="flex gap-4"
                        >
                          <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center shrink-0 border border-current/20">
                            <point.icon size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm uppercase tracking-wider">
                              {point.label}
                            </h3>
                            <p className="text-xs opacity-70 mt-1">
                              {point.desc}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative mt-auto">
                <motion.span
                  layout
                  initial={{ opacity: 0, filter: "blur(5px)" }}
                  animate={{
                    opacity: introStage === 1 ? 0.6 : 0,
                    filter: introStage === 1 ? "blur(0px)" : "blur(5px)",
                  }}
                  className="text-[10px] font-bold uppercase tracking-[0.4em] mb-4 block"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {slides[step].subtitle}
                </motion.span>
                <motion.h1
                  layout
                  className="font-['Urbanosta',sans-serif] lowercase text-[5.5rem] md:text-[7rem] leading-[0.8] tracking-tighter"
                >
                  {typeof slides[step].title === "string" ? (
                    <motion.span
                      initial="hidden"
                      animate="visible"
                      variants={containerVariants}
                      className="flex"
                    >
                      {(slides[step].title as string)
                        .split("")
                        .map((char, index) => (
                          <motion.span
                            key={index}
                            variants={letterVariants}
                            className="inline-block"
                          >
                            {char}
                          </motion.span>
                        ))}
                    </motion.span>
                  ) : (
                    slides[step].title
                  )}
                </motion.h1>
              </div>
            </>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col h-full"
            >
              <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pb-6">
                {slides[step].isThemeSlide ? (
                  <ThemeSelector onComplete={handleNext} />
                ) : (
                  <>
                    {slides[step].interactiveComponent && (
                      <motion.div
                        variants={itemVariants}
                        className="w-full flex justify-center"
                      >
                        {slides[step].interactiveComponent}
                      </motion.div>
                    )}

                    {/* Render ChefsPreview explicitly inside the community slide points list if requested */}
                    {slides[step].isCommunitySlide && slides[step].preview && (
                      <motion.div
                        variants={itemVariants}
                        className="w-full flex justify-center"
                      >
                        {slides[step].preview}
                      </motion.div>
                    )}

                    {slides[step].points.map((point, i) => (
                      <motion.div
                        key={i}
                        variants={itemVariants}
                        className="flex gap-4"
                      >
                        <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center shrink-0 border border-current/20">
                          <point.icon size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm uppercase tracking-wider">
                            {point.label}
                          </h3>
                          <p className="text-xs opacity-70 mt-1">
                            {point.desc}
                          </p>
                        </div>
                      </motion.div>
                    ))}

                    {slides[step].isPrivacySlide && (
                      <motion.button
                        variants={itemVariants}
                        onClick={() => setIsPrivacyOpen(true)}
                        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full border border-current/10"
                      >
                        how it works <ArrowRight size={12} />
                      </motion.button>
                    )}

                    {slides[step].isCommunitySlide && (
                      <motion.div variants={itemVariants} className="space-y-6">
                        <p className="text-xs opacity-80 leading-relaxed max-w-[280px]">
                          join our whatsapp community. it's where the vibes are.
                          if something breaks, just shout in the group and we'll
                          fix it literally immediately. no corporate ticket bs.
                        </p>
                        <motion.a
                          whileTap={{ scale: 0.95 }}
                          href="https://chat.whatsapp.com/your-invite-link"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-3 bg-white text-[#8b5cf6] px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl"
                        >
                          <MessageCircle size={20} fill="currentColor" />
                          Join the group
                        </motion.a>
                      </motion.div>
                    )}
                  </>
                )}
              </div>

              <div className="mt-auto pt-8">
                {slides[step].isCommunitySlide && <CommunityPreview />}
                <motion.span
                  variants={itemVariants}
                  className="text-[10px] font-bold uppercase tracking-[0.4em] mb-4 opacity-40 block"
                >
                  {slides[step].subtitle}
                </motion.span>
                <motion.h1
                  variants={itemVariants}
                  className={slides[step].titleClass}
                  style={{ whiteSpace: "pre-line" }}
                >
                  {typeof slides[step].title === "string"
                    ? slides[step].title
                    : slides[step].title}
                </motion.h1>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <PrivacyOverlay
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />

      <AnimatePresence>
        {introStage === 1 && (
          <>
            <motion.div
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{
                opacity: step === 0 ? 0 : 1,
                filter: step === 0 ? "blur(10px)" : "blur(0px)",
              }}
              exit={{ opacity: 0, filter: "blur(10px)" }}
              className={`absolute bottom-8 left-8 flex items-center h-14 font-['Urbanosta',sans-serif] lowercase text-2xl tracking-tighter z-[1000] pointer-events-none ${slides[step].text}`}
            >
              ratio'd
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 15, filter: "blur(10px)" }}
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
            </motion.div>

            <motion.button
              initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
              whileTap={{ scale: 0.9 }}
              onClick={handleNext}
              className="absolute bottom-8 right-8 w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-lg pointer-events-auto z-[1000]"
            >
              <ArrowRight size={24} strokeWidth={3} />
            </motion.button>
          </>
        )}
      </AnimatePresence>
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
      alert(
        "Installation is almost ready. If it doesn't pop up, please wait a few seconds or use the browser menu to 'Add to Home Screen'.",
      );
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
