"use client";
import React from "react";
import { Zap, CloudOff, Smartphone } from "lucide-react";
import { OnboardingSlide } from "../slidesData";

export const LogoSlide: OnboardingSlide = {
  id: "core",
  bg: "bg-[#0c30ff]",
  text: "text-[#ceff1c]",
  title: "ratio'd",
  subtitle: "built for speed",
  isLogoPhase: true,
  points: [
    {
      icon: Zap,
      label: "actually fast",
      desc: "refreshes in like a second. no lag, no mid portal errors.",
    },
    {
      icon: CloudOff,
      label: "works offline",
      desc: "access your schedule even when campus wifi is being mid.",
    },
    {
      icon: Smartphone,
      label: "gesture nav",
      desc: "smooth transitions and fluid navigation. built for handhelds.",
    },
  ],
};
