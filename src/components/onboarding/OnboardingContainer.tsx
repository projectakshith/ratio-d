"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Smartphone,
  MessageCircle,
  X,
  Download,
  Share,
  PlusSquare,
  CheckCircle2,
} from "lucide-react";
import PrivacyProtocol from "@/components/shared/PrivacyProtocol";
import ThemeSelector from "./ThemeSelector";
import CommunityPreview from "./previews/CommunityPreview";
import { slides, OnboardingSlide } from "./slidesData";

const isDev = process.env.NODE_ENV === "development";

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
          style={{ touchAction: "pan-y" }}
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
                  style={{ fontFamily: "var(--font-montserrat)" }}
                >
                  {slides[step].subtitle}
                </motion.span>
                <motion.h1
                  layout
                  className="font-black lowercase text-[5.5rem] md:text-[7rem] leading-[0.8] tracking-tighter"
                  style={{ fontFamily: "var(--font-urbanosta)" }}
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
              <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pb-6 pointer-events-none">
                {slides[step].isThemeSlide ? (
                  <div className="pointer-events-auto">
                    <ThemeSelector onComplete={handleNext} />
                  </div>
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

                        {slides[step].preview && (
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
                        className="flex gap-4 pointer-events-none"
                      >
                        <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center shrink-0 border border-current/20">
                          <point.icon size={20} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-sm uppercase tracking-wider">
                            {point.label}
                          </h3>
                          <div className="text-xs opacity-70 mt-1 [&_a]:pointer-events-auto">
                            {point.desc}
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {slides[step].isPrivacySlide && (
                      <motion.button
                        variants={itemVariants}
                        onClick={() => setIsPrivacyOpen(true)}
                        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full border border-current/10 pointer-events-auto"
                      >
                        how it works <ArrowRight size={12} />
                      </motion.button>
                    )}

                    {slides[step].isCommunitySlide && (
                      <motion.div variants={itemVariants} className="space-y-6 pointer-events-none">
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
                          className="inline-flex items-center gap-3 bg-white text-[#8b5cf6] px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl pointer-events-auto"
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
                  style={{ whiteSpace: "pre-line", fontFamily: "var(--font-montserrat)" }}
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

      <PrivacyProtocol
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
              className={`absolute bottom-8 left-8 flex items-center h-14 lowercase text-2xl tracking-tighter z-[1000] pointer-events-none ${slides[step].text}`}
              style={{ fontFamily: "var(--font-urbanosta)" }}
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

export default function OnboardingContainer({
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
            style={{ fontFamily: "var(--font-urbanosta)" }}
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
                  style={{ fontFamily: "var(--font-aonic)" }}
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
                  style={{ fontFamily: "var(--font-aonic)" }}
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
                  style={{ fontFamily: "var(--font-aonic)" }}
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
                    style={{ fontFamily: "var(--font-aonic)" }}
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
