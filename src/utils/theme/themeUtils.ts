/**
 * Theme Utilities
 * Central helper for the CSS custom-property based theming system.
 * Each "full theme" is a combination of:
 *   - UI style:     "minimalist" | "brutalist"
 *   - Color theme:  one of the 10 named palettes below
 */

export type ColorTheme =
  | "el"
  | "asherah"
  | "baal"
  | "shapash"
  | "yhwh"
  | "lucifer"
  | "gad"
  | "gabriel"
  | "mot"
  | "default"
  | "minimalist-dark"
  | "brutalist";

export type UiStyle = "minimalist" | "brutalist";

export interface ThemeMeta {
  id: ColorTheme;
  name: string;
  deity: string;
  description: string;
  isDark: boolean;
  /** Representative swatches: [bg, primary, highlight] */
  swatches: [string, string, string];
}

export const COLOR_THEMES: ThemeMeta[] = [
  {
    id: "el",
    name: "El",
    deity: "Egyptian",
    description: "Warm earthy browns & tans",
    isDark: false,
    swatches: ["#F5E6D3", "#8B7355", "#C5A572"],
  },
  {
    id: "asherah",
    name: "Asherah",
    deity: "Canaanite",
    description: "Soft pinks & forest greens",
    isDark: false,
    swatches: ["#FFF9E6", "#2E7D32", "#FFB74D"],
  },
  {
    id: "baal",
    name: "Baal",
    deity: "Storm God",
    description: "Dark stormy with gold",
    isDark: true,
    swatches: ["#263238", "#37474F", "#FFD54F"],
  },
  {
    id: "shapash",
    name: "Shapash",
    deity: "Sun Goddess",
    description: "Warm golden & amber",
    isDark: false,
    swatches: ["#FFF9C4", "#FFB300", "#FFF176"],
  },
  {
    id: "yhwh",
    name: "Yhwh",
    deity: "Abstract",
    description: "Pure minimal black & white",
    isDark: false,
    swatches: ["#FFFFFF", "#212121", "#BDBDBD"],
  },
  {
    id: "lucifer",
    name: "Lucifer",
    deity: "Light Bearer",
    description: "Abyss dark with blood red",
    isDark: true,
    swatches: ["#0D0D0D", "#1A1A1A", "#FF4444"],
  },
  {
    id: "gad",
    name: "Gad",
    deity: "Fortune God",
    description: "Deep charcoal & muted grays",
    isDark: true,
    swatches: ["#1A1A1A", "#2A2A2A", "#6A6A6A"],
  },
  {
    id: "gabriel",
    name: "Gabriel",
    deity: "Archangel",
    description: "Celestial blues & purples",
    isDark: false,
    swatches: ["#EEF0FF", "#5C6BC0", "#7C4DFF"],
  },
  {
    id: "mot",
    name: "Mot",
    deity: "Death God",
    description: "Deep teal darkness",
    isDark: true,
    swatches: ["#1A1F2E", "#607D8B", "#80CBC4"],
  },
  {
    id: "default",
    name: "Default Light",
    deity: "Classic Minimal",
    description: "Clean grayscale with green highlight",
    isDark: false,
    swatches: ["#F7F7F7", "#555555", "#85a818"],
  },
  {
    id: "minimalist-dark",
    name: "Default Dark",
    deity: "Classic Minimal",
    description: "Pure black with green highlight",
    isDark: true,
    swatches: ["#111111", "#37474F", "#85a818"],
  },
  {
    id: "brutalist",
    name: "Neon Brutalist",
    deity: "Classic Brutal",
    description: "Deep black with neon yellow",
    isDark: true,
    swatches: ["#050505", "#3b82f6", "#ceff1c"],
  },
];

/** Themes whose --theme-bg is dark */
export const DARK_COLOR_THEMES = new Set<ColorTheme>([
  "baal",
  "lucifer",
  "gad",
  "mot",
  "minimalist-dark",
  "brutalist",
]);

/** Parse a full theme string like "minimalist_baal" into its parts */
export function parseTheme(fullTheme: string): {
  uiStyle: UiStyle;
  colorTheme: ColorTheme;
  isDark: boolean;
} {
  const parts = fullTheme.split("_");
  const uiStyle: UiStyle =
    parts[0] === "brutalist" ? "brutalist" : "minimalist";
  const colorPart = parts.slice(1).join("_") as ColorTheme;
  const colorTheme: ColorTheme = COLOR_THEMES.some((t) => t.id === colorPart)
    ? colorPart
    : "el";
  return { uiStyle, colorTheme, isDark: DARK_COLOR_THEMES.has(colorTheme) };
}

/** Build a full theme string */
export function buildTheme(
  uiStyle: UiStyle,
  colorTheme: ColorTheme,
): string {
  return `${uiStyle}_${colorTheme}`;
}

/**
 * Migrate legacy theme strings to the new combined format.
 * "minimalist_dark"  → "minimalist_baal"
 * "minimalist_light" → "minimalist_el"
 * "brutalist"        → "brutalist_el"
 */
export function migrateTheme(raw: string | null): string {
  if (!raw) return "minimalist_baal";
  switch (raw) {
    case "minimalist_dark":  return "minimalist_baal";
    case "minimalist_light": return "minimalist_el";
    case "brutalist":        return "brutalist_el";
    default:
      // Already in new format or recognisable – validate it
      if (raw.includes("_")) {
        const { uiStyle, colorTheme } = parseTheme(raw);
        return buildTheme(uiStyle, colorTheme);
      }
      return "minimalist_baal";
  }
}

/** Human-readable display name for a full theme string */
export function getThemeDisplayName(fullTheme: string): string {
  const { uiStyle, colorTheme } = parseTheme(fullTheme);
  const meta = COLOR_THEMES.find((t) => t.id === colorTheme);
  const styleName = uiStyle === "brutalist" ? "Brutalist" : "Minimalist";
  return meta ? `${meta.name} · ${styleName}` : styleName;
}

/**
 * Return semantic color CSS-variable strings based on the current theme.
 * These resolve at runtime via CSS custom properties.
 */
export const getThemeColors = () => ({
  // Status
  success: "var(--theme-highlight)",
  warning: "var(--theme-accent)",
  error: "var(--theme-secondary)",
  info: "var(--theme-primary)",
  // UI
  background: "var(--theme-bg)",
  foreground: "var(--theme-text)",
  border: "var(--theme-primary)",
  // Brutalist
  brutalistBg: "var(--theme-bg)",
  brutalistAccent: "var(--theme-highlight)",
  brutalistDanger: "var(--theme-secondary)",
  brutalistExam: "var(--theme-primary)",
  // Minimalist
  minimalistCardBg: "var(--theme-bg)",
  minimalistCardBorder: "var(--theme-primary)",
  minimalistMutedText:
    "color-mix(in srgb, var(--theme-text) 60%, transparent)",
});
