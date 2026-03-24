# ratio'd
<p align="center">
  <img src="https://capsule-render.vercel.app/render?type=wave&color=0EA5E9&height=200&section=header&text=ratio'd&fontSize=90&animation=fadeIn&fontAlignY=38&fontFamily=Urbanosta" />
</p>

### built for speed.
swipe through the lore of academia with zero friction.

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
</p>

> ratio'd is a dashboard built by students, for students. it's lowkey private, failproof, and designed to replace the stress of traditional academic portals.

---

## Project Structure

```
ratio-d/
├── src/               # nextjs frontend [pwa]
├── backend/           # python fastapi backend
├── public/            # static assets and fonts
└── package.json
```

---

## What makes ratio'd different?

* **failproof auth engine**
  seamlessly bypass session expired or concurrent session issues with a custom logic.
* **sub-second sync**
  zero-lag background data fetching that keeps your dashboard fresh while you chill.
* **offline first**
  your schedule, marks, and notes are always cached and available even without wifi.
* **live alerts**
  get real-time notifications for classes, exams, and marks (with special support for 2nd yr cse).
* **custom notes**
  built-in private notes for every subject. stay organized without extra apps.
* **dual visual identities**
  pick between minimalist and brutalist themes based on your vibe.
* **smart attendance tracking**
  instant calculation of margins and recovery paths for every subject.
* **academic predictions**
  advanced marks predictor to plan your path to specific target grades.
* **end-to-end encryption**
  unique device-specific keys generated locally to protect your credentials.

### The Logic Behind ratio'd

we built this to streamline the student experience. by using modern web standards and asynchronous processing, ratio'd provides a fluid interface that works across all your devices.

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/projectakshith/ratio-d
cd ratio-d
```

### 2. Backend Setup (Python FastAPI)

The backend handles the data fetching and session management logic.

```bash
cd backend
# create a virtual environment
python -m venv .venv
source .venv/bin/activate  # on Windows use: .venv\Scripts\activate

# install dependencies
pip install -r requirements.txt

# start the backend server
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup (Next.js)

The frontend is a PWA built with Next.js and Tailwind CSS.

```bash
# from the root ratio-d directory
npm install

# start the development server
npm run dev
```

### 4. Environment Configuration

Create a `.env.local` file in the root `ratio-d` directory:

```bash
# Frontend: comma-separated URLs for your backend instances
BACKEND_URLS="http://localhost:8000"

# Security: must be identical on both frontend and backend
INTERNAL_SECRET="your_secure_random_string"
```

> [!TIP]
> The `INTERNAL_SECRET` is used for a server-to-server handshake between Next.js and FastAPI. It ensures that only your frontend can communicate with your backend.

---

## Visuals

<p align="center">
  <img src="public/screenshots/mobile.jpeg" width="45%" />
  <img src="public/screenshots/attendance.jpeg" width="45%" />
</p>

---

## Technical Specs

* **frontend** nextjs with framer motion
* **backend** python fastapi
* **styling** tailwind css
* **state** react context with custom diffing hooks
* **icons** lucide react

> [!WARNING]
> ensure your backend servers have the correct cors origins set for your frontend domain.

built with heart for students who value efficiency and design.
