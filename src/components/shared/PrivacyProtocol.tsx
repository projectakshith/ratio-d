"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, ServerOff, Database } from "lucide-react";

interface PrivacyProtocolProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyProtocol({
  isOpen,
  onClose,
}: PrivacyProtocolProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
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
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <h2
            className="text-[2.5rem] font-black lowercase tracking-tighter leading-[0.9] mb-8"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            how it
            <br />
            works.
          </h2>

          <div className="space-y-10 flex-1 overflow-y-auto no-scrollbar pb-8">
            <div className="space-y-3">
              <h3 className="font-black text-sm uppercase tracking-[0.2em] flex items-center gap-3 text-white" style={{ fontFamily: "var(--font-montserrat)" }}>
                <Lock size={18} className="text-white/60" /> AES-256 Encryption
              </h3>
              <p className="text-xs opacity-70 leading-relaxed font-bold" style={{ fontFamily: "var(--font-montserrat)" }}>
                When you log in, we use window.crypto to generate a unique 32-byte key locally on your device. Your Academia credentials and session cookies are encrypted using AES-256 before ever touching localStorage.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-black text-sm uppercase tracking-[0.2em] flex items-center gap-3 text-white" style={{ fontFamily: "var(--font-montserrat)" }}>
                <ServerOff size={18} className="text-white/60" /> Stateless Proxy
              </h3>
              <p className="text-xs opacity-70 leading-relaxed font-bold" style={{ fontFamily: "var(--font-montserrat)" }}>
                We don't have a user database. Our FastAPI backend acts strictly as a stateless proxy scraper. It takes your decrypted credentials, authenticates with the SRM portal, parses the HTML into JSON, and immediately drops the session data.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-black text-sm uppercase tracking-[0.2em] flex items-center gap-3 text-white" style={{ fontFamily: "var(--font-montserrat)" }}>
                <Database size={18} className="text-white/60" /> Local-First Caching
              </h3>
              <p className="text-xs opacity-70 leading-relaxed font-bold" style={{ fontFamily: "var(--font-montserrat)" }}>
                All your parsed data (attendance, marks, schedule) is cached in your browser's localStorage for offline access. Deleting the app or clearing your browser cache acts as a permanent kill switch, wiping everything.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full py-5 bg-[#F0EDE5] text-[#111111] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[0.98] transition-transform"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            understood
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
