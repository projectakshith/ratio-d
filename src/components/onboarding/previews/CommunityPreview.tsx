"use client";
import React from "react";
import { motion } from "framer-motion";

export default function CommunityPreview() {
  return (
    <div className="relative w-full h-48 mt-4 flex flex-col justify-center items-center">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 blur-[100px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#FFF3E6]/5 blur-[60px] rounded-full" />
      </div>

      <div className="relative w-full max-w-[280px] h-full flex flex-col gap-4">
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -5, x: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: -8, x: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.5,
          }}
          className="bg-white/5 backdrop-blur-2xl border border-white/10 p-4 rounded-3xl rounded-bl-none self-start shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
        >
          <span className="text-[8px] font-black uppercase tracking-widest opacity-40 block mb-1">
            Student
          </span>
          <p className="text-[11px] leading-tight font-medium text-white/90">
            yo, marks aren't updating...
          </p>
        </motion.div>

        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: 5, x: 20 }}
          animate={{ scale: 1, opacity: 1, rotate: 6, x: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 1.8,
          }}
          className="bg-[#ceff1c] text-[#111111] p-4 rounded-3xl rounded-br-none self-end shadow-[0_8px_32px_rgba(206,255,28,0.2)] relative z-10"
        >
          <span className="text-[8px] font-black uppercase tracking-widest opacity-40 block mb-1">
            Devs
          </span>
          <p className="text-[11px] leading-tight font-bold">
            fixed it. refresh blud!
          </p>
        </motion.div>
      </div>
    </div>
  );
}
