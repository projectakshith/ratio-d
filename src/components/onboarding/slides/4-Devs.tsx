"use client";
import React from "react";
import DevsPreview from "../previews/DevsPreview";
import { OnboardingSlide } from "../slidesData";

export const DevsSlide: OnboardingSlide = {
  id: "community",
  bg: "bg-[#381932]",
  text: "text-[#FFF3E6]",
  title: "the devs",
  titleClass:
    "font-black uppercase text-[4rem] md:text-[6.5rem] tracking-tighter leading-[0.85]",
  subtitle: "we da best (kanye level delusion)",
  isLogoPhase: false,
  isCommunitySlide: true,
  preview: <DevsPreview />,
  points: [],
};
