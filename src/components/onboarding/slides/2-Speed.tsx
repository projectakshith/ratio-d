"use client";
import React from "react";
import { Zap, Activity, CloudOff } from "lucide-react";
import RefreshPreview from "../previews/RefreshPreview";
import { OnboardingSlide } from "../slidesData";

export const SpeedSlide: OnboardingSlide = {
  id: "speed",
  bg: "bg-[#8b5cf6]",
  text: "text-[#F7F7F7]",
  title: (
    <>
      <span className="text-[2rem] block leading-none">feel</span>
      <span className="text-[4rem] md:text-[6rem] block leading-[0.8] tracking-tighter">
        the speed
      </span>
    </>
  ),
  titleClass: "font-black uppercase tracking-tighter leading-[0.85]",
  subtitle: "actually fast",
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
