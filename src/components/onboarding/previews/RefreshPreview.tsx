"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

export default function RefreshPreview() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [attendance, setAttendance] = useState(74.5);

  const handleRefresh = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setTimeout(() => {
      setAttendance(75.2);
      setIsSyncing(false);
    }, 450);
  };

  return (
    <div className="w-full max-w-[320px] space-y-4 mb-8 self-center pointer-events-none">
      <div className="bg-white border-black/10 border-[1.5px] rounded-[24px] p-5 shadow-xl">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">
              Attendance
            </span>
            <motion.h3
              key={attendance}
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={`text-4xl font-black tracking-tighter ${attendance >= 75 ? "text-[#85a818]" : "text-black"}`}
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              {attendance}%
            </motion.h3>
          </div>
          <div
            className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${attendance >= 75 ? "bg-[#85a818] text-white" : "bg-black/5 text-black/40"}`}
          >
            {attendance >= 75 ? "Safe" : "Cooked"}
          </div>
        </div>
        <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${attendance}%` }}
            transition={{ type: "spring", stiffness: 100 }}
            className={`h-full rounded-full ${attendance >= 75 ? "bg-[#85a818]" : "bg-black/20"}`}
          />
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={handleRefresh}
        className="w-full py-4 bg-white border-black border-[2px] text-black rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all pointer-events-auto"
      >
        <motion.div
          animate={isSyncing ? { rotate: 360 } : {}}
          transition={
            isSyncing ? { repeat: Infinity, duration: 1, ease: "linear" } : {}
          }
        >
          <RefreshCw size={18} />
        </motion.div>
        {isSyncing ? "Syncing..." : "Refresh Now"}
      </motion.button>
    </div>
  );
}
