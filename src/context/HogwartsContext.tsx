"use client";

import { createContext, useContext, useState, useEffect, useLayoutEffect, ReactNode } from "react";
import { useTheme } from "@/context/ThemeContext";
import { parseTheme } from "@/utils/theme/themeUtils";
import { useApp } from "@/context/AppContext";
import { fetchWithLoadBalancer } from "@/utils/backendProxy";
import { EncryptionUtils } from "@/utils/shared/Encryption";

export type HogwartsHouse = "gryffindor" | "slytherin" | "ravenclaw" | "hufflepuff";

export const HOUSE_CONFIG: Record<HogwartsHouse, {
  name: string;
  emoji: string;
  motto: string;
  colorThemeId: string;
}> = {
  gryffindor: { name: "Gryffindor", emoji: "🦁", motto: "Where dwell the brave at heart", colorThemeId: "hogwarts-gryffindor" },
  slytherin: { name: "Slytherin", emoji: "🐍", motto: "Those cunning folk use any means", colorThemeId: "hogwarts-slytherin" },
  ravenclaw: { name: "Ravenclaw", emoji: "🦅", motto: "Wit beyond measure is treasure", colorThemeId: "hogwarts-ravenclaw" },
  hufflepuff: { name: "Hufflepuff", emoji: "🦡", motto: "Those patient and loyal", colorThemeId: "hogwarts-hufflepuff" },
};

interface HogwartsContextType {
  isHogwartsActive: boolean;
  hogwartsHouse: HogwartsHouse | null;
  showIntro: boolean;
  showQuote: boolean;
  dismissIntro: () => void;
  dismissQuote: () => void;
}

const HogwartsContext = createContext<HogwartsContextType | undefined>(undefined);

export function HogwartsProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const { userData, setUserData } = useApp();

  const isHogwartsActive = theme.includes("hogwarts");
  const house = (userData?.profile as any)?.hogwarts_house as HogwartsHouse | undefined;
  const introSeen = (userData?.profile as any)?.hogwarts_intro_seen as boolean | undefined;

  const [localHouse, setLocalHouse] = useState<HogwartsHouse | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [sessionTriggered, setSessionTriggered] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (house) setLocalHouse(house);
  }, [house]);

  useEffect(() => {
    let active = true;

    async function assignHouse() {
      if (!isHogwartsActive || !userData?.profile || isAssigning) return;

      if (house) {
        if (!sessionTriggered) {
          setSessionTriggered(true);
          if (!introSeen) {
            setShowIntro(true);
            setShowQuote(false);
          } else {
            setShowIntro(false);
            setShowQuote(true);
          }
        }
        return;
      }

      setIsAssigning(true);
      try {
        const token = (userData.profile as any).hogwarts_token;
        if (!token) {
            console.error("Missing Hogwarts token in profile");
            return;
        }

        const res = await fetchWithLoadBalancer(`/hogwarts/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });

        const data = await res.json();

        if (!active) return;

        if (data.hogwarts_house) {
          setUserData({
            ...userData,
            profile: {
              ...userData.profile,
              hogwarts_house: data.hogwarts_house,
              hogwarts_intro_seen: false
            }
          });

          setLocalHouse(data.hogwarts_house as HogwartsHouse);

          if (!sessionTriggered) {
            setSessionTriggered(true);
            setShowIntro(true);
            setShowQuote(false);
          }
        }
      } catch (e) {
        console.error("Failed to assign Hogwarts house", e);
      } finally {
        if (active) setIsAssigning(false);
      }
    }

    assignHouse();

    return () => { active = false; };
  }, [isHogwartsActive, house, introSeen, sessionTriggered, isAssigning, userData, setUserData]);

  useEffect(() => {
    if (!isHogwartsActive) {
      setShowIntro(false);
      setShowQuote(false);
      setSessionTriggered(false);
    }
  }, [isHogwartsActive]);

  useLayoutEffect(() => {
    if (isHogwartsActive && localHouse) {
      document.documentElement.setAttribute("data-theme", HOUSE_CONFIG[localHouse].colorThemeId);
      document.documentElement.style.colorScheme = "dark";
      setTimeout(() => {
        const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--theme-bg').trim();
        let meta = document.querySelector('meta[name="theme-color"]');
        if (meta && bgColor) meta.setAttribute('content', bgColor);
      }, 50);
    } else if (theme && !isHogwartsActive) {
      const { colorTheme, isDark } = parseTheme(theme);
      document.documentElement.setAttribute("data-theme", colorTheme);
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";
      setTimeout(() => {
        const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--theme-bg').trim();
        let meta = document.querySelector('meta[name="theme-color"]');
        if (meta && bgColor) meta.setAttribute('content', bgColor);
      }, 50);
    }
  }, [isHogwartsActive, localHouse, theme]);

  const dismissIntro = async () => {
    setShowIntro(false);

    if (userData?.profile) {
      setUserData({
        ...userData,
        profile: {
          ...userData.profile,
          hogwarts_intro_seen: true
        }
      });

      try {
        const token = (userData.profile as any).hogwarts_token;
        if (!token) return;

        await fetchWithLoadBalancer(`/hogwarts/intro`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });
      } catch (e) {
        console.error("Failed to save intro state", e);
      }
    }
  };

  const dismissQuote = () => {
    setShowQuote(false);
  };

  return (
    <HogwartsContext.Provider
      value={{
        isHogwartsActive,
        hogwartsHouse: localHouse,
        showIntro,
        showQuote,
        dismissIntro,
        dismissQuote,
      }}
    >
      {children}
    </HogwartsContext.Provider>
  );
}

export function useHogwarts() {
  const context = useContext(HogwartsContext);
  if (context === undefined) {
    throw new Error("useHogwarts must be used within a HogwartsProvider");
  }
  return context;
}
