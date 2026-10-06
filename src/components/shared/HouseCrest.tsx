"use client";

import React from "react";

interface HouseCrestProps {
  house: "gryffindor" | "slytherin" | "ravenclaw" | "hufflepuff";
  size?: number; // default 48
  className?: string;
}

const colors = {
  gryffindor: { shield: "#7A1B1B", accent: "#D4A838" },
  slytherin: { shield: "#1A5C2A", accent: "#A8A8A8" },
  ravenclaw: { shield: "#1A3A6B", accent: "#CD8032" },
  hufflepuff: { shield: "#C5960C", accent: "#2C2C2C" },
};

const animalPaths = {
  gryffindor: (
    <path d="M12 7 C13.5 7 14 8.5 13 9.5 C14 11 14.5 13 13 15 C11 16 10 15.5 10 14 C10 12.5 11 11.5 11 10 C10 9 10.5 7 12 7 Z" />
  ),
  slytherin: (
    <path
      d="M14 8 C11.5 6.5 9 8.5 10 10.5 C11 12.5 14 13.5 14 15 C14 17 11 18 9 16.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  ),
  ravenclaw: (
    <path d="M12 7 L15 10 L17 9 L15 13 L12 17 L9 13 L7 9 L9 10 Z" />
  ),
  hufflepuff: (
    <>
      <path d="M8 14 C8 12.5 10 11.5 12 11.5 C14 11.5 16 12.5 16 14 C16 15 14 16 12 16 C10 16 8 15 8 14 Z" />
      <path
        d="M10 11.5 L9 9.5 M14 11.5 L15 9.5 M11.5 14.5 H12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </>
  ),
};

export function HouseCrest({ house, size = 48, className }: HouseCrestProps) {
  const { shield, accent } = colors[house];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-label={`${house} crest`}
      role="img"
    >
      {/* Shield Outline and Fill */}
      <path
        d="M12 2 C12 2 4 4 4 10 C4 16 12 22 12 22 C12 22 20 16 20 10 C20 4 12 2 12 2 Z"
        fill={shield}
        stroke={accent}
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Decorative top elements */}
      <circle cx="8" cy="4.5" r="0.75" fill={accent} />
      <circle cx="16" cy="4.5" r="0.75" fill={accent} />

      {/* Animal Silhouette */}
      <g fill={accent} stroke={accent} strokeWidth="0.5" strokeLinejoin="round">
        {animalPaths[house]}
      </g>
    </svg>
  );
}

export { colors as HOUSE_CREST_COLORS };
export default HouseCrest;
