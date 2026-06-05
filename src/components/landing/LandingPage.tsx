"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

const BEZIER = [0.16, 1, 0.3, 1] as const;

const EYE_STATES = [
  {
    left: "polygon(0 0%, 100% 0%, 100% 100%, 0 100%)",
    right: "polygon(0 0%, 100% 0%, 100% 100%, 0 100%)",
    pupilX: 0,
    pupilY: 0,
    eyeY: 0,
  },
  {
    left: "polygon(0 15%, 100% 40%, 100% 100%, 0 100%)",
    right: "polygon(0 40%, 100% 15%, 100% 100%, 0 100%)",
    pupilX: -8,
    pupilY: -2,
    eyeY: -2,
  },
  {
    left: "polygon(0 40%, 100% 15%, 100% 100%, 0 100%)",
    right: "polygon(0 15%, 100% 40%, 100% 100%, 0 100%)",
    pupilX: 6,
    pupilY: 6,
    eyeY: 2,
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [stage, setStage] = useState<"splash" | "hero">("splash");
  const [isExiting, setIsExiting] = useState(false);
  const [eyeStateIdx, setEyeStateIdx] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setStage("hero"), 1000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (stage === "hero") {
      const interval = setInterval(() => {
        setEyeStateIdx((prev) => (prev + 1) % EYE_STATES.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [stage]);

  const handleLoginClick = () => {
    setIsExiting(true);
    setTimeout(() => {
      router.push("/login");
    }, 600);
  };

  return (
    <div className="h-screen w-full bg-[#0c30ff] relative overflow-hidden flex flex-col justify-center items-center selection:bg-[#ceff1c] selection:text-[#0c30ff]">
      <motion.div
        initial={{ y: "-100%", x: "-50%" }}
        animate={{
          y: stage === "hero" ? "calc(-100% + 40vh)" : "-100%",
          x: "-50%",
        }}
        transition={{ type: "spring", damping: 14, stiffness: 60, delay: 0.1 }}
        className="absolute top-0 left-1/2 w-[200vw] md:w-[150vw] h-[200vw] md:h-[150vw] bg-[#ceff1c] rounded-full z-0 flex justify-center items-end"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0, rotate: -45 }}
          animate={{
            opacity: stage === "hero" ? 1 : 0,
            scale: stage === "hero" ? 1 : 0,
            rotate: stage === "hero" ? 0 : -45,
          }}
          transition={{
            type: "spring",
            damping: 10,
            stiffness: 80,
            delay: 0.6,
          }}
          className="flex gap-3 md:gap-2 z-10 mb-[-3rem] md:mb-[-4rem]"
        >
          <motion.div
            className="w-16 h-24 md:w-20 md:h-28 bg-white relative shadow-sm overflow-hidden"
            style={{ borderRadius: "50%" }}
            animate={{
              clipPath: isExiting
                ? EYE_STATES[0].left
                : (EYE_STATES[eyeStateIdx] || EYE_STATES[0]).left,
              y: isExiting
                ? 0
                : (EYE_STATES[eyeStateIdx] || EYE_STATES[0]).eyeY,
            }}
            transition={{ duration: 0.5, ease: BEZIER }}
          >
            <motion.div
              animate={
                isExiting
                  ? { scale: 1.8, x: -8, y: -15 }
                  : {
                      x: (EYE_STATES[eyeStateIdx] || EYE_STATES[0]).pupilX,
                      y: (EYE_STATES[eyeStateIdx] || EYE_STATES[0]).pupilY,
                    }
              }
              transition={
                isExiting
                  ? { duration: 0.4, type: "spring" }
                  : { duration: 0.5, ease: BEZIER }
              }
              className="w-6 h-6 md:w-8 md:h-10 bg-[#111] absolute bottom-4 right-3 md:bottom-1 md:right-1"
              style={{ borderRadius: "50%" }}
            />
          </motion.div>
          <motion.div
            className="w-16 h-24 md:w-20 md:h-28 bg-white relative shadow-sm overflow-hidden"
            style={{ borderRadius: "50%" }}
            animate={{
              clipPath: isExiting
                ? EYE_STATES[0].right
                : (EYE_STATES[eyeStateIdx] || EYE_STATES[0]).right,
              y: isExiting
                ? 0
                : (EYE_STATES[eyeStateIdx] || EYE_STATES[0]).eyeY,
            }}
            transition={{ duration: 0.5, ease: BEZIER }}
          >
            <motion.div
              animate={
                isExiting
                  ? { scale: 1.8, x: 8, y: -15 }
                  : {
                      x: (EYE_STATES[eyeStateIdx] || EYE_STATES[0]).pupilX,
                      y: (EYE_STATES[eyeStateIdx] || EYE_STATES[0]).pupilY,
                    }
              }
              transition={
                isExiting
                  ? { duration: 0.4, type: "spring" }
                  : { duration: 0.5, ease: BEZIER }
              }
              className="w-6 h-6 md:w-8 md:h-10 bg-[#111] absolute bottom-4 right-3 md:bottom-1 md:right-1"
              style={{ borderRadius: "50%" }}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{
          top: "50%",
          left: "50%",
          x: "-50%",
          y: "-20%",
          scale: 0.8,
          opacity: 0,
        }}
        animate={{
          top: stage === "splash" ? "50%" : "85%",
          left: stage === "splash" ? "50%" : "8%",
          x: stage === "splash" ? "-50%" : "0%",
          y: stage === "splash" ? "-50%" : "-50%",
          scale: stage === "splash" ? 1 : 0.45,
          opacity: 1,
        }}
        transition={{
          duration: stage === "splash" ? 0.6 : 1.2,
          ease: BEZIER,
        }}
        style={{ originX: 0, originY: 0.5 }}
        className="absolute z-20 whitespace-nowrap pointer-events-none"
      >
        <span
          className="text-[#ceff1c] font-black lowercase tracking-tight leading-none text-[12vw] md:text-[8vw]"
          style={{ fontFamily: "var(--font-urbanosta)" }}
        >
          ratio'd
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{
          opacity: stage === "hero" ? 1 : 0,
          x: stage === "hero" ? 0 : 50,
        }}
        transition={{ duration: 1, ease: BEZIER, delay: 0.4 }}
        className="absolute bottom-[35%] md:bottom-[30%] right-[8%] z-20 pointer-events-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: stage === "hero" ? 1 : 0,
            scale: stage === "hero" ? 1 : 0.5,
          }}
          transition={{ duration: 0.8, delay: 2.0, ease: BEZIER }}
          className="absolute -top-6 left-16 md:-top-7 md:left-10 flex items-center rotate-[-4deg] text-[#ceff1c]"
        >
          <svg
            width="32"
            height="24"
            viewBox="0 0 32 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 mt-2"
          >
            <path d="M28 4 Q 14 4, 6 16" />
            <path d="M13 16 L 6 16 L 6 9" />
          </svg>
          <span
            className="text-lg md:text-l font-bold lowercase tracking-tight"
            style={{ fontFamily: "var(--font-afacad)" }}
          >
            and fast too
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: stage === "hero" ? 1 : 0,
            scale: stage === "hero" ? 1 : 0.5,
          }}
          transition={{ duration: 0.8, delay: 4.0, ease: BEZIER }}
          className="absolute -bottom-8 left-20 md:-bottom-7 md:left-10 flex items-center rotate-[6deg] text-[#ceff1c]"
        >
          <svg
            width="32"
            height="24"
            viewBox="0 0 32 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 -mt-2"
          >
            <path d="M28 20 Q 14 20, 6 8" />
            <path d="M13 8 L 6 8 L 6 15" />
          </svg>
          <span
            className="text-lg md:text-sm font-bold lowercase tracking-tight whitespace-nowrap"
            style={{ fontFamily: "var(--font-afacad)" }}
          >
            oh oh and secure too
          </span>
        </motion.div>

        <h2
          className="text-xl md:text-xl lg:text-2xl font-bold lowercase tracking-tight whitespace-nowrap bg-gradient-to-r from-white to-[#ceff1c] text-transparent bg-clip-text"
          style={{ fontFamily: "var(--font-afacad)" }}
        >
          a <span className="relative" style={{ WebkitTextFillColor: "white", color: "white" }}>
            cool
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: stage === "hero" ? "100%" : 0 }}
              transition={{ duration: 0.5, delay: 1.0, ease: BEZIER }}
              className="absolute bottom-0 left-0 h-[2px] bg-[#ceff1c] rounded-full"
            />
          </span> looking academia wrapper.
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 50, y: "-50%" }}
        animate={{
          opacity: stage === "hero" ? 1 : 0,
          x: stage === "hero" ? 0 : 50,
          y: "-50%",
        }}
        transition={{ duration: 1, ease: BEZIER, delay: 0.5 }}
        className="absolute top-[85%] right-[8%] z-20 pointer-events-auto"
      >
        <button
          onClick={handleLoginClick}
          className="group flex items-center gap-2 bg-[#ceff1c] text-[#0c30ff] px-6 py-2 rounded-full font-bold text-base md:text-lg lowercase transition-transform hover:scale-105 active:scale-95 shadow-sm"
          style={{ fontFamily: "var(--font-afacad)" }}
        >
          login
          <ArrowRight
            className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1"
            strokeWidth={3}
          />
        </button>
      </motion.div>

      <motion.div
        initial={{ left: "100%" }}
        animate={{ left: isExiting ? "0%" : "100%" }}
        transition={{ duration: 0.6, ease: BEZIER }}
        className="fixed top-0 w-full h-screen bg-[#ceff1c] z-[60] pointer-events-none"
      />
    </div>
  );
}
