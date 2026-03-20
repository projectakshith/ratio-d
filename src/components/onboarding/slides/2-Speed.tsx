"use client";
import React from "react";
import { Zap, Activity, CloudOff } from "lucide-react";
import RefreshPreview from "../previews/RefreshPreview";
import { OnboardingSlide } from "../slidesData";

export const SpeedSlide: OnboardingSlide = {
  id: "speed",
  bg: "bg-[#004643]",
  text: "text-[#F0EDE5]",
  title: "feel\nthe speed",
  titleClass:
    "font-black uppercase text-[4.5rem] md:text-[6.5rem] tracking-tighter leading-[0.85]",
  subtitle: "custom backend. zero lag.",
  isLogoPhase: false,
  interactiveComponent: <RefreshPreview />,
  points: [
    {
      icon: Zap,
      label: "sub second sync",
      desc: "tap the button above to see it in action. it's actually fast.",
    },
    {
      icon: Activity,
      label: "no more waiting",
      desc: "skip the academia portal lag. our custom endpoints fetch data directly.",
    },
    {
      icon: CloudOff,
      label: "instant offline",
      desc: "everything is cached instantly. access your marks even with zero bars.",
    },
  ],
};
