/**
 * Minimal resilient JSON fetch for sync jobs. Uses Node's global `fetch`
 * (Node 18+). Retries on transient failures (network errors, 429, 5xx) with
 * exponential backoff, honoring a `Retry-After` header when the upstream sends
 * one. Throws on non-retryable 4xx so a bad request surfaces immediately.
 */

export interface FetchJsonOptions {
  /** Total attempts before giving up (default 4). */
  retries?: number;
  /** Base backoff in ms; doubles each retry (default 500). */
  backoffMs?: number;
  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
  /** Extra request headers (e.g. a descriptive User-Agent for Wikidata). */
  headers?: Record<string, string>;
}

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/** Sleep for `ms`, resolving early-but-cleanly is not needed here. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchJson<T>(url: string, opts: FetchJsonOptions = {}): Promise<T> {
  const { retries = 4, backoffMs = 500, signal, headers } = opts;

  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json', ...headers },
        signal,
      });

      if (res.ok) {
        return (await res.json()) as T;
      }

      // 429 (rate limit) and 5xx are retryable; other 4xx are not.
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable) {
        const body = await safeText(res);
        throw new HttpError(`HTTP ${res.status} for ${redact(url)}: ${body}`, res.status);
      }

      const retryAfter = parseRetryAfter(res.headers.get('retry-after'));
      const wait = retryAfter ?? backoffMs * 2 ** attempt;
      lastError = new HttpError(`HTTP ${res.status} for ${redact(url)}`, res.status);
      if (attempt < retries - 1) await sleep(wait);
    } catch (err) {
      // Non-HTTP errors (network/DNS/abort). Abort is not retryable.
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      if (err instanceof HttpError && err.status < 500 && err.status !== 429) throw err;
      lastError = err;
      if (attempt < retries - 1) await sleep(backoffMs * 2 ** attempt);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to fetch ${redact(url)} after ${retries} attempts`);
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number(header);
  return Number.isFinite(seconds) ? seconds * 1000 : null;
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 300);
  } catch {
    return '<unreadable body>';
  }
}

/** Strip the api_key query param so it never lands in logs. */
function redact(url: string): string {
  return url.replace(/(api_key=)[^&]+/i, '$1***');
}
