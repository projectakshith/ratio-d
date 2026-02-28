"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Dashboard from "./Dashboard";
import MinimalAttendance from "./Attendance";
import Navbar from "./Navbar";

export default function MinimalTheme(props: any) {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="h-full w-full bg-[#F7F7F7] flex flex-col overflow-hidden">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700;800;900&display=swap');
        `,
        }}
      />

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full"
            >
              <Dashboard
                data={props.data}
                timeStatus={props.academia?.timeStatus}
                currentRoast={props.academia?.currentRoast || "analyzing..."}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {activeTab === "attendance" && (
        <motion.div
          key="attendance"
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
        >
          <MinimalAttendance />
        </motion.div>
      )}

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
