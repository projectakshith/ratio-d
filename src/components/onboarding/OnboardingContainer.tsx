"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Smartphone,
  MessageCircle,
  Download,
  Share,
  PlusSquare,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import PrivacyProtocol from "@/components/shared/PrivacyProtocol";
import ThemeSelector from "./ThemeSelector";
import CommunityPreview from "./previews/CommunityPreview";
import { slides } from "./slidesData";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";

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

const isDev = process.env.NODE_ENV === "development";

function PwaSlideshow({ onComplete }: { onComplete?: () => void }) {
  const { loginPromise, setLoginPromise } = useApp();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [introStage, setIntroStage] = useState(0);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isWaitingForLogin, setIsWaitingForLogin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const haptic = (intensity = 10) => {
    if (typeof window !== "undefined" && window.navigator.vibrate) {
      window.navigator.vibrate(intensity);
    }
  };

  useEffect(() => {
    setHasInteracted(false);
  }, [step]);

  useEffect(() => {
    if (loginPromise) {
      loginPromise.catch((err) => {
        setLoginError(err.message || "Invalid credentials");
      });
    }
  }, [loginPromise]);

  useEffect(() => {
    if (step === 0) {
      setIntroStage(0);
      const t1 = setTimeout(() => setIntroStage(1), 800);
      return () => clearTimeout(t1);
    } else {
      setIntroStage(1);
    }
  }, [step]);

  const handleNext = async () => {
    haptic(15);
    if (step < slides.length - 1) {
      setDirection(1);
      setStep((prev) => prev + 1);
    } else {
      if (loginPromise) {
        setIsWaitingForLogin(true);
        try {
          await loginPromise;
        } catch (err) {
          router.replace("/login?error=bg_failed");
          return;
        } finally {
          setIsWaitingForLogin(false);
        }
      }

      localStorage.setItem("ratiod_onboarded", "true");
      setIsExiting(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 600);
    }
  };

  const handlePrev = () => {
    haptic(15);
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
      scale: 1.05,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 } as const,
        opacity: { duration: 0.4 },
      },
    },
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
      transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 250,
      } as const,
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 overflow-hidden bg-[#111111] z-[999]"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <AnimatePresence mode="wait">
          {!slides[step].bg.includes('#111111') && !slides[step].bg.includes('black') && !slides[step].bg.includes('#000F08') && (
            <motion.div 
              key={`glow-${slides[step].id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full h-full"
              style={{
                background: `radial-gradient(circle at center, ${slides[step].text === 'text-[#FFF3E6]' || slides[step].text === 'text-[#F0EDE5]' || slides[step].text === 'text-[#FEE5A8]' || slides[step].text === 'text-[#F2EFEA]' || slides[step].text === 'text-[#EADFD4]' || slides[step].text === 'text-[#D1C9FF]' ? slides[step].text.replace('text-[', '').replace(']', '') : 'rgba(255,255,255,0.8)'} 0%, transparent 70%)`
              }}
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {loginError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#111111] border-2 border-[#FF4D4D] p-8 space-y-6 relative overflow-hidden shadow-[0_0_50px_rgba(255,77,77,0.2)] rounded-[32px]"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FF4D4D]" />
              
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#FF4D4D]/10 flex items-center justify-center">
                  <AlertCircle size={32} className="text-[#FF4D4D]" />
                </div>
                
                <div className="space-y-2">
                  <h2 
                    className="text-2xl font-black lowercase tracking-tighter text-[#FF4D4D]"
                    style={{ fontFamily: 'var(--font-montserrat)' }}
                  >
                    Auth Failed
                  </h2>
                  <p className="text-sm font-bold uppercase tracking-widest text-white/40" style={{ fontFamily: 'var(--font-montserrat)' }}>
                    {loginError}
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <p className="text-[10px] text-center text-white/30 uppercase tracking-[0.2em] leading-relaxed font-bold" style={{ fontFamily: 'var(--font-montserrat)', whiteSpace: 'pre-line' }}>
                  blud your netid or{"\n"}password is wrong :/
                </p>
                
                <button
                  onClick={() => {
                    setLoginPromise(null);
                    setLoginError(null);
                    window.location.href = "/login";
                  }}
                  className="w-full py-4 bg-[#FF4D4D] text-[#111111] font-black lowercase text-xl tracking-tighter hover:brightness-110 transition-all flex items-center justify-center gap-2 rounded-2xl pointer-events-auto"
                  style={{ fontFamily: 'var(--font-montserrat)' }}
                >
                  <ArrowLeft size={18} /> go back to login
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
          style={{ touchAction: "none" }}
          className={`absolute inset-0 flex flex-col ${slides[step].bg} ${slides[step].text} px-8 pt-16 pb-32 overflow-hidden`}
        >
          {/* Transparent drag handle overlay */}
          <div className="absolute inset-0 z-0 pointer-events-auto touch-none" />

          {slides[step].isLogoPhase ? (
            <div className="relative z-10 flex flex-col h-full pointer-events-none">
              <div className="mt-8 space-y-9 flex-1 pointer-events-none">
                <AnimatePresence>
                  {introStage === 1 && (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-9 pointer-events-none"
                    >
                      {slides[step].description ? (
                        <motion.p
                          variants={itemVariants}
                          className="text-xl font-bold tracking-tight opacity-80"
                          style={{ fontFamily: "var(--font-montserrat)", whiteSpace: "pre-line" }}
                        >
                          {slides[step].description}
                        </motion.p>
                      ) : (
                        slides[step].points.map((point, i) => (
                          <motion.div
                            key={point.label}
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
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative mt-auto pointer-events-none">
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
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col h-full pointer-events-none relative z-10"
            >
              <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pb-6 pointer-events-none">
                {slides[step].isThemeSlide ? (
                  <div className="pointer-events-auto h-full">
                    <ThemeSelector onComplete={handleNext} />
                  </div>
                ) : (
                  <>
                    {slides[step].preview && (
                      <motion.div
                        variants={itemVariants}
                        className="w-full flex justify-center pointer-events-none"
                      >
                        {slides[step].preview}
                      </motion.div>
                    )}

                    {slides[step].interactiveComponent && (
                      <motion.div
                        variants={itemVariants}
                        className="w-full flex justify-center pointer-events-auto"
                      >
                        {React.isValidElement(slides[step].interactiveComponent) 
                          ? React.cloneElement(slides[step].interactiveComponent as React.ReactElement<any>, { 
                              onInteraction: () => setHasInteracted(true) 
                            })
                          : slides[step].interactiveComponent}
                      </motion.div>
                    )}

                    <div className="space-y-6 pointer-events-none">
                      {!slides[step].isCommunitySlide && slides[step].points
                        .filter(point => {
                          if (hasInteracted && point.hideAfterInteraction) return false;
                          if (!hasInteracted && point.showAfterInteraction) return false;
                          return true;
                        })
                        .map((point, i) => (
                        <motion.div
                          key={point.label}
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
                    </div>

                    {slides[step].isPrivacySlide && (
                      <motion.button
                        variants={itemVariants}
                        onClick={() => {
                          haptic(10);
                          setIsPrivacyOpen(true);
                        }}
                        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full border border-current/10 pointer-events-auto"
                      >
                        how it works <ArrowRight size={12} />
                      </motion.button>
                    )}
                  </>
                )}
              </div>

              <div className={`mt-auto pt-4 relative z-10 pointer-events-none ${slides[step].isThemeSlide ? 'hidden' : ''}`}>
                {slides[step].isCommunitySlide && (
                  <div className="mt-auto space-y-4 mb-4 pointer-events-none">
                    <div className="space-y-4 pointer-events-none">
                      <div className="space-y-1 px-2 pointer-events-none">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFF3E6]">
                          the lore
                        </p>
                          <p className="text-xs opacity-80 leading-relaxed max-w-[300px]">
                            ratio'd was basically built for fun. thats it. thats the lore. ")
                        </p>
                      </div>

                      <div className="space-y-1 px-2 pointer-events-none">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFF3E6]">
                          join the community
                        </p>
                        <p className="text-xs opacity-80 leading-relaxed max-w-[280px]">
                          for sum fun, bug reports, and feature suggestions.
                          if something breaks, just shout in the group.
                        </p>
                      </div>
                    </div>

                    <div className="relative flex flex-col items-center -mt-8 pointer-events-none">
                      <motion.a
                        initial={{ opacity: 0, y: 10, rotate: 5 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0, 
                          rotate: 5,
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          scale: {
                            repeat: Infinity,
                            duration: 2,
                            ease: "easeInOut"
                          },
                          default: { duration: 0.4 }
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => haptic(20)}
                        href="https://chat.whatsapp.com/D7wymoQ1zrQKqf4Qs4gw91"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-0 right-12 z-20 bg-[#25D366] text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_4px_20px_rgba(37,211,102,0.4)] flex items-center gap-1.5 pointer-events-auto border-2 border-white/20"
                      >
                        join da gng <WhatsappIcon size={12} />
                      </motion.a>
                      <CommunityPreview />
                    </div>
                  </div>
                )}
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
              className={`absolute bottom-8 left-8 flex items-center h-12 lowercase text-2xl tracking-tighter z-[1000] pointer-events-none ${slides[step].text}`}
              style={{ fontFamily: "var(--font-urbanosta)" }}
            >
              ratio'd
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 15, filter: "blur(10px)" }}
              className={`absolute bottom-8 left-[45%] -translate-x-1/2 flex gap-3 items-center h-12 z-[1000] ${slides[step].text}`}
            >
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    haptic(10);
                    setDirection(i > step ? 1 : -1);
                    setStep(i);
                  }}
                  className="group p-0 pointer-events-auto flex items-center justify-center"
                >
                  <div
                    className={`h-1.5 transition-all duration-300 rounded-full ${
                      i === step ? "w-10 bg-current" : "w-2 bg-current opacity-20"
                    }`}
                  />
                </button>
              ))}
            </motion.div>

            <motion.button
              initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
              whileTap={{ scale: 0.9 }}
              disabled={isWaitingForLogin}
              onClick={handleNext}
              className={`absolute bottom-8 right-8 w-12 h-12 rounded-full flex items-center justify-center shadow-lg pointer-events-auto z-[1000] border-2 border-current/10 ${isWaitingForLogin ? 'opacity-50' : ''}`}
              style={{ 
                backgroundColor: slides[step].text.includes('[#') ? slides[step].text.replace('text-[', '').replace(']', '') : '#FFFFFF',
                color: slides[step].bg.includes('[#') ? slides[step].bg.replace('bg-[', '').replace(']', '') : '#000000'
              }}
            >
              {isWaitingForLogin ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : step === slides.length - 1 ? (
                <CheckCircle2 size={20} strokeWidth={3} />
              ) : (
                <ArrowRight size={20} strokeWidth={3} />
              )}
            </motion.button>
          </>
        )}
      </AnimatePresence>
    </motion.div>
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
  
  const { deferredPrompt, canInstall, setDeferredPrompt, setCanInstall, userData, loginPromise } = useApp();
  const router = useRouter();

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

    window.addEventListener("resize", checkDevice);

    checkPWAStatus();
    checkDevice();

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  useEffect(() => {
    if (isPWA === null) return;
    const isOnboarded = localStorage.getItem("ratiod_onboarded") === "true";
    const hasData = localStorage.getItem("ratio_data");
    const hasSession = document.cookie.includes("ratio_session=");

    if (isPWA && !userData && !hasData && !hasSession && !forceOnboarding && !loginPromise) {
      router.replace("/login");
    } else if (isPWA && userData && isOnboarded && !forceOnboarding) {
      router.replace("/");
    }
  }, [isPWA, userData, forceOnboarding, router, loginPromise]);

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
    if (!userData && !forceOnboarding) return <div className="fixed inset-0 bg-[#0c30ff] z-[999]" />;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="fixed inset-0"
      >
        <PwaSlideshow onComplete={onFinish || onComplete || onDevBypass} />
      </motion.div>
    );
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
                    className={`
                      ${canInstall ? "group-hover:translate-y-2 transition-transform" : ""}
                      -translate-y-2
                    `}
                  />                </button>
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
