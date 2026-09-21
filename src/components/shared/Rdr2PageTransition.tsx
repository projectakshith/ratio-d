"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

interface Rdr2PageTransitionProps {
  children: React.ReactNode;
  pathname: string;
}

export default function Rdr2PageTransition({ children, pathname }: Rdr2PageTransitionProps) {
  const { theme } = useTheme();
  const isRdr2 = theme?.includes("rdr2") ?? false;
  
  if (!isRdr2) {
    return <>{children}</>;
  }

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col flex-1">
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.3 }}
          transition={{ duration: 0.25 }}
          className="w-full h-full flex flex-col flex-1"
        >
          {children}
        </motion.div>
      </AnimatePresence>

      <TransitionOverlay pathname={pathname} />
    </div>
  );
}

function TransitionOverlay({ pathname }: { pathname: string }) {
  const [renderKey, setRenderKey] = useState<string | null>(null);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      setRenderKey(pathname);
    }
  }, [pathname]);

  if (!renderKey) return null;

  return (
    <div key={renderKey} className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Muzzle Flash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.06, 0] }}
        transition={{ duration: 0.03, times: [0, 0.5, 1] }}
        className="absolute inset-0 bg-white pointer-events-none mix-blend-screen"
        aria-hidden="true"
      />

      {/* Top Letterbox */}
      <motion.div
        initial={{ y: "-100%" }}
        animate={{ y: ["-100%", "0%", "0%", "-100%"] }}
        transition={{ duration: 0.75, times: [0, 0.33, 0.6, 1], ease: "easeInOut" }}
        className="absolute top-0 left-0 w-full h-[40px] pointer-events-none"
        style={{ backgroundColor: "#0a0806" }}
        aria-hidden="true"
      />

      {/* Bottom Letterbox */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: ["100%", "0%", "0%", "100%"] }}
        transition={{ duration: 0.75, times: [0, 0.33, 0.6, 1], ease: "easeInOut" }}
        className="absolute bottom-0 left-0 w-full h-[40px] pointer-events-none"
        style={{ backgroundColor: "#0a0806" }}
        aria-hidden="true"
      />

      {/* Smoke Wipe */}
      <motion.div
        initial={{ x: "-300px", opacity: 0 }}
        animate={{ x: "100vw", opacity: [0, 1, 1, 0] }}
        transition={{ duration: 0.6, ease: "linear" }}
        className="absolute top-0 left-0 w-[300px] h-full pointer-events-none"
        style={{ 
          background: "linear-gradient(to right, transparent, rgba(120, 110, 95, 0.4), transparent)",
          filter: "blur(8px)"
        }}
        aria-hidden="true"
      />
    </div>
  );
}
