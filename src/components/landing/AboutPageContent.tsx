"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AboutPageContent() {
  const BEZIER = [0.16, 1, 0.3, 1] as const;

  return (
    <div className="w-full h-screen bg-[#0c30ff] relative overflow-hidden">
      <motion.div
        initial={{ top: "0%" }}
        animate={{ top: "100%" }}
        transition={{ duration: 0.8, ease: BEZIER }}
        className="fixed left-0 w-full h-screen bg-[#ceff1c] z-[60] pointer-events-none"
      />

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: BEZIER }}
        className="h-full w-full flex flex-col justify-center items-center p-8 selection:bg-[#ceff1c] selection:text-[#0c30ff] relative"
      >
        <Link href="/" className="absolute top-8 left-8 md:top-12 md:left-12 flex items-center gap-2 text-[#ceff1c] hover:opacity-80 transition-opacity font-mono text-sm tracking-wider">
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
          back
        </Link>
        
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: BEZIER }}
          className="text-4xl md:text-6xl font-bold text-[#ceff1c] lowercase tracking-tight" 
          style={{ fontFamily: "var(--font-afacad)" }}
        >
          about ratio'd
        </motion.h1>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: BEZIER }}
          className="mt-6 text-[#ceff1c]/80 text-lg md:text-xl text-center max-w-2xl lowercase font-mono"
        >
          we are building a cool looking academia wrapper. it's fast, secure, and built for everyone.
        </motion.p>
      </motion.div>
    </div>
  );
}
