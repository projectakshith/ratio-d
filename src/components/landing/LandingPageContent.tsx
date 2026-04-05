"use client";
import React from "react";
import { motion } from "framer-motion";

export default function LandingPageContent() {
  return (
    <div className="fixed inset-0 w-full h-full bg-[#0c30ff] flex items-center justify-center selection:bg-[#ceff1c] selection:text-[#0c30ff]">
      <motion.h1 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="text-8xl md:text-[12vw] font-medium lowercase tracking-tighter text-[#ceff1c] leading-none select-none relative"
        style={{ fontFamily: 'var(--font-urbanosta)' }}
      >
        ratio'd
      </motion.h1>
    </div>
  );
}
