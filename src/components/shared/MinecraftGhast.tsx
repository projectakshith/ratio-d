"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

export default function MinecraftGhast() {
  const { theme } = useTheme();
  const isSteve = theme?.includes("steve");

  const [ghast, setGhast] = useState<{ x: number; y: number; dir: number } | null>(null);

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
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
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
            className="absolute"
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
