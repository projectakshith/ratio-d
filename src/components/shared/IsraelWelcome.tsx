"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Haptics } from "@/utils/shared/haptics";
import { PATH as WELCOME_PATH, VIEWBOX as WELCOME_VIEWBOX } from "./israelPaths/welcome";
import { PATH as TAVIV_PATH, VIEWBOX as TAVIV_VIEWBOX } from "./israelPaths/totelaviv";

// tracks the previous theme value so the welcome only fires on a *switch*
// into the israel theme, not on cold start while already on it
let prevTheme: string | null = null;

type Stage = "greet" | "video" | "sheet";

/**
 * Israel-theme welcome, in the style of fairshift's onboarding: the greeting
 * is traced in ink ("welcome" / "to tel aviv"), a tap plays the epsteindance
 * clip fullscreen (aspect-safe contain fit, audio on by default with a mute
 * toggle), and when the clip ends the Bibi onboarding card takes over before
 * heading to the dashboard. Skip is a plain text button — no border box.
 */
export default function IsraelWelcome() {
  const { theme } = useTheme();
  const [show, setShow] = useState(false);
  const [stage, setStage] = useState<Stage>("greet");
  const [muted, setMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const t = theme ?? "";
    const isIsrael = t.includes("israel");
    // never hijack onboarding or the pre-auth screens — a fresh user picking
    // israel on the theme slide would otherwise get a fullscreen takeover
    const onboarded = localStorage.getItem("ratiod_onboarded") === "true";
    const p = window.location.pathname;
    const inAppShell = onboarded && !p.startsWith("/onboarding") && !p.startsWith("/login") && !p.startsWith("/setup") && p !== "/";
    if (isIsrael && inAppShell && prevTheme !== null && !prevTheme.includes("israel")) {
      Haptics.success();
      setStage("greet");
      setShow(true);
    } else if (!isIsrael && show) {
      // theme switched away mid-welcome — tear it down
      videoRef.current?.pause();
      setShow(false);
      setStage("greet");
      setMuted(false);
    }
    prevTheme = t;
  }, [theme, show]);

  // tell the easter-egg layer to stand down for the whole welcome
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("israel:video", { detail: show }));
    return () => {
      window.dispatchEvent(new CustomEvent("israel:video", { detail: false }));
    };
  }, [show]);

  const dismiss = (toDashboard = false) => {
    Haptics.selection();
    videoRef.current?.pause();
    setShow(false);
    if (toDashboard) {
      window.location.assign("/dashboard");
    }
  };

  const playVideo = () => {
    Haptics.medium();
    setStage("video");
    requestAnimationFrame(() => {
      videoRef.current?.play().catch(() => {});
    });
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[85] overflow-hidden"
          style={{ background: "#0A1428" }}
        >
          <style>{`
            @keyframes io-in {
              from { opacity: 0; filter: blur(10px); transform: scale(1.06); }
              to { opacity: 1; filter: blur(0); transform: scale(1); }
            }
            @keyframes io-glow {
              0% { filter: drop-shadow(0 0 0 transparent); }
              55% { filter: drop-shadow(0 0 22px rgba(77, 163, 255, 0.55)); }
              100% { filter: drop-shadow(0 0 10px rgba(77, 163, 255, 0.18)); }
            }
            @keyframes io-sharpen {
              0% { filter: blur(5px) drop-shadow(0 0 20px rgba(77, 163, 255, 0.5)); }
              100% { filter: blur(0) drop-shadow(0 0 9px rgba(77, 163, 255, 0.18)); }
            }
            @keyframes io-trace { to { stroke-dashoffset: 0; } }
            @keyframes io-fill { to { fill-opacity: 1; } }
            @keyframes io-fade { to { opacity: 1; } }
            @keyframes io-drift-a {
              0%, 100% { transform: translate(-8%, -6%) scale(1); }
              50% { transform: translate(6%, 8%) scale(1.12); }
            }
            @keyframes io-drift-b {
              0%, 100% { transform: translate(6%, 4%) scale(1.08); }
              50% { transform: translate(-6%, -8%) scale(0.95); }
            }
            .io-greet-item {
              opacity: 0;
              animation: io-in 1100ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .io-greet-item.is-l2 { animation-delay: 1.05s; }
            .io-greet path {
              fill: #EAF2FF;
              fill-opacity: 0;
              stroke: url(#io-ink);
              stroke-width: 46px;
              stroke-linejoin: round;
              stroke-linecap: round;
              paint-order: stroke;
              stroke-dasharray: 1;
              stroke-dashoffset: 1;
              animation: io-trace 1.15s cubic-bezier(0.65, 0, 0.35, 1) forwards,
                io-fill 600ms ease forwards,
                io-glow 2200ms ease-out forwards;
            }
            .io-greet.io-l1 path { animation-delay: 0.15s, 2.4s, 0.15s; }
            .io-greet.io-l2 path { animation-delay: 1.2s, 2.4s, 1.2s; }
            .io-greet { animation: io-sharpen 800ms ease forwards; animation-delay: 2.4s; }
            .io-hint { opacity: 0; animation: io-fade 600ms ease 3.9s forwards; }
          `}</style>

          <svg width="0" height="0" className="absolute">
            <defs>
              <linearGradient id="io-ink" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#4DA3FF" />
                <stop offset="55%" stopColor="#7FB2FF" />
                <stop offset="100%" stopColor="#EAF2FF" />
              </linearGradient>
            </defs>
          </svg>

          {stage === "greet" && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
              onClick={playVideo}
            >
              <div
                className="absolute rounded-full blur-3xl"
                style={{
                  width: "70vw", height: "70vw", left: "-12%", top: "-18%",
                  background: "rgba(0, 56, 184, 0.16)",
                  animation: "io-drift-a 14s ease-in-out infinite",
                }}
              />
              <div
                className="absolute rounded-full blur-3xl"
                style={{
                  width: "60vw", height: "60vw", right: "-14%", bottom: "-16%",
                  background: "rgba(77, 163, 255, 0.12)",
                  animation: "io-drift-b 17s ease-in-out infinite",
                }}
              />

              <div className="relative flex flex-col items-center gap-[0.6em]" style={{ fontSize: "clamp(2.4rem, 9.5vw, 5rem)" }}>
                <div className="io-greet-item">
                  <svg
                    className="io-greet io-l1"
                    viewBox={WELCOME_VIEWBOX}
                    style={{ width: "min(92vw, 720px)", height: "1.5em", overflow: "visible" }}
                  >
                    <path d={WELCOME_PATH} pathLength={1} />
                  </svg>
                </div>
                <div className="io-greet-item is-l2">
                  <svg
                    className="io-greet io-l2"
                    viewBox={TAVIV_VIEWBOX}
                    style={{ width: "min(76vw, 600px)", height: "1.5em", overflow: "visible" }}
                  >
                    <path d={TAVIV_PATH} pathLength={1} />
                  </svg>
                </div>
              </div>

              <span
                className="io-hint absolute bottom-[calc(env(safe-area-inset-bottom,0px)+64px)] text-[13px] font-bold lowercase tracking-[0.25em] text-theme-muted"
                style={{ fontFamily: "var(--font-frankruhl), serif" }}
              >
                tap anywhere
              </span>
            </div>
          )}

          {stage !== "greet" && (
            <div className="absolute inset-0 bg-black">
              <video
                ref={videoRef}
                src="/israel/epsteindance.mp4"
                playsInline
                autoPlay
                onTimeUpdate={(e) => {
                  // begin the handoff while the clip is still moving — the
                  // motion blur of the final frames carries the transition
                  const v = e.currentTarget;
                  if (stage === "video" && v.duration && v.duration - v.currentTime < 0.45) {
                    Haptics.success();
                    setStage("sheet");
                  }
                }}
                onEnded={() => {
                  if (stage === "video") {
                    Haptics.success();
                    setStage("sheet");
                  }
                }}
                className={`w-full h-full object-contain transition-all duration-[600ms] ease-out ${stage === "sheet" ? "brightness-[0.55] blur-[2px] scale-[1.06] translate-x-[1.5%]" : ""}`}
              />
              {stage === "sheet" && (
                <motion.div
                  initial={{ opacity: 0, backgroundColor: "#F0EEE9" }}
                  animate={{ opacity: 1, backgroundColor: "#0A1428" }}
                  transition={{
                    opacity: { duration: 0.4, ease: "easeOut" },
                    backgroundColor: { duration: 1.1, ease: "easeOut", delay: 0.3 },
                  }}
                  className="absolute inset-0"
                />
              )}
              {(
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMuted((m) => {
                      const next = !m;
                      if (videoRef.current) videoRef.current.muted = next;
                      Haptics.selection();
                      return next;
                    });
                  }}
                  className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+28px)] right-5 w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform"
                  aria-label={muted ? "unmute" : "mute"}
                >
                  {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
                </button>
              )}
            </div>
          )}

          <AnimatePresence>
            {stage === "sheet" && (
              <motion.div
                initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: "easeOut", delay: 0.4 }}
                className="absolute inset-x-0 bottom-0 px-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)]"
              >
                <div className="bg-theme-bg border border-theme-subtle rounded-[28px] p-6 flex flex-col items-center">
                  <div className="w-10 h-1.5 bg-theme-text-10 rounded-full mb-5" />
                  {(
                    <div className="border border-theme-highlight p-1 rounded-[8px] mb-4 -rotate-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/israel/bibi.jpg"
                        alt="bibi"
                        className="w-28 h-36 object-cover object-top rounded-[4px]"
                        draggable={false}
                      />
                    </div>
                  )}
                  <span
                    className="text-[30px] leading-none font-black tracking-[0.08em] text-theme-text mb-0"
                    style={{ fontFamily: "var(--font-frankruhl), serif" }}
                  >
                    shalom.
                  </span>
                  <div className="w-14 h-[2px] bg-theme-highlight my-3" />
                  <span
                    className="text-[13px] font-light lowercase tracking-wide text-theme-muted text-center mb-6"
                    style={{ fontFamily: "var(--font-frankruhl), serif" }}
                  >
                    you have been admitted to the coalition.
                    <br />
                    your attendance is now a matter of national security.
                  </span>
                  <button
                    onClick={() => dismiss(true)}
                    className="w-full bg-theme-highlight text-theme-bg py-4 rounded-[16px] text-[13px] font-black uppercase tracking-widest active:scale-95 transition-all"
                    style={{ fontFamily: "var(--font-frankruhl), serif" }}
                  >
                    yalla, to the dashboard
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {show && (
            <button
              onClick={() => dismiss()}
              className="absolute top-[calc(env(safe-area-inset-top,0px)+16px)] right-5 text-[13px] font-bold lowercase tracking-[0.2em] text-theme-muted active:text-theme-text transition-colors z-10"
              style={{ fontFamily: "var(--font-frankruhl), serif" }}
            >
              skip
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
