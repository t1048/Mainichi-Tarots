# AGENTS.md

## Project

`mainichi-tarots` — Japanese-language single-page app with 5 fortune-telling menus:
タロット / ルーン / おみくじ / 周易, plus 恋愛・相性 (compatibility: タロット + 周易).
Static SPA, no backend, no external network calls at runtime, history persisted to `localStorage`.
Deployed to GitHub Pages at `https://t1048.github.io/Mainichi-Tarots/`.

## Stack (do not introduce alternatives)

- Vite 5 + Preact 10 + `preact-iso` (hash routing)
- `vite-plugin-pwa` (PWA + service worker; `registerSW` is called in `src/main.tsx`)
- TypeScript strict, `noUnusedLocals` / `noUnusedParameters` on
- CSS Modules (`.module.css`) — no Tailwind, no CSS-in-JS
- No tests, no ESLint, no Prettier, no Husky configured. Do not invent or run them.

## Commands

- `npm run dev` — Vite dev server on `http://localhost:5173`
- `npm run typecheck` — `tsc --noEmit` (this is the only static check; CI runs it before build)
- `npm run build` — `tsc -b && vite build` → `dist/`
- `npm run preview` — serve `dist/` locally

There is no `lint`, no `test`, no single-test command. Do not fabricate one.

## Layout

- `src/main.tsx` → mounts `<App />` into `#app`, calls `registerSW({ immediate: true })`
- `src/app.tsx` — `<HashLocationProvider>` + `<Router>`; registers 7 routes:
  `/`, `/tarot`, `/rune`, `/omikuji`, `/iching`, `/love`, `/love/tarot`, `/love/iching`,
  default `<NotFound>`.
- `src/pages/` — `Home`, `Tarot`, `Rune`, `Omikuji`, `IChing`, `LoveHome`, `LoveTarot`, `LoveIChing`, `NotFound` (each ships a colocated `.module.css`)
- `src/components/` — `Layout`, `Button`, `CardSlot`, `ResultPanel`, `RuneStone`, `TarotCard`, `HistoryModal`
  - `src/components/tarot/` — SVG glyph/pip layouts for the 78 tarot cards
- `src/lib/`
  - `rng.ts` — Fisher–Yates via `crypto.getRandomValues` (rejection sampling); `chance(0.5)` rolls 正/逆
  - `storage.ts` — `localStorage` wrapper, key prefix `mainichi-tarots:v1:`
  - `hash-location.tsx` — custom router context (see Quirks)
  - `history.ts` — per-`FortuneKind` history with 14-day retention, old tarot entries auto-migrated to the unified shape
  - `format.ts` — JP date/time/romanize helpers
- `src/data/`
  - `tarot-major.json` + `tarot-minor.json` = 78 cards (loaded by `tarot-meta.ts`)
  - `runes.json`, `iching.json`, `omikuji.json` (with thin `-meta.ts` wrappers)
  - `templates.ts` — tarot interpretation text builder (used by `Tarot.tsx`, `LoveTarot.tsx`)
- `scripts/` — empty placeholder directory, ignore

## Quirks / things an agent will get wrong without this

- **Custom hash router.** `src/lib/hash-location.tsx` monkey-patches `preact-iso`'s `LocationProvider` context so all `<a href="#/...">` links work as SPA routes. Routes are hash-based on purpose (GitHub Pages subpath). Don't replace it with `BrowserRouter` or change link `href` formats without also revisiting `Layout.tsx`.
- **Debug beacon in production code.** `src/lib/hash-location.tsx` contains a `// #region agent log` block that `fetch`es `http://127.0.0.1:7597/ingest/...` on every route change. This is leftover instrumentation, not a feature. Remove it when touching this file, and never add similar dev-only network calls to shipped code.
- **localStorage key prefix.** `src/lib/storage.ts` uses `mainichi-tarots:v1:`. Changing the prefix silently invalidates user history; if you bump it, write a migration, don't just rename.
- **History retention is 14 days, not a count cap.** `src/lib/history.ts` `RETENTION_DAYS = 14`; `loadHistoryEntries` trims and re-saves on read. The README's "30 件" line is stale — code wins.
- **Old tarot history auto-migrates.** `isOldTarotEntry` / `migrateTarotEntries` in `src/lib/history.ts` convert pre-`kind` tarot entries into the unified `BaseHistoryEntry` shape on first read. Don't remove this branch even if no old data exists in dev.
- **Vite `base: './'`.** Required for GitHub Pages subpath deployment. Don't switch to `'/'` unless the deploy target also changes.
- **PWA manifest `start_url` / `scope` are hardcoded** to `/Mainichi-Tarots/` in `vite.config.ts`. If the repo is renamed or deployed elsewhere, both paths and `vite.config.ts` `base` must be updated together.
- **`tsc -b` in the build script.** `tsconfig.json` is a single file with no `references`; the `-b` is harmless but misleading. Treat `npm run typecheck` as the source of truth for type errors.
- **`virtual:pwa-register` typings come from `tsconfig.json` `types: ["vite-plugin-pwa/client"]`.** Don't drop that entry or `main.tsx` stops type-checking.
- **Static data lives in JSON.** Card / rune / hexagram content is in `src/data/*.json` and re-exported via `*-meta.ts`. Add or edit content there, not in TS source.
- **All randomness is secure.** `src/lib/rng.ts` uses `crypto.getRandomValues` with rejection sampling; do not substitute `Math.random()` in pages. `chance(0.5)` is how orientation (正/逆) is rolled.
- **No image assets.** Cards, runes, and hexagrams are all inline SVG. Do not add raster images to `public/`.
- **Reduced motion.** The site must continue to function when `prefers-reduced-motion: reduce` is set; CSS in `src/styles/` already handles the disabling, but don't introduce new animations without honoring it.
- **Tarot preset URLs.** Only `src/pages/Tarot.tsx` reads `?r=<base64>` query params to restore a shared reading via `tryDecodePreset`. The love pages do not have a sharing contract. Keep the existing one or break it explicitly.
- **TS strictness.** Unused locals / parameters fail typecheck. Clean up dead code rather than `_`-prefixing without thought.
- **Japanese UI strings.** User-facing copy is Japanese; keep new copy in Japanese to match the existing voice.

## Deploy / CI

- `.github/workflows/deploy.yml` runs on push to `main`: `npm ci` → `npm run typecheck` → `npm run build` → uploads `dist/` to GitHub Pages. Matching this order locally (`typecheck` then `build`) is the fastest pre-PR check.
- No release tooling, no versioning workflow, no PR template.

## Conventions

- Functions over classes; Preact function components, hooks from `preact/hooks`.
- CSS Modules import as `import styles from './X.module.css'`; class names composed via template strings.
- No state library — local `useState` / `useReducer` / `useRef` only.
- Persisted state goes through `loadJSON` / `saveJSON` in `src/lib/storage.ts`; do not touch `localStorage` directly.
- A "save once per reading" pattern is enforced with `useRef(false)` flags in pages (e.g. `IChing.tsx`, `LoveTarot.tsx`, `LoveIChing.tsx`) — don't replace these with a plain boolean state, the effect re-fires and you'd double-save.
