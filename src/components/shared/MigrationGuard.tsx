"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, ExternalLink, ShieldAlert } from "lucide-react";

const PRODUCTION_VERSION = "1.0.0-prod";

export function MigrationGuard({ children }: { children: React.ReactNode }) {
  const [needsMigration, setNeedsMigration] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const checkMigration = async () => {
      const currentVersion = localStorage.getItem("ratio_app_version");
      const hasData = localStorage.getItem("ratio_data") || localStorage.getItem("ratio_credentials");

      if (currentVersion !== PRODUCTION_VERSION && hasData) {
        // Trigger migration
        try {
          await navigator.clipboard.writeText("getratiod.lol");
          setCopied(true);
        } catch (err) {}

        // Clear everything
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        setNeedsMigration(true);
      } else {
        localStorage.setItem("ratio_app_version", PRODUCTION_VERSION);
      }
    };

    checkMigration();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText("getratiod.lol");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (needsMigration) {
    return (
      <div className="fixed inset-0 z-[9999] bg-theme-bg/95 backdrop-blur-2xl flex items-center justify-center p-8">
        <div className="max-w-md w-full rounded-[40px] bg-theme-surface border border-theme-border p-10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
            <ShieldAlert size={160} className="text-theme-text" />
          </div>
          
          <div className="flex flex-col mb-10">
            <h1 className="text-[3.5rem] font-black text-theme-text leading-[0.8] tracking-tighter lowercase" style={{ fontFamily: 'var(--font-montserrat)' }}>
              reinstall <br /> required.
            </h1>
          </div>
          
          <p className="text-theme-muted mb-12 text-[14px] font-bold uppercase tracking-widest leading-relaxed opacity-80" style={{ fontFamily: 'var(--font-afacad)' }}>
            thank you for being with us during the dev phase. 
            <br />
            we've got something new waiting for you at our permanent spot. 
            <br /><br />
            please <span className="text-theme-highlight font-black">uninstall this version</span> and download the new one.
          </p>

          <div className="flex flex-col gap-4">
            <button 
              onClick={handleCopy}
              className="w-full group bg-theme-highlight text-theme-bg p-6 flex items-center justify-between cursor-pointer active:scale-95 transition-all rounded-[28px] shadow-lg shadow-theme-highlight/20"
            >
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">official link</span>
                <span className="text-2xl font-black lowercase tracking-tighter" style={{ fontFamily: 'var(--font-montserrat)' }}>getratiod.lol</span>
              </div>
              <div className="bg-theme-bg/10 p-3 rounded-2xl group-hover:bg-theme-bg/20 transition-colors">
                {copied ? <span className="text-[11px] font-black uppercase tracking-widest">copied!</span> : <Copy size={22} />}
              </div>
            </button>

            <a 
              href="https://getratiod.lol" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-theme-muted hover:text-theme-text transition-all py-4 text-[12px] font-black uppercase tracking-[0.3em]"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              visit site <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
