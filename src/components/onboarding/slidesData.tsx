"use client";
import React from "react";
import { LogoSlide } from "./slides/0-Logo";
import { DiffSlide } from "./slides/1-Diff";
import { SpeedSlide } from "./slides/2-Speed";
import { PrivacySlide } from "./slides/3-Privacy";
import { DevsSlide } from "./slides/4-Devs";
import { ThemesSlide } from "./slides/5-Themes";

export interface OnboardingSlide {
  id: string;
  bg: string;
  text: string;
  title: string | React.ReactNode;
  subtitle: string;
  isLogoPhase: boolean;
  titleClass?: string;
  isPrivacySlide?: boolean;
  isCommunitySlide?: boolean;
  isThemeSlide?: boolean;
  interactiveComponent?: React.ReactNode;
  preview?: React.ReactNode;
  description?: string;
  points: { icon: any; label: string; desc: string | React.ReactNode }[];
}

export const slides: OnboardingSlide[] = [
  LogoSlide,
  DiffSlide,
  SpeedSlide,
  PrivacySlide,
  DevsSlide,
  ThemesSlide,
];
