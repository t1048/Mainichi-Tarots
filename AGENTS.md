# AGENTS.md

## Project

`mainichi-tarots` — Japanese-language single-page app with fortune-telling menus:
タロット / ルーン / おみくじ / 周易 / 数秘術, plus 恋愛・相性 (タロット相性占い + 二人の周易).
Home shows a daily one-card tarot dashboard (`DailyTarotDashboard`).
Static SPA, no backend, no external network calls at runtime; state persisted to `localStorage`.
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
- `src/app.tsx` — `<HashLocationProvider>` + `<Router>`; registers 8 routes:
  `/`, `/tarot`, `/rune`, `/omikuji`, `/iching`, `/numerology`, `/love/tarot`, `/love/iching`,
  default `<NotFound>`. (No `/love` hub — love pages are linked from Home nav cards.)
- `src/pages/` — `Home`, `Tarot`, `Rune`, `Omikuji`, `IChing`, `Numerology`, `LoveTarot`, `LoveIChing`, `NotFound` (each ships a colocated `.module.css`)
- `src/components/` — `Layout`, `Button`, `CardSlot`, `ResultPanel`, `RuneStone`, `TarotCard`, `HistoryModal`, `CopyResultButton`, `ConfirmDialog`, `DailyTarotDashboard`, `TarotShuffleStage`, `TarotDeckStack`, `ShuffleStylePicker`
  - `src/components/tarot/` — SVG glyph/pip layouts for the 78 tarot cards
- `src/lib/`
  - `rng.ts` — Fisher–Yates via `crypto.getRandomValues` (rejection sampling); `chance(0.5)` rolls 正/逆
  - `storage.ts` — `localStorage` wrapper, key prefix `mainichi-tarots:v1:`
  - `hash-location.tsx` — custom hash router context (see Quirks)
  - `history.ts` — per-`FortuneKind` history with 14-day retention, old tarot entries auto-migrated
  - `daily-fortune.ts` — per-day snapshots for Home daily draws (`daily-tarot`, `daily-rune`, etc.)
  - `tarot-deck.ts` / `tarot-draw.ts` / `tarot-shuffle.ts` — persistent deck order, draw helpers, shuffle styles
  - `use-save-once.ts` / `use-daily-restore.ts` — save-once and daily-restore hooks
  - `format.ts`, `copy.ts`, `iching-toss.ts`, `love-tarot-summary.ts`, `shuffle-page-effect.ts`
- `src/data/`
  - `tarot-major.json` + `tarot-minor.json` = 78 cards (loaded by `tarot-meta.ts`)
  - `runes.json`, `iching.json`, `omikuji.json`, `numerology.json` (with thin `-meta.ts` wrappers)
  - `templates.ts` — tarot interpretation text builder (used by `Tarot.tsx`, `LoveTarot.tsx`)
- `scripts/` — empty placeholder directory, ignore

## Quirks / things an agent will get wrong without this

- **Custom hash router.** `src/lib/hash-location.tsx` monkey-patches `preact-iso`'s `LocationProvider` context so all `<a href="#/...">` links work as SPA routes. Routes are hash-based on purpose (GitHub Pages subpath). Don't replace it with `BrowserRouter` or change link `href` formats without also revisiting `Layout.tsx`.
- **localStorage key prefix.** `src/lib/storage.ts` uses `mainichi-tarots:v1:`. Changing the prefix silently invalidates user data; if you bump it, write a migration, don't just rename.
- **History retention is 14 days, not a count cap.** `src/lib/history.ts` `RETENTION_DAYS = 14`; `loadHistoryEntries` trims and re-saves on read.
- **Old tarot history auto-migrates.** `isOldTarotEntry` / `migrateTarotEntries` in `src/lib/history.ts` convert pre-`kind` tarot entries into the unified `BaseHistoryEntry` shape on first read. Don't remove this branch even if no old data exists in dev.
- **Daily fortune is separate from history.** `daily-fortune.ts` stores one result per calendar day (`daily-tarot`, `daily-rune`, `daily-omikuji`, `daily-iching`) for Home restore. Old flat `daily-tarot` objects are auto-migrated to `{ date, payload }` envelope on read.
- **Persistent tarot deck.** `tarot-deck.ts` keeps a shuffled 78-card order in `tarot-deck`; draws consume from the top. `shuffle-style` stores the user's shuffle animation preference. Don't reset these casually — users expect continuity across sessions.
- **Vite `base: './'`.** Required for GitHub Pages subpath deployment. Don't switch to `'/'` unless the deploy target also changes.
- **PWA manifest `start_url` / `scope` are hardcoded** to `/Mainichi-Tarots/` in `vite.config.ts`. If the repo is renamed or deployed elsewhere, both paths and `vite.config.ts` `base` must be updated together.
- **`tsc -b` in the build script.** `tsconfig.json` is a single file with no `references`; the `-b` is harmless but misleading. Treat `npm run typecheck` as the source of truth for type errors.
- **`virtual:pwa-register` typings come from `tsconfig.json` `types: ["vite-plugin-pwa/client"]`.** Don't drop that entry or `main.tsx` stops type-checking.
- **Static data lives in JSON.** Card / rune / hexagram / numerology content is in `src/data/*.json` and re-exported via `*-meta.ts`. Add or edit content there, not in TS source.
- **Fortune randomness uses `rng.ts`.** `secureRandomInt` / `shuffle` / `chance` prefer `crypto.getRandomValues`; do not substitute `Math.random()` in draw logic. (`history.ts` uses `Math.random` only for non-security history IDs; `rng.ts` falls back to `Math.random` only when `crypto` is unavailable.)
- **No image assets.** Cards, runes, and hexagrams are all inline SVG. Do not add raster images to `public/`.
- **Reduced motion.** The site must continue to function when `prefers-reduced-motion: reduce` is set; CSS in `src/styles/` and component modules already handle disabling — honor it for new animations.
- **TS strictness.** Unused locals / parameters fail typecheck. Clean up dead code rather than `_`-prefixing without thought.
- **Japanese UI strings.** User-facing copy is Japanese; keep new copy in Japanese to match the existing voice.
- **README is partially stale.** It still says "4 種類" and omits numerology / new components — code wins.

## Deploy / CI

- `.github/workflows/deploy.yml` runs on push to `main`: `npm ci` → `npm run typecheck` → `npm run build` → uploads `dist/` to GitHub Pages. Matching this order locally (`typecheck` then `build`) is the fastest pre-PR check.
- No release tooling, no versioning workflow, no PR template.

## Conventions

- Functions over classes; Preact function components, hooks from `preact/hooks`.
- CSS Modules import as `import styles from './X.module.css'`; class names composed via template strings.
- No state library — local `useState` / `useReducer` / `useRef` only.
- Persisted state goes through `loadJSON` / `saveJSON` in `src/lib/storage.ts`; do not touch `localStorage` directly.
- **Save once per reading** via `useSaveOnce` from `src/lib/use-save-once.ts` (used in all fortune pages and `DailyTarotDashboard`). Call `reset()` when starting a new draw — don't replace with plain boolean state or the effect re-fires and double-saves.
- **Daily restore on mount** via `useDailyRestore` where pages need to reload today's saved draw.

## Cursor Cloud specific instructions

- Pure static SPA: no backend, database, or other services to start. Running `npm run dev` (Vite on `http://localhost:5173`) is the only service needed to test any flow end to end. Dependencies are refreshed by the startup update script (`npm ci`), so you normally don't need to reinstall.
- See `## Commands` above for the canonical dev/typecheck/build/preview commands; CI order (typecheck → build) is the fastest pre-PR check.
- State lives only in `localStorage`; to test from a clean slate, clear site data / use a fresh browser profile rather than expecting a server reset.