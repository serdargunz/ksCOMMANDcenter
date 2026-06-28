# 🥗 SnapCal — Photo Calorie Tracker

The easiest possible way to track calories: **snap a photo of your meal, and the
app figures out the calories for you.** No searching databases, no scanning
barcodes, no tedious manual entry — just point, shoot, and confirm.

Built for someone to use remotely from their phone. Open the link, tap **Snap a
meal**, take a picture, and it's logged.

![SnapCal](https://img.shields.io/badge/calorie%20tracker-photo%20powered-16a34a)

---

## How it works

1. **You take a photo** of your food (camera opens automatically on phones).
2. The photo is sent to a small serverless function that calls **Google
   Gemini's vision model** (free tier), which identifies the food, estimates
   portion sizes, and returns calories + protein / carbs / fat.
3. You get an editable result card — tweak anything if you like — and tap
   **Add to today**.
4. Your daily total updates against your goal. Everything is saved on your
   device automatically.

The interface is deliberately tiny: one screen, one big button, a progress ring,
and today's list.

---

## Tech overview

- **Frontend:** React + TypeScript + Vite. Mobile-first, single screen.
- **AI engine:** Google Gemini vision (`gemini-2.0-flash`, free tier) called over
  its REST API with a JSON `responseSchema`, so the nutrition numbers come back
  as clean, validated JSON. (Also accepts iPhone HEIC photos.)
- **Backend:** one Netlify serverless function (`netlify/functions/analyze.mts`)
  that keeps your API key secret — the key never touches the browser.
- **Storage:** the daily log lives in the browser's `localStorage`. No database,
  no accounts, fully private to the device.

```
Browser  ──photo──▶  /.netlify/functions/analyze  ──▶  Gemini vision  ──▶  calories
   ▲                                                                          │
   └──────────────────────  localStorage (your log)  ◀──────────────────────┘
```

---

## Deploy to Netlify (get a shareable link)

You need a **free Google Gemini API key** — create one at
<https://aistudio.google.com/app/apikey>.

### Option A — via the Netlify website

1. Push this repository to GitHub.
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
   Build settings are detected automatically from `netlify.toml`
   (build `npm run build`, publish `dist`, functions `netlify/functions`).
3. Before/after the first deploy, go to **Site settings → Environment
   variables** and add:

   | Key              | Value                          |
   | ---------------- | ------------------------------ |
   | `GEMINI_API_KEY` | your Gemini key (from AI Studio) |

4. Trigger a deploy. Netlify gives you a public URL — share it with whoever
   will be using the tracker. That's it.

### Option B — via the Netlify CLI

```bash
npm install
npm install -g netlify-cli
netlify deploy --build --prod
# then set the key once:
netlify env:set GEMINI_API_KEY "your-gemini-key"
netlify deploy --build --prod
```

---

## Run locally

The app needs the serverless function running too, so use the Netlify dev server
(plain `vite` alone won't have the `/analyze` endpoint):

```bash
npm install
cp .env.example .env          # then put your real GEMINI_API_KEY in .env
npm install -g netlify-cli    # if you don't have it
netlify dev                   # serves the app + the function together
```

Open the URL it prints (usually <http://localhost:8888>).

> Plain `npm run dev` runs only the Vite frontend — photo analysis will fail
> because the `/analyze` function isn't running. Use `netlify dev`.

---

## Notes & limits

- Calorie estimates from a photo are **approximations** — good for everyday
  tracking, not a substitute for a kitchen scale. Every number is editable
  before you log it.
- Supported image types: JPEG, PNG, GIF, WebP, up to ~5 MB.
- Data is stored per-device in the browser. Clearing site data clears the log.
  (Want cross-device sync? That's the natural next step — swap `localStorage`
  for a hosted database.)
