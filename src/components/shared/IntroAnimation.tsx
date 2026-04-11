"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function IntroAnimation({ children }: { children: React.ReactNode }) {
  const [stage, setStage] = useState<"initial" | "animate" | "complete">("initial");

  useEffect(() => {
    const timer1 = setTimeout(() => setStage("animate"), 1200);
    const timer2 = setTimeout(() => setStage("complete"), 2200);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      <AnimatePresence>
        {stage !== "complete" && (
          <motion.div
            initial={{ height: "100vh", borderRadius: 0 }}
            animate={{ 
              height: stage === "animate" ? "120px" : "100vh",
              transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
            }}
            className="fixed top-0 left-0 w-full bg-[#0c30ff] z-[100] flex items-center justify-center overflow-hidden"
          >
            <motion.h1
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: stage === "animate" ? 0.5 : 1,
                y: stage === "animate" ? 0 : 0,
                transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
              }}
              className="text-7xl md:text-9xl font-black lowercase tracking-tighter text-[#ceff1c] whitespace-nowrap"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              ratio'd
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: stage === "complete" || stage === "animate" ? 1 : 0,
          transition: { delay: 1.5, duration: 0.8 }
        }}
        className="h-full w-full pt-[120px] px-8 md:px-16"
      >
        <div className="max-w-4xl mx-auto pt-20">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-6xl font-black text-white lowercase tracking-tight mb-6">
              your academia, redefined.
            </h2>
            <p className="text-xl md:text-2xl text-white/40 leading-relaxed font-medium lowercase tracking-tight max-w-2xl">
              experience a faster, cleaner, and more intuitive way to manage your university life. 
              built for the next generation of students.
            </p>
          </motion.div>
          
          <div className="mt-20">
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
