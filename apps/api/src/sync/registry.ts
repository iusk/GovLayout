import type { SyncKey } from './lib/syncState.js';
import { runCongressSync } from './syncCongress.js';
import { runFecSync } from './syncFec.js';
import { runJudicialSync } from './syncJudicial.js';
import { runExecutiveSync } from './syncExecutive.js';

/**
 * Single registry of sync jobs. Each job's logic is a plain async function that
 * takes a `log` callback and returns a one-line summary. The CLI wrappers, the
 * `POST /api/sync` endpoint, and the scheduler all drive jobs through this list,
 * so there's exactly one place that knows what "sync everything" means.
 *
 * Order matters: Congress must populate members before the FEC money sync can
 * enrich them.
 */
export interface SyncJob {
  key: SyncKey;
  label: string;
  run: (log: (msg: string) => void) => Promise<string>;
}

export const SYNC_JOBS: SyncJob[] = [
  { key: 'congress', label: 'Congress roster', run: runCongressSync },
  { key: 'fec', label: 'FEC money', run: runFecSync },
  { key: 'judicial', label: 'Judicial (Supreme Court)', run: runJudicialSync },
  { key: 'executive', label: 'Executive (President + cabinet)', run: runExecutiveSync },
];

export function getJob(key: SyncKey): SyncJob | undefined {
  return SYNC_JOBS.find((j) => j.key === key);
}
