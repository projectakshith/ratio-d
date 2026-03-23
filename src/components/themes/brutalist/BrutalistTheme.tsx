"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { BottomNav } from "./BottomNav";
import { flavorText } from "@/utils/shared/flavortext";
import { usePathname } from "next/navigation";

interface BrutalistThemeProps {
  children: React.ReactNode;
}

export default function BrutalistTheme({ children }: BrutalistThemeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  return (
    <div className="h-[100dvh] w-full bg-black relative overflow-hidden">
      <LayoutGroup>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-0 left-0 w-full h-full bg-[#050505]"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>

      {!isLoading && (
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <BottomNav />
          </div>
        </div>
      )}
    </div>
  );
}

