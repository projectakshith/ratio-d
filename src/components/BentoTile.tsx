"use client";
import { motion } from "framer-motion";

interface BentoTileProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const BentoTile = ({ children, className, onClick }: BentoTileProps) => {
  return (
    <motion.div
      layout
      onClick={onClick}
      className={`rounded-[32px] p-8 shadow-sm cursor-pointer overflow-hidden bento-tile ${className}`}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
    >
      {children}
    </motion.div>
  );
};