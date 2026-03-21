"use client";
import React from "react";
import { Zap, CloudOff, BookOpen, Activity } from "lucide-react";
import AlertCardPreview from "../previews/AlertCardPreview";
import { OnboardingSlide } from "../slidesData";
import { motion } from "framer-motion";

export const DiffSlide: OnboardingSlide = {
  id: "unique",
  bg: "bg-[#4A3A32]",
  text: "text-[#EADFD4]",
  title: (
    <motion.div
      initial={{ y: 20, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <span className="text-[2rem] block leading-none">built</span>
      <span className="text-[4rem] md:text-[6rem] block leading-[0.8] tracking-tighter">
        different
      </span>
    </motion.div>
  ),
  titleClass: "font-black uppercase tracking-tighter leading-[0.85]",
  subtitle: "dashboard for the gng",
  isLogoPhase: false,
  interactiveComponent: <AlertCardPreview />,
  points: [
    {
      icon: Activity,
      label: "live alerts",
      desc: "get real-time notifications for classes, exams, and marks.",
      hideAfterInteraction: true,
    },
    {
      icon: Activity,
      label: "2nd yr cse alerts",
      desc: "full ft/ct details for 2nd yr cse. (other courses? send us details!)",
      showAfterInteraction: true,
    },
    {
      icon: Zap,
      label: "failproof auth engine",
      desc: "seamlessly bypasses common portal issues like 'session expired' or concurrent login blocks.",
    },
    {
      icon: CloudOff,
      label: "offline caching",
      desc: "your schedule and marks are always there, even without wifi.",
    },
    {
      icon: BookOpen,
      label: "custom notes",
      desc: "built-in private notes for every subject. stay organized lowkey.",
    },
  ],
};
