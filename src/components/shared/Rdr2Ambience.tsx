"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

type DustMote = {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
};

type Cloud = {
  id: number;
  size: number;
  top: number;
  duration: number;
  delay: number;
  opacity: number;
};

type Ember = {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
};

export default function Rdr2Ambience() {
  const { theme } = useTheme();
  const isRdr2 = theme?.includes("rdr2");
  const [mounted, setMounted] = useState(false);
  const [showTumbleweed, setShowTumbleweed] = useState(false);
  const [tumbleweedDirection, setTumbleweedDirection] = useState<"left" | "right">("right");
  const [showWanted, setShowWanted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tumbleweed spawner
  useEffect(() => {
    if (!mounted || !isRdr2) return;
    
    let timeout: NodeJS.Timeout;
    const scheduleTumbleweed = () => {
      // Every 25-40 seconds
      const nextDelay = 25000 + Math.random() * 15000;
      timeout = setTimeout(() => {
        setTumbleweedDirection(Math.random() > 0.5 ? "right" : "left");
        setShowTumbleweed(true);
        
        // Hide after it crosses screen (assume ~10s to cross)
        setTimeout(() => setShowTumbleweed(false), 12000);
        
        scheduleTumbleweed();
      }, nextDelay);
    };
    
    scheduleTumbleweed();
    return () => clearTimeout(timeout);
  }, [mounted, isRdr2]);

  // Wanted poster spawner
  useEffect(() => {
    if (!mounted || !isRdr2) return;
    
    let timeout: NodeJS.Timeout;
    const scheduleWanted = () => {
      // Every 45-70 seconds
      const nextDelay = 45000 + Math.random() * 25000;
      timeout = setTimeout(() => {
        setShowWanted(true);
        // Hide after animation (0.5 + 1.5 + 0.5 = 2.5s)
        setTimeout(() => setShowWanted(false), 2500);
        scheduleWanted();
      }, nextDelay);
    };
    
    scheduleWanted();
    return () => clearTimeout(timeout);
  }, [mounted, isRdr2]);

  const dust = useMemo<DustMote[]>(() => {
    if (!mounted) return [];
    return Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 1 + Math.random() * 2.5,
      duration: 10 + Math.random() * 18,
      delay: Math.random() * 8,
      drift: 12 + Math.random() * 40,
    }));
  }, [mounted]);

  const clouds = useMemo<Cloud[]>(() => {
    if (!mounted) return [];
    // 3-5 clouds
    const count = 3 + Math.floor(Math.random() * 3);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: 150 + Math.random() * 150,
      top: Math.random() * 80,
      duration: 25 + Math.random() * 20,
      delay: Math.random() * 10,
      opacity: 0.08 + Math.random() * 0.1,
    }));
  }, [mounted]);

  const embers = useMemo<Ember[]>(() => {
    if (!mounted) return [];
    const colors = ["#c0621a", "#e87d2a", "#b8933f"];
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 2 + Math.random() * 2,
      duration: 8 + Math.random() * 10,
      delay: Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, [mounted]);

  if (!isRdr2) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[30] overflow-hidden"
      aria-hidden
    >
      {/* 4. Heat Haze */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[60px]"
        animate={{
          scaleY: [1, 1.1, 1],
          opacity: [0.04, 0.08, 0.04],
          skewX: [0, 2, -2, 0],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: "linear-gradient(to bottom, rgba(200,180,150,1), transparent)",
          filter: "blur(4px)",
          transformOrigin: "top",
        }}
      />

      {/* 5. Enhanced Vignette - Layer 1 (Darker edges, sepia) */}
      <div
        className="absolute inset-0 rdr2-vignette mix-blend-multiply"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(50, 30, 15, 0.4) 65%, rgba(15, 5, 0, 0.85) 100%)",
        }}
      />
      
      {/* 5. Enhanced Vignette - Layer 2 (Depth) */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-multiply"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, transparent 40%, rgba(30, 20, 10, 0.2) 80%, rgba(0, 0, 0, 0.6) 100%)",
        }}
      />

      {/* 6. Warm lamp flicker (dual amber/red) */}
      <motion.div
        className="absolute inset-0"
        animate={{ 
          opacity: [0.12, 0.22, 0.14, 0.25, 0.12],
          background: [
            "radial-gradient(ellipse 70% 55% at 50% 18%, rgba(184, 147, 63, 0.18), transparent 65%)",
            "radial-gradient(ellipse 70% 55% at 50% 18%, rgba(184, 147, 63, 0.22), transparent 65%)",
            "radial-gradient(ellipse 70% 55% at 50% 18%, rgba(122, 30, 30, 0.12), transparent 65%)",
            "radial-gradient(ellipse 70% 55% at 50% 18%, rgba(184, 147, 63, 0.25), transparent 65%)",
            "radial-gradient(ellipse 70% 55% at 50% 18%, rgba(184, 147, 63, 0.18), transparent 65%)",
          ]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 7. Film / paper grain */}
      <div className="absolute inset-0 rdr2-film-grain opacity-[0.18] mix-blend-multiply" />

      {/* 1. Gunsmoke Clouds */}
      {clouds.map((c) => (
        <motion.div
          key={`cloud-${c.id}`}
          className="absolute rounded-full blur-[20px]"
          style={{
            top: `${c.top}%`,
            width: c.size,
            height: c.size * 0.6,
            background: "radial-gradient(circle, rgba(120, 110, 95, 1) 0%, rgba(184, 147, 63, 0.4) 50%, transparent 100%)",
            opacity: c.opacity,
          }}
          initial={{ x: "-100%" }}
          animate={{
            x: ["-100%", "100vw"],
            y: [0, 20, -10, 0],
          }}
          transition={{
            x: { duration: c.duration, delay: c.delay, repeat: Infinity, ease: "linear" },
            y: { duration: c.duration * 0.5, delay: c.delay, repeat: Infinity, ease: "easeInOut" }
          }}
        />
      ))}

      {/* 8. Floating dust motes */}
      {dust.map((m) => (
        <motion.span
          key={`dust-${m.id}`}
          className="absolute rounded-full"
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            width: m.size,
            height: m.size,
            backgroundColor: "rgba(237, 225, 200, 0.55)",
            boxShadow: "0 0 4px rgba(184, 147, 63, 0.35)",
          }}
          animate={{
            y: [0, -m.drift, 0],
            x: [0, m.drift * 0.35, 0],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: m.duration,
            delay: m.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* 2. Campfire Embers */}
      {embers.map((e) => (
        <motion.span
          key={`ember-${e.id}`}
          className="absolute rounded-full"
          style={{
            left: `${e.left}%`,
            bottom: "-10px",
            width: e.size,
            height: e.size,
            backgroundColor: e.color,
            boxShadow: `0 0 6px ${e.color}`,
          }}
          animate={{
            y: [0, -(600 + Math.random() * 300)],
            x: [0, (Math.random() - 0.5) * 100],
            opacity: [0, 1, 0.8, 0],
            scale: [0.5, 1.2, 0.8, 0.2],
          }}
          transition={{
            duration: e.duration,
            delay: e.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}

      {/* 3. Tumbleweeds */}
      <AnimatePresence>
        {showTumbleweed && (
          <motion.div
            className="absolute"
            style={{
              bottom: `${Math.random() * 15 + 5}%`,
            }}
            initial={{ x: tumbleweedDirection === "right" ? "-100px" : "100vw", rotate: 0 }}
            animate={{ 
              x: tumbleweedDirection === "right" ? "100vw" : "-100px",
              rotate: tumbleweedDirection === "right" ? 1080 : -1080
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 10, ease: "linear" }}
          >
            <svg width="50" height="50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="40" stroke="#8B7355" strokeWidth="2" strokeDasharray="10 5" fill="transparent" />
              <circle cx="45" cy="55" r="35" stroke="#6b573e" strokeWidth="1.5" strokeDasharray="8 6" fill="transparent" transform="rotate(45 50 50)" />
              <circle cx="55" cy="45" r="38" stroke="#a08560" strokeWidth="1.5" strokeDasharray="12 8" fill="transparent" transform="rotate(-30 50 50)" />
              <circle cx="50" cy="50" r="25" stroke="#8B7355" strokeWidth="2" strokeDasharray="5 5" fill="transparent" transform="rotate(75 50 50)" />
              <path d="M 20 50 Q 50 20 80 50" stroke="#756046" strokeWidth="1.5" fill="transparent" />
              <path d="M 30 70 Q 50 40 70 70" stroke="#907757" strokeWidth="1.5" fill="transparent" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 10. Wanted Poster Flash */}
      <AnimatePresence>
        {showWanted && (
          <motion.div
            className="absolute top-8 right-8 flex items-center justify-center p-3"
            style={{
              width: 120,
              height: 80,
              backgroundColor: "#d9c9a3", // parchment
              border: "2px solid #5a4030", // aged border
              boxShadow: "2px 2px 8px rgba(0,0,0,0.4), inset 0 0 15px rgba(90,64,48,0.4)",
              fontFamily: "'Rye', serif",
              transformOrigin: "center",
            }}
            initial={{ opacity: 0, rotate: -5, scale: 0.9 }}
            animate={{ opacity: 1, rotate: -2, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center w-full">
              <div style={{ color: "#7a1e1e", fontSize: "18px", letterSpacing: "1px", fontWeight: "bold" }}>
                WANTED
              </div>
              <div style={{ color: "#2b2018", fontSize: "8px", marginTop: "4px" }}>
                DEAD OR ALIVE
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 9. Thin gold corner brackets */}
      <div className="absolute inset-3 md:inset-5">
        <span className="absolute top-0 left-0 w-5 h-5 border-t border-l border-[#b8933f]/50" />
        <span className="absolute top-0 right-0 w-5 h-5 border-t border-r border-[#b8933f]/50" />
        <span className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-[#b8933f]/50" />
        <span className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-[#b8933f]/50" />
      </div>
    </div>
  );
}
