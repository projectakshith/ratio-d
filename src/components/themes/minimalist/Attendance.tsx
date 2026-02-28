"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function MinimalAttendance() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const subjects = [
    {
      id: 1,
      code: "dtm",
      name: "discrete transforms",
      percent: 85.2,
      attended: 35,
      total: 41,
      safe: true,
      marginVal: 5,
    },
    {
      id: 2,
      code: "oops",
      name: "object oriented prog",
      percent: 73.1,
      attended: 29,
      total: 39,
      safe: false,
      marginVal: 3,
    },
    {
      id: 3,
      code: "ml",
      name: "machine learning",
      percent: 90.5,
      attended: 38,
      total: 42,
      safe: true,
      marginVal: 8,
    },
    {
      id: 4,
      code: "dsa",
      name: "data structures",
      percent: 78.0,
      attended: 32,
      total: 41,
      safe: true,
      marginVal: 2,
    },
    {
      id: 5,
      code: "os",
      name: "operating systems",
      percent: 74.5,
      attended: 30,
      total: 40,
      safe: false,
      marginVal: 1,
    },
    {
      id: 6,
      code: "dbms",
      name: "database systems",
      percent: 82.3,
      attended: 34,
      total: 41,
      safe: true,
      marginVal: 4,
    },
  ];

  const lowAttendance = subjects.filter((s) => !s.safe);
  const safeAttendance = subjects.filter((s) => s.safe);

  if (!mounted) return null;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700;800;900&display=swap');

          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }

          .warning-dotted {
            background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='24' stroke='%23FF4D4D' stroke-width='3' stroke-dasharray='6%2c 10' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e");
            border-radius: 24px;
          }
        `,
        }}
      />

      <div className="absolute inset-0 bg-[#F7F7F7]">
        <div className="h-full w-full overflow-y-auto no-scrollbar px-6 pt-6 pb-[240px] flex flex-col">
          {lowAttendance.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full warning-dotted p-5 flex flex-col gap-4 mb-8 bg-[#FFEDED]/30"
            >
              <div className="flex items-center gap-3 w-full">
                <span
                  className="text-[12px] font-bold lowercase tracking-[0.25em] text-[#FF4D4D] whitespace-nowrap"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  action required
                </span>
                <div className="flex-1 h-[1.5px] bg-[#FF4D4D]/20 rounded-full" />
              </div>

              {lowAttendance.map((sub, index) => (
                <div
                  key={sub.id}
                  className="w-full bg-white border-[1.5px] border-[#FF4D4D]/30 rounded-[18px] p-4 flex items-center justify-between shadow-sm"
                >
                  <div className="flex flex-col items-center justify-center w-[70px] shrink-0">
                    <span
                      className="text-[3.2rem] leading-[0.8] font-black tracking-tighter text-[#FF4D4D]"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {sub.marginVal}
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest mt-2 text-[#FF4D4D]/70"
                      style={{ fontFamily: "'Afacad', sans-serif" }}
                    >
                      required
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col items-end text-right min-w-0 ml-4">
                    <span
                      className="text-[16px] font-black uppercase tracking-widest leading-none mb-1 truncate w-full text-[#FF4D4D]"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {sub.code}
                    </span>
                    <span
                      className="text-[13px] font-medium lowercase tracking-wide mb-3 truncate w-full text-[#FF4D4D]/70"
                      style={{ fontFamily: "'Afacad', sans-serif" }}
                    >
                      {sub.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[12px] font-bold tracking-widest text-[#FF4D4D]/70"
                        style={{ fontFamily: "'Afacad', sans-serif" }}
                      >
                        {sub.attended}/{sub.total}
                      </span>
                      <div className="w-[3px] h-[3px] rounded-full bg-[#FF4D4D]/40" />
                      <span
                        className="text-[16px] font-black tracking-tighter text-[#FF4D4D]"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {sub.percent}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col gap-3.5 w-full"
          >
            <div className="flex items-center gap-3 mb-2 w-full">
              <span
                className="text-[12px] font-bold lowercase tracking-[0.25em] text-[#111111]/40 whitespace-nowrap"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                safe subjects
              </span>
              <div className="flex-1 h-[1.5px] bg-[#111111]/10 rounded-full" />
            </div>

            {safeAttendance.map((sub, index) => (
              <div
                key={sub.id}
                className="w-full border-[1.5px] rounded-[24px] p-5 flex items-center justify-between bg-white shadow-sm border-[#111111]/10"
              >
                <div className="flex flex-col items-center justify-center w-[70px] shrink-0">
                  <span
                    className="text-[3.5rem] leading-[0.8] font-black tracking-tighter text-[#111111]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {sub.marginVal}
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest mt-2 text-[#111111]/40"
                    style={{ fontFamily: "'Afacad', sans-serif" }}
                  >
                    margin
                  </span>
                </div>

                <div className="flex-1 flex flex-col items-end text-right min-w-0 ml-4">
                  <span
                    className="text-[18px] font-black uppercase tracking-widest leading-none mb-1 truncate w-full text-[#111111]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {sub.code}
                  </span>
                  <span
                    className="text-[14px] font-medium lowercase tracking-wide mb-3 truncate w-full text-[#111111]/50"
                    style={{ fontFamily: "'Afacad', sans-serif" }}
                  >
                    {sub.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[12px] font-bold tracking-widest text-[#111111]/40"
                      style={{ fontFamily: "'Afacad', sans-serif" }}
                    >
                      {sub.attended}/{sub.total}
                    </span>
                    <div className="w-[3px] h-[3px] rounded-full bg-[#111111]/20" />
                    <span
                      className="text-[16px] font-black tracking-tighter text-[#111111]"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {sub.percent}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="fixed bottom-[90px] left-6 right-6 flex justify-between items-end pointer-events-none z-10">
          {"attendance".split("").map((char, i) => (
            <span
              key={i}
              className="text-[3.2rem] leading-[0.75] lowercase text-[#111111]"
              style={{ fontFamily: "'Afacad', sans-serif", fontWeight: 400 }}
            >
              {char}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
