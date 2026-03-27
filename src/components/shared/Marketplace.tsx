"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Coins, Sparkles, Clock } from "lucide-react";

interface MarketplaceProps {
  isOpen: boolean;
  onClose: () => void;
}

const slideVariants = {
  hidden: { x: "100%" },
  visible: { 
    x: "0%", 
    transition: { duration: 0.5, ease: [0.6, 0.05, 0.01, 0.9] } 
  },
  exit: { 
    x: "100%", 
    transition: { duration: 0.35, ease: "easeIn" } 
  },
};

export default function Marketplace({ isOpen, onClose }: MarketplaceProps) {
  const featured = [
    {
      name: "Exclusive Theme Pack",
      desc: "Unlock 5 rare deity-themed colour palettes.",
      price: 120,
      tag: "Popular",
    },
    {
      name: "Animated Avatar",
      desc: "Bring your profile avatar to life with subtle animations.",
      price: 80,
      tag: "New",
    },
  ];

  const comingSoon = [
    { name: "Achievement Badges", desc: "Show off milestones on your profile card." },
    { name: "Custom Alert Tones", desc: "Pick your own notification sounds." },
    { name: "Widget Skins", desc: "Reskin your attendance and marks widgets." },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={slideVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-[#111111] text-[#F0EDE5] z-[2000] p-8 flex flex-col"
        >
          <div className="flex justify-between items-center mb-12">
            <span
              className="text-2xl font-black lowercase tracking-tighter"
              style={{ fontFamily: "var(--font-urbanosta)" }}
            >
              ratio'd
            </span>
            <div className="flex items-center gap-4">
              <div 
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20"
                style={{ fontFamily: "var(--font-montserrat)" }}
              >
                <Coins size={14} className="text-[#F0EDE5]" />
                <span className="text-[11px] font-black uppercase tracking-widest text-white">0 creds</span>
              </div>
              <button
                onClick={onClose}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors shrink-0"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <h2
            className="text-[2.5rem] font-black lowercase tracking-tighter leading-[0.9] mb-8"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            market
            <br />
            place.
          </h2>

          <div className="space-y-12 flex-1 overflow-y-auto no-scrollbar pb-8">
            <div className="space-y-6">
              <h3
                className="font-black text-[10px] text-white/40 uppercase tracking-[0.3em] flex items-center gap-2"
                style={{ fontFamily: "var(--font-montserrat)" }}
              >
                <Sparkles size={12} /> Featured
              </h3>
              
              {featured.map((item, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <h4
                      className="font-black text-sm uppercase tracking-[0.2em] text-white"
                      style={{ fontFamily: "var(--font-montserrat)" }}
                    >
                      {item.name}
                    </h4>
                    <span 
                      className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white text-[#111111] shrink-0"
                      style={{ fontFamily: "var(--font-montserrat)" }}
                    >
                      {item.tag}
                    </span>
                  </div>
                  <p
                    className="text-xs opacity-70 leading-relaxed font-bold"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    {item.desc}
                  </p>
                  <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors">
                    <Coins size={12} /> {item.price} — Get Now
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-6 pt-4 border-t border-white/10">
              <h3
                className="font-black text-[10px] text-white/40 uppercase tracking-[0.3em] flex items-center gap-2"
                style={{ fontFamily: "var(--font-montserrat)" }}
              >
                <Clock size={12} /> Coming Soon
              </h3>
              
              {comingSoon.map((item, i) => (
                <div key={i} className="space-y-2 opacity-50">
                  <h4
                    className="font-black text-xs uppercase tracking-[0.2em] text-white"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    {item.name}
                  </h4>
                  <p
                    className="text-xs leading-relaxed font-bold"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10 text-center space-y-3">
               <Coins size={24} className="mx-auto text-white/40" />
               <h4 className="font-black text-xs uppercase tracking-[0.2em] text-white" style={{ fontFamily: "var(--font-montserrat)" }}>Earn Credits</h4>
               <p className="text-[10px] opacity-50 font-bold uppercase tracking-widest leading-relaxed" style={{ fontFamily: "var(--font-montserrat)" }}>
                 Watch ads, Maintained streaks and academic milestones yield credits.
               </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full py-5 bg-[#F0EDE5] text-[#111111] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[0.98] transition-transform"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            close
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}