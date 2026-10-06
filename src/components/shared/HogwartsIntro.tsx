"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHogwarts, HOUSE_CONFIG, HogwartsHouse } from "@/context/HogwartsContext";
import { HouseCrest, HOUSE_CREST_COLORS } from "@/components/shared/HouseCrest";
import { useApp } from "@/context/AppContext";

const HOUSE_WELCOMES: Record<HogwartsHouse, string> = {
  gryffindor: "Where courage leads the way.",
  slytherin: "Where ambition shapes the path.",
  ravenclaw: "Where curiosity opens every door.",
  hufflepuff: "Where loyalty and kindness endure.",
};

const HOUSE_EVERYDAY_QUOTES: Record<HogwartsHouse, string[]> = {
  gryffindor: [
    "Courage begins where comfort ends.",
    "Stand boldly when the moment calls.",
    "Bravery is a choice made in the face of fear."
  ],
  slytherin: [
    "Ambition gives direction to determination.",
    "Know your path. Shape your future.",
    "Great things are built with patience and purpose."
  ],
  ravenclaw: [
    "Curiosity opens doors that certainty cannot.",
    "Let knowledge sharpen your path.",
    "A curious mind is never truly still."
  ],
  hufflepuff: [
    "Loyalty makes ordinary journeys meaningful.",
    "Kindness is a strength, not a weakness.",
    "Stay true to what matters."
  ]
};

export default function HogwartsIntro() {
  const { showIntro, showQuote, dismissIntro, dismissQuote, hogwartsHouse } = useHogwarts();
  const { userData, customDisplayName } = useApp();
  const [phase, setPhase] = useState(0);

  const profileName = customDisplayName || userData?.profile?.name || "Student";
  const firstName = profileName.split(" ")[0];

  // Memoize random quote so it doesn't change on re-renders
  const randomQuote = useMemo(() => {
    if (!hogwartsHouse) return "";
    const quotes = HOUSE_EVERYDAY_QUOTES[hogwartsHouse];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }, [hogwartsHouse]);

  // Letter Animation Logic
  useEffect(() => {
    if (!showIntro || !hogwartsHouse) return;

    let timers: NodeJS.Timeout[] = [];
    setPhase(0);

    timers.push(setTimeout(() => setPhase(1), 100)); // Phase 1: Arrival (0 - 1s)
    timers.push(setTimeout(() => setPhase(2), 1000)); // Phase 2: Opening (1s - 2.5s)
    timers.push(setTimeout(() => setPhase(3), 2500)); // Phase 3: Personal greeting (2.5s - 4.5s)
    timers.push(setTimeout(() => setPhase(4), 4500)); // Phase 4: Sorting (4.5s - 6.5s)
    timers.push(setTimeout(() => setPhase(5), 6500)); // Phase 5: House welcome (6.5s - 8.5s)
    timers.push(setTimeout(() => setPhase(6), 8500)); // Phase 6: Transition (8.5s)
    timers.push(setTimeout(() => dismissIntro(), 9500)); // Auto dismiss

    return () => timers.forEach(clearTimeout);
  }, [showIntro, hogwartsHouse, dismissIntro]);

  // Quote Animation Logic
  useEffect(() => {
    if (!showQuote || !hogwartsHouse) return;

    const timer = setTimeout(() => {
      dismissQuote();
    }, 4000); // Quote shows for 4 seconds then fades out

    return () => clearTimeout(timer);
  }, [showQuote, hogwartsHouse, dismissQuote]);

  if (!hogwartsHouse) return null;

  const houseConfig = HOUSE_CONFIG[hogwartsHouse];

  return (
    <>
      {/* -------------------------------------------------------------
          MODE 1: FIRST-TIME LETTER
          ------------------------------------------------------------- */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 6 ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={dismissIntro}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{
                scale: phase >= 1 ? 1 : 0.9,
                opacity: phase >= 1 && phase !== 6 ? 1 : 0,
                y: phase >= 1 ? 0 : 20,
              }}
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
              style={{
                background: "linear-gradient(135deg, #F5E6D3 0%, #E8D5B5 50%, #F0DCC0 100%)",
                border: "1px solid rgba(139, 115, 85, 0.3)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              }}
              className="relative w-full max-w-[340px] rounded-sm p-8 text-[#3A2A1A] overflow-hidden min-h-[340px] flex flex-col justify-center"
              onClick={(e) => {
                e.stopPropagation();
                dismissIntro();
              }}
            >
              <AnimatePresence mode="wait">
                {phase < 3 && (
                  <motion.div
                    key="envelope"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="w-16 h-16 rounded-full shadow-lg border border-black/10 flex items-center justify-center text-3xl"
                      style={{ backgroundColor: HOUSE_CREST_COLORS[hogwartsHouse].accent }}
                    >
                      🦉
                    </motion.div>
                  </motion.div>
                )}

                {phase === 3 && (
                  <motion.div
                    key="greeting"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col gap-6 text-center italic"
                    style={{ fontFamily: 'var(--font-hogwarts-serif, Georgia, serif)' }}
                  >
                    <p className="text-xl">Dear {firstName},</p>
                    <p className="text-lg opacity-90 leading-relaxed">
                      Welcome to Hogwarts.
                    </p>
                  </motion.div>
                )}

                {phase === 4 && (
                  <motion.div
                    key="sorting"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col items-center justify-center gap-6 text-center italic"
                    style={{ fontFamily: 'var(--font-hogwarts-serif, Georgia, serif)' }}
                  >
                    <p className="text-xl leading-relaxed px-4">
                      The Sorting has chosen your house...
                    </p>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6, type: "spring", bounce: 0.5 }}
                      className="text-6xl mt-2"
                    >
                      {houseConfig.emoji}
                    </motion.div>
                  </motion.div>
                )}

                {phase >= 5 && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col items-center justify-center text-center gap-6 absolute inset-0 p-8"
                    style={{ fontFamily: 'var(--font-hogwarts-serif, Georgia, serif)' }}
                  >
                    <HouseCrest house={hogwartsHouse} size={72} className="mx-auto" />

                    <div className="space-y-3">
                      <h2
                        className="text-2xl font-bold tracking-wider uppercase"
                        style={{ color: HOUSE_CREST_COLORS[hogwartsHouse].accent }}
                      >
                        Welcome to {houseConfig.name}
                      </h2>
                      <p className="italic text-[15px] opacity-80 font-medium px-2 leading-relaxed">
                        "{HOUSE_WELCOMES[hogwartsHouse]}"
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: phase >= 2 && phase < 6 ? 0.4 : 0 }}
                className="absolute bottom-4 left-0 right-0 text-center text-[10px] tracking-widest uppercase font-sans font-bold"
              >
                Tap anywhere to skip
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* -------------------------------------------------------------
          MODE 2: EVERYDAY SUBTLE QUOTE
          ------------------------------------------------------------- */}
      <AnimatePresence>
        {showQuote && !showIntro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-[998] flex items-center justify-center bg-black/90 pointer-events-none"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: 0.3, duration: 1 }}
              className="flex flex-col items-center justify-center text-center px-8"
              style={{ fontFamily: 'var(--font-hogwarts-serif, Georgia, serif)' }}
            >
              <p className="text-xl md:text-2xl italic text-white/90 leading-relaxed font-light tracking-wide max-w-lg">
                "{randomQuote}"
              </p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="mt-6 flex items-center gap-3"
              >
                <span className="h-[1px] w-8 bg-white/20 rounded-full" />
                <span
                  className="text-xs uppercase tracking-[0.3em] font-sans"
                  style={{ color: HOUSE_CREST_COLORS[hogwartsHouse].accent }}
                >
                  {houseConfig.name}
                </span>
                <span className="h-[1px] w-8 bg-white/20 rounded-full" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
