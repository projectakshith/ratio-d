"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Zap, Bell, Star } from "lucide-react";

interface WhatsNewProps {
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

export default function WhatsNew({ isOpen, onClose }: WhatsNewProps) {
  const updates = [

    {
      icon: <Zap size={18} className="text-white/60" />,
      version: "v1.0.2",
      date: "Mar 2025",
      title: "Marketplace !!",
      desc: "Use your credits to unlock exclusive theme packs, animated avatars, and personalized enhancements.",
      isNew: true,
    },

    {
      icon: <Sparkles size={18} className="text-white/60" />,
      version: "v1.0.1",
      date: "Latest",
      title: "Avatar Customisation",
      desc: "Randomise your profile avatar with a new seed anytime from the Settings page.",
      isNew: false,
    },

    {
      icon: <Star size={18} className="text-white/60" />,
      version: "v1.0.0",
      date: "Jan 2025",
      title: "Theme Collections",
      desc: "Pick from a curated set of minimalist and brutalist themes with named deity palettes.",
      isNew: false,
    },
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
            <button
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors shrink-0"
            >
              <X size={24} />
            </button>
          </div>

          <h2
            className="text-[2.5rem] font-black lowercase tracking-tighter leading-[0.9] mb-8"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            what's
            <br />
            new.
          </h2>

          <div className="space-y-10 flex-1 overflow-y-auto no-scrollbar pb-8">
            {updates.map((item, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3
                    className="font-black text-sm uppercase tracking-[0.2em] flex items-center gap-3 text-white"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    {item.icon} {item.title}
                  </h3>
                </div>
                
                <div className="flex items-center gap-2">
                  <span 
                    className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      item.isNew ? "bg-white text-[#111111]" : "bg-white/10 text-white/70"
                    }`}
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    {item.isNew ? "NEW" : item.version}
                  </span>
                  <span 
                    className="text-[10px] opacity-50 font-bold uppercase tracking-widest"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    {item.date}
                  </span>
                </div>

                <p
                  className="text-xs opacity-70 leading-relaxed font-bold"
                  style={{ fontFamily: "var(--font-montserrat)" }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
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