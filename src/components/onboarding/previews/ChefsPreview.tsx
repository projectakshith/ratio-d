"use client";
import React from "react";
import { motion } from "framer-motion";
import { Github, Instagram } from "lucide-react";

const ChefCard = ({
  name,
  role,
  github,
  ig,
  index,
}: {
  name: string;
  role: string;
  github: string;
  ig?: string;
  index: number;
}) => {
  const isDark = index % 2 === 0;
  const topBg = isDark ? "bg-[#381932]" : "bg-[#FFF3E6]";
  const bottomBg = isDark ? "bg-[#FFF3E6]" : "bg-[#381932]";
  const topText = isDark ? "text-[#FFF3E6]" : "text-[#381932]";
  const bottomText = isDark ? "text-[#381932]" : "text-[#FFF3E6]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: index % 2 === 0 ? -2 : 2 }}
      animate={{ opacity: 1, y: 0, rotate: index % 2 === 0 ? -2 : 2 }}
      whileTap={{ scale: 0.95, rotate: 0 }}
      className="w-full flex flex-col rounded-[1.2rem] overflow-hidden shadow-lg border-black/5 border pointer-events-auto"
    >
      <div
        className={`px-3 py-2.5 ${topBg} ${topText} flex flex-col relative overflow-hidden`}
      >
        <span
          className="font-black uppercase tracking-tighter text-sm z-10 leading-none"
          style={{ fontFamily: "var(--font-montserrat)" }}
        >
          {name}
        </span>
        <span className="text-[8px] font-bold opacity-60 uppercase tracking-widest mt-0.5 z-10">
          {role}
        </span>
      </div>
      <div
        className={`py-1.5 ${bottomBg} ${bottomText} flex items-center justify-center gap-4`}
      >
        <a
          href={github}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:scale-110 transition-transform"
        >
          <Github size={14} />
        </a>
        {ig && (
          <a
            href={ig}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-110 transition-transform"
          >
            <Instagram size={14} />
          </a>
        )}
      </div>
    </motion.div>
  );
};

export default function ChefsPreview() {
  return (
    <div className="w-full max-w-[300px] grid grid-cols-2 gap-3 mb-4 self-center pointer-events-none px-2">
      <div className="space-y-3">
        <ChefCard
          name="Akshith"
          role="The Architect"
          github="https://github.com/projectakshith"
          ig="https://www.instagram.com/akshithfilms/"
          index={0}
        />
        <ChefCard
          name="Debaditya"
          role="Color Picasso"
          github="https://github.com/DebadityaMalakar"
          index={2}
        />
      </div>
      <div className="space-y-3 pt-6">
        <ChefCard
          name="Prethiv"
          role="Logic Wizard"
          github="https://github.com/wtfPrethiv"
          ig="https://www.instagram.com/_prethiv/"
          index={1}
        />
      </div>
    </div>
  );
}
