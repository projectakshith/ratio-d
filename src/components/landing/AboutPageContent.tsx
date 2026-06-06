"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Zap, WifiOff, Shield, Palette, Calculator, Target, Bell, Book, Server, Network, Lock, Fingerprint, Smartphone, RefreshCw, Database } from "lucide-react";
import { useLenis } from "lenis/react";

const BEZIER = [0.16, 1, 0.3, 1] as const;

const GRID_BOXES = [[0,20],[0,40],[0,70],[0,90],[10,10],[10,40],[10,50],[10,80],[20,0],[20,30],[20,60],[20,90],[30,20],[30,40],[30,70],[40,0],[40,10],[40,50],[40,80],[50,30],[50,60],[50,90],[60,20],[60,50],[60,70],[70,0],[70,40],[70,80],[80,10],[80,30],[80,60],[80,90],[90,0],[90,20],[90,50],[90,70]];

const features = [
  { icon: WifiOff, title: "offline first", desc: "schedule, marks, and attendance cached locally — works without wifi" },
  { icon: Shield, title: "device-local encryption", desc: "credentials encrypted with a non-exportable AES-256 key" },
  { icon: Palette, title: "dual themes", desc: "minimalist or brutalist modes for any vibe" },
  { icon: Calculator, title: "attendance predictor", desc: "calculates exactly how many classes you can bunk and still survive" },
  { icon: Target, title: "marks target", desc: "reverse engineers what you need in finals to hit your target grade" },
  { icon: Bell, title: "live alerts", desc: "class reminders, attendance dips, new marks as push notifications" },
  { icon: Book, title: "private notes", desc: "per subject notes, stored locally, never synced anywhere" },
];

const navSections = [
  { id: "hero", label: "what's this", index: 4 },
  { id: "speed", label: "speed", index: 12 },
  { id: "security", label: "security", index: 20 },
  { id: "features", label: "features", index: 28 },
];
const TOTAL_TICKS = 35;

export default function AboutPageContent() {
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const lenis = useLenis((lenisInstance) => {
    let currentId = navSections[0].id;
    for (const { id } of navSections) {
      const element = document.getElementById(id);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.top <= 300) {
          currentId = id;
        }
      }
    }
    if (activeSection !== currentId) {
      setActiveSection(currentId);
    }
  }, [activeSection]);

  useEffect(() => setMounted(true), []);

  const handleScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      if (lenis) {
        lenis.scrollTo(element, { offset: -10, duration: 1.2 });
      } else {
        const y = element.getBoundingClientRect().top + window.scrollY - 10;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0c30ff] bg-checkit-grid relative flex flex-col selection:bg-[#ceff1c] selection:text-[#0c30ff] overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {mounted && GRID_BOXES.map(([y, x], i) => (
          <div
            key={i}
            className={`absolute w-[10vw] h-[10vw] transition-colors ${
              (x * 7 + y * 13) % 2 === 0 ? "bg-white/[0.04]" : "bg-black/[0.12]"
            }`}
            style={{ top: `${y}vh`, left: `${x}vw` }}
          />
        ))}
      </div>

      <motion.div
        initial={{ top: "0%" }}
        animate={{ top: "100%" }}
        transition={{ duration: 0.8, ease: BEZIER }}
        className="fixed left-0 w-full h-screen bg-[#ceff1c] z-[60] pointer-events-none"
      />

      <div className="fixed top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#0c30ff] via-[#0c30ff]/60 to-[#0c30ff]/0 z-[90] pointer-events-none" />

      <div className="fixed top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 z-[100] flex justify-between items-start pointer-events-none">
        
        <Link href="/" className="pointer-events-auto group flex items-center gap-2 text-white bg-black/20 backdrop-blur-md px-4 py-2 rounded-full hover:bg-[#ceff1c] hover:text-[#0c30ff] transition-colors text-xs tracking-widest uppercase shadow-lg border border-white/10 hover:border-[#ceff1c]" style={{ fontFamily: "var(--font-afacad)" }}>
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" strokeWidth={2.5} />
          back
        </Link>

        <div className="hidden lg:flex flex-row gap-[8px] items-start pointer-events-none mt-2 relative">
          <div className="absolute left-0 right-0 top-0 h-[1px] bg-white/5 -z-10" />
          {Array.from({ length: TOTAL_TICKS }).map((_, i) => {
            const section = navSections.find((s) => s.index === i);
            
            if (section) {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={`nav-${i}`}
                  onClick={() => handleScrollTo(section.id)}
                  className="group flex flex-col items-center gap-3 pointer-events-auto outline-none w-[1px]"
                >
                  <div className="relative flex flex-col items-center justify-start h-8 w-[1px] shrink-0">
                    <div className={`w-[1px] transition-all duration-300 origin-top ${isActive ? 'bg-[#ceff1c] h-8' : 'bg-white/30 h-4 group-hover:bg-white/60 group-hover:h-6'}`} />
                    {isActive && (
                      <motion.div 
                        layoutId="nav-indicator-line"
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-8 bg-[#ceff1c]"
                        style={{ boxShadow: '0 0 8px rgba(206, 255, 28, 0.4)' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </div>
                  <span className={`text-[10px] uppercase tracking-[0.2em] transition-all duration-300 leading-[0] whitespace-nowrap ${isActive ? 'text-[#ceff1c] font-bold' : 'text-white/30 group-hover:text-white/60'}`} style={{ fontFamily: "var(--font-afacad)" }}>
                    {section.label}
                  </span>
                </button>
              );
            }

            return (
              <div key={`tick-${i}`} className="h-[6px] w-[1px] bg-white/10 shrink-0" />
            );
          })}
        </div>

        <Link href="/login" className="pointer-events-auto group flex items-center gap-2 text-[#0c30ff] bg-[#ceff1c] backdrop-blur-md px-6 py-2 rounded-full hover:bg-white hover:text-black transition-colors text-xs tracking-widest uppercase shadow-[0_0_15px_rgba(206,255,28,0.4)] border border-[#ceff1c]" style={{ fontFamily: "var(--font-afacad)" }}>
          login
        </Link>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-32 flex flex-col gap-24">
        
        <motion.section 
          id="hero"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: BEZIER }}
          className="flex flex-col gap-6 scroll-mt-32"
        >
          <h1 
            className="text-6xl md:text-8xl lg:text-9xl font-black text-[#ceff1c] lowercase tracking-tight leading-[0.85]"
            style={{ fontFamily: "var(--font-urbanosta)" }}
          >
            ratio'd
          </h1>
          <p className="text-xl md:text-3xl text-white/90 lowercase max-w-3xl leading-snug font-bold mt-4" style={{ fontFamily: "var(--font-afacad)" }}>
            a dashboard built by students, for students. lowkey private, failproof, and designed to replace the stress of traditional academic portals.
          </p>
          <p className="text-sm md:text-base text-white/60 lowercase max-w-2xl font-mono leading-relaxed mt-2 border-l-2 border-[#ceff1c]/50 pl-4">
            the official academia portal is painfully slow and mobile unfriendly. ratio'd wraps it, scrapes the HTML, parses it into clean JSON, and serves it in an interface that doesn't make you want to close the tab immediately.
          </p>
        </motion.section>

        <motion.section 
          id="speed"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: BEZIER }}
          className="flex flex-col gap-8 border-t border-white/10 pt-20 scroll-mt-10"
        >
          <h2 
            className="text-5xl md:text-7xl font-black text-[#ceff1c] lowercase tracking-tight"
            style={{ fontFamily: "var(--font-urbanosta)" }}
          >
            built for<br/>speed.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mt-4">
            <div className="flex gap-5 bg-black/10 backdrop-blur-md p-8 rounded-[32px] border border-white/5">
              <Zap className="w-8 h-8 text-[#ceff1c] shrink-0" />
              <div>
                <h3 className="text-white font-bold text-2xl lowercase tracking-tight" style={{ fontFamily: "var(--font-afacad)" }}>sub-second refresh</h3>
                <p className="text-white/60 font-mono text-sm leading-relaxed mt-3">background refresh keeps your schedule, marks, and attendance updated instantly without ever interrupting your flow.</p>
              </div>
            </div>
            <div className="flex gap-5 bg-black/10 backdrop-blur-md p-8 rounded-[32px] border border-white/5">
              <RefreshCw className="w-8 h-8 text-[#ceff1c] shrink-0" />
              <div>
                <h3 className="text-white font-bold text-2xl lowercase tracking-tight" style={{ fontFamily: "var(--font-afacad)" }}>failproof auth</h3>
                <p className="text-white/60 font-mono text-sm leading-relaxed mt-3">we don't log you out randomly. ratio'd automatically refreshes expired sessions and handles concurrent cookie issues behind the scenes.</p>
              </div>
            </div>
          </div>
        </motion.section>

        <section id="security" className="flex flex-col lg:flex-row gap-16 border-t border-white/10 pt-20 scroll-mt-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: BEZIER }}
            className="flex-1 flex flex-col gap-6"
          >
            <h2 
              className="text-5xl md:text-7xl font-black text-white lowercase tracking-tight"
              style={{ fontFamily: "var(--font-urbanosta)" }}
            >
              zero trust<br/>security.
            </h2>
            <div className="flex flex-col gap-8 mt-4 h-full justify-center">
              <div className="flex gap-5">
                <div className="w-12 h-12 rounded-full bg-[#ceff1c]/10 flex items-center justify-center shrink-0">
                  <Database className="w-6 h-6 text-[#ceff1c]" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-xl font-mono tracking-tight">No Databases</h4>
                  <p className="text-white/60 text-sm font-mono mt-2 leading-relaxed max-w-md">
                    we literally don't use databases. ratio'd runs entirely on stateless cloudflare edge proxies, so we couldn't store your data even if we wanted to.
                  </p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="w-12 h-12 rounded-full bg-[#ceff1c]/10 flex items-center justify-center shrink-0">
                  <Lock className="w-6 h-6 text-[#ceff1c]" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-xl font-mono tracking-tight">Local AES-256-GCM</h4>
                  <p className="text-white/60 text-sm font-mono mt-2 leading-relaxed max-w-md">
                    credentials are encrypted with an unextractable Web Crypto API key. the cipher is stored in localStorage, and the key is permanently bound to your browser's secure store.
                  </p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="w-12 h-12 rounded-full bg-[#ceff1c]/10 flex items-center justify-center shrink-0">
                  <Fingerprint className="w-6 h-6 text-[#ceff1c]" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-xl font-mono tracking-tight">HMAC Payload Signing</h4>
                  <p className="text-white/60 text-sm font-mono mt-2 leading-relaxed max-w-md">
                    every request is cryptographically signed. backends reject any traffic that doesn't originate strictly from our official cloudflare edge proxies.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2, ease: BEZIER }}
            className="flex-1 flex flex-col gap-6"
          >
            <h2 
              className="text-5xl md:text-7xl font-black text-[#ceff1c] lowercase tracking-tight"
              style={{ fontFamily: "var(--font-urbanosta)" }}
            >
              stack &<br/>flow.
            </h2>
            <div className="bg-black/20 backdrop-blur-md rounded-[32px] p-8 border border-[#ceff1c]/20 flex flex-col gap-8 font-mono text-sm shadow-2xl h-full justify-center mt-4">
              <div className="flex items-center gap-4 text-white">
                <Smartphone className="w-6 h-6 text-[#ceff1c] shrink-0" />
                <span className="opacity-80 text-base">Next.js PWA (Static Frontend)</span>
              </div>
              <div className="w-[2px] h-6 bg-[#ceff1c]/30 ml-[11px]" />
              <div className="flex items-center gap-4 text-white">
                <Network className="w-6 h-6 text-[#ceff1c] shrink-0" />
                <span className="opacity-80 text-base">Cloudflare Worker (HMAC Proxy)</span>
              </div>
              <div className="w-[2px] h-6 bg-[#ceff1c]/30 ml-[11px]" />
              <div className="flex items-center gap-4 text-white">
                <Server className="w-6 h-6 text-[#ceff1c] shrink-0" />
                <span className="opacity-80 text-base">FastAPI Backend Cluster</span>
              </div>
              <div className="w-[2px] h-6 bg-[#ceff1c]/30 ml-[11px]" />
              <div className="flex items-center gap-4 text-white">
                <Book className="w-6 h-6 text-[#ceff1c] shrink-0" />
                <span className="opacity-80 text-base">SRM Academia Portal</span>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="features" className="flex flex-col gap-8 border-t border-white/10 pt-20 scroll-mt-10">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: BEZIER }}
            className="text-5xl md:text-7xl font-black text-white lowercase tracking-tight"
            style={{ fontFamily: "var(--font-urbanosta)" }}
          >
            all<br/>features.
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {features.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: BEZIER }}
                className="bg-black/10 backdrop-blur-sm border border-white/10 p-6 rounded-[24px] hover:bg-black/20 transition-colors flex flex-col gap-4 group"
              >
                <div className="w-12 h-12 rounded-full bg-[#ceff1c]/10 flex items-center justify-center text-[#ceff1c] group-hover:scale-110 transition-transform">
                  <feat.icon strokeWidth={2} className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg lowercase tracking-tight" style={{ fontFamily: "var(--font-afacad)" }}>
                    {feat.title}
                  </h3>
                  <p className="text-white/60 text-sm lowercase font-mono mt-2 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
        <motion.section 
          id="lore"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: BEZIER }}
          className="flex flex-col items-center text-center gap-6 mt-8 pt-16 border-t border-white/10 scroll-mt-20"
        >
          <p className="text-white/40 font-mono text-sm max-w-xl leading-relaxed uppercase tracking-widest font-bold">
            "ratio'd was basically built for fun. thats it. thats the lore."
          </p>
          <div className="bg-black/20 text-white/60 font-mono text-xs p-4 rounded-xl max-w-2xl text-center border border-white/5">
            ratio'd is not affiliated with SRM in any way. we don't own the portal, we don't store your data, we just make it less painful to look at. use it at your own risk, gng.
          </div>
        </motion.section>
      </div>
    </div>
  );
}
