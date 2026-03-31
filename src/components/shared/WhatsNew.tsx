"use client";
import React from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { X, UserCircle2, BarChart3, Clock, Calendar, CheckCircle2 } from "lucide-react";

interface WhatsNewProps {
  isOpen: boolean;
  onClose: () => void;
}

const slideVariants: Variants = {
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
      icon: <Clock size={18} />,
      title: "History Logging",
      desc: "keep track of every attendance shift and mark update from the last 48 hours in your settings log",
      isNew: true,
    },
    {
      icon: <UserCircle2 size={18} />,
      title: "Avatar Customisation",
      desc: "randomise your profile avatar with new seeds until you find the perfect one from the settings page",
      isNew: true,
    },
    {
      icon: <Calendar size={18} />,
      title: "Recover Dates",
      desc: "see exactly which dates you need to attend to hit your attendance targets",
      isNew: true,
    },
    {
      icon: <BarChart3 size={18} />,
      title: "OD/ML Prediction",
      desc: "we have more accurate logic for predicting leaves and od/ml stuff",
      isNew: true,
    },
    {
      icon: <CheckCircle2 size={18} />,
      title: "Bug Fixes",
      desc: "fixed sum bugs and improved stability. if something still breaks just shout in the community",
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
          className="fixed inset-0 bg-theme-bg text-theme-text z-[2000] p-8 flex flex-col"
        >
          <div className="flex justify-between items-center mb-12">
            <span
              className="text-2xl font-black lowercase tracking-tighter text-theme-text"
              style={{ fontFamily: "var(--font-urbanosta)" }}
            >
              ratio'd
            </span>
            <button
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-theme-surface border border-theme-border text-theme-text transition-colors shrink-0"
            >
              <X size={24} />
            </button>
          </div>

          <h2
            className="text-[2.5rem] font-black lowercase tracking-tighter leading-[0.9] mb-8 text-theme-text"
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
                  <div className="text-theme-highlight">
                    {item.icon}
                  </div>
                  <h3
                    className="font-black text-sm uppercase tracking-[0.2em] text-theme-text"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    {item.title}
                  </h3>
                </div>
                
                {item.isNew && (
                  <span 
                    className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-theme-highlight text-theme-bg"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    NEW
                  </span>
                )}

                <p
                  className="text-xs opacity-70 leading-relaxed font-bold text-theme-text"
                  style={{ fontFamily: "var(--font-montserrat)" }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full py-5 bg-theme-emphasis text-theme-bg font-black uppercase tracking-[0.2em] rounded-2xl active:scale-[0.98] transition-transform"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            awesome
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
