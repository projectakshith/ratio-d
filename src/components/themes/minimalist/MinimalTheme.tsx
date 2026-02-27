"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Dashboard from "./Dashboard";
import Navbar from "./Navbar";

export default function MinimalTheme(props: any) {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="h-full w-full bg-[#F7F7F7] flex flex-col overflow-hidden">
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700;800;900&display=swap');
        `
      }} />

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
                currentRoast={props.academia?.currentRoast || "analyzing aura..."}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}