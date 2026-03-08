# Changelog

## March 8, 2026

### Minimalist Theme — Full `isDark` Prop Removal & Theme Variable Migration

**Files changed:**
- `src/components/themes/minimalist/timetable/CustomClass.tsx`
- `src/components/themes/minimalist/calendar/Calendar.tsx`
- `src/components/themes/minimalist/attendance/Attendance.tsx`
- `src/components/themes/minimalist/attendance/Predict.tsx`
- `src/components/themes/minimalist/MinimalTheme.tsx`
- `src/utils/attendance/attendanceLogic.ts` *(pre-existing — `getPercentColor` already returns CSS vars)*

#### What changed

Across all minimalist theme pages the `isDark` boolean prop has been fully removed and every hardcoded color replaced with CSS custom-property utility classes from `globals.css`. Components now respond to the active `data-theme` token automatically.

##### All pages — general pattern
| Before | After |
|--------|-------|
| `isDark ? "bg-[#111111]" : "bg-[#F7F7F7]"` | `bg-theme-bg` |
| `isDark ? "text-white" : "text-[#111111]"` | `text-theme-text` |
| `isDark ? "text-white/40" : "text-[#111111]/40"` | `text-theme-muted` |
| `isDark ? "bg-white/5" : "bg-white"` | `bg-theme-surface` |
| `isDark ? "border-white/10" : "border-[#111111]/10"` | `border-theme-subtle` |
| `#85a818` (green accent) | `text-theme-highlight` / `bg-theme-highlight` |
| `#ceff1c text-[#111111]` (brutalist yellow) | `bg-theme-highlight text-theme-text` |
| Bottom-fade gradient with hardcoded color stops | inline `style` with `linear-gradient(to top, var(--theme-bg) …)` using `color-mix` |

---

##### `CustomClass.tsx`
- Subtitle badge: `text-[#85a818]` → `text-theme-highlight`
- All input `focus:border-[#85a818]/50` → `focus:[border-color:var(--theme-highlight)]`
- CTA "add to schedule" button: `bg-[#85a818] text-white shadow-[rgba(133,168,24,…)]` → `bg-theme-highlight text-theme-bg` with `boxShadow: color-mix(…)` inline style

##### `Calendar.tsx`
- Removed `isDark` from `CalendarDay` props and memo comparison
- Removed `getHeaderTheme()` helper function — now uses `const header = theme` directly from `useCalendarData`
- Removed `isDark` from `Calendar` component signature
- Removed all `bgClass / textClass / subTextClass / cardBg / cardBorder` local variables
- Removed redundant inline `<style>` tag (`.no-scrollbar` already in `globals.css`)
- CalendarDay states: selected uses `bg-theme-text text-theme-bg`; today uses `border-theme-text`; regular days `bg-theme-surface border-theme-subtle`
- Nav buttons: `bg-theme-card text-theme-text`; today button `bg-theme-text text-theme-bg`

##### `Attendance.tsx`
- Removed `isDark` from component props/interface
- Inline `<style>` block: removed dark-mode branches; `.affected-dotted-border` now uses `color-mix(in srgb, var(--theme-text) 40%, transparent)`
- PREDICT idle button: shadow offset via inline `style={{ boxShadow: '2px 2px 0px var(--theme-text)' }}`; all inner elements use `bg-theme-surface`, `text-theme-text`, `border-theme-border`
- PREDICTING active banner (`bg-theme-text` inverted panel): inner pulse dot `bg-theme-bg`; label `text-theme-bg`; subtitle `text-theme-bg-60`; icon buttons `bg-theme-bg-alpha border-theme-bg-10 text-theme-bg`
- Warning (action-required) box: `bg-[#FF4D4D]/5` (theme-neutral; red is a fixed semantic color)
- Subject cards: `bg-theme-surface border-theme-subtle`; `baseColor` for non-practical subjects is `"var(--theme-text)"` with alpha via `color-mix`
- Removed `isDark` prop from `<Predict>` call

##### `Predict.tsx`
- Removed `isDark` from `PredictProps` interface and all destructuring
- Removed `textClass` local variable
- All containers / buttons migrated to `bg-theme-surface`, `bg-theme-text-20`, `text-theme-text`, `text-theme-muted`, `border-theme-subtle`
- Active tab pill: `bg-theme-highlight text-theme-text`
- Active mode toggle: `bg-theme-text-20 text-theme-text`; inactive: `text-theme-muted`
- Date cell states: disabled `text-theme-subtle`; selected `bg-theme-highlight text-theme-text`; normal `bg-theme-surface text-theme-text`
- Confirm button: `bg-theme-highlight text-theme-text`

##### `MinimalTheme.tsx`
- Removed `isDark={false}` from `<Attendance>` usage

---

### Settings – Theme Picker: Default Presets

**Files changed:**
- `src/utils/theme/themeUtils.ts`
- `src/app/globals.css`
- `src/components/shared/SettingsPage.tsx`

#### What changed

Added the three legacy CSS themes as selectable options in the Settings theme picker.

**New `ColorTheme` values:**

| ID | Name | Description |
|----|------|-------------|
| `default` | Default Light | Classic light minimalist — clean grayscale with green highlight (`#F7F7F7` bg / `#85a818` highlight) |
| `minimalist-dark` | Default Dark | Classic dark minimalist — pure black with green highlight (`#111111` bg / `#85a818` highlight) |
| `brutalist` | Neon Brutalist | Classic brutalist — deep black with neon yellow (`#050505` bg / `#ceff1c` highlight) |

These map directly to the pre-existing `[data-theme="default"]`, `[data-theme="minimalist-dark"]`, and `[data-theme="brutalist"]` blocks already defined in `globals.css`. No new CSS was added.

**`themeUtils.ts`:**
- Added `"default"`, `"minimalist-dark"`, `"brutalist"` to the `ColorTheme` union type
- Added corresponding entries to `COLOR_THEMES` array with correct swatches and metadata
- Added `"minimalist-dark"` and `"brutalist"` to `DARK_COLOR_THEMES`

**`SettingsPage.tsx`:**
- Theme picker now shows a **Default Presets** section above the named deity palettes
- Default Presets contains the three legacy themes listed above
- Theme button layout fixed: `items-center` → `items-start` so text wraps correctly
- Description text split onto two lines (`deity` / `description`) instead of single truncated line
