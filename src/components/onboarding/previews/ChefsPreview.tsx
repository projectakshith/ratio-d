"use client";
import React from "react";
import { motion } from "framer-motion";
import { Github, Instagram } from "lucide-react";

const ChefCard = ({
  name,
  github,
  ig,
  isPlumTop = true,
}: {
  name: string;
  github: string;
  ig?: string;
  isPlumTop?: boolean;
}) => {
  const topBg = isPlumTop ? "bg-[#381932]" : "bg-[#FFF3E6]";
  const bottomBg = isPlumTop ? "bg-[#FFF3E6]" : "bg-[#381932]";
  const topText = isPlumTop ? "text-[#FFF3E6]" : "text-[#381932]";
  const bottomText = isPlumTop ? "text-[#381932]" : "text-[#FFF3E6]";

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="w-full flex flex-col rounded-[2rem] overflow-hidden shadow-2xl border-black/5 border pointer-events-auto"
    >
      <div
        className={`py-4 ${topBg} ${topText} flex items-center justify-center relative overflow-hidden`}
      >
        <span
          className="font-black uppercase tracking-tighter text-lg z-10"
          style={{ fontFamily: "var(--font-montserrat)" }}
        >
          {name}
        </span>
        <div className="absolute -right-2 -top-2 opacity-10 rotate-12">
          <Github size={40} />
        </div>
      </div>
      <div
        className={`py-3 ${bottomBg} ${bottomText} flex items-center justify-center gap-6`}
      >
        <a
          href={github}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:scale-110 transition-transform"
        >
          <Github size={20} />
        </a>
        {ig && (
          <a
            href={ig}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-110 transition-transform"
          >
            <Instagram size={20} />
          </a>
        )}
      </div>
    </motion.div>
  );
};

export default function ChefsPreview() {
  return (
    <div className="w-full max-w-[320px] grid grid-cols-1 gap-4 mb-8 self-center pointer-events-none">
      <ChefCard
        name="Akshith"
        github="https://github.com/projectakshith"
        ig="https://www.instagram.com/akshithfilms/"
        isPlumTop={true}
      />
      <ChefCard
        name="Prethiv"
        github="https://github.com/wtfPrethiv"
        ig="https://www.instagram.com/_prethiv/"
        isPlumTop={false}
      />
      <ChefCard
        name="Debaditya"
        github="https://github.com/DebadityaMalakar"
        isPlumTop={true}
      />
    </div>
  );
}
