"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

const BEZIER = [0.16, 1, 0.3, 1] as const;
const FULL_OPEN = "polygon(0 0%, 100% 0%, 100% 100%, 0 100%)";

const EYE_STATES = [
  { left: FULL_OPEN, right: FULL_OPEN, pupilX: 0, pupilY: 0, eyeY: 0 },
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

const LOOK_UP_BASE = { left: FULL_OPEN, right: FULL_OPEN, eyeY: -6 };
const LOOK_UP_STATES = [
  { ...LOOK_UP_BASE, pupilX: -30, pupilY: -62 },
  { ...LOOK_UP_BASE, pupilX: -20, pupilY: -62 },
  { ...LOOK_UP_BASE, pupilX: -8, pupilY: -62 },
  { ...LOOK_UP_BASE, pupilX: 2, pupilY: -62 },
];

const LOGIN_HOVER_STATE = {
  left: "polygon(0 0%, 100% 0%, 100% 75%, 0 75%)",
  right: "polygon(0 0%, 100% 0%, 100% 75%, 0 75%)",
  pupilX: 16,
  pupilY: -10,
  eyeY: -6,
};

const IMAGE_HOVER_STATE = {
  left: FULL_OPEN,
  right: FULL_OPEN,
  pupilX: -30,
  pupilY: 20,
  eyeY: 4,
};

const GRID_BOXES = [
  [0, 20],
  [0, 40],
  [0, 70],
  [0, 90],
  [10, 10],
  [10, 40],
  [10, 50],
  [10, 80],
  [20, 0],
  [20, 30],
  [20, 60],
  [20, 90],
  [30, 20],
  [30, 40],
  [30, 70],
  [40, 0],
  [40, 10],
  [40, 50],
  [40, 80],
  [50, 30],
  [50, 60],
  [50, 90],
  [60, 20],
  [60, 50],
  [60, 70],
  [70, 0],
  [70, 40],
  [70, 80],
  [80, 10],
  [80, 30],
  [80, 60],
  [80, 90],
  [90, 0],
  [90, 20],
  [90, 50],
  [90, 70],
];

const NAV_ITEMS = [
  { path: "/about", label: "about" },
  { path: "/cli", label: "cli" },
  { path: "/lore", label: "lore" },
  { path: "/devs", label: "devs" },
];

const NAV_BTN_CLASS =
  "hover:text-black transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:h-[1px] after:w-0 after:bg-black hover:after:w-full after:transition-all after:duration-300";

type EyeState = {
  left: string;
  right: string;
  pupilX: number;
  pupilY: number;
  eyeY: number;
};

function Eye({
  side,
  state,
  isExiting,
}: {
  side: "left" | "right";
  state: EyeState;
  isExiting: boolean;
}) {
  const exitPupilX = side === "left" ? -8 : 8;
  return (
    <motion.div
      className="w-16 h-24 md:w-20 md:h-28 bg-white relative shadow-sm overflow-hidden"
      style={{ borderRadius: "50%" }}
      animate={{
        clipPath: isExiting ? EYE_STATES[0][side] : state[side],
        y: isExiting ? 0 : state.eyeY,
      }}
      transition={{ duration: 0.5, ease: BEZIER }}
    >
      <motion.div
        animate={
          isExiting
            ? { scale: 1.8, x: exitPupilX, y: -15 }
            : { x: state.pupilX, y: state.pupilY }
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
  );
}

function ArrowCallout({
  text,
  direction,
  stage,
  delay,
  className,
}: {
  text: string;
  direction: "up" | "down";
  stage: string;
  delay: number;
  className: string;
}) {
  const isUp = direction === "up";
  const pathD = isUp ? "M28 4 Q 14 4, 6 16" : "M28 20 Q 14 20, 6 8";
  const arrowD = isUp ? "M13 16 L 6 16 L 6 9" : "M13 8 L 6 8 L 6 15";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: stage === "hero" ? 1 : 0,
        scale: stage === "hero" ? 1 : 0.5,
      }}
      transition={{ duration: 0.8, delay, ease: BEZIER }}
      className={className}
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
        className={isUp ? "mr-2 mt-2" : "mr-2 -mt-2"}
      >
        <path d={pathD} />
        <path d={arrowD} />
      </svg>
      <span
        className="text-lg md:text-sm font-bold lowercase tracking-tight whitespace-nowrap"
        style={{ fontFamily: "var(--font-afacad)" }}
      >
        {text}
      </span>
    </motion.div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [stage, setStage] = useState<"splash" | "hero">("splash");
  const [exitPath, setExitPath] = useState<string | null>(null);
  const isExiting = exitPath !== null;
  const [eyeStateIdx, setEyeStateIdx] = useState(0);
  const [hoveredNavIdx, setHoveredNavIdx] = useState<number | null>(null);
  const [isHoveringLogin, setIsHoveringLogin] = useState(false);
  const [isHoveringImage, setIsHoveringImage] = useState(false);

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

  const handleNavClick = (path: string) => {
    setExitPath(path);
    setTimeout(() => router.push(path), path === "/about" ? 800 : 600);
  };

  const currentEyeState = isHoveringImage
    ? IMAGE_HOVER_STATE
    : isHoveringLogin
      ? LOGIN_HOVER_STATE
      : hoveredNavIdx !== null
        ? LOOK_UP_STATES[hoveredNavIdx]
        : EYE_STATES[eyeStateIdx] || EYE_STATES[0];

  return (
    <div className="h-[100dvh] w-full bg-[#0c30ff] bg-checkit-grid relative overflow-hidden flex flex-col justify-center items-center selection:bg-[#ceff1c] selection:text-[#0c30ff]">
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {GRID_BOXES.map(([y, x], i) => (
          <div
            key={i}
            className={`absolute w-[10vw] h-[10vw] transition-colors ${
              (x * 7 + y * 13) % 2 === 0 ? "bg-white/[0.02]" : "bg-black/[0.16]"
            }`}
            style={{ top: `${y}vw`, left: `${x}vw` }}
          />
        ))}
      </div>


      <motion.div
        initial={{ y: "-100%", x: "-50%", borderRadius: "50%" }}
        animate={{
          y:
            exitPath === "/about"
              ? "calc(-100% + 150vh)"
              : stage === "hero"
                ? "calc(-100% + 40vh)"
                : "-100%",
          x: "-50%",
          borderRadius: "50%",
        }}
        transition={
          exitPath === "/about"
            ? { duration: 0.8, ease: BEZIER }
            : { type: "spring", damping: 14, stiffness: 60, delay: 0.1 }
        }
        className="absolute top-0 left-1/2 w-[200vw] md:w-[150vw] h-[200vw] md:h-[150vw] bg-[#ceff1c] z-[15] flex justify-center items-end"
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
          <Eye side="left" state={currentEyeState} isExiting={isExiting} />
          <Eye side="right" state={currentEyeState} isExiting={isExiting} />
        </motion.div>
      </motion.div>


      <motion.div
        initial={{
          top: "50%",
          left: "50%",
          x: "-50%",
          y: "-50%",
          scale: 0.8,
          opacity: 0,
        }}
        animate={{
          opacity: stage === "splash" ? 1 : 0,
          scale: stage === "splash" ? 1 : 1.1,
          pointerEvents: stage === "splash" ? "auto" : "none",
        }}
        transition={{
          duration: 0.5,
          delay: stage === "splash" ? 0 : 0.3,
          ease: BEZIER,
        }}
        className="absolute z-[80] whitespace-nowrap pointer-events-none"
      >
        <span
          className="font-black text-[#ceff1c] lowercase tracking-tight leading-none text-[12vw] md:text-[8vw]"
          style={{ fontFamily: "var(--font-urbanosta)" }}
        >
          ratio'd
        </span>
      </motion.div>


      <motion.div
        initial={{ opacity: 0, y: 100, rotate: -45 }}
        animate={{
          opacity: stage === "hero" ? 1 : 0,
          y: stage === "hero" ? 0 : 100,
          rotate: -45,
          pointerEvents: stage === "hero" ? "auto" : "none",
        }}
        transition={{ duration: 1, ease: BEZIER, delay: 1.6 }}
        onMouseEnter={() => setIsHoveringImage(true)}
        onMouseLeave={() => setIsHoveringImage(false)}
        className="absolute bottom-[-20vw] md:bottom-[-12vw] left-[-8%] md:left-[-9%] w-[90vw] md:w-[55vw] max-w-[900px] z-[5]"
      >
        <img
          src="/mockup.png"
          alt="ratio'd mockup"
          className="w-full h-auto object-contain drop-shadow-2xl"
        />
      </motion.div>


      <motion.div
        initial={{ opacity: 0, y: -20, x: "-50%" }}
        animate={{
          opacity: exitPath ? 0 : stage === "hero" ? 1 : 0,
          y: stage === "hero" ? 0 : -20,
          pointerEvents: stage === "hero" ? "auto" : "none",
        }}
        transition={{ duration: 0.8, delay: exitPath ? 0 : 0.8, ease: BEZIER }}
        onMouseLeave={() => setHoveredNavIdx(null)}
        className="absolute top-4 md:top-6 left-1/2 z-[30] flex flex-row justify-center w-full max-w-3xl gap-8 md:gap-16 text-xs md:text-sm tracking-wider lowercase text-[#0c30ff]"
        style={{ fontFamily: "aonic" }}
      >
        {NAV_ITEMS.map((item, i) => (
          <button
            key={item.path}
            onClick={() => handleNavClick(item.path)}
            onMouseEnter={() => setHoveredNavIdx(i)}
            className={NAV_BTN_CLASS}
          >
            {item.label}
          </button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{
          opacity: stage === "hero" ? 1 : 0,
          x: stage === "hero" ? 0 : 50,
        }}
        transition={{ duration: 1, ease: BEZIER, delay: 1.2 }}
        className="absolute bottom-[75vw] md:bottom-[20vw] right-[8%] z-10 pointer-events-auto"
      >
        <ArrowCallout
          text="and fast too"
          direction="up"
          stage={stage}
          delay={2.0}
          className="absolute -top-6 left-16 md:-top-7 md:left-10 flex items-center rotate-[-4deg] text-[#ceff1c]"
        />

        <ArrowCallout
          text="oh oh and secure too"
          direction="down"
          stage={stage}
          delay={4.0}
          className="absolute -bottom-8 left-20 md:-bottom-7 md:left-10 flex items-center rotate-[6deg] text-[#ceff1c]"
        />

        <h2
          className="text-xl md:text-xl lg:text-2xl font-bold lowercase tracking-tight whitespace-nowrap bg-gradient-to-r from-white to-[#ceff1c] text-transparent bg-clip-text"
          style={{ fontFamily: "var(--font-afacad)" }}
        >
          a{" "}
          <span
            className="relative"
            style={{ WebkitTextFillColor: "white", color: "white" }}
          >
            cool
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: stage === "hero" ? "100%" : 0 }}
              transition={{ duration: 0.5, delay: 1.0, ease: BEZIER }}
              className="absolute bottom-0 left-0 h-[2px] bg-[#ceff1c] rounded-full"
            />
          </span>{" "}
          looking academia wrapper.
        </h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: stage === "hero" ? 1 : 0,
            y: stage === "hero" ? 0 : 20,
          }}
          transition={{ duration: 0.8, delay: 1.0, ease: BEZIER }}
          className="absolute -bottom-[90px] md:-bottom-[100px] left-0 w-full flex justify-center"
        >
          <button
            onMouseEnter={() => setIsHoveringLogin(true)}
            onMouseLeave={() => setIsHoveringLogin(false)}
            onClick={() => handleNavClick("/login")}
            className="group flex items-center gap-2 bg-[#ceff1c] text-[#0c30ff] px-6 py-2.5 rounded-full font-bold text-lg md:text-xl lowercase transition-transform hover:scale-105 active:scale-95 shadow-lg transform -rotate-3"
            style={{ fontFamily: "var(--font-afacad)" }}
          >
            login
            <ArrowRight
              className="w-5 h-5 transition-transform group-hover:translate-x-1"
              strokeWidth={3}
            />
          </button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ left: "100%", top: 0 }}
        animate={{ left: exitPath === "/login" ? "0%" : "100%", top: 0 }}
        transition={{ duration: 0.6, ease: BEZIER }}
        className="fixed top-0 w-full h-screen bg-[#ceff1c] z-[60] pointer-events-none"
      />
    </div>
  );
}
