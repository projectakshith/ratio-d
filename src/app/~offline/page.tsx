"use client";
import React from "react";
import { WifiOff } from "lucide-react";
import { motion } from "framer-motion";

export default function OfflinePage() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0c30ff] text-white p-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-6"
      >
        <WifiOff size={40} />
      </motion.div>
      <h1 className="text-4xl font-black lowercase tracking-tighter mb-2" style={{ fontFamily: "Aonic, sans-serif" }}>
        offline
      </h1>
      <p className="text-white/60 text-sm max-w-xs uppercase tracking-widest font-bold leading-relaxed">
        this page hasn't been cached yet. connect to the internet to load it.
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="mt-10 px-8 py-3 bg-[#ceff1c] text-[#0c30ff] rounded-full font-black uppercase tracking-widest text-xs active:scale-95 transition-transform"
      >
        retry
      </button>
    </div>
  );
}
