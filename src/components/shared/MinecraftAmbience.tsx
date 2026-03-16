"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

export default function MinecraftAmbience() {
  const { theme } = useTheme();
  const isSteve = theme?.includes("steve");

  const [bgIndex, setBgIndex] = useState(0);
  const bgs = ["/mc_bg/mc_bg_1.gif", "/mc_bg/mc_bg_2.gif", "/mc_bg/mc_bg_3.gif"];

  const [enderman, setEnderman] = useState<{ x: number; y: number } | null>(null);
  const [ghast, setGhast] = useState<{ x: number; y: number; dir: number } | null>(null);

  useEffect(() => {
    if (!isSteve) return;
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % bgs.length);
    }, 30000);
    return () => clearInterval(interval);
  }, [isSteve, bgs.length]);

  useEffect(() => {
    if (!isSteve) return;
    
    const teleportEnderman = () => {
      if (Math.random() > 0.4) {
        const x = Math.random() * 80 + 10;
        const y = Math.random() * 60 + 20;
        setEnderman({ x, y });
        setTimeout(() => setEnderman(null), 5000 + Math.random() * 3000);
      }
    };

    const interval = setInterval(teleportEnderman, 15000);
    return () => clearInterval(interval);
  }, [isSteve]);

  useEffect(() => {
    if (!isSteve) return;

    const spawnGhast = () => {
      if (Math.random() > 0.5) {
        const startX = Math.random() > 0.5 ? -20 : 120;
        const startY = 10 + Math.random() * 30;
        setGhast({ x: startX, y: startY, dir: startX < 0 ? 1 : -1 });
        
        setTimeout(() => setGhast(null), 15000);
      }
    };

    const interval = setInterval(spawnGhast, 25000);
    return () => clearInterval(interval);
  }, [isSteve]);

  if (!isSteve) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          [data-theme="steve"] .bg-theme-bg,
          [data-theme="steve"] .bg-theme-card,
          [data-theme="steve"] .bg-theme-surface,
          [data-theme="steve"] main {
            background-color: transparent !important;
          }
          [data-theme="steve"] html {
            background-color: #F7F7F7 !important;
          }
        `,
        }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={bgIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 z-[-2]"
        >
          <img
            src={bgs[bgIndex]}
            alt="Minecraft Background"
            className="w-full h-full object-cover"
            style={{ 
              imageRendering: "pixelated",
              filter: "brightness(0.9) contrast(1.1)"
            }}
          />
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {enderman && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.5 }}
            style={{ left: `${enderman.x}%`, top: `${enderman.y}%` }}
            className="absolute z-[9999] -translate-x-1/2 -translate-y-1/2"
          >
            <div className="relative">
              <img
                src="/enderman_idle.gif"
                alt="Enderman"
                className="h-56 w-auto object-contain"
                style={{ imageRendering: "pixelated" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                {Array.from({ length: 10 }).map((_, i) => (
                  <motion.div
                    key={Math.random() + i}
                    animate={{
                      y: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 200],
                      x: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100],
                      opacity: [0, 1, 0],
                      scale: [0.5, 1.5, 0.2],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.8 + Math.random(),
                    }}
                    className="absolute w-2 h-2 bg-[#ff00ff] shadow-[0_0_8px_#ff00ff]"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ghast && (
          <motion.div
            initial={{ x: `${ghast.x}%`, y: `${ghast.y}%`, opacity: 0 }}
            animate={{ 
              x: ghast.dir > 0 ? "120%" : "-20%",
              y: [`${ghast.y}%`, `${ghast.y + 10}%`, `${ghast.y - 5}%`, `${ghast.y + 5}%`],
              opacity: 1 
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              x: { duration: 15, ease: "linear" },
              y: { duration: 15, ease: "easeInOut", repeat: Infinity },
              opacity: { duration: 1 }
            }}
            className="absolute z-[9998]"
          >
            <img
              src="/ghast.gif"
              alt="Ghast"
              className="h-48 w-auto object-contain"
              style={{ 
                imageRendering: "pixelated",
                transform: ghast.dir > 0 ? "scaleX(-1)" : "none"
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
