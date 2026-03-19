"use client";
import { createContext, useContext } from "react";

interface AppLayoutContextType {
  onOpenSettings: () => void;
}

export const AppLayoutContext = createContext<AppLayoutContextType | undefined>(undefined);

export function useAppLayout() {
  const context = useContext(AppLayoutContext);
  if (!context) throw new Error("useAppLayout must be used within AppLayout");
  return context;
}
