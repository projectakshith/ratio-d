"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { flavorText } from "@/utils/shared/flavortext";

export default function LoadingPage() {
  const [progress, setProgress] = useState(0);
  const [flavorIndex, setFlavorIndex] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 10;
      });
    }, 400);

    const flavorInterval = setInterval(() => {
      setFlavorIndex((prev) => (prev + 1) % flavorText.loading.length);
    }, 2500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(flavorInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] bg-[#0c30ff] flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <h1
              className="text-4xl md:text-6xl lowercase tracking-tighter text-[#ceff1c]"
              style={{ fontFamily: "Urbanosta, sans-serif" }}
            >
              ratio'd
            </h1>
            <span className="font-mono text-[10px] text-[#ceff1c]/60 mb-1 uppercase tracking-widest">
              {Math.round(progress)}%
            </span>
          </div>
          
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#ceff1c]"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeInOut" }}
            />
          </div>
        </div>

        <div className="min-h-[3em]">
          <AnimatePresence mode="wait">
            <motion.p
              key={flavorIndex}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-sm lowercase text-white opacity-80 text-right"
              style={{ fontFamily: "Aonic, sans-serif" }}
            >
              {flavorText.loading[flavorIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
