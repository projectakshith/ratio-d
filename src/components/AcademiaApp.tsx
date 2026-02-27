"use client";
import React from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export default function MinimalHomepage() {
  const userName = "akshith";
  const overallAttendance = "80.4";
  const dayOrder = "01";

  const splitText = Array.from("ratio'd.");

  return (
    <>
      {/* Force loading the exact fonts from Google Fonts */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700;800;900&display=swap');
        `,
        }}
      />

      <div className="h-full w-full flex flex-col bg-[#F7F7F7] text-[#111111] overflow-y-auto custom-scrollbar pb-32">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-between items-start pt-16 px-7 mb-10"
        >
          <div className="w-12 h-12 rounded-[18px] bg-[#111111] flex items-center justify-center shadow-md overflow-hidden">
            {/* Replace with actual image later */}
            <div className="w-full h-full bg-[#111111] flex items-center justify-center text-white font-bold font-mono">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span
              className="text-[15px] font-medium lowercase tracking-wide text-[#111111]/50 mb-[-6px]"
              style={{ fontFamily: "'Afacad', sans-serif" }}
            >
              sup!
            </span>
            <span
              className="text-[26px] font-bold lowercase tracking-tight text-[#111111]"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {userName}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-5 gap-2.5 px-7 mb-10"
        >
          {/* Top Left - DTM */}
          <div className="aspect-square rounded-[14px] border-[1.5px] border-[#111111] flex flex-col items-center justify-center bg-white shadow-sm">
            <span
              className="text-[9px] font-bold uppercase tracking-widest text-[#111111]/60 mb-0.5"
              style={{ fontFamily: "'Afacad', sans-serif" }}
            >
              dtm
            </span>
            <span
              className="text-[11px] font-black tracking-tighter"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {overallAttendance}%
            </span>
          </div>

          {/* 4 Dashed Boxes */}
          {[...Array(4)].map((_, i) => (
            <div
              key={`dashed-${i}`}
              className="aspect-square rounded-[14px] border-[1.5px] border-dashed border-[#111111]/30"
            />
          ))}

          {/* 4 Solid Boxes */}
          {[...Array(4)].map((_, i) => (
            <div
              key={`solid-${i}`}
              className="aspect-square rounded-[14px] border-[1.5px] border-[#111111] bg-white shadow-sm"
            />
          ))}

          {/* 1 Empty/Faded Box */}
          <div className="aspect-square rounded-[14px] border-[1.5px] border-transparent bg-[#111111]/5" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex justify-between items-end px-7 mb-2"
        >
          <span
            className="text-[8.5rem] leading-[0.75] font-medium tracking-tighter text-[#111111] ml-[-8px]"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {dayOrder}
          </span>
          <span
            className="text-[15px] font-medium lowercase tracking-wide text-[#111111]/50 mb-3"
            style={{ fontFamily: "'Afacad', sans-serif" }}
          >
            day order
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="px-7 mb-12 w-full"
        >
          <div className="flex justify-between items-center w-full">
            {splitText.map((char, index) => (
              <span
                key={index}
                className="text-[4.2rem] leading-none font-medium lowercase text-[#111111]"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {char}
              </span>
            ))}
          </div>
        </motion.div>

        <div className="flex flex-col gap-3.5 px-7">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="w-full border-[1.5px] border-[#111111] rounded-[28px] p-3 flex items-center gap-4 bg-white shadow-sm"
          >
            <div className="w-[52px] h-[52px] rounded-[18px] bg-[#F0F0F0] flex items-center justify-center shrink-0 border border-[#111111]/5">
              <div className="w-3.5 h-3.5 rounded-full bg-[#111111]" />
            </div>
            <div className="flex-1 flex flex-col justify-center min-w-0 py-1">
              <span
                className="text-[15px] font-semibold lowercase leading-tight text-[#111111] truncate"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                software engineering
              </span>
              <span
                className="text-[13px] font-medium lowercase text-[#111111]/50 mt-1.5 truncate"
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                08:00 am - tp101
              </span>
            </div>
            <button className="w-10 h-10 flex items-center justify-center shrink-0 text-[#111111]/40 hover:text-[#111111] transition-colors">
              <Plus size={20} strokeWidth={1.5} />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="w-full border-[1.5px] border-[#111111] rounded-[28px] p-3 flex items-center gap-4 bg-white shadow-sm"
          >
            <div className="w-[52px] h-[52px] rounded-[18px] bg-[#F0F0F0] flex items-center justify-center shrink-0 border border-[#111111]/5">
              <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-[#111111]" />
            </div>
            <div className="flex-1 flex flex-col justify-center min-w-0 py-1">
              <span
                className="text-[15px] font-semibold lowercase leading-tight text-[#111111] truncate"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                machine learning
              </span>
              <span
                className="text-[13px] font-medium lowercase text-[#111111]/50 mt-1.5 truncate"
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                09:50 am - ub204
              </span>
            </div>
            <button className="w-10 h-10 flex items-center justify-center shrink-0 text-[#111111]/40 hover:text-[#111111] transition-colors">
              <Plus size={20} strokeWidth={1.5} />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="w-full border-[1.5px] border-[#111111] rounded-[28px] p-3 flex items-center gap-4 bg-white shadow-sm"
          >
            <div className="w-[52px] h-[52px] rounded-[18px] bg-[#F0F0F0] flex items-center justify-center shrink-0 border border-[#111111]/5" />
            <div className="flex-1 flex flex-col justify-center min-w-0 py-1">
              <span
                className="text-[15px] font-semibold lowercase leading-tight text-[#111111] truncate"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                attendance might be cooked.
              </span>
              <span
                className="text-[13px] font-medium lowercase text-[#111111]/50 mt-1.5 truncate"
                style={{ fontFamily: "'Afacad', sans-serif" }}
              >
                academic comeback needed
              </span>
            </div>
            <button className="w-10 h-10 flex items-center justify-center shrink-0 text-[#111111]/40 hover:text-[#111111] transition-colors">
              <Plus size={20} strokeWidth={1.5} />
            </button>
          </motion.div>
        </div>
      </div>
    </>
  );
}
