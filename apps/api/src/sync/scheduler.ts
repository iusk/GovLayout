import cron from 'node-cron';
import { config } from '../config.js';
import { triggerFullSync } from './coordinator.js';

/**
 * Start the scheduled auto-sync when deployed. Enabled by setting `SYNC_CRON`
 * to a 5-field cron expression (and optionally `SYNC_TZ`). When the schedule
 * fires, it runs a full sync honoring each job's cache window (so e.g. members
 * only actually re-fetch every 7 days even if the cron runs nightly). No-op if
 * `SYNC_CRON` is unset. Returns a stop function for clean shutdown.
 */
export function startScheduler(): (() => void) | null {
  const expr = config.syncCron;
  if (!expr) {
    console.log('[scheduler] SYNC_CRON not set — scheduled auto-sync disabled.');
    return null;
  }
  if (!cron.validate(expr)) {
    console.error(`[scheduler] invalid SYNC_CRON "${expr}" — scheduled auto-sync disabled.`);
    return null;
  }

  const task = cron.schedule(
    expr,
    () => {
      console.log('[scheduler] cron fired — running scheduled sync.');
      // Not forced: respect cache windows so we don't hammer upstreams nightly.
      triggerFullSync({ force: false, source: 'scheduler' }).then((r) => {
        if (!r.started) console.log(`[scheduler] skipped: ${r.reason}`);
      });
    },
    config.syncTz ? { timezone: config.syncTz } : undefined,
  );

  console.log(
    `[scheduler] scheduled auto-sync enabled: "${expr}"` +
      (config.syncTz ? ` (${config.syncTz})` : ''),
  );
  return () => task.stop();
}
