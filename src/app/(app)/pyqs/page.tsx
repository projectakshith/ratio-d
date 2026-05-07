"use client";

import React from "react";
import DesktopPYQs from "@/components/desktop/pyqs/PYQs";
import { useIsMobile } from "@/hooks/use-mobile";

export default function PYQsPage() {
  const isMobile = useIsMobile();

  if (isMobile === undefined) return <div className="h-full w-full bg-theme-bg" />;

  if (!isMobile) {
    return <DesktopPYQs />;
  }

  // Mobile version can be added later if needed
  return <DesktopPYQs />;
}
