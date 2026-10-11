"use client";
import { ReactNode } from "react";

export default function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <div className="h-full w-full overflow-hidden">
      {children}
    </div>
  );
}
