"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, ChevronDown, ChevronUp } from "lucide-react";
import { ReactLenis } from "lenis/react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ReactLenis root>
      <div className="min-h-screen w-full bg-theme-bg flex flex-col items-center py-12 px-6 text-center overflow-x-hidden relative selection:bg-theme-highlight selection:text-theme-bg">
        
        <div className="fixed inset-0 pointer-events-none z-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, var(--theme-text) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />

        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
          <h1 className="text-[40vw] font-black text-theme-secondary opacity-[0.12] blur-3xl select-none leading-none uppercase">
            err
          </h1>
        </div>

        <motion.div 
          animate={{ 
            rotate: [0, 2, -2, 0],
            y: [0, -10, 0]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="relative z-10 mb-8 mt-4 shrink-0"
        >
          <pre className="text-[1.2vw] md:text-[0.6vw] leading-[1.1] font-mono text-theme-secondary opacity-80 select-none pointer-events-none whitespace-pre">
{`
 ███████╗██████╗ ██████╗  ██████╗ ██████╗ 
 ██╔════╝██╔══██╗██╔══██╗██╔═══██╗██╔══██╗
 █████╗  ██████╔╝██████╔╝██║   ██║██████╔╝
 ██╔══╝  ██╔══██╗██╔══██╗██║   ██║██╔══██╗
 ███████╗██║  ██║██║  ██║╚██████╔╝██║  ██║
 ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝
`}
          </pre>
        </motion.div>

        <div className="relative z-10 flex flex-col items-center w-full max-w-2xl my-auto">
          <div className="space-y-1 shrink-0 mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-[1px] w-6 bg-theme-secondary/30" />
              <p className="text-theme-muted text-[10px] font-black uppercase tracking-[0.5em]" style={{ fontFamily: 'var(--font-montserrat)' }}>
                mayday! mayday!
              </p>
              <div className="h-[1px] w-6 bg-theme-secondary/30" />
            </div>
          </div>

          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-theme-secondary/20 border-2 border-theme-secondary p-8 rounded-[32px] w-full relative backdrop-blur-md shadow-[0_0_50px_rgba(var(--theme-secondary-rgb),0.1)] shrink-0 mb-8"
          >
            <div className="absolute -top-3 left-8 px-3 py-1 bg-theme-secondary text-theme-bg text-[10px] font-black uppercase tracking-widest rounded-full">
              error details
            </div>
            <p className="text-theme-text text-lg md:text-xl font-black lowercase tracking-tight leading-relaxed text-center italic mb-4" style={{ fontFamily: 'var(--font-montserrat)' }}>
              "{error.message || "unknown failure in the matrix"}"
            </p>

            <button 
              onClick={() => setShowLogs(!showLogs)}
              className="absolute bottom-4 right-8 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-theme-muted hover:text-theme-secondary transition-colors group/btn"
            >
              <Terminal size={10} className={showLogs ? "text-theme-secondary" : ""} />
              {showLogs ? "HIDE LOG" : "VIEW LOG"}
              {showLogs ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
          </motion.div>

          <div className="w-full flex flex-col items-center">
            <AnimatePresence initial={false}>
              {showLogs && error.stack && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="w-full overflow-hidden"
                >
                  <div className="bg-theme-text/[0.03] border border-theme-border rounded-2xl p-6 text-left mb-8 overflow-hidden">
                    <pre 
                      data-lenis-prevent
                      className="text-[10px] font-mono text-theme-text/70 leading-relaxed whitespace-pre-wrap lowercase max-h-[300px] overflow-y-auto no-scrollbar overscroll-contain"
                    >
                      {error.stack}
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col items-center gap-8">
              <button 
                onClick={() => reset()}
                className="group relative pt-2 shrink-0"
              >
                <span className="text-theme-text text-2xl md:text-3xl font-black italic tracking-tighter uppercase relative z-10 transition-transform group-hover:scale-110 block" style={{ fontFamily: 'var(--font-montserrat)' }}>
                  TRY AGAIN
                </span>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-48 h-8 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
                  <svg viewBox="0 0 200 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <motion.path
                      d="M10 25C40 22 70 28 100 25C130 22 160 18 190 22"
                      stroke="var(--theme-secondary)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </svg>
                </div>
              </button>

              <div className="max-w-xs space-y-2 pb-12">
                <p className="text-theme-muted text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 leading-relaxed" style={{ fontFamily: 'var(--font-afacad)' }}>
                  the devs are retarded asf
                </p>
                <div className="pt-2">
                  <Link 
                    href="https://chat.whatsapp.com/D7wymoQ1zrQKqf4Qs4gw91" 
                    target="_blank"
                    className="inline-block px-6 py-2 bg-theme-secondary text-theme-bg text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-transform"
                    style={{ fontFamily: 'var(--font-montserrat)' }}
                  >
                    SHOUT AT THE DEVS HERE
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ReactLenis>
  );
}
