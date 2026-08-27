# ratio-d Performance & Bundle Size Optimization Plan

This document outlines the optimization strategy for the **ratio-d** dashboard. The goal is to shrink bundle sizes, decrease initial paint latency, and optimize CPU execution to make the app run smoothly on low-end devices and slow 3G networks.

---

## 🚫 Core Bottlenecks & Optimization Details

### 1. View Duplication in Page Routes (Bundle Bloat)
* **Locations:**
  * [attendance/page.tsx](file:///C:/Users/Rajesh/ratio-d/src/app/%28app%29/attendance/page.tsx)
  * [dashboard/page.tsx](file:///C:/Users/Rajesh/ratio-d/src/app/%28app%29/dashboard/page.tsx)
  * [marks/page.tsx](file:///C:/Users/Rajesh/ratio-d/src/app/%28app%29/marks/page.tsx)
  * [calendar/page.tsx](file:///C:/Users/Rajesh/ratio-d/src/app/%28app%29/calendar/page.tsx)
  * [timetable/page.tsx](file:///C:/Users/Rajesh/ratio-d/src/app/%28app%29/timetable/page.tsx)
* **The Issue:** Every route statically imports all three layouts (Desktop, Mobile Minimalist, and Mobile Brutalist). This forces client browsers to download code for all three, even though they only show one layout at any time.
* **The Fix:** Replace static imports with client-side dynamic imports using `next/dynamic` so the browser only fetches the bundle it renders.
* **Example:**
  ```typescript
  import dynamic from "next/dynamic";
  const DesktopAttendance = dynamic(() => import("@/components/desktop/attendance/Attendance"), {
    loading: () => <div className="h-full w-full bg-theme-bg" />
  });
  ```

---

### 2. Global Layout Overhead in AppWrapper (Initial Load Bloat)
* **Location:** [AppWrapper.tsx](file:///C:/Users/Rajesh/ratio-d/src/components/shared/AppWrapper.tsx)
* **The Issue:** Heavy interactive modules like `WhatsNew`, `UpdateHistory`, `PortalLoginModal`, and experimental components like `MinecraftParticles` and `MinecraftAmbience` are statically imported at the root layout. They block the initial paint for all users, including those who are not logged in or are not using the `"steve"` theme.
* **The Fix:** Import these modules dynamically with `{ ssr: false }` so they are excluded from the initial rendering path and loaded on-demand.

---

### 3. Redundant Landing Page Payload on Mobile
* **Location:** [src/app/page.tsx](file:///C:/Users/Rajesh/ratio-d/src/app/page.tsx)
* **The Issue:** Mobile users are immediately redirected in `useEffect` and never see the landing page. However, because `LandingPage` is statically imported, the browser downloads the landing page package before redirecting.
* **The Fix:** Change the landing page to a dynamic import.
  ```typescript
  const LandingPage = dynamic(() => import("@/components/landing/LandingPage"), {
    loading: () => <div className="h-screen w-full bg-[#0c30ff]" />,
  });
  ```

---

### 4. Settings Page Bloating the Layout
* **Location:** [AppLayoutClient.tsx](file:///C:/Users/Rajesh/ratio-d/src/app/%28app%29/AppLayoutClient.tsx)
* **The Issue:** The 42KB [SettingsPage.tsx](file:///C:/Users/Rajesh/ratio-d/src/components/shared/SettingsPage.tsx) is imported statically in the main layout wrapper and downloaded on initial dashboard mount, even though the user only clicks it occasionally.
* **The Fix:** Convert it to a dynamic import.

---

### 5. CPU Overhead from Particle Animation Loop
* **Location:** [MinecraftParticles.tsx](file:///C:/Users/Rajesh/ratio-d/src/components/shared/MinecraftParticles.tsx)
* **The Issue:** Running React state updates at 60fps via `setInterval` to animate up to 50 absolute-positioned particle divs causes high CPU load, leading to frame drops on budget mobile devices.
* **The Fix:** Rebuild the particle generator using an HTML5 `<canvas>` and a `requestAnimationFrame` loop, keeping animation state out of React's render cycles.

---

### 6. Unoptimized Local Fonts
* **Location:** `public/fonts/` & [layout.tsx](file:///C:/Users/Rajesh/ratio-d/src/app/layout.tsx)
* **The Issue:** Fonts are loaded in `.otf` and `.ttf` formats. In addition, the 191KB [dortage.otf](file:///C:/Users/Rajesh/ratio-d/public/fonts/dortage.otf) is completely unused.
* **The Fix:** Remove the unused font and compress others (`Akira`, `Aonic`, `Minecraft`, `Urbanosta`) to `.woff2` format to save ~60% network weight on font loads.

---

### 7. CryptoJS Bundle Footprint
* **Location:** [Encryption.ts](file:///C:/Users/Rajesh/ratio-d/src/utils/shared/Encryption.ts)
* **The Issue:** `crypto-js` is imported globally but only used in `legacyDecrypt` to migrate users from the old credentials format. Modern browsers all run Web Crypto API natively.
* **The Fix:** Dynamically import `crypto-js` inside `legacyDecrypt` so that it is only downloaded by users who actually need legacy migration (99.9% of users will bypass it).
  ```typescript
  async function legacyDecrypt(ciphertext: string) {
    const CryptoJS = (await import("crypto-js")).default;
    // ...
  }
  ```

---

### 8. Date-fns Formatting Overhead
* **Location:** [Attendance.tsx](file:///C:/Users/Rajesh/ratio-d/src/components/desktop/attendance/Attendance.tsx#L17)
* **The Issue:** The heavy `date-fns` library is imported just to format date strings to `"yyyy-MM-dd"`.
* **The Fix:** Replace it with a native JS string formatter, removing `date-fns` entirely from the bundle footprint:
  ```typescript
  const dStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
  ```

---

### 9. SmoothScroll Window Caching
* **Location:** [SmoothScroll.tsx](file:///C:/Users/Rajesh/ratio-d/src/components/desktop/SmoothScroll.tsx) & [AppLayoutClient.tsx](file:///C:/Users/Rajesh/ratio-d/src/app/%28app%29/AppLayoutClient.tsx)
* **The Issue:** `SmoothScroll` (Lenis wrapper) is statically imported on the root AppLayout, which loads it for mobile users. Additionally, it binds scroll listeners to the `window` root, even though page window scrolling is disabled in the desktop container.
* **The Fix:** Dynamically import `SmoothScroll` only on desktop, and configure Lenis options to bind to the scrollable layout div instead of the `window` root.

---

### 10. Redundant Timetable Fetching (Backend Sync API)
* **Location:** [main.py](file:///C:/Users/Rajesh/ratio-d/backend/main.py#L309) (FastAPI refresh)
* **The Issue:** When fetching attendance refresh from Academia, the backend concurrently requests both `Batch_1` and `batch_2` timetable grids. This is slow and double-loads Academia.
* **The Fix:** Add an optional `batch` string to the `/refresh` credentials request. If the client has cached profile data, it sends the student's batch, allowing the backend to request only the relevant grid.

---

### 11. PWA Navigation "Lie-fi" Latency
* **Location:** [next.config.ts](file:///C:/Users/Rajesh/ratio-d/next.config.ts)
* **The Issue:** Page navigations use the `NetworkFirst` policy without timeouts, meaning the browser will hang waiting for a slow network before falling back to local cached pages.
* **The Fix:** Add `networkTimeoutSeconds: 3` to the navigate caching rule in PWA workbox configurations.

---

### 12. High-Resolution Pixel Art GIFs (Massive Asset Overhead)
* **Location:** `public/mc_bg/` (`mc_bg_1.gif` at 4.43MB, `mc_bg_2.gif` at 1.01MB, `mc_bg_3.gif` at 1.32MB) & `public/enderman_idle.gif` (695KB)
* **The Issue:** These are pixel art decorative assets. Because they are saved at high resolutions, they take up massive bandwidth (~7.5MB total!).
* **The Fix:** Downscale the GIF resolutions to their native pixel art grid (e.g. 240p or 360p) and let the browser's CSS upscaler (`image-rendering: pixelated`) handle the display. This will preserve pixel-perfect crispness while shrinking file sizes by **90-95%**!

---

### 13. Heavy Landing Page Mockup
* **Location:** `public/mockup.png` (2.22MB)
* **The Issue:** A 2.22MB PNG is served for the landing page hero section.
* **The Fix:** Compress it to `.webp` format, which will reduce the payload size to ~150KB (a ~93% size saving) with no loss in visual quality.

---

### 14. Heavy Splash Screen Video
* **Location:** `public/splash.mp4` (1.95MB)
* **The Issue:** The video played on PWA launch is nearly 2MB, delaying startup if loading from scratch.
* **The Fix:** Compress the video stream (crf-28) or use WebM format, bringing the size down to ~300KB.

---

## 🐛 Core Logic Bugs to Fix

* **Today Double Counting:** In [attendanceLogic.ts](file:///C:/Users/Rajesh/ratio-d/src/utils/attendance/attendanceLogic.ts#L317), prevent `getRecoveryDate` from simulating classes on today's date if those classes have already completed.
* **Fallback Matcher Type Mismatch:** In [attendanceLogic.ts](file:///C:/Users/Rajesh/ratio-d/src/utils/attendance/attendanceLogic.ts#L181), make `matchAttendance` check `(codeMatch || nameMatch) && typeMatch` to prevent practical lab hours from counting towards theory subjects.
* **Brutalist Theme Prediction Cards:** In Brutalist [Attendance.tsx](file:///C:/Users/Rajesh/ratio-d/src/components/themes/brutalist/attendance/Attendance.tsx#L390), update the active subject display counts using predicted counts (`predPresent` and `predConducted`) when prediction mode is active.
