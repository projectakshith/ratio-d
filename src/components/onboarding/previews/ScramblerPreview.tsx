"use client";
import React, { useState } from "react";
import { Lock } from "lucide-react";

export default function ScramblerPreview() {
  const [input, setInput] = useState("");
  const scramble = (text: string) => {
    if (!text) return "";
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let res = "U2FsdGVkX1";
    for (let i = 0; i < 15; i++)
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    return res + "...";
  };

  return (
    <div className="w-full max-w-[320px] space-y-4 mb-8 self-center text-white pointer-events-none">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-3xl min-h-[70px] flex flex-col justify-center">
        <span className="text-[7px] font-mono uppercase tracking-widest opacity-40 mb-1">
          AES-256 encrypted stream
        </span>
        <p className="font-mono text-[10px] break-all text-[#ceff1c] opacity-80 leading-tight">
          {input ? scramble(input) : "Waiting for input..."}
        </p>
      </div>

      <div className="relative pointer-events-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="type your name to encrypt..."
          className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#ceff1c]/50 transition-colors"
        />
        <Lock
          size={18}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20"
        />
      </div>
    </div>
  );
}
