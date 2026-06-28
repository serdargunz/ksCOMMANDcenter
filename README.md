# 🥗 SnapCal — Photo Calorie Tracker

The easiest possible way to track calories: **snap a photo of your meal, and the
app figures out the calories for you.** No searching databases, no scanning
barcodes, no tedious manual entry — just point, shoot, and confirm.

It's a single self-contained web page with **no backend** — it runs entirely in
the browser, so it can be hosted free anywhere (GitHub Pages, etc.) and used from
any phone.

![SnapCal](https://img.shields.io/badge/calorie%20tracker-photo%20powered-16a34a)

---

## How it works

1. **You take a photo** of your food (camera opens automatically on phones).
2. The browser sends it straight to **Google Gemini's vision model** (free tier),
   which identifies the food, estimates portions, and returns calories +
   protein / carbs / fat as structured JSON.
3. You get an editable result card — tweak anything if you like — and tap
   **Add to today**.
4. Your daily total updates against your goal. Everything is saved on your
   device automatically.

The interface is deliberately tiny: one screen, one big button, a progress ring,
and today's list.

---

## The API key (one-time, free)

Because there's no server, the app calls Gemini **directly from your browser**
using your own key:

1. Get a free key at <https://aistudio.google.com/app/apikey> (sign in with
   Google → **Create API key** → copy).
2. In the app, tap the **🎯 Settings** button (top right) and paste it in.

The key is stored **only in your browser** (`localStorage`) — it is never
committed to the repo, never uploaded to any server, and isn't part of the
published site. Each person who uses the app enters their own key. This is fine
for personal use; for a shared/public product you'd move the key behind a small
backend instead.

---

## Tech overview

- **Frontend:** React + TypeScript + Vite. Mobile-first, single screen.
- **AI engine:** Google Gemini vision (`gemini-2.0-flash`, free tier) called over
  its REST API with a JSON `responseSchema`, so the nutrition numbers come back
  as clean, validated JSON. (Also accepts iPhone HEIC photos.)
- **Backend:** none. Pure static site.
- **Storage:** the daily log and your API key live in the browser's
  `localStorage`. No database, no accounts.

```
Browser  ──photo + your key──▶  Google Gemini  ──▶  calories
   ▲                                                   │
   └─────────────  localStorage (log + key)  ◀─────────┘
```

---

## Deploy free on GitHub Pages

This repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`)
that builds the app and publishes it to GitHub Pages on every push to `main`.

1. Push this code to `main` (already done if you cloned from there).
2. In the repo on GitHub: **Settings → Pages → Build and deployment → Source**,
   choose **GitHub Actions**. (The workflow tries to enable this automatically;
   set it manually if needed.)
3. The workflow runs on each push to `main`. When it's green, your site is at:

   ```
   https://<your-username>.github.io/<repo-name>/
   ```

Because `vite.config.ts` uses `base: "./"`, it works at that subpath with no
extra configuration. Any other static host (Cloudflare Pages, Netlify, plain
file server) works too — just serve the `dist/` folder.

---

## Run locally

No backend means no special tooling — just Vite:

```bash
npm install
npm run dev
```

Open the URL it prints (usually <http://localhost:5173>). Tap **🎯 Settings**,
paste your Gemini key, and the photo flow works immediately.

To preview the production build:

```bash
npm run build
npm run preview
```

---

## Notes & limits

- Calorie estimates from a photo are **approximations** — good for everyday
  tracking, not a substitute for a kitchen scale. Every number is editable
  before you log it.
- Supported image types: JPEG, PNG, WebP, GIF, and HEIC/HEIF, up to ~5 MB.
- Data is per-device in the browser. Clearing site data clears the log and the
  saved key.
- Free Gemini tier is rate-limited; if you hit a limit, wait a moment and retry.
