"use client";
import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface BentoTileProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  as?: any;
}

export const BentoTile = ({
  children,
  className,
  onClick,
  transition,
  as,
  ...props
}: BentoTileProps) => {
  return (
    <motion.div
      layout
      onClick={onClick}
      className={`rounded-[32px] p-8 shadow-sm cursor-pointer overflow-hidden bento-tile ${className || ""}`}
      transition={transition || { type: "spring", stiffness: 200, damping: 25 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
