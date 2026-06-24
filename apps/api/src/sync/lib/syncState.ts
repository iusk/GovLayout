import { prisma } from '../../db.js';
import { CACHE_WINDOW_MS } from '../../config.js';

/**
 * Helpers around the `SyncState` table that give every sync job the same
 * behavior: a cache window (skip if run too recently unless forced), a resume
 * cursor (pick up where a failed run left off), and a recorded status/message.
 */

export type SyncKey = keyof typeof CACHE_WINDOW_MS;

/** True if the job ran within its cache window and `force` was not requested. */
export async function isFresh(key: SyncKey, force: boolean): Promise<boolean> {
  if (force) return false;
  const window = CACHE_WINDOW_MS[key];
  if (window === null) return false; // manual-only jobs never auto-skip
  const state = await prisma.syncState.findUnique({ where: { key } });
  if (!state?.lastRunAt) return false;
  return Date.now() - state.lastRunAt.getTime() < window;
}

/** Read the saved resume cursor (e.g. last processed bioguideId), if any. */
export async function getCursor(key: SyncKey): Promise<string | null> {
  const state = await prisma.syncState.findUnique({ where: { key } });
  return state?.cursor ?? null;
}

export async function markRunning(key: SyncKey): Promise<void> {
  await prisma.syncState.upsert({
    where: { key },
    create: { key, status: 'running' },
    update: { status: 'running', message: null },
  });
}

/** Persist the resume cursor mid-run without changing status. */
export async function saveCursor(key: SyncKey, cursor: string | null): Promise<void> {
  await prisma.syncState.upsert({
    where: { key },
    create: { key, cursor, status: 'running' },
    update: { cursor },
  });
}

export async function markDone(key: SyncKey, message: string): Promise<void> {
  await prisma.syncState.upsert({
    where: { key },
    create: { key, status: 'ok', message, lastRunAt: new Date(), cursor: null },
    update: { status: 'ok', message, lastRunAt: new Date(), cursor: null },
  });
}

export async function markError(key: SyncKey, err: unknown): Promise<void> {
  const message = err instanceof Error ? err.message : String(err);
  await prisma.syncState.upsert({
    where: { key },
    create: { key, status: 'error', message },
    update: { status: 'error', message },
  });
}
