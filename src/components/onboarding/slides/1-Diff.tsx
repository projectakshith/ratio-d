"use client";
import React from "react";
import { Zap, CloudOff, BookOpen, Activity } from "lucide-react";
import AlertCardPreview from "../previews/AlertCardPreview";
import { OnboardingSlide } from "../slidesData";

export const DiffSlide: OnboardingSlide = {
  id: "unique",
  bg: "bg-[#FF4D4D]",
  text: "text-[#F7F7F7]",
  title: (
    <>
      <span className="text-[2rem] block leading-none">built</span>
      <span className="text-[4rem] md:text-[6rem] block leading-[0.8] tracking-tighter">
        different
      </span>
    </>
  ),
  titleClass: "font-black uppercase tracking-tighter leading-[0.85]",
  subtitle: "not your average dashboard",
  isLogoPhase: false,
  interactiveComponent: <AlertCardPreview />,
  points: [
    {
      icon: Zap,
      label: "sub second refresh",
      desc: "our custom endpoints fetch your data in under a second. no cap.",
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
    {
      icon: Activity,
      label: "2nd yr cse alerts",
      desc: "full ft/ct details for 2nd yr cse. (other courses? send us details!)",
    },
  ],
};
