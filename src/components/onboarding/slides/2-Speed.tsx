"use client";
import React from "react";
import { Zap, Activity, CloudOff } from "lucide-react";
import RefreshPreview from "../previews/RefreshPreview";
import { OnboardingSlide } from "../slidesData";

export const SpeedSlide: OnboardingSlide = {
  id: "speed",
  bg: "bg-[#004643]",
  text: "text-[#F0EDE5]",
  title: (
    <div className="flex flex-col">
      <span className="text-[1.2rem] md:text-[2rem] font-black uppercase tracking-[0.2em] opacity-40 mb-1">
        feel the
      </span>
      <span className="text-[5.5rem] md:text-[8rem] font-black uppercase tracking-tighter leading-[0.8]">
        speeeeeed
      </span>
    </div>
  ),
  titleClass: "font-black uppercase tracking-tighter",
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
      label: "bg refresh",
      desc: "data fetches in the background within a sec while you chill. no wait times.",
    },
    {
      icon: CloudOff,
      label: "instant offline",
      desc: "everything is cached instantly. access your marks even with zero bars.",
    },
  ],
};
