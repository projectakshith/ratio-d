"use client";
import React from "react";
import { Lock, EyeOff, ShieldCheck, Github } from "lucide-react";
import ScramblerPreview from "../previews/ScramblerPreview";
import { OnboardingSlide } from "../slidesData";

export const PrivacySlide: OnboardingSlide = {
  id: "privacy",
  bg: "bg-[#111111]",
  text: "text-[#F7F7F7]",
  title: (
    <>
      <span className="text-[2rem] block leading-none">lowkenuinely</span>
      <span className="text-[5rem] md:text-[6rem] block leading-[0.8]">
        private
      </span>
    </>
  ),
  titleClass: "font-black uppercase tracking-tighter leading-[0.85]",
  subtitle: "the pinky promise",
  isLogoPhase: false,
  isPrivacySlide: true,
  interactiveComponent: <ScramblerPreview />,
  points: [
    {
      icon: Lock,
      label: "on device only",
      desc: "all your data stays on your phone. nowhere else.",
    },
    {
      icon: EyeOff,
      label: "no databases",
      desc: "we dont store anything so we literally cant see your marks.",
    },
    {
      icon: ShieldCheck,
      label: "aes encrypted",
      desc: "even if someone takes your phone, your data is locked down.",
    },
    {
      icon: Github,
      label: "open source",
      desc: (
        <a
          href="https://github.com/projectakshith/ratio-d"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-[#ceff1c]/30 hover:decoration-[#ceff1c] transition-all"
        >
          github.com/projectakshith/ratio-d
        </a>
      ),
    },
  ],
};
