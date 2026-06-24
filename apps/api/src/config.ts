import 'dotenv/config';

/**
 * Centralized environment access + Stage 3 caching policy.
 *
 * API keys are read lazily (via getters) rather than at import time so that the
 * API server can boot and serve cached DB data even when no keys are configured
 * — only the sync scripts require them, and they fail loudly when missing.
 */

export const config = {
  port: Number(process.env.PORT ?? 4000),

  /** True when running locally (dev). Controls whether the manual sync trigger
   * and the frontend "Sync Data" button are available. Defaults to true unless
   * NODE_ENV is explicitly "production". */
  get isLocal(): boolean {
    return (process.env.NODE_ENV ?? 'development') !== 'production';
  },

  /**
   * Scheduled auto-sync (used when deployed). A standard 5-field cron
   * expression in `SYNC_CRON` enables the scheduler; unset/blank disables it.
   * `SYNC_TZ` sets the timezone (IANA name, e.g. "America/New_York").
   * Example: SYNC_CRON="0 3 * * *" runs every day at 03:00.
   */
  get syncCron(): string | null {
    return process.env.SYNC_CRON?.trim() || null;
  },
  get syncTz(): string | undefined {
    return process.env.SYNC_TZ?.trim() || undefined;
  },

  /**
   * Whether the manual sync trigger (`POST /api/sync`) is allowed. On by
   * default when local; in production it's off unless ENABLE_SYNC_ENDPOINT is
   * explicitly "true" (so a deployed instance isn't open to forced re-syncs).
   */
  get syncEndpointEnabled(): boolean {
    if (process.env.ENABLE_SYNC_ENDPOINT?.trim() === 'true') return true;
    return this.isLocal;
  },

  /** Congress.gov API key (api.data.gov). Required only by `sync:congress`. */
  get congressApiKey(): string {
    return requireKey('CONGRESS_API_KEY');
  },

  /**
   * OpenFEC API key (api.data.gov). Required only by `sync:fec`. Falls back to
   * the public `DEMO_KEY`, which is heavily rate-limited (~30/hr) and only
   * suitable for a tiny spot-check — never a full sync.
   */
  get fecApiKey(): string {
    return process.env.FEC_API_KEY?.trim() || 'DEMO_KEY';
  },
} as const;

/**
 * Caching policy from the implementation plan. A sync is skipped if it ran more
 * recently than its window, unless `--force` is passed. Justices/Executive have
 * no window (manual trigger only).
 */
export const CACHE_WINDOW_MS = {
  congress: 7 * 24 * 60 * 60 * 1000, // members: 7 days
  fec: 30 * 24 * 60 * 60 * 1000, // money: 30 days
  judicial: null, // manual only
  executive: null, // manual only
} as const;

function requireKey(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Copy apps/api/.env.example to apps/api/.env and add your key. ` +
        `See the README for where to obtain it.`,
    );
  }
  return value;
}
