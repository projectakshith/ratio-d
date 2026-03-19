"use client";
import React from "react";
import { Zap } from "lucide-react";
import ChefsPreview from "../previews/ChefsPreview";
import { OnboardingSlide } from "../slidesData";

export const DevsSlide: OnboardingSlide = {
  id: "community",
  bg: "bg-[#8b5cf6]",
  text: "text-[#F7F7F7]",
  title: "the\nchefs",
  titleClass:
    "font-black uppercase text-[4.5rem] md:text-[6.5rem] tracking-tighter leading-[0.85]",
  subtitle: "built by students for students",
  isLogoPhase: false,
  isCommunitySlide: true,
  preview: <ChefsPreview />,
  points: [
    {
      icon: Zap,
      label: "student run",
      desc: "built by students for students. no corporate bs.",
    },
  ],
};
