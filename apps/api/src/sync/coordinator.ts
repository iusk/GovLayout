import { runAllJobs, type SyncRunResult } from './lib/runner.js';

/**
 * Process-wide guard so only one full sync runs at a time, no matter whether it
 * was triggered by the scheduler (cron) or the manual `POST /api/sync` button.
 * A second trigger while one is in flight is rejected rather than queued — the
 * data is the same either way, and overlapping runs would fight over the FEC
 * resume cursor.
 */

let inFlight: Promise<SyncRunResult[]> | null = null;
let lastFinishedAt: Date | null = null;

export interface SyncTriggerResult {
  started: boolean;
  /** Present when started === true. */
  results?: SyncRunResult[];
  /** Reason when started === false (e.g. already running). */
  reason?: string;
}

export function isSyncRunning(): boolean {
  return inFlight !== null;
}

export function lastSyncFinishedAt(): Date | null {
  return lastFinishedAt;
}

/**
 * Run a full sync if one isn't already in progress. Returns once the run
 * completes (so callers can report per-job results). Use `force` to bypass
 * cache windows (the manual button does; the scheduler doesn't).
 */
export async function triggerFullSync(opts: {
  force: boolean;
  source: string;
}): Promise<SyncTriggerResult> {
  if (inFlight) {
    return { started: false, reason: 'A sync is already running.' };
  }

  const log = (msg: string) => console.log(`[sync:${opts.source}] ${msg}`);
  inFlight = runAllJobs({ force: opts.force, log });
  try {
    const results = await inFlight;
    return { started: true, results };
  } finally {
    lastFinishedAt = new Date();
    inFlight = null;
  }
}
