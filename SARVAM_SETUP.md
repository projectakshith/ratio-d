# Sarvam AI Voice Assistant Integration · ratio'd

This branch (`feature/sarvam-ai`) integrates **Sarvam AI** directly into ratio'd, providing SRM students with an interactive, voice-first AI buddy that calculates bunk limits, projects target marks, and answers academic questions in English, Hinglish, and Indic languages.

---

## 🔮 What Was Added

### 1. 3D Animated Dotted AI Orb (`AiOrbCanvas.tsx`)
- **480-Point Fibonacci Sphere:** Mathematical 3D particle sphere rotating at 60 FPS on HTML5 Canvas.
- **Dual Orbital Dashed Rings:** Interactive rotating halo rings around the sphere.
- **Dynamic States:**
  - `idle`: Gentle breathing pulse with rotating points.
  - `listening`: Outward expansion reacting to voice input.
  - `thinking`: Rapid orbital acceleration with violet/cyan aura.
  - `speaking`: Harmonic wave oscillations radiating from the core while audio plays.

### 2. Two-Way Multilingual Voice Pipeline
- **Speech-to-Text (STT) via `saaras:v4` (`/api/sarvam/stt`):**
  - Uses the browser's Web Audio API to capture raw audio in **pristine 16kHz mono WAV format** (PCM 16-bit).
  - Bypasses external browser cloud servers (avoiding campus Wi-Fi blocking).
  - Supports English, Hindi, Tamil, Telugu, and code-mixed speech.
- **Text-to-Speech (TTS) via `bulbul:v3` (`/api/sarvam/tts`):**
  - Generates natural, Indian-accented speech audio in real time using the `shubh` speaker model.
  - Features mute/unmute audio toggling and manual read-aloud buttons.

### 3. Context-Aware Intelligence (`/api/sarvam`)
- **Model:** `sarvam-105b-conversations`
- **Data Injected:**
  - Full blueprint of `api.getratiod.lol` endpoints.
  - SRM 75% attendance threshold & bunk formulas:
    - $\lfloor\frac{\text{present} - 0.75 \times \text{conducted}}{0.75}\rfloor$ for safe bunks.
    - $\lceil\frac{0.75 \times \text{conducted} - \text{present}}{0.25}\rceil$ for critical recovery classes.
  - SRM 10-point CGPA grading scales.
  - **Live Student Context:** Logged-in profile, subject-by-subject attendance stats, and internal test marks.

---

## 🚀 Setup & Environment

### 1. Environment Configuration (`.env`)
Create a `.env` file in the root of the project:

```env
# Sarvam AI Secret Subscription Key
SARVAM_API_KEY=your_sarvam_api_key_here

# Backend routing (points to production ratio'd backend)
NEXT_PUBLIC_BACKEND_URLS=https://api.getratiod.lol
NEXT_PUBLIC_PORTAL_AUTH_URL=https://api.getratiod.lol
```

> [!NOTE]
> `.env` is included in `.gitignore` — your API key will never be committed or exposed to the client bundle.

---

## 💻 Running the App

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
Bind to `0.0.0.0` so you can access it on your phone over Wi-Fi:

```bash
npx next dev --webpack -H 0.0.0.0 -p 9002
```

### 3. Access URLs
- **Desktop (Localhost):** [http://localhost:9002](http://localhost:9002)
- **Phone (Same Wi-Fi / Hotspot):** `http://<your-lan-ip>:9002` (e.g. `http://10.9.156.247:9002`)

---

## 📁 Files Modified & Created

| File | Purpose |
|---|---|
| `src/app/api/sarvam/route.ts` | Next.js API route: forwards chat queries to `sarvam-105b-conversations` with live student data context. |
| `src/app/api/sarvam/stt/route.ts` | Next.js API route: accepts 16kHz WAV audio and transcribes via Sarvam `saaras:v4`. |
| `src/app/api/sarvam/tts/route.ts` | Next.js API route: synthesizes speech via Sarvam `bulbul:v3`. |
| `src/components/shared/AiOrbCanvas.tsx` | Interactive 3D animated dotted particle sphere canvas component. |
| `src/components/shared/SarvamPopup.tsx` | Main popup modal with Orb & Voice mode, chat logs, live insight cards, and voice controls. |
| `src/components/shared/AppWrapper.tsx` | Global mount for `SarvamPopup` across all pages. |
| `src/utils/backendProxy.ts` | Configured backend fallback to `https://api.getratiod.lol`. |
| `SARVAM_SETUP.md` | Complete documentation and setup guide. |
