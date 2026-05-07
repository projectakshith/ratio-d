"use client";
import { useEffect } from "react";

export function useTabFocus() {
  useEffect(() => {
    const normalTitle = "ratio'd";
    const awayTitles = [
      "come back gng",
      "miss u already",
      "where'd u go?",
      "locking out? :/",
      "waiting for u...",
      "ratio'd misses u",
      "come back and lock in",
    ];

    let isInitialLoad = true;
    setTimeout(() => { isInitialLoad = false; }, 2000);

    const handleVisibilityChange = () => {
      if (isInitialLoad) return;
      
      if (document.hidden) {
        const randomTitle = awayTitles[Math.floor(Math.random() * awayTitles.length)];
        document.title = randomTitle;
      } else {
        document.title = normalTitle;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);
}
