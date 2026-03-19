"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, CloudOff, Smartphone } from "lucide-react";

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
          className="fixed inset-0 bg-[#0c30ff] text-[#ceff1c] z-[2000] p-8 flex flex-col"
        >
          <div className="flex justify-between items-center mb-12">
            <span className="font-mono text-[10px] uppercase tracking-[0.4em]">
              Privacy Protocol
            </span>
            <button
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10"
            >
              <X size={24} />
            </button>
          </div>

          <h2
            className="text-6xl font-black lowercase tracking-tighter leading-[0.9] mb-8"
            style={{ fontFamily: "var(--font-urbanosta)" }}
          >
            how it
            <br />
            works
          </h2>

          <div className="space-y-8 flex-1 overflow-y-auto no-scrollbar">
            <div className="space-y-2">
              <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                <Lock size={16} /> Encryption
              </h3>
              <p className="text-sm opacity-80 leading-relaxed">
                When you log in, we generate a unique key on your device. Your
                Academia credentials and marks are scrambled using AES-256
                before being saved.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                <CloudOff size={16} /> Zero Servers
              </h3>
              <p className="text-sm opacity-80 leading-relaxed">
                We don't have a backend database for users. Your data goes from
                the portal to your phone's memory. That's it.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                <Smartphone size={16} /> Local Only
              </h3>
              <p className="text-sm opacity-80 leading-relaxed">
                Deleting the app or clearing browser cache permanently wipes all
                your data. We have no way to recover it because we never had it.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-8 w-full py-5 bg-[#ceff1c] text-[#0c30ff] font-black uppercase tracking-widest rounded-2xl"
          >
            got it
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
