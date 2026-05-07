"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MoveLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="h-screen w-full bg-theme-bg flex flex-col items-center justify-center p-6 text-center overflow-hidden selection:bg-theme-highlight selection:text-theme-bg relative">
      
      <div className="absolute inset-0 pointer-events-none z-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, var(--theme-text) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="absolute inset-0 pointer-events-none z-[1] opacity-[0.03] mix-blend-overlay">
        <svg width="100%" height="100%">
          <filter id="dither">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="discrete" tableValues="0 1" />
              <feFuncG type="discrete" tableValues="0 1" />
              <feFuncB type="discrete" tableValues="0 1" />
            </feComponentTransfer>
          </filter>
          <rect width="100%" height="100%" filter="url(#dither)" />
        </svg>
      </div>

      <motion.div 
        animate={{ 
          rotate: [0, 5, -5, 0],
          y: [0, -20, 0],
          scale: [1, 1.05, 1]
        }}
        transition={{ 
          duration: 10, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="relative z-10 mb-8"
      >
        <pre className="text-[1.5vw] md:text-[0.8vw] leading-[1.1] font-mono text-theme-highlight opacity-80 select-none pointer-events-none whitespace-pre">
{`
 ██╗      ██████╗ ███████╗████████╗
 ██║     ██╔═══██╗██╔════╝╚══██╔══╝
 ██║     ██║   ██║███████╗   ██║   
 ██║     ██║   ██║╚════██║   ██║   
 ███████╗╚██████╔╝███████║   ██║   
 ╚══════╝ ╚═════╝ ╚══════╝   ╚═╝   
`}
        </pre>
      </motion.div>

      <div className="space-y-6 max-w-sm relative z-20">
        <h1 
          className="text-lg md:text-xl font-black text-theme-text lowercase tracking-tighter leading-tight"
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          man my website only has like 6 pages how tf did you end up here
        </h1>
        
        <div className="flex items-center justify-center gap-3">
          <div className="h-[1px] w-8 bg-theme-border" />
          <p 
            className="text-theme-muted text-[10px] uppercase tracking-[0.5em] font-bold"
            style={{ fontFamily: 'var(--font-afacad)' }}
          >
            404 — mayday! mayday!
          </p>
          <div className="h-[1px] w-8 bg-theme-border" />
        </div>

        <div className="pt-4">
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-transparent text-theme-text rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center gap-3 mx-auto shadow-2xl transition-all border border-theme-text/20 hover:border-theme-text/50"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              <MoveLeft size={14} className="text-theme-text" />
              emergency exit
            </motion.button>
          </Link>
        </div>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] pointer-events-none -z-10 overflow-hidden opacity-10">
        <div className="w-full h-full rotate-45 scale-150"
          style={{
            background: 'repeating-linear-gradient(90deg, var(--theme-border) 0px, var(--theme-border) 1px, transparent 1px, transparent 100px)'
          }}
        />
      </div>
    </div>
  );
}
