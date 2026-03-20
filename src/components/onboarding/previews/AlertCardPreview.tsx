"use client";
import React from "react";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";

export default function AlertCardPreview() {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="w-full max-w-[320px] bg-[#EADFD4] border-[#4A3A32]/10 border-[1.5px] rounded-[24px] p-5 flex flex-col relative overflow-hidden shadow-xl mb-8 self-center"
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[100px] bg-[#4A3A32]/5 pointer-events-none" />
      <div className="flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0 bg-[#4A3A32] text-[#EADFD4]">
            exam
          </span>
          <span className="text-[11px] font-bold text-[#4A3A32]/40 tracking-wider uppercase">
            tomorrow
          </span>
        </div>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-8 h-8 rounded-full bg-[#4A3A32]/10 flex items-center justify-center text-[#4A3A32]"
        >
          <Bell size={14} />
        </motion.div>
      </div>
      <span
        className="text-[20px] font-black tracking-tight text-[#4A3A32] leading-tight mb-4 z-10"
        style={{ fontFamily: "var(--font-montserrat)" }}
      >
        discrete mathematics
      </span>
      <div className="flex flex-col gap-2.5 z-10">
        <div className="flex items-start gap-3 bg-[#4A3A32]/[0.05] border-[#4A3A32]/10 rounded-xl p-3 border">
          <div className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-[#4A3A32]" />
          <span className="text-[14px] font-bold text-[#4A3A32]/70 lowercase leading-tight">
            ft-1 assessment @ 9:00 am
          </span>
        </div>
      </div>
    </motion.div>
  );
}
