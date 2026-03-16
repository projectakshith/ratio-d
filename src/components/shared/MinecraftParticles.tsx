"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  vx: number;
  vy: number;
}

export default function MinecraftParticles() {
  const { theme } = useTheme();
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleCounter = useRef(0);
  const isSteve = theme.includes("steve");

  const colors = ["#35801C", "#5D4037", "#7A5C4F", "#1D1D1D", "#FFFFFF"];

  const spawnParticles = useCallback((x: number, y: number) => {
    const newParticles: Particle[] = [];
    const count = 8 + Math.floor(Math.random() * 6);

    for (let i = 0; i < count; i++) {
      const size = 4 + Math.floor(Math.random() * 8);
      const angle = Math.random() * Math.PI * 2;
      const velocity = 2 + Math.random() * 4;
      
      newParticles.push({
        id: ++particleCounter.current,
        x,
        y,
        color: colors[Math.floor(Math.random() * colors.length)],
        size,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 2,
      });
    }

    setParticles((prev) => [...prev, ...newParticles].slice(-50));
  }, []);

  useEffect(() => {
    if (!isSteve) return;

    const handleInteraction = (e: MouseEvent | TouchEvent) => {
      let x, y;
      if ("clientX" in e) {
        x = e.clientX;
        y = e.clientY;
      } else {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      }
      spawnParticles(x, y);
    };

    window.addEventListener("mousedown", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);

    return () => {
      window.removeEventListener("mousedown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, [isSteve, spawnParticles]);

  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.2,
            size: Math.max(0, p.size - 0.2),
          }))
          .filter((p) => p.size > 0),
      );
    }, 16);

    return () => clearInterval(interval);
  }, [particles.length]);

  if (!isSteve) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: "1px 1px 0px rgba(0,0,0,0.3)",
          }}
        />
      ))}
    </div>
  );
}
