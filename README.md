# U.S. Government Layout

A simplified visualization of the three branches of the U.S. federal government.

See [InitialRequirements.md](InitialRequirements.md) for the original requirements and [ImplementationPlan.md](ImplementationPlan.md) for the stage-by-stage build plan.

## Stack

- **Frontend** (`apps/web`) — React + Vite + TypeScript + MUI v6 (Material Design 3). Dark mode only.
- **Backend** (`apps/api`) — Express + TypeScript, Prisma + SQLite, `node-cron` for scheduled syncs.
- **Shared** (`packages/shared`) — TypeScript types for the frontend↔backend API contract.

## Repository layout

```
apps/
  api/                 # Express backend (port 4000)
    prisma/
      schema.prisma    # Prisma models (Member, Justice, ExecutiveRole, Court, SyncState)
      migrations/      # SQL migrations
    src/
      index.ts         # Express app + middleware
      repo.ts          # Prisma reads -> shared API shapes
      photos.ts        # /api/photos proxy (302 + silhouette fallback)
      sync/            # data sync jobs (Congress.gov, OpenFEC, seeds)
    .env.example
  web/                 # React frontend (port 5173, proxies /api -> :4000)
    src/
      components/
      pages/
      App.tsx
      theme.ts
      main.tsx
packages/
  shared/              # @usgov/shared — API contract types
    src/
      api.ts
      index.ts
```

## Prerequisites

- Node.js >= 20 (tested with 22.x)
- npm >= 10

## First-time setup

```bash
npm install
cp apps/api/.env.example apps/api/.env
# add your API keys to apps/api/.env (see "Data sources & API keys" below)
npm run prisma:generate -w @usgov/api   # generate the Prisma client
npm run prisma:migrate  -w @usgov/api    # create apps/api/prisma/dev.db
npm run sync:all                         # populate the DB with real data
```

The SQLite database lives at `apps/api/prisma/dev.db` (gitignored). It is created
by the migrate step and filled by `npm run sync:all`. Until you run a sync the
tables are empty and the API returns empty lists — the site still loads, it just
has no people in it yet.

## Run the app

```bash
npm run dev
```

This starts:

- **API** on http://localhost:4000 — health check at http://localhost:4000/api/health.
- **Web** on http://localhost:5173 — open this in a browser. Requests to `/api/*` are proxied to the API.

## Useful scripts

| Script                  | What it does                                          |
| ----------------------- | ----------------------------------------------------- |
| `npm run dev`           | Start both web and api concurrently                   |
| `npm run build`         | Type-check and build all workspaces                   |
| `npm run typecheck`     | Run `tsc --noEmit` across all workspaces              |
| `npm run lint`          | ESLint across the repo                                |
| `npm run format`        | Prettier write across the repo                        |
| `npm run test -w @usgov/web` | Run the frontend Vitest smoke tests              |
| `npm run sync:all`      | Run every data sync (Congress → FEC → judicial → executive) |
| `npm run sync:congress` | Sync the member roster + photos from Congress.gov     |
| `npm run sync:fec`      | Compute each member's PAC % from the OpenFEC API      |
| `npm run sync:judicial` | Seed the 9 Justices + court hierarchy                 |
| `npm run sync:executive`| Seed the President + cabinet                          |

Pass `--force` to any `sync:*` command to bypass the cache window and re-run
immediately (e.g. `npm run sync:congress -- --force`).

## Data sources & API keys

Stage 3 pulls real data from public APIs and caches it in SQLite. The endpoints
read **only** from the local DB, so the site keeps working (serves the last
successful sync) even if an upstream is down.

| Data | Source | Key |
| ---- | ------ | --- |
| Member roster, party, state, district, photos | [Congress.gov API](https://api.congress.gov/) | `CONGRESS_API_KEY` |
| PAC contribution % (`pacPct`) | [OpenFEC API](https://api.open.fec.gov/developers/) | `FEC_API_KEY` |
| OpenSecrets profile link | derived URL | — |
| Justice & executive **roster + names + photos** | [Wikidata](https://www.wikidata.org/) (SPARQL + entity API) | — |
| Lower-court hierarchy | curated seed in `apps/api/src/sync/seeds/` | — |

> **Note:** The original plan named the OpenSecrets and ProPublica Congress APIs.
> Both have been retired, so the money data now comes from the FEC's official
> **OpenFEC** API (`pacPct = other_political_committee_contributions / receipts`).
> We still deep-link each member to their opensecrets.org profile.
>
> **Wikidata roster:** Justices and executive office-holders are pulled live from
> Wikidata (who currently holds each office + their photo), not hardcoded. Because
> Wikidata is community-edited and gets vandalized (its "current Supreme Court"
> query also returns "Bart Simpson"; executive offices return fictional TV
> characters), each result is validated against a small curated **allowlist of
> expected person Q-ids** in `apps/api/src/sync/seeds/`. The allowlist holds only
> stable identifiers — names and photos come from the API. To reflect a new
> office-holder, update that one Q-id.

**Both keys are free and issued instantly** (a single api.data.gov key works for
both, but they're read as separate env vars so you can rotate independently):

1. **`CONGRESS_API_KEY`** — sign up at <https://api.congress.gov/sign-up/>.
   ~5,000 req/hr; a full roster sync is a handful of requests.
2. **`FEC_API_KEY`** — sign up at <https://api.open.fec.gov/developers/>.
   1,000 req/hr. The money sync makes ~2 requests per member (~1,070 total), so
   it throttles and is **resumable** — if it's interrupted, just run
   `npm run sync:fec` again and it picks up where it left off. Without a key it
   falls back to `DEMO_KEY` (~30 req/hr), only useful for a tiny spot-check.

(Justice/executive and lower-court data need no key — Wikidata is public.)

Put the keys in `apps/api/.env` (gitignored). `apps/api/.env.example` is committed.

## Data flow

- **UI reads only the DB.** Every endpoint serves data from local SQLite via
  Prisma — the frontend never calls an upstream. If an upstream is down, the site
  keeps serving the last successful sync (stale-on-error).
- **The DB is filled only by sync jobs** that call the APIs above.
- **When deployed:** set `SYNC_CRON` to auto-refresh on a schedule (see below).
- **When local:** a floating bottom-left **"Sync Data"** button triggers a full
  sync immediately and reloads the page. It only appears in the Vite dev server
  and only when the API allows it.

## Refresh process

You can refresh in three ways:

- **Locally:** click the **"Sync Data"** button (bottom-left in `npm run dev`).
- **Manually via CLI:** run the relevant `sync:*` script (see Useful scripts).
  Each sync records its last run and skips if still within its cache window
  (pass `--force` to override):
  - **Members (Congress.gov):** every 7 days → `npm run sync:congress`.
  - **Money % (OpenFEC):** every 30 days → `npm run sync:fec`.
  - **Justices / Executive (Wikidata):** manual only → `npm run sync:judicial` /
    `npm run sync:executive`.
  - Or `npm run sync:all` to refresh everything that's due.
- **Automatically when deployed:** set the env vars below.

### Scheduled auto-sync (deployment)

| Var | Meaning | Example |
| --- | ------- | ------- |
| `SYNC_CRON` | 5-field cron expression; unset = disabled | `0 3 * * *` (daily 03:00) |
| `SYNC_TZ` | IANA timezone for the schedule | `America/New_York` |
| `NODE_ENV` | `production` hides the local sync button + disables the manual endpoint | `production` |
| `ENABLE_SYNC_ENDPOINT` | set `true` to allow `POST /api/sync` in production | `true` |

The scheduled run honors each job's cache window, so a nightly cron won't re-hit
upstreams more often than the policy above allows.

## API endpoints

Every endpoint returns data from the local SQLite DB, matching the shared types
in `packages/shared/src/api.ts` (shapes are unchanged from Stage 2's mock
contract, so the frontend is untouched).

| Endpoint                          | Returns                                              |
| --------------------------------- | ---------------------------------------------------- |
| `GET /api/health`                 | `{ ok: true }`                                       |
| `GET /api/config`                 | `{ allowSync, syncing, lastSyncAt }` (drives the Sync Data button) |
| `POST /api/sync`                  | Runs a full sync (local/enabled only); `{ started, results[] }` |
| `GET /api/branches`               | The three branches (Executive, Judicial, Legislative) |
| `GET /api/executive`              | President + 5 essential roles                        |
| `GET /api/judicial/courts`        | Court hierarchy (only Supreme Court clickable)       |
| `GET /api/judicial/supreme-court` | The 9 sitting Justices                               |
| `GET /api/legislative/chambers`   | Senate + House entries                               |
| `GET /api/legislative/senate`     | Senators (party, pacPct, opensecretsUrl, photo)      |
| `GET /api/legislative/house`      | Representatives (same fields)                         |
| `GET /api/photos/:bioguideId`     | 302-redirect to a member's photo; silhouette on miss |

## Current stage

**Stage 3 — Real Data Integration** is implemented: mock fixtures are replaced
by real data synced from public APIs and cached in SQLite via Prisma. Highlights:

- Prisma models `Member`, `Justice`, `ExecutiveRole`, `Court`, `SyncState`.
- Idempotent, independently-runnable sync jobs in `apps/api/src/sync/`, with a
  cache-window policy, resume-on-failure (FEC), and stale-on-error reads.
- Endpoints rewritten to read from Prisma — response shapes unchanged, so the
  frontend required no changes.
- Justice + executive roster, names, and photos pulled live from **Wikidata**,
  gated by a curated Q-id allowlist (drops vandalism like "Bart Simpson").
- A `/api/photos/:bioguideId` proxy isolates the frontend from upstream photo
  URL churn (302-redirect, silhouette SVG fallback).
- **Configurable scheduled auto-sync** (`node-cron`, via `SYNC_CRON`) for
  deployments, plus a local-only floating **"Sync Data"** button that triggers
  `POST /api/sync` and reloads. One run at a time (coordinator guard).

Run the syncs (see above), then spot-check a few members against opensecrets.org.
