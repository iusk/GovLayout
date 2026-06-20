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

| Script              | What it does                                              |
| ------------------- | --------------------------------------------------------- |
| `npm run dev`       | Start both web and api concurrently                       |
| `npm run build`     | Type-check and build all workspaces                       |
| `npm run typecheck` | Run `tsc --noEmit` across all workspaces                  |
| `npm run lint`      | ESLint across the repo                                    |
| `npm run format`    | Prettier write across the repo                            |

## Current stage

**Stage 1 — Architecture & Project Setup** is complete: monorepo skeleton, MUI dark theme with flag colors, all routes registered with placeholder pages, Express backend with `/api/health`, Prisma initialized with an empty schema, and the shared API contract in `packages/shared/src/api.ts`.

Next: **Stage 2 — Dynamic UI with Mocked Data** (pending user approval — see [ImplementationPlan.md](ImplementationPlan.md)).
