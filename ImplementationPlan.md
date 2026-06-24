# Implementation Plan

This document converts [InitialRequirements.md](InitialRequirements.md) into a concrete, stage-by-stage build plan for the U.S. Government Layout project. It is written to be executed by an AI agent, with **a mandatory human checkpoint between each stage** so the user can review progress before the next stage starts.

## Overview

**Goal:** A web app that visualizes the three branches of the U.S. federal government, with all data served dynamically from a backend.

**Stack (locked in during planning):**

- **Frontend:** React + Vite + TypeScript + MUI v6 (Material Design 3), React Router. Dark mode only.
- **Backend:** Node + Express + TypeScript.
- **Database:** SQLite via Prisma (file-based; upgrade path to Postgres later).
- **Data sources (Stage 3):** Congress.gov API, OpenSecrets API, ProPublica Congress API, Wikipedia/Wikidata.
- **Theme colors:** Primary = U.S. flag blue `#3C3B6E`, Secondary = flag red `#B22234`. Used sparingly against a neutral dark background.

**Branch naming correction:** The requirements list the second button as "Legislative" but describe the Supreme Court under it — that is the **Judicial** branch. Congress is the Legislative branch. The three branch buttons in this plan are therefore: **Executive**, **Judicial**, **Legislative**.

**Stage-gating rule:** Stages MUST be executed one at a time. After each stage, stop and wait for the user to verify the deliverables against the **Human checkpoint** section. Do not begin the next stage until the user explicitly approves.

---

## Stage 1 — Architecture & Project Setup

**Goal:** Lay down the empty monorepo skeleton so future stages drop code into well-defined places. No feature code in this stage — only structure, tooling, and the API contract.

### Steps

1. **Initialize npm workspaces monorepo at the repo root** with this layout:
   - `apps/web` — Vite + React + TypeScript frontend.
   - `apps/api` — Express + TypeScript backend.
   - `packages/shared` — shared TypeScript types (`Branch`, `Member`, `Justice`, `ExecutiveRole`, `MoneyBreakdown`, `ColorMode` enum, etc.).
2. **Tooling:** TypeScript in strict mode across all workspaces, ESLint, Prettier, `.editorconfig`. Root `package.json` exposes a `dev` script that uses `concurrently` to run web + api together.
3. **Frontend scaffold (`apps/web`):**
   - Install React Router. Register routes for `/`, `/executive`, `/judicial`, `/judicial/supreme-court`, `/legislative`, `/legislative/senate`, `/legislative/house`.
   - Install MUI v6. Create a `theme.ts` with a dark palette: neutral background (~`#0E0E12`), primary flag-blue `#3C3B6E`, secondary flag-red `#B22234`. Wrap the app in `<ThemeProvider>` + `<CssBaseline>`.
   - Create placeholder page components for each route (titles only).
   - Create `<PageLayout>` — renders a centered page title and a top-right Back button (router-aware; not shown on the index). Used by every non-index page.
   - Create `<RepresentativeCard>` — circular bordered avatar + name caption. Renders with placeholder data for now; the contract is finalized so Stage 2 can reuse it everywhere a government representative appears.
4. **Backend scaffold (`apps/api`):**
   - Express server with CORS, JSON middleware, structured error middleware, and a `GET /api/health` endpoint returning `{ ok: true }`.
   - Initialize Prisma with the SQLite datasource. Schema file exists but contains no models yet (added in Stage 3).
   - Add `.env.example` listing the API key names that will be needed later: `CONGRESS_API_KEY`, `OPENSECRETS_API_KEY`, `PROPUBLICA_API_KEY`.
5. **Shared API contract:** In `packages/shared/src/api.ts`, declare the response shape for every endpoint the UI will call (see Stage 2 list). This locks the frontend↔backend contract before either side has logic. Both `apps/web` and `apps/api` import from `@usgov/shared`.
6. **Root `README.md`** with run instructions: `npm install`, `npm run dev`, which ports the web and api listen on, where the SQLite file lives, and a pointer to this `ImplementationPlan.md`.

### Deliverables

- Repo where `npm install && npm run dev` boots an empty backend on one port and an empty React app on another.
- Navigation works between blank placeholder pages.
- Dark theme + flag colors are visibly applied (verify by viewing the index in a browser).

### Human checkpoint

User confirms:
- The project boots cleanly with `npm run dev`.
- The dark theme and flag colors look right.
- The folder structure and shared-types contract are acceptable.

---

## Stage 2 — Dynamic UI with Mocked Data

**Goal:** Build the full UI per the requirements, populated entirely by mock data served from the backend. Nothing is hardcoded in the frontend — every value the user sees is fetched from the API. Real data sources are deferred to Stage 3.

### Steps

1. **Design system — shared component library** (`apps/web/src/components/`). Define all reusable styled components once here so no page ever re-styles the same element. Build and visually verify each component in isolation before any page uses it:
   - **`<BranchButton>`** — the large, prominent card-style button used on the Index page (three branches) and the Legislative page (Senate/House). Accepts `label`, `onClick`/`to` (router link), and an optional `disabled` flag. Single source of truth for that look — not an inline `sx` on every page.
   - **`<CourtButton>`** — the vertical-stack button used on the Judicial hierarchy page. Shares visual language with `BranchButton` but is narrower/full-width and accepts a `clickable` prop that renders it as a `Button` or a disabled `Box` depending on the flag.
   - **`<RepresentativeCard>`** (already stubbed in Stage 1) — finalize props: `fullName`, `photoUrl`, `subtitle` (role title or appointment info), `size`. Used identically on Executive, Supreme Court, and as tooltip content in `<ChamberView>`.
   - **`<PageLayout>`** (already stubbed) — no change needed; verified in Stage 1.
   - **`<LoadingGrid>`** — a responsive grid of MUI `Skeleton` cards, sized to match `<RepresentativeCard>`. Drop-in loading state for Executive and Supreme Court pages.
   - **`<ErrorMessage>`** — a simple centered MUI `Alert` with a retry button. Used as the error state on all data-fetched pages.
   - Document each component's props with a JSDoc comment so future stages can use them without reading the implementation.

2. **Backend — implement every endpoint returning realistic mock fixtures** matching the shared types from Stage 1:
   - `GET /api/branches` — three branches: Executive, Judicial, Legislative.
   - `GET /api/executive` — current President (Donald Trump) + 5 roles below: Vice President, Secretary of State, Secretary of the Treasury, Secretary of Defense, Attorney General. Each with a placeholder photo URL and name.
   - `GET /api/judicial/courts` — hierarchy: Supreme Court → U.S. Courts of Appeals → U.S. District Courts. Only Supreme Court flagged `clickable: true`.
   - `GET /api/judicial/supreme-court` — 9 justices with placeholder photos and names.
   - `GET /api/legislative/chambers` — Senate + House entries.
   - `GET /api/legislative/senate` — 100 fake members with `party` (`D` | `R` | `I`), `pacPct` (0–100), `opensecretsUrl`, `photoUrl`.
   - `GET /api/legislative/house` — 435 fake members with the same fields.

3. **Frontend pages — all data loaded via fetch hooks** (`useBranches()`, `useExecutive()`, `useSenate()`, etc.). No inline data anywhere in the frontend. Every page uses the components from step 1 — no ad-hoc `sx` styling that duplicates a component's design.
   - **Index page** — three large MD3 buttons labeled "Executive", "Judicial", "Legislative", spaced evenly via a responsive grid. Clicking each navigates to its branch route.
   - **Common layout** — every non-index page uses `<PageLayout>` (centered title + top-right Back button).
   - **`<RepresentativeCard>`** — circular bordered avatar + name caption. Reused on Executive, Supreme Court, and as the visual basis for member dot tooltips.
   - **Executive page** — President centered at top, the 5 role cards below in a responsive grid.
   - **Judicial page** — vertical stack of branch-style buttons (Supreme Court, Courts of Appeals, District Courts); only Supreme Court is clickable, others render as disabled.
   - **Supreme Court page** — responsive grid of 9 `<RepresentativeCard>` instances.
   - **Legislative page** — two buttons: "Upper Body / Senate" and "Lower Body / House".
   - **Senate & House pages** — share a `<ChamberView>` component:
     - **U-shape of dots** rendered as SVG. Built as **two halves (left arc + right arc)** placed in a CSS flex/grid container that wraps so on narrow screens the halves stack vertically (top → bottom) instead of side-by-side. Define a breakpoint around `~900px`.
     - **Dropdown** above the U-shape with two options: **Party** (default) and **Money**.
     - **Dot fill:**
       - Party mode: blue for Democrats, red for Republicans, grey for Independents.
       - Money mode: green if `pacPct === 0`, yellow if `pacPct < 25`, red if `pacPct >= 25`.
     - **Hover:** dot expands (CSS transform scale) and shows a tooltip with the member's name.
     - **Click:** opens the member's `opensecretsUrl` in a new tab.
     - Loading skeleton + error state via MUI components.
4. **Manual responsiveness pass:** resize the browser; confirm the Senate and House U-shape halves stack vertically below the defined breakpoint, per the requirement that small screens "breakdown and show top to bottom instead of left to right".
5. **Thin smoke tests via Vitest:** one test for `<RepresentativeCard>` rendering, one for the money-color function (`0 → green`, `24 → yellow`, `25 → red`, `60 → red`). Just enough to prevent regressions in Stage 3.

### Deliverables

- A fully clickable site that looks finished and behaves correctly, but is powered by mock data — the people and numbers are fake.
- Every requirement in the layout / UX section of the requirements doc is visibly satisfied.

### Human checkpoint

User clicks through every page and verifies:
- Layout matches the requirements (branch buttons, back button placement, centered titles, circular rep cards).
- The U-shape renders correctly and stacks vertically on small screens.
- Hover expands the dots; clicking opens OpenSecrets in a new tab.
- The Party/Money dropdown switches color schemes correctly.
- Theme and colors look right.

User approves the visual + interaction design before any real data is wired in.

---

## Stage 3 — Real Data Integration

**Goal:** Replace mock fixtures with real data pulled from public APIs and cached in SQLite via Prisma. The endpoints from Stage 2 keep their shapes — the frontend should require **no changes**.

### Data-source reality check (updated during Stage 3 implementation)

The original plan named the **OpenSecrets API** and the **ProPublica Congress API** as the money / member-enrichment sources. Both have since been retired:

- **ProPublica Congress API** — no longer issuing keys; effectively shut down. **Dropped.** Congress.gov alone covers the member roster we need.
- **OpenSecrets API** (`candSummary`) — the legacy key-based API has been retired in favor of bulk data. **Replaced** by the **OpenFEC API** (`api.open.fec.gov`), the FEC's official, free, actively-maintained campaign-finance API. We still link each member out to their **opensecrets.org** profile page (that website is alive; only its old API is gone).

So the live data sources for Stage 3 are:

| Data | Source | Notes |
|---|---|---|
| Member roster, party, state, district, photo | **Congress.gov API** v3 | Free key from api.data.gov. |
| PAC contribution % (`pacPct`) | **OpenFEC API** | Free key from api.data.gov. `pacPct = other_political_committee_contributions / receipts`. |
| OpenSecrets profile link | derived URL | Built from member name/state; opensecrets.org website still works. |
| Justice / executive **roster, names, photos** | **Wikidata** (SPARQL + entity API, `P18`) | Queried live; gated by a curated Q-id allowlist (see below). Lower-court hierarchy stays a curated seed (fixed structure). |

### Required API keys & how to get them

Both keys below are **free** and issued instantly. One key from **api.data.gov actually works for both** Congress.gov and OpenFEC (it is a shared gateway), but the code reads them as separate env vars so you can rotate them independently.

1. **`CONGRESS_API_KEY`** — Congress.gov member data.
   - Sign up at **https://api.congress.gov/sign-up/** (or any api.data.gov key works).
   - You get the key by email immediately. Rate limit: ~5,000 requests/hour. The full member roster is a few hundred requests, so one sync run is well within limits.
2. **`FEC_API_KEY`** — OpenFEC campaign-finance data (replaces the dead `OPENSECRETS_API_KEY`).
   - Sign up at **https://api.open.fec.gov/developers/** ("Sign up for an API key" → api.data.gov form).
   - Issued instantly by email. Rate limit: **1,000 requests/hour**. The money sync makes ~2 requests per member (≈1,070 total for all 535), so it must throttle to stay under the cap and is **resumable** across runs.
   - Without a key you may use the literal value `DEMO_KEY`, but it is rate-limited to ~30 req/hour and 50/day — only useful for a tiny spot-check, not a full sync.

`OPENSECRETS_API_KEY` and `PROPUBLICA_API_KEY` are **removed** from `.env.example` (the services are gone). `FEC_API_KEY` is added.

### Steps

1. **Prisma schema** in `apps/api/prisma/schema.prisma`:
   - `Member` — `id`, `bioguideId`, `fullName`, `party`, `state`, `district` (nullable, House-only), `chamber` (`SENATE` | `HOUSE`), `photoUrl`, `fecCandidateId` (nullable), `opensecretsUrl`, `pacPct` (nullable until the money sync runs), `lastSyncedAt`, `moneySyncedAt` (nullable).
   - `Justice` — `id`, `fullName`, `photoUrl`, `appointedBy`, `year`, `source`, `order` (display order).
   - `ExecutiveRole` — `id`, `roleKey`, `roleTitle`, `holderName`, `photoUrl`, `source`, `isPresident`, `order`.
   - `Court` — `id`, `name`, `level`, `parentCourtId` (nullable), `clickable`, `order`.
   - `SyncState` — `key` (e.g. `congress`, `fec`), `lastRunAt`, `cursor` (nullable, for resume), `status`. Tracks idempotent/resumable sync runs and powers the caching policy.
   - Generate the Prisma client and run the initial migration.
2. **Sync jobs** under `apps/api/src/sync/`, each idempotent and runnable independently via npm scripts (`npm run sync:congress`, `sync:fec`, `sync:executive`, `sync:judicial`, or `sync:all`):
   - **`syncCongress.ts`** — Congress.gov API (`/v3/member/congress/{congress}?currentMember=true`, paginated) → upsert all current Senate (~100) + House (~435) members with `bioguideId`, name, `party` (mapped to `D`/`R`/`I`), `state`, `district`, and `photoUrl` (from each member's `depiction.imageUrl`). Derive `opensecretsUrl` from name. ProPublica is **not** used (API dead).
   - **`syncFec.ts`** (replaces `syncOpenSecrets.ts`) — OpenFEC API → for each member, resolve a `fecCandidateId` via `/v1/candidates/search/` (by name + state + office), then `/v1/candidate/{id}/totals/` for the latest cycle → compute `pacPct = other_political_committee_contributions / receipts * 100` (clamped 0–100; null if no receipts). Throttle to stay under 1,000 req/hr. **Resume** from `SyncState.cursor` (last processed bioguideId) on failure or rate-limit. The npm script alias `sync:opensecrets` is kept pointing here for continuity with the plan.
   - **`syncJudicial.ts`** — The 9 current Justices come from a small curated seed file in-repo (only 9 entries, changes rarely); their photos resolve from Wikipedia/Wikidata via the `P18` image property, falling back to a seed-provided URL. The lower-court hierarchy is also a small seed file.
   - **`syncExecutive.ts`** — Curated seed file for the President + VP + Big 4 *role titles* (State, Treasury, Defense, AG) and current holder names. Photos resolve from Wikipedia/Wikidata, falling back to a seed-provided URL. Cabinet changes infrequently; a manual re-run is acceptable when there is a change.
3. **Endpoint rewrite:** the routes from Stage 2 now read from Prisma instead of returning fixtures. Shapes match the Stage 1 shared types, so the frontend remains untouched. Where the DB has not yet been synced (e.g. `pacPct` still null), serve a sensible default so the UI never breaks.
4. **Photo handling:** photo URLs are stored in the DB pointing to upstream sources. Add a `GET /api/photos/:bioguideId` thin proxy that 302-redirects to the cached URL, falling back to a generic silhouette SVG on 404 / missing photo. This isolates the frontend from upstream URL churn.
5. **API key + env management:**
   - `.env` holds `CONGRESS_API_KEY` and `FEC_API_KEY`. Real `.env` is gitignored; `.env.example` is committed with the key names and a pointer to the sign-up URLs.
   - README documents how to obtain each key (see links above).
6. **Caching policy** (enforced via `SyncState.lastRunAt`; each sync is skipped if run again within its window unless `--force`):
   - Members (Congress.gov): refresh every 7 days.
   - Money percentages (OpenFEC): refresh every 30 days.
   - Justices / Executive: manual trigger only.
   - **Serve stale-on-error**: endpoints always read whatever is in the DB, so the site keeps working even if an upstream is down or a sync is mid-failure.
7. **First real-data run:** execute `npm run sync:all`; spot-check 5 senators and 5 representatives against opensecrets.org to confirm the `pacPct` math and link correctness.

### Data flow (revised during Stage 3)

The data flow was tightened so that **all UI data comes from the DB**, the DB is filled **only by sync jobs that call upstream APIs**, and refresh is automatic when deployed / one-click when local:

1. **UI → DB only.** Every endpoint reads exclusively from SQLite via Prisma (`repo.ts`). The UI never calls an upstream directly. This gives stale-on-error for free: if an upstream is down, the site still serves the last successful sync.
2. **DB ← APIs only (no hardcoded rosters).** Even rarely-changing data is API-sourced:
   - **Justices & executive roster + names + photos** come live from **Wikidata** (SPARQL for "who currently holds this office", entity API for label + `P18` photo). Wikidata is community-edited and returns vandalism (its current-SCOTUS query also yields "Bart Simpson"; executive offices yield fictional TV characters), so each result is **validated against a curated allowlist of expected person Q-ids** (`src/sync/seeds/`). The allowlist holds only stable identifiers + historical constants (appointer/year) — no names or photos. When an office changes hands, update one Q-id and the name/photo follow from the API.
   - Only the **lower-court hierarchy** stays a curated seed (it's fixed structure, not a roster).
3. **Scheduled auto-sync when deployed.** Setting `SYNC_CRON` (a 5-field cron expression, with optional `SYNC_TZ`) enables a `node-cron` job that runs a full sync on a configurable schedule, honoring each job's cache window. Unset = disabled.
4. **One-click sync when local.** A floating bottom-left **"Sync Data"** button (frontend) calls `POST /api/sync`, which runs a forced full sync in-process and reloads the page. The button only renders under the Vite dev server (`import.meta.env.DEV`) **and** only when the API reports `allowSync` via `GET /api/config`. In production the sync endpoint is disabled by default (`ENABLE_SYNC_ENDPOINT=true` to override), so the deployed app has no button and relies on the schedule.
5. **One sync at a time.** A process-wide coordinator (`coordinator.ts`) ensures the scheduler and the manual button can't run concurrently (a second trigger returns `409`), preventing FEC resume-cursor collisions.

New endpoints: `GET /api/config` (`{ allowSync, syncing, lastSyncAt }`), `POST /api/sync` (`{ started, results[] }`).
New env vars: `SYNC_CRON`, `SYNC_TZ`, `ENABLE_SYNC_ENDPOINT`, `NODE_ENV`.

### Deliverables

- The site from Stage 2, now showing real members, real photos, real money percentages (from the FEC), real OpenSecrets profile links, and an API-sourced (Wikidata, allowlist-gated) Supreme Court + Executive roster.
- All UI data served from the DB; DB filled only by API-calling sync jobs.
- Refresh automated on a configurable schedule when deployed, plus a one-click local "Sync Data" button.

### Human checkpoint

User obtains the two free API keys, runs `npm run sync:all` (or clicks "Sync Data" locally), then spot-checks accuracy (a handful of members, a few justices, the President + cabinet) and confirms the site is ready for use.

---

## Requirements Traceability

Every requirement in [InitialRequirements.md](InitialRequirements.md) is covered by a step above:

| Requirement | Stage / Step |
|---|---|
| Material Design 3 | Stage 1, step 3 (MUI v6) |
| Flag-blue primary / flag-red secondary, dark mode only, colors used sparingly | Stage 1, step 3 (`theme.ts`) |
| Backend-served dynamic data (no frontend hardcoding) | Stage 1 step 5 (contract), Stage 2 step 2 (hooks) |
| Index page with three branch buttons | Stage 2, step 2 (Index page) |
| Back button top-right on non-index pages | Stage 1 step 3 + Stage 2 step 2 (`<PageLayout>`) |
| Circular avatar + name for every representative | Stage 1 step 3 + Stage 2 step 2 (`<RepresentativeCard>`) |
| Centered page title on every page | `<PageLayout>` (same as above) |
| Executive page: President + roles below | Stage 2 step 2 (Executive page) |
| Judicial page: court hierarchy, only Supreme Court clickable | Stage 2 step 2 (Judicial page) |
| Supreme Court page with 9 justices | Stage 2 step 2 (Supreme Court page) |
| Legislative page with Senate + House buttons | Stage 2 step 2 (Legislative page) |
| Senate U-shape split into two halves that stack vertically on small screens | Stage 2 step 2 (`<ChamberView>`) + step 3 (responsiveness pass) |
| House U-shape with more dots | Stage 2 step 2 (`<ChamberView>` shared component) |
| Dots colored by party (blue/red) | Stage 2 step 2 (Party mode) |
| Dots expand on hover, click → OpenSecrets URL | Stage 2 step 2 (`<ChamberView>` hover + click) |
| Party/Money dropdown | Stage 2 step 2 (`<ChamberView>` dropdown) |
| Money mode: green/yellow/red by PAC % | Stage 2 step 2 + Stage 3 step 2 (`syncOpenSecrets.ts`) |
| Money thresholds: 0% green, <25% yellow, ≥25% red | Stage 2 step 2 (`<ChamberView>` color function) |
| Figure out where to get data; create own DB to cache | Stage 3 steps 1–2 (Prisma schema + sync jobs) |
