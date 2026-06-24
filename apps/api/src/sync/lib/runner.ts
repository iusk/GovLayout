import { prisma } from '../../db.js';
import { isFresh, markRunning, markDone, markError, type SyncKey } from './syncState.js';
import { getJob, SYNC_JOBS, type SyncJob } from '../registry.js';

/** Result of a single in-process sync run. */
export interface SyncRunResult {
  key: SyncKey;
  label: string;
  status: 'ok' | 'skipped' | 'error';
  message: string;
}

/**
 * Run one sync job in-process: enforce the cache window (unless forced), record
 * running/ok/error status, and capture a result. Used by the `POST /api/sync`
 * endpoint and the scheduler. Never throws — failures are returned as a result
 * so one bad job doesn't abort a batch.
 */
export async function runJob(
  job: SyncJob,
  opts: { force: boolean; log?: (msg: string) => void } = { force: false },
): Promise<SyncRunResult> {
  const log = opts.log ?? ((msg: string) => console.log(`[sync:${job.key}] ${msg}`));
  try {
    if (await isFresh(job.key, opts.force)) {
      const message = 'skipped — still fresh (use force to override).';
      log(message);
      return { key: job.key, label: job.label, status: 'skipped', message };
    }
    await markRunning(job.key);
    const message = await job.run(log);
    await markDone(job.key, message);
    log(`done — ${message}`);
    return { key: job.key, label: job.label, status: 'ok', message };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markError(job.key, err).catch(() => undefined);
    log(`FAILED — ${message}`);
    return { key: job.key, label: job.label, status: 'error', message };
  }
}

/** Run every registered job in order (in-process). Continues past failures. */
export async function runAllJobs(opts: { force: boolean; log?: (msg: string) => void }): Promise<SyncRunResult[]> {
  const results: SyncRunResult[] = [];
  for (const job of SYNC_JOBS) {
    results.push(await runJob(job, opts));
  }
  return results;
}

/**
 * CLI entry used by the `syncX.ts` wrapper scripts. Parses `--force`, runs the
 * one job by key, logs, disconnects Prisma, and sets a non-zero exit code on
 * failure.
 */
export async function runSyncCli(key: SyncKey): Promise<void> {
  const job = getJob(key);
  if (!job) throw new Error(`Unknown sync job: ${key}`);
  const force = process.argv.includes('--force');
  const log = (msg: string) => console.log(`[sync:${key}] ${msg}`);
  log(force ? 'starting (forced)…' : 'starting…');

  const result = await runJob(job, { force, log });
  await prisma.$disconnect();
  if (result.status === 'error') process.exitCode = 1;
}
