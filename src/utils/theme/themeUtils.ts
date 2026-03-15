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
  | "brutalist"
  | "yam"
  | "gojo"
  | "eren";

export type UiStyle = "minimalist" | "brutalist";

export interface ThemeMeta {
  id: ColorTheme;
  name: string;
  deity: string;
  description: string;
  isDark: boolean;
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
    swatches: ["#263238", "#37474F", "#D4AF37"],
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
  {
    id: "yam",
    name: "Yam",
    deity: "River God",
    description: "Minimal white with stark lines",
    isDark: false,
    swatches: ["#FFFFFF", "#000000", "#333333"],
  },
  {
    id: "gojo",
    name: "Gojo",
    deity: "Six Eyes",
    description: "Deep void with electric teal",
    isDark: true,
    swatches: ["#00001A", "#000033", "#00FFFF"],
  },
  {
    id: "eren",
    name: "Eren",
    deity: "Founding Titan",
    description: "Earthy charcoal with blood red",
    isDark: true,
    swatches: ["#1A1A1A", "#4B3621", "#8B0000"],
  },
];

export const DARK_COLOR_THEMES = new Set<ColorTheme>([
  "baal",
  "lucifer",
  "gad",
  "mot",
  "minimalist-dark",
  "brutalist",
  "gojo",
  "eren",
]);

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
    : "minimalist-dark";
  return { uiStyle, colorTheme, isDark: DARK_COLOR_THEMES.has(colorTheme) };
}

export function buildTheme(
  uiStyle: UiStyle,
  colorTheme: ColorTheme,
): string {
  return `${uiStyle}_${colorTheme}`;
}

export function migrateTheme(raw: string | null): string {
  if (!raw) return "minimalist_minimalist-dark";
  if (raw === "brutalist") return "brutalist_brutalist";
  if (raw === "minimalist_dark") return "minimalist_minimalist-dark";
  if (raw === "minimalist_light") return "minimalist_default";

  if (raw.includes("_")) {
    const { uiStyle, colorTheme } = parseTheme(raw);
    return buildTheme(uiStyle, colorTheme);
  }

  return "minimalist_minimalist-dark";
}

export function getThemeDisplayName(fullTheme: string): string {
  const { uiStyle, colorTheme } = parseTheme(fullTheme);
  const meta = COLOR_THEMES.find((t) => t.id === colorTheme);
  const styleName = uiStyle === "brutalist" ? "Brutalist" : "Minimalist";
  return meta ? `${meta.name} · ${styleName}` : styleName;
}

export const getThemeColors = () => ({
  success: "var(--theme-highlight)",
  warning: "var(--theme-accent)",
  error: "var(--theme-secondary)",
  info: "var(--theme-primary)",
  background: "var(--theme-bg)",
  foreground: "var(--theme-text)",
  border: "var(--theme-primary)",
  brutalistBg: "var(--theme-bg)",
  brutalistAccent: "var(--theme-highlight)",
  brutalistDanger: "var(--theme-secondary)",
  brutalistExam: "var(--theme-primary)",
  minimalistCardBg: "var(--theme-bg)",
  minimalistCardBorder: "var(--theme-primary)",
  minimalistMutedText:
    "color-mix(in srgb, var(--theme-text) 60%, transparent)",
});
