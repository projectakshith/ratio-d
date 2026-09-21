"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

type Interaction = {
  id: number;
  x: number;
  y: number;
  timestamp: number;
  cracks: number[];
  smokePuffs: { id: number; dx: number; size: number; delay: number }[];
  size: number;
};

export default function Rdr2InteractionEffects() {
  const { theme } = useTheme();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const isRdr2 = theme.includes("rdr2");

  const addInteraction = useCallback((x: number, y: number) => {
    const numCracks = 4 + Math.floor(Math.random() * 3); // 4 to 6 cracks
    const cracks = Array.from({ length: numCracks }).map(
      () => Math.random() * 360
    );
    const numSmoke = 2 + Math.floor(Math.random() * 2); // 2 to 3 smoke puffs
    const smokePuffs = Array.from({ length: numSmoke }).map((_, i) => ({
      id: i,
      dx: (Math.random() - 0.5) * 30, // Random drift x
      size: 4 + Math.random() * 6, // 4 to 10px size
      delay: Math.random() * 0.1,
    }));

    const newInteraction: Interaction = {
      id: Date.now() + Math.random(),
      x,
      y,
      timestamp: Date.now(),
      cracks,
      smokePuffs,
      size: 8 + Math.random() * 4, // 8 to 12px
    };

    setInteractions((prev) => [...prev, newInteraction].slice(-6));
  }, []);

  useEffect(() => {
    if (!isRdr2) return;

    const handleInteraction = (e: MouseEvent | TouchEvent) => {
      let x, y;
      if ("clientX" in e) {
        x = e.clientX;
        y = e.clientY;
      } else {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      }
      addInteraction(x, y);
    };

    window.addEventListener("mousedown", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);

    return () => {
      window.removeEventListener("mousedown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, [isRdr2, addInteraction]);

  useEffect(() => {
    if (interactions.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setInteractions((prev) => prev.filter((i) => now - i.timestamp < 2000));
    }, 100);

    return () => clearInterval(interval);
  }, [interactions.length]);

  if (!isRdr2) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[31] overflow-hidden"
      aria-hidden="true"
    >
      <AnimatePresence>
        {interactions.map((interaction) => (
          <motion.div
            key={interaction.id}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute pointer-events-none"
            style={{ left: interaction.x, top: interaction.y }}
          >
            {/* Muzzle flash ring */}
            <motion.div
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute rounded-full border-2"
              style={{
                left: -10,
                top: -10,
                width: 20,
                height: 20,
                borderColor: "rgba(184, 147, 63, 0.4)",
              }}
            />

            {/* Bullet hole container */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 1], opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="absolute flex items-center justify-center"
              style={{
                left: -interaction.size / 2,
                top: -interaction.size / 2,
                width: interaction.size,
                height: interaction.size,
              }}
            >
              {/* Bullet Hole SVG */}
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                className="absolute overflow-visible opacity-80"
                style={{ transform: "scale(0.8)" }}
              >
                <circle cx="16" cy="16" r="4" fill="#2b2018" />
                {interaction.cracks.map((angle, i) => (
                  <line
                    key={i}
                    x1="16"
                    y1="16"
                    x2="16"
                    y2="2"
                    stroke="#2b2018"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    style={{
                      transformOrigin: "16px 16px",
                      transform: `rotate(${angle}deg)`,
                    }}
                  />
                ))}
              </svg>
            </motion.div>

            {/* Smoke puffs */}
            {interaction.smokePuffs.map((puff) => (
              <motion.div
                key={puff.id}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 0.6, 0],
                  scale: [0.5, 1.5, 2.5],
                  x: puff.dx,
                  y: -20 - Math.random() * 30,
                }}
                transition={{
                  duration: 1 + Math.random() * 0.5,
                  delay: puff.delay,
                  ease: "easeOut",
                }}
                className="absolute rounded-full blur-sm"
                style={{
                  left: -puff.size / 2,
                  top: -puff.size / 2,
                  width: puff.size,
                  height: puff.size,
                  backgroundColor: "rgba(120, 110, 95, 0.5)", // Smoke grey
                }}
              />
            ))}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
