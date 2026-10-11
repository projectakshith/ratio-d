"use client";
import React from "react";
import dynamic from "next/dynamic";
import { useIsMobile } from "@/hooks/use-mobile";

const MessPage = dynamic(
  () => import("@/components/desktop/mess/Mess"),
  { loading: () => <div className="h-full w-full bg-theme-bg" /> }
);

export default function MessRoute() {
  const isMobile = useIsMobile();
  if (isMobile === undefined) return <div className="h-full w-full bg-theme-bg" />;
  return <MessPage />;
}
