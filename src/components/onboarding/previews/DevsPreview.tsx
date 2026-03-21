"use client";
import React from "react";
import { motion } from "framer-motion";
import { Github, Instagram, Linkedin } from "lucide-react";

const DevCard = ({
  name,
  role,
  github,
  ig,
  linkedin,
  index,
}: {
  name: string;
  role: string;
  github: string;
  ig?: string;
  linkedin?: string;
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
        {linkedin && (
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-110 transition-transform"
          >
            <Linkedin size={14} />
          </a>
        )}
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

export default function DevsPreview() {
  return (
    <div className="w-full max-w-[300px] flex flex-col self-center pointer-events-none px-2">
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="space-y-3">
          <DevCard
            name="Akshith"
            role="design & dev"
            github="https://github.com/projectakshith"
            ig="https://www.instagram.com/akshithfilms/"
            linkedin="https://www.linkedin.com/in/akshith-rajesh/"
            index={0}
          />
          <DevCard
            name="Debaditya"
            role="themes"
            github="https://github.com/DebadityaMalakar"
            ig="https://www.instagram.com/anxy.4.uriel/"
            linkedin="https://www.linkedin.com/in/debaditya-malakar-3ba9b5334/"
            index={2}
          />
        </div>
        <div className="space-y-3 pt-6">
          <DevCard
            name="Prethiv"
            role="core logic & dev"
            github="https://github.com/wtfPrethiv"
            ig="https://www.instagram.com/_prethiv/"
            linkedin="https://www.linkedin.com/in/prethiv-sriman/"
            index={1}
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        className="text-center"
      >
        <p
          className="text-[7px] font-bold lowercase tracking-widest leading-relaxed"
          style={{ fontFamily: "var(--font-montserrat)" }}
        >
          and our friends who helped us{"\n"}through the dev period{" "}
          <span className="lowercase text-[12px]">UwU</span>
        </p>
      </motion.div>
    </div>
  );
}
