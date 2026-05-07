# Security & Architecture Changes

Branch: `security` — branched off `dev`

---

## What changed and why

### 1. Encryption — properly this time

**Before:**
The app generated a random AES key and stored it in `localStorage` under `ratio_internal_dk`. The encrypted credentials and cookies were also in `localStorage`. Both the key and the data it protects lived in the same place — anyone who could read `localStorage` (a malicious browser extension, XSS, etc.) got the key and the data at the same time. The encryption was effectively doing nothing.

**After:**
The AES key is now generated using the browser's built-in Web Crypto API with `extractable: false`. This means the key object lives inside the browser's secure key store (IndexedDB) and **cannot be exported or read by any JavaScript** — not even our own code. The ciphertext still lives in `localStorage`, but without the key it's useless. Passive localStorage dumping no longer exposes credentials.

Algorithm also upgraded from AES-CBC to AES-GCM, which includes authentication (detects tampering) and uses a random IV per encryption.

**Migration:** Existing users are automatically migrated on first load — their old data is decrypted with the old key and re-encrypted with the new scheme. No forced logout. The old `ratio_internal_dk` key is deleted after migration.

Files changed: `src/utils/shared/Encryption.ts`

---

### 2. Password no longer sent on every refresh

**Before:**
Every refresh request sent `{ username, password, cookies }` to the backend. The password went over the wire every single time even though it was only needed if the SRM session had expired. This was a `...creds` spread that included everything.

**After:**
Refresh requests now only send `{ username, cookies }`. The password stays in encrypted storage. If the SRM session has expired, the backend returns a `SESSION_EXPIRED` signal, the frontend loads the password from storage and retries once. After that it succeeds or logs the user out. The password is transmitted only when it's actually needed.

Files changed: `src/context/AppContext.tsx`, `backend/models/schemas.py`, `backend/main.py`

---

### 3. Backend authentication — HMAC request signing

**Before:**
The backend checked for a header `X-Ratio-App: true`. Any request from anywhere could add this header and hit the backend directly. It was security theater — one line in curl would bypass it.

**After:**
Every request that reaches the backend must carry a cryptographic signature: `X-Ratio-Sig: t=<timestamp>,v1=<HMAC-SHA256>`. The signature is computed using a shared secret that lives only in the Cloudflare Worker environment (never in browser code) and on the backend servers. The backend verifies the signature and also checks that the timestamp is within 5 minutes to prevent replay attacks.

A request without a valid signature returns 403. There is no header value to guess — the signature changes with every request.

Files changed: `backend/main.py`, `worker/index.ts` (new)

---

### 4. Cloudflare Worker proxy

**Before:**
The frontend held a list of backend URLs (`NEXT_PUBLIC_BACKEND_URLS`) and load-balanced between them using `Math.random()` directly in the browser. The signing secret (if any) would have had to be in the browser bundle.

**After:**
A Cloudflare Worker sits between the frontend and all backends. The frontend calls one URL (the Worker). The Worker:
- Adds the HMAC signature using a secret stored in Worker environment variables — never touches the browser
- Load balances across all backend instances (Render + personal PCs)
- Caches refresh responses per student for 10 minutes — if the same student hits refresh multiple times in quick succession, only the first request actually reaches the backend, the rest are served from Cloudflare's cache instantly
- Handles CORS with a 24-hour preflight cache — browsers only send the OPTIONS preflight once per day instead of before every request

The 10-minute cache on refresh responses is significant: SRM's data updates at most a few times per day, so serving cached data for 10 minutes is accurate and cuts backend load dramatically during peak hours (8-9am when everyone checks before class).

Files changed: `worker/index.ts` (new), `worker/wrangler.toml` (new), `src/utils/backendProxy.ts`

---

### 5. Rate limiting fixed

**Before:**
The rate limit key was `X-Student-Key`, a header the client set to their own username. Anyone could send any value for this header to appear as a different "user" and bypass rate limits.

**After:**
Rate limiting now uses `CF-Connecting-IP`, which Cloudflare sets to the real client IP. This cannot be spoofed by the client. Usernames are no longer logged in full — only the last 4 characters are logged to avoid building a user enumeration list in server logs.

Files changed: `backend/main.py`

---

### 6. CORS tightened

**Before:**
The backend allowed `http://localhost:3000` and `http://localhost:9002` in production. Every browser preflight (OPTIONS request) was hitting the backend with no caching.

**After:**
`localhost` origins are only allowed when `ENV=development` is set on the backend. In production, only `getratiod.lol` and `www.getratiod.lol` are allowed. Preflight responses are now cached for 24 hours (`max_age=86400`) — a student who used the app yesterday won't trigger a new preflight today. This halves the number of requests hitting the backend for regular users.

Files changed: `backend/main.py`

---

### 7. Edge runtime removed from all app pages

**Before:**
Every page under `src/app/(app)/` had `export const runtime = "edge"`. On Cloudflare Pages with `@cloudflare/next-on-pages`, this means every page navigation invoked a Cloudflare Worker. All these pages are `"use client"` components — they render entirely in the browser and don't run any server-side code. The `runtime = "edge"` declaration on them was pointless and was burning free tier Worker invocations on every navigation.

**After:**
`runtime = "edge"` removed from all `"use client"` pages. The app layout (`layout.tsx`) has also been simplified — it was doing a server-side cookie check that `AppLayoutClient` was already doing client-side. The duplicate server-side check is removed. Auth protection works exactly as before, just without the Worker invocation.

Files changed: `src/app/(app)/layout.tsx`, `src/app/(app)/page.tsx`, `src/app/(app)/marks/page.tsx`, `src/app/(app)/timetable/page.tsx`, `src/app/(app)/attendance/page.tsx`, `src/app/(app)/calendar/page.tsx`

---

### 8. Security headers

**Before:**
No HTTP security headers. The app could be iframed by any website (clickjacking). Browsers had no CSP instructions.

**After:**
Added to all responses:
- `X-Frame-Options: DENY` — prevents the app from being embedded in iframes on other sites
- `X-Content-Type-Options: nosniff` — prevents browsers from MIME-sniffing responses
- `Referrer-Policy: strict-origin-when-cross-origin` — limits referrer info sent to third parties
- `Content-Security-Policy` — restricts what the app can connect to; `connect-src` includes the Worker URL dynamically from the `NEXT_PUBLIC_WORKER_URL` env var at build time

Files changed: `next.config.ts`

---

## What you need to do to deploy

### 1. Deploy the Worker

```bash
cd worker
wrangler secret put HMAC_SECRET      # use: openssl rand -hex 32, save this value
wrangler secret put BACKEND_URLS     # comma-separated: https://render-url.onrender.com,https://pc-tunnel.cfargotunnel.com
wrangler deploy
```

### 2. Set env vars on Cloudflare Pages

```
NEXT_PUBLIC_WORKER_URL = https://ratiod-proxy.<your-account>.workers.dev
```

### 3. Set env vars on each backend (Render + each PC)

```
HMAC_SECRET = <same value as Worker secret>
ENV = production
```

### 4. Cloudflare Tunnels for PCs (recommended)

Replace whatever you're using for the PCs with Cloudflare Tunnel — free, stable URL regardless of dynamic home IP:

```bash
cloudflared tunnel create ratiod-pc1
cloudflared tunnel run ratiod-pc1
```

Add the tunnel URL to `BACKEND_URLS` in the Worker secret.

---

## What is NOT changed

- PWA service worker and Workbox caching — untouched
- Offline mode — works exactly as before
- All animations and UX flows — untouched
- `ratio_data` localStorage structure — same, just read/written with async functions now
- The actual data the app shows — nothing about attendance, marks, timetable logic changed
