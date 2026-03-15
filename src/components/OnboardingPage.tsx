"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Database,
  ShieldCheck,
  KeyRound,
  Zap,
  CloudOff,
  Fingerprint,
} from "lucide-react";

const slides = [
  {
    id: "core",
    bg: "bg-[#0c30ff]",
    text: "text-[#ceff1c]",
    subtitle: "CORE EXPERIENCE",
    points: [
      {
        icon: Zap,
        label: "Lightning Fast",
        desc: "Zero loading screens. Instantaneous data delivery.",
      },
      {
        icon: CloudOff,
        label: "Always Online",
        desc: "Full offline mode. View your schedule even without Wi-Fi.",
      },
      {
        icon: Fingerprint,
        label: "Persistent",
        desc: "Kills 'Session Expired' errors. Stay logged in forever.",
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
    points: [
      {
        icon: Database,
        label: "0ms Latency",
        desc: "100% Local-first IndexedDB storage. Zero external databases.",
      },
      {
        icon: ShieldCheck,
        label: "AES-256 Vault",
        desc: "Client-side cryptographic vault for your university credentials.",
      },
      {
        icon: KeyRound,
        label: "Token Bypass",
        desc: "Native session hijacking to override concurrent login blocks.",
      },
    ],
  },
];

export default function OnboardingPage({
  onComplete,
}: {
  onComplete?: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [introStage, setIntroStage] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (step === 0 && direction === 1 && mounted) {
      setIntroStage(0);
      const t1 = setTimeout(() => setIntroStage(1), 1400);
      return () => clearTimeout(t1);
    } else if (step === 0 && direction === -1) {
      setIntroStage(1); 
    }
  }, [step, direction, mounted]);

  const handleNext = () => {
    if (step < 1) {
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

  if (!mounted) {
    return <div className="fixed inset-0 bg-[#0c30ff] z-[999]" />;
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#111111] z-[999]">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        {step === 0 ? (
          <motion.div
            key="slide-0"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className={`absolute inset-0 flex flex-col ${slides[0].bg} ${slides[0].text} px-8 pt-16 pb-32`}
          >
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
                {slides[0].subtitle}
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
                  {"ratio'd".split("").map((char, index) => (
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
                className="mt-12 space-y-8"
              >
                {slides[0].points.map((point, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <point.icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm uppercase tracking-wider">{point.label}</h3>
                      <p className="text-xs opacity-60 mt-1">{point.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="slide-1"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className={`absolute inset-0 flex flex-col ${slides[1].bg} ${slides[1].text} px-8 pt-16 pb-32`}
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] mb-6 opacity-40">
              {slides[1].subtitle}
            </span>
            <h1 className={slides[1].titleClass} style={{ whiteSpace: "pre-line" }}>
              {slides[1].title}
            </h1>
            <div className="mt-12 space-y-8">
              {slides[1].points.map((point, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <point.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-wider">{point.label}</h3>
                    <p className="text-xs opacity-60 mt-1">{point.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-8 left-8 right-8 flex justify-between items-center z-[1000]">
        <div className="flex gap-3">
          {[0, 1].map((i) => (
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
          className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-lg pointer-events-auto"
        >
          <ArrowRight size={24} strokeWidth={3} />
        </motion.button>
      </div>
    </div>
  );
}
