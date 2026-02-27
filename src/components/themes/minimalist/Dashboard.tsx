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
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700;800;900&display=swap');
        `,
        }}
      />

      <div className="h-full w-full flex flex-col bg-[#F6F6F6] text-[#1E1E1E] overflow-y-auto custom-scrollbar pb-32">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-between items-start pt-14 px-6 mb-8"
        >
          <div className="w-12 h-12 rounded-[16px] bg-[#1E1E1E] flex flex-col items-center justify-end overflow-hidden shadow-sm relative">
            <div className="w-4 h-4 rounded-full bg-white/20 absolute top-2" />
            <div className="w-8 h-6 rounded-t-full bg-white/20 absolute bottom-0" />
          </div>
          <div className="flex flex-col items-end">
            <span
              className="text-[14px] font-medium lowercase tracking-wide text-[#1E1E1E]/60 mb-[-4px]"
              style={{ fontFamily: "'Afacad', sans-serif" }}
            >
              sup!
            </span>
            <span
              className="text-[22px] font-bold lowercase tracking-tight text-[#1E1E1E]"
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
          className="grid grid-cols-5 gap-2.5 px-6 mb-8"
        >
          <div className="aspect-square rounded-[14px] border border-[#1E1E1E] flex flex-col items-center justify-center bg-transparent">
            <span
              className="text-[10px] font-semibold lowercase tracking-widest text-[#1E1E1E]/70 mb-[2px]"
              style={{ fontFamily: "'Afacad', sans-serif" }}
            >
              dtm
            </span>
            <span
              className="text-[10px] font-bold tracking-tighter"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {overallAttendance}%
            </span>
          </div>

          {[...Array(4)].map((_, i) => (
            <div
              key={`dashed-${i}`}
              className="aspect-square rounded-[14px] border border-dashed border-[#1E1E1E]/40"
            />
          ))}

          {[...Array(5)].map((_, i) => (
            <div
              key={`solid-${i}`}
              className="aspect-square rounded-[14px] border border-[#1E1E1E] bg-transparent"
            />
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex justify-between items-baseline px-6 mb-1"
        >
          <span
            className="text-[7.5rem] leading-[0.8] font-medium tracking-tighter text-[#1E1E1E] ml-[-6px]"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {dayOrder}
          </span>
          <span
            className="text-[14px] font-semibold lowercase tracking-widest text-[#1E1E1E]/60 mb-2"
            style={{ fontFamily: "'Afacad', sans-serif" }}
          >
            day order
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="px-6 mb-10 w-full"
        >
          <div className="flex justify-between items-center w-full">
            {splitText.map((char, index) => (
              <span
                key={index}
                className="text-[4rem] leading-[0.9] font-medium lowercase text-[#1E1E1E]"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {char}
              </span>
            ))}
          </div>
        </motion.div>

        <div className="flex flex-col gap-4 px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="w-full border border-[#1E1E1E] rounded-full p-2 pr-5 flex items-center gap-4 bg-transparent"
          >
            <div className="w-[58px] h-[58px] rounded-[20px] bg-[#EBEBEB] flex items-center justify-center shrink-0 border border-[#1E1E1E]" />
            <div className="flex-1 flex flex-col justify-center gap-2 py-1">
              <div className="w-3/4 h-[1.5px] bg-[#1E1E1E]/30 rounded-full relative">
                <span
                  className="absolute bottom-1 left-0 text-[11px] font-semibold lowercase text-[#1E1E1E]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  software engineering
                </span>
              </div>
              <div className="w-1/2 h-[1.5px] bg-[#1E1E1E]/30 rounded-full relative">
                <span
                  className="absolute bottom-1 left-0 text-[10px] lowercase text-[#1E1E1E]/60"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  current class • tp101
                </span>
              </div>
            </div>
            <Plus
              size={20}
              strokeWidth={1}
              className="text-[#1E1E1E] shrink-0"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="w-full border border-[#1E1E1E] rounded-full p-2 pr-5 flex items-center gap-4 bg-transparent"
          >
            <div className="w-[58px] h-[58px] rounded-[20px] bg-[#EBEBEB] flex items-center justify-center shrink-0 border border-[#1E1E1E]" />
            <div className="flex-1 flex flex-col justify-center gap-2 py-1">
              <div className="w-3/4 h-[1.5px] bg-[#1E1E1E]/30 rounded-full relative">
                <span
                  className="absolute bottom-1 left-0 text-[11px] font-semibold lowercase text-[#1E1E1E]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  machine learning
                </span>
              </div>
              <div className="w-1/2 h-[1.5px] bg-[#1E1E1E]/30 rounded-full relative">
                <span
                  className="absolute bottom-1 left-0 text-[10px] lowercase text-[#1E1E1E]/60"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  next class • ub204
                </span>
              </div>
            </div>
            <Plus
              size={20}
              strokeWidth={1}
              className="text-[#1E1E1E] shrink-0"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="w-full border border-[#1E1E1E] rounded-full p-2 pr-5 flex items-center gap-4 bg-transparent"
          >
            <div className="w-[58px] h-[58px] rounded-[20px] bg-[#EBEBEB] flex items-center justify-center shrink-0 border border-[#1E1E1E]" />
            <div className="flex-1 flex flex-col justify-center gap-2 py-1">
              <div className="w-3/4 h-[1.5px] bg-[#1E1E1E]/30 rounded-full relative">
                <span
                  className="absolute bottom-1 left-0 text-[11px] font-semibold lowercase text-[#1E1E1E]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  attendance might be cooked.
                </span>
              </div>
              <div className="w-1/2 h-[1.5px] bg-[#1E1E1E]/30 rounded-full relative">
                <span
                  className="absolute bottom-1 left-0 text-[10px] lowercase text-[#1E1E1E]/60"
                  style={{ fontFamily: "'Afacad', sans-serif" }}
                >
                  academic comeback needed
                </span>
              </div>
            </div>
            <Plus
              size={20}
              strokeWidth={1}
              className="text-[#1E1E1E] shrink-0"
            />
          </motion.div>
        </div>
      </div>
    </>
  );
}
