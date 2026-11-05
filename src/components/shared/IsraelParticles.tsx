"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { Haptics } from "@/utils/shared/haptics";

const STAR_COLORS = ["#4DA3FF", "#0038B8", "#7FB2FF", "#EAF2FF"];

const PHOTOS = ["/israel/epstein.jpg", "/israel/bibi.jpg", "/israel/bibi.jpg"];

const TICKER_LINES = [
  "cottage went to eight shekels. they boycotted the cheese before the government",
  "special situation in the city. your plans have been reclassified",
  "davka. it does not translate. that is the point",
  "after the holidays. the national deadline for never",
  "leaves. pink things. dwarfs. that was the code for the gifts",
  "neither bloc has 61. the beach is open. the coffee is mud",
  "your attendance fell faster than the shekel",
  "87% attendance, 0% guilty verdicts",
  "day order dropped. knesset dissolved.",
  "trial adjourned. again.",
  "the ice cream budget is classified",
  "epstein didn't kill himself",
];

const EPSTEIN_TAP_LINES = [
  "security footage 'malfunctioned'",
  "you can't prove that",
  "the cameras were 'under maintenance'",
  "the list remains 'national security'",
];

const BIBI_TAP_LINES = [
  "+1 seat in the coalition",
  "trial adjourned for another 3 months",
  "the ice cream budget just increased",
  "a new day order has been decreed",
  "the coalition holds. barely.",
];

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  rot: number;
  decay?: number;
  op?: number;
}

interface Floater {
  id: number;
  photo: string;
  y: number;
  fromLeft: boolean;
  duration: number;
}

function StarOfDavid({ size, color, opacity }: { size: number; color: string; opacity: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      style={{ opacity }}
    >
      <polygon points="12,2 21.5,18.5 2.5,18.5" />
      <polygon points="12,22 2.5,5.5 21.5,5.5" />
    </svg>
  );
}

const AMBIENT_STAR_COLORS = ["#4DA3FF", "#7FB2FF", "#EAF2FF"];

export default function IsraelParticles() {
  const { theme } = useTheme();
  const [stars, setStars] = useState<Star[]>([]);
  const [floater, setFloater] = useState<Floater | null>(null);
  const [ticker, setTicker] = useState<string | null>(null);
  const [videoLive, setVideoLive] = useState(false);
  const starCounter = useRef(0);
  const floaterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isIsrael = theme?.includes("israel");

  // the tel-aviv welcome's video takes over the screen — stand down while it plays
  useEffect(() => {
    const onVideo = (e: Event) => setVideoLive(Boolean((e as CustomEvent).detail));
    window.addEventListener("israel:video", onVideo);
    return () => window.removeEventListener("israel:video", onVideo);
  }, []);
  const tickerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spawnStarsAt = useCallback((x: number, y: number) => {
    const newStars: Star[] = [];
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      newStars.push({
        id: ++starCounter.current,
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        size: 10 + Math.floor(Math.random() * 12),
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        vx: Math.cos(angle) * 1.2,
        vy: -(1.5 + Math.random() * 2),
        rot: Math.random() * 360,
      });
    }
    setStars((prev) => [...prev, ...newStars].slice(-40));
  }, []);

  const showTicker = useCallback((line: string) => {
    setTicker(line);
    if (tickerTimeoutRef.current) clearTimeout(tickerTimeoutRef.current);
    tickerTimeoutRef.current = setTimeout(() => setTicker(null), 4200);
  }, []);

  useEffect(() => {
    if (!isIsrael) return;

    const spawnStars = (e: MouseEvent | TouchEvent) => {
      let x, y;
      if ("clientX" in e) {
        x = e.clientX;
        y = e.clientY;
      } else {
        x = e.touches[0]?.clientX ?? 0;
        y = e.touches[0]?.clientY ?? 0;
      }
      spawnStarsAt(x, y);
    };

    window.addEventListener("mousedown", spawnStars);
    window.addEventListener("touchstart", spawnStars);
    return () => {
      window.removeEventListener("mousedown", spawnStars);
      window.removeEventListener("touchstart", spawnStars);
    };
  }, [isIsrael, spawnStarsAt]);

  const handleFloaterClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    spawnStarsAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
    Haptics.success();
    const pool = floater?.photo.includes("epstein") ? EPSTEIN_TAP_LINES : BIBI_TAP_LINES;
    showTicker(pool[Math.floor(Math.random() * pool.length)]);
    setFloater(null);
  };

  useEffect(() => {
    if (stars.length === 0) return;
    const interval = setInterval(() => {
      setStars((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.decay ? p.vy : p.vy - 0.02,
            size: Math.max(0, p.size - (p.decay ?? 0.25)),
            rot: p.rot + (p.decay ? 1 : 4),
          }))
          .filter((p) => p.size > 0),
      );
    }, 16);
    return () => clearInterval(interval);
  }, [stars.length]);

  useEffect(() => {
    if (!isIsrael) return;

    const ambientInterval = setInterval(() => {
      setStars((prev) => {
        if (prev.length > 24) return prev;
        const star: Star = {
          id: ++starCounter.current,
          x: Math.random() * window.innerWidth,
          y: window.innerHeight + 16,
          size: 9 + Math.random() * 10,
          color: AMBIENT_STAR_COLORS[Math.floor(Math.random() * AMBIENT_STAR_COLORS.length)],
          vx: (Math.random() - 0.5) * 0.3,
          vy: -(0.25 + Math.random() * 0.35),
          rot: Math.random() * 360,
          decay: 0.025 + Math.random() * 0.02,
          op: 0.3 + Math.random() * 0.2,
        };
        return [...prev, star].slice(-40);
      });
    }, 2400);

    const spawnFloater = () => {
      if (Math.random() > 0.35) {
        setFloater({
          id: Date.now(),
          // bibi carries the floaters; epstein shows roughly one in three
          photo: Math.random() < 0.34 ? "/israel/epstein.jpg" : "/israel/bibi.jpg",
          y: 12 + Math.random() * 38,
          fromLeft: Math.random() > 0.5,
          duration: 11000 + Math.random() * 3000,
        });
        if (floaterTimeoutRef.current) clearTimeout(floaterTimeoutRef.current);
        floaterTimeoutRef.current = setTimeout(() => setFloater(null), 15000);
      }
    };
    const floaterInterval = setInterval(spawnFloater, 45000);

    const spawnTicker = () => {
      showTicker(TICKER_LINES[Math.floor(Math.random() * TICKER_LINES.length)]);
    };
    const tickerInterval = setInterval(spawnTicker, 40000);
    const firstTicker = setTimeout(spawnTicker, 12000);

    return () => {
      clearInterval(ambientInterval);
      clearInterval(floaterInterval);
      clearInterval(tickerInterval);
      clearTimeout(firstTicker);
      if (tickerTimeoutRef.current) clearTimeout(tickerTimeoutRef.current);
      if (floaterTimeoutRef.current) clearTimeout(floaterTimeoutRef.current);
    };
  }, [isIsrael, showTicker]);

  if (!isIsrael || videoLive) return null;

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-[75] overflow-hidden">
        {stars.map((p) => (
          <div
            key={p.id}
            style={{ position: "absolute", left: p.x, top: p.y, transform: `rotate(${p.rot}deg)` }}
          >
            <StarOfDavid size={p.size} color={p.color} opacity={p.op ?? 0.9} />
          </div>
        ))}

        <AnimatePresence>
          {floater && (
            <motion.div
              key={floater.id}
              initial={{ x: floater.fromLeft ? "-15vw" : "115vw" }}
              animate={{ x: floater.fromLeft ? "115vw" : "-15vw" }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: floater.duration / 1000, ease: "linear" }}
              whileTap={{ scale: 1.15, rotate: 0 }}
              onClick={handleFloaterClick}
              className="pointer-events-auto cursor-pointer"
              style={{
                position: "absolute",
                top: `${floater.y}%`,
                left: 0,
                rotate: floater.fromLeft ? "4deg" : "-4deg",
              }}
            >
              <div
                className="bg-white p-1.5 pb-4 rounded-[6px] shadow-2xl"
                style={{ width: 92, boxShadow: "0 8px 30px rgba(0,0,0,0.45)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={floater.photo}
                  alt=""
                  className="w-full h-[110px] object-cover object-top rounded-[3px]"
                  draggable={false}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {ticker && (
            <motion.div
              key={ticker}
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+72px)] left-4 right-4 flex justify-end"
            >
              <motion.span
                initial={{ x: "70vw", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "60vw", opacity: 0 }}
                transition={{ type: "spring", damping: 24, stiffness: 170 }}
                className="block w-max max-w-full text-[11px] font-bold lowercase tracking-widest bg-theme-surface-90 border border-theme-subtle text-theme-muted px-4 py-2.5 rounded-2xl text-center backdrop-blur-sm"
              >
                {ticker}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
