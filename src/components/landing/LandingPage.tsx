"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ReactLenis } from "lenis/react";

const BEZIER = [0.16, 1, 0.3, 1];

const FeatureCard = ({ title, desc, index }: { title: string, desc: string, index: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, delay: 0.05 * index, ease: BEZIER }}
    className="p-6 rounded-[32px] bg-white/[0.03] border border-white/5 transition-all duration-500 hover:bg-white/[0.05]"
  >
    <h3 className="text-xl font-bold text-white mb-3 lowercase tracking-tight">{title}</h3>
    <p className="text-sm text-white/40 leading-relaxed font-medium lowercase tracking-tight">{desc}</p>
  </motion.div>
);

export default function LandingPage() {
  const [stage, setStage] = useState<"intro" | "splash" | "shrink" | "ready">("intro");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { scrollY } = useScroll({ container: scrollRef });
  const heroImageY = useTransform(scrollY, [0, 800], ["0%", "20%"]);
  const heroImageScaleScroll = useTransform(scrollY, [0, 800], [1, 1.1]);

  useEffect(() => {
    const t1 = setTimeout(() => setStage("splash"), 100);
    const t2 = setTimeout(() => setStage("shrink"), 1200); 
    const t3 = setTimeout(() => setStage("ready"), 2400); 
    return () => {
      [t1, t2, t3].forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="h-screen w-full bg-black overflow-hidden relative selection:bg-[#ceff1c] selection:text-[#0c30ff]">
      
      {/* Hero Parallax Image - Perfectly Synced */}
      {stage !== "intro" && (
        <motion.div 
          initial={{ opacity: 0, scale: 1.2 }}
          animate={{ 
            opacity: (stage === "shrink" || stage === "ready") ? 0.4 : 0,
            scale: (stage === "shrink" || stage === "ready") ? 1 : 1.2,
          }}
          style={{ scale: heroImageScaleScroll, y: heroImageY }}
          transition={{ 
            delay: stage === "shrink" ? 0 : 0,
            duration: 1.2, 
            ease: BEZIER 
          }}
          className="fixed inset-0 z-0 pointer-events-none"
        >
          <img src="/screenshots/hero.png" alt="" className="w-full h-full object-cover blur-[1px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
        </motion.div>
      )}

      <ReactLenis root={false} options={{ lerp: 0.05, duration: 1.2 }}>
        <div 
          ref={scrollRef} 
          className="h-screen w-full overflow-y-auto no-scrollbar relative z-10"
        >
          <div className="w-full max-w-5xl mx-auto px-8 md:px-16 pt-[25vh] pb-32">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: (stage === "shrink" || stage === "ready") ? 1 : 0 }}
              transition={{ duration: 0.8, ease: BEZIER }}
              className="relative mb-48 min-h-[60vh] flex flex-col justify-center"
            >
              <div className="space-y-4">
                <motion.h1 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ 
                    opacity: stage === "ready" ? 1 : 0,
                    y: stage === "ready" ? 0 : 30 
                  }}
                  transition={{ delay: 0.2, duration: 1, ease: BEZIER }}
                  className="text-[10vw] md:text-[6vw] font-black text-white lowercase tracking-[-0.06em] leading-[0.85]"
                  style={{ fontFamily: 'var(--font-montserrat)' }}
                >
                  your academia,<br />
                  <span className="text-white/20">redefined.</span>
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ 
                    opacity: stage === "ready" ? 1 : 0,
                    y: stage === "ready" ? 0 : 15 
                  }}
                  transition={{ delay: 0.4, duration: 1, ease: BEZIER }}
                  className="text-lg md:text-xl text-white/40 leading-relaxed font-medium lowercase tracking-tight max-w-xl"
                >
                  experience a faster, cleaner, and more intuitive way to manage your university life. 
                </motion.p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-48">
              {[
                { t: "sub-second sync", d: "background refresh keeps your data fresh without ever interrupting your flow." },
                { t: "offline first", d: "cached locally on your device. check your schedule even without wifi." },
                { t: "secure by design", d: "non-exportable encryption ensures your credentials never leave your store." },
                { t: "attendance pro", d: "predict exactly how many classes you can skip while staying safe." },
                { t: "marks target", d: "know exactly what you need to score to hit your target grade." },
                { t: "dual themes", d: "switch between minimalist and brutalist styles anytime." }
              ].map((feat, i) => (
                <FeatureCard key={i} title={feat.t} desc={feat.d} index={i} />
              ))}
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: BEZIER }}
              className="w-full aspect-video rounded-[40px] overflow-hidden border border-white/10 mb-48 bg-white/5 relative"
            >
              <img src="/screenshots/features.png" alt="" className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent flex items-center px-12">
                <div className="space-y-4 max-w-lg">
                  <h2 className="text-4xl md:text-5xl font-black text-white lowercase tracking-tighter leading-none">everything you need.</h2>
                  <p className="text-lg text-white/60 lowercase tracking-tight">we redesigned every single part of academia from the ground up to be high-performance and aesthetically pleasing.</p>
                </div>
              </div>
            </motion.div>

            <div className="space-y-24 mb-32">
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
                <div className="space-y-6">
                  <h2 className="text-4xl font-black text-white lowercase tracking-tighter leading-none">built for privacy.</h2>
                  <p className="text-lg text-white/30 leading-relaxed lowercase tracking-tight font-medium">we don't have a database for your credentials. everything is encrypted using the web crypto api and stored in your browser's indexeddb.</p>
                </div>
                <div className="space-y-6">
                  <h2 className="text-4xl font-black text-white lowercase tracking-tighter leading-none">open & chill.</h2>
                  <p className="text-lg text-white/30 leading-relaxed lowercase tracking-tight font-medium">ratio'd is a student project. no tracking, no ads, no nonsense. just a wrapper for academia that doesn't suck.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ReactLenis>

      {/* Intro Animation Layer - Perfectly Synced */}
      <motion.div
        initial={{ clipPath: "circle(0% at 50% 50%)", height: "100vh" }}
        animate={{ 
          clipPath: "circle(150% at 50% 50%)",
          height: (stage === "shrink" || stage === "ready") ? "80px" : "100vh",
          transition: { 
            clipPath: { duration: 4, ease: BEZIER },
            height: { delay: 1.2, duration: 1.2, ease: BEZIER }
          }
        }}
        className={`fixed bottom-0 left-0 w-full bg-[#0c30ff] flex items-center z-50 overflow-hidden shadow-[0_-15px_60px_rgba(12,48,255,0.15)] ${(stage === "shrink" || stage === "ready") ? "pointer-events-none" : "pointer-events-auto"}`}
      >
        <div className="relative w-full flex items-center h-full px-12">
          <motion.h1
            initial={{ x: -100, opacity: 0 }}
            animate={{ 
              x: 0, 
              opacity: 1,
              scale: (stage === "shrink" || stage === "ready") ? 0.3 : 1,
            }}
            transition={{ 
              x: { delay: 0.4, duration: 0.8, ease: BEZIER },
              opacity: { delay: 0.4, duration: 0.8, ease: BEZIER },
              scale: { delay: 1.2, duration: 1.2, ease: BEZIER }
            }}
            className="text-[10vw] font-black lowercase tracking-[0em] text-[#ceff1c] leading-none select-none inline-block origin-left"
            style={{ fontFamily: 'var(--font-urbanosta)' }}
          >
            ratio'd
          </motion.h1>

          {stage === "ready" && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: BEZIER }}
              className="ml-auto flex gap-8 items-center pointer-events-auto"
            >
              <div 
                onClick={() => window.location.href = '/dashboard'}
                className="px-8 py-2.5 rounded-full bg-[#ceff1c] text-[#0c30ff] text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform cursor-pointer shadow-[0_0_30px_rgba(206,255,28,0.3)]"
              >
                get started
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
