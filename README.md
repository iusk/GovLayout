# U.S. Government Layout

A simplified visualization of the three branches of the U.S. federal government.

See [InitialRequirements.md](InitialRequirements.md) for the original requirements and [ImplementationPlan.md](ImplementationPlan.md) for the stage-by-stage build plan.

## Stack

- **Frontend** (`apps/web`) — React + Vite + TypeScript + MUI v6 (Material Design 3). Dark mode only.
- **Backend** (`apps/api`) — Express + TypeScript, Prisma + SQLite.
- **Shared** (`packages/shared`) — TypeScript types for the frontend↔backend API contract.

## Repository layout

```
apps/
  api/                 # Express backend (port 4000)
    prisma/
      schema.prisma    # Prisma schema (empty until Stage 3)
    src/
      index.ts
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
```

The Prisma schema at `apps/api/prisma/schema.prisma` is intentionally empty of models in Stage 1 — `prisma generate` and `prisma migrate` will be run starting in Stage 3, when the SQLite database file at `apps/api/prisma/dev.db` is created.

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

## API endpoints (Stage 2 — mock data)

Every endpoint returns mock fixtures matching the shared types in
`packages/shared/src/api.ts`. Stage 3 swaps the data source for Prisma/SQLite
without changing these shapes.

| Endpoint                          | Returns                                              |
| --------------------------------- | ---------------------------------------------------- |
| `GET /api/health`                 | `{ ok: true }`                                       |
| `GET /api/branches`               | The three branches (Executive, Judicial, Legislative) |
| `GET /api/executive`              | President + 5 essential roles                        |
| `GET /api/judicial/courts`        | Court hierarchy (only Supreme Court clickable)       |
| `GET /api/judicial/supreme-court` | The 9 sitting Justices                               |
| `GET /api/legislative/chambers`   | Senate + House entries                               |
| `GET /api/legislative/senate`     | 100 senators (party, pacPct, opensecretsUrl, photo)  |
| `GET /api/legislative/house`      | 435 representatives (same fields)                    |

Mock people and numbers are generated from a fixed seed (`apps/api/src/data/`),
so the roster is stable across restarts.

## Current stage

**Stage 2 — Dynamic UI with Mocked Data** is complete: the full UI is built and
clickable, powered entirely by mock data served from the backend (no hardcoded
data in the frontend). Highlights:

- Shared component library: `BranchButton`, `CourtButton`, `RepresentativeCard`,
  `LoadingGrid`, `ErrorMessage`, `PageLayout`.
- Every page loads via typed fetch hooks (`apps/web/src/api/`) — loading and
  error/retry states included.
- Senate (100) and House (435) render the U-shape dot chart (`ChamberView`):
  two SVG halves that sit side by side on wide screens and stack vertically
  below ~900px; a Party/Money dropdown recolors the dots; dots expand on hover
  with a member card and open OpenSecrets on click.
- Vitest smoke tests for `RepresentativeCard` and the money-color thresholds.

The people and numbers are **fake** until Stage 3 wires in real data.

Next: **Stage 3 — Real Data Integration** (pending user approval — see [ImplementationPlan.md](ImplementationPlan.md)).
