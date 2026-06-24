import { Router, type Request, type Response, type NextFunction, type RequestHandler } from 'express';
import {
  API_ROUTES,
  type AppConfigResponse,
  type BranchesResponse,
  type JudicialCourtsResponse,
  type LegislativeChambersResponse,
  type MembersResponse,
  type SupremeCourtResponse,
  type SyncResponse,
} from '@usgov/shared';
import {
  BRANCHES,
  CHAMBERS,
  getCourts,
  getExecutive,
  getJustices,
  getMembers,
} from './repo.js';
import { photoHandler } from './photos.js';
import { config } from './config.js';
import { isSyncRunning, lastSyncFinishedAt, triggerFullSync } from './sync/coordinator.js';

/**
 * Stage 3: every endpoint reads from the local SQLite DB via Prisma (see
 * `repo.ts`). Response shapes are unchanged from the Stage 2 mock contract, so
 * the frontend is untouched. Because reads hit only the local DB, the API keeps
 * serving the last successful sync even when an upstream source is down.
 */
export const apiRouter: Router = Router();

/** Wrap an async handler so rejected promises reach the error middleware. */
function asyncHandler(
  fn: (req: Request, res: Response) => Promise<void>,
): RequestHandler {
  return (req, res, next: NextFunction) => {
    fn(req, res).catch(next);
  };
}

apiRouter.get(API_ROUTES.config, (_req, res) => {
  const last = lastSyncFinishedAt();
  const body: AppConfigResponse = {
    allowSync: config.syncEndpointEnabled,
    syncing: isSyncRunning(),
    lastSyncAt: last ? last.toISOString() : null,
  };
  res.json(body);
});

// Manual full sync (local-only by default; see config.syncEndpointEnabled).
// Forced so the button always re-fetches immediately, bypassing cache windows.
apiRouter.post(
  API_ROUTES.sync,
  asyncHandler(async (_req, res) => {
    if (!config.syncEndpointEnabled) {
      res.status(403).json({ started: false, reason: 'Sync endpoint is disabled.' } satisfies SyncResponse);
      return;
    }
    const result = await triggerFullSync({ force: true, source: 'manual' });
    const body: SyncResponse = result.started
      ? { started: true, results: result.results }
      : { started: false, reason: result.reason };
    res.status(result.started ? 200 : 409).json(body);
  }),
);

apiRouter.get(API_ROUTES.branches, (_req, res) => {
  const body: BranchesResponse = { branches: BRANCHES };
  res.json(body);
});

apiRouter.get(
  API_ROUTES.executive,
  asyncHandler(async (_req, res) => {
    res.json(await getExecutive());
  }),
);

apiRouter.get(
  API_ROUTES.judicialCourts,
  asyncHandler(async (_req, res) => {
    const body: JudicialCourtsResponse = { courts: await getCourts() };
    res.json(body);
  }),
);

apiRouter.get(
  API_ROUTES.supremeCourt,
  asyncHandler(async (_req, res) => {
    const body: SupremeCourtResponse = { justices: await getJustices() };
    res.json(body);
  }),
);

apiRouter.get(API_ROUTES.legislativeChambers, (_req, res) => {
  const body: LegislativeChambersResponse = { chambers: CHAMBERS };
  res.json(body);
});

apiRouter.get(
  API_ROUTES.senate,
  asyncHandler(async (_req, res) => {
    const body: MembersResponse = { members: await getMembers('SENATE') };
    res.json(body);
  }),
);

apiRouter.get(
  API_ROUTES.house,
  asyncHandler(async (_req, res) => {
    const body: MembersResponse = { members: await getMembers('HOUSE') };
    res.json(body);
  }),
);

// Photo proxy: 302-redirects to the cached upstream URL, silhouette on miss.
apiRouter.get('/api/photos/:bioguideId', asyncHandler(photoHandler));
