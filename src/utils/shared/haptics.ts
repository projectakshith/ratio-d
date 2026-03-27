export const Haptics = {
  vibe: (pattern: number | number[] = 8) => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
      }
    }
  },

  selection: () => Haptics.vibe(8),
  light: () => Haptics.vibe(10),
  medium: () => Haptics.vibe(15),
  heavy: () => Haptics.vibe(20),
  
  success: () => Haptics.vibe([10, 30, 10]),
  warning: () => Haptics.vibe([30, 50, 30]),
  error: () => Haptics.vibe([50, 100, 50]),
  notification: () => Haptics.vibe([200, 100, 200]),
};
