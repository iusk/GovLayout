import { prisma } from '../db.js';
import { config } from '../config.js';
import { fetchJson, sleep } from './lib/http.js';
import { getCursor, saveCursor } from './lib/syncState.js';

/**
 * Compute each member's PAC contribution percentage from the OpenFEC API and
 * store it as `pacPct`. Replaces the retired OpenSecrets API.
 *
 *   pacPct = other_political_committee_contributions / receipts * 100
 *
 * Per member: 1 candidate search + 1 totals lookup (≈2 requests). OpenFEC caps
 * keys at 1,000 req/hour, so we throttle and process members in bioguideId
 * order, saving a resume cursor after each one. A rate-limit/crash mid-run can
 * be restarted and it picks up where it left off.
 */

const BASE = 'https://api.open.fec.gov/v1';

// ~2 req/member. A 2200ms gap between members => ~1.1s/request => ~3,270
// req/hr ceiling, but DEMO_KEY is far stricter; tune via FEC_THROTTLE_MS. We
// default conservative to comfortably clear the 1,000/hr real-key limit when
// processing all 535 members (~1,070 requests ≈ 20 min).
const THROTTLE_MS = Number(process.env.FEC_THROTTLE_MS ?? 1100);

interface CandidateSearchResult {
  candidate_id: string;
  name: string;
  office: string; // "S" | "H" | "P"
  state?: string;
  district?: string;
}
interface CandidateSearchResponse {
  results: CandidateSearchResult[];
}

interface CandidateTotals {
  candidate_id: string;
  cycle: number | null;
  receipts: number | null;
  other_political_committee_contributions: number | null;
}
interface TotalsResponse {
  results: CandidateTotals[];
}

/** Resolve a member to their most likely FEC candidate_id. */
async function findCandidateId(member: {
  fullName: string;
  state: string;
  chamber: string;
}): Promise<string | null> {
  const office = member.chamber === 'SENATE' ? 'S' : 'H';
  const url =
    `${BASE}/candidates/search/` +
    `?q=${encodeURIComponent(member.fullName)}` +
    `&office=${office}&state=${encodeURIComponent(member.state)}` +
    `&is_active_candidate=true&sort=-first_file_date&per_page=5` +
    `&api_key=${config.fecApiKey}`;
  const data = await fetchJson<CandidateSearchResponse>(url);
  // Take the first result matching office + state (the query already filters).
  const match = data.results.find((c) => c.office === office) ?? data.results[0];
  return match?.candidate_id ?? null;
}

/** Fetch the latest-cycle totals and derive pacPct. */
async function fetchPacPct(candidateId: string): Promise<number | null> {
  const url =
    `${BASE}/candidate/${encodeURIComponent(candidateId)}/totals/` +
    `?sort=-cycle&per_page=1&api_key=${config.fecApiKey}`;
  const data = await fetchJson<TotalsResponse>(url);
  const totals = data.results[0];
  if (!totals) return null;

  const receipts = totals.receipts ?? 0;
  const pac = totals.other_political_committee_contributions ?? 0;
  if (receipts <= 0) return null; // no data this cycle

  const pct = (pac / receipts) * 100;
  // Clamp into [0, 100] and round to whole percent (matches the UI thresholds).
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export async function runFecSync(log: (msg: string) => void): Promise<string> {
  const members = await prisma.member.findMany({ orderBy: { bioguideId: 'asc' } });
  if (members.length === 0) {
    throw new Error('No members in DB. Run `npm run sync:congress` first.');
  }

  // Resume: skip everyone at or before the saved cursor.
  const cursor = await getCursor('fec');
  const start = cursor ? members.findIndex((m) => m.bioguideId > cursor) : 0;
  const pending = start >= 0 ? members.slice(start) : [];
  if (cursor) {
    log(`resuming after ${cursor}: ${pending.length} of ${members.length} members remaining.`);
  } else {
    log(`processing all ${members.length} members.`);
  }

  let updated = 0;
  let unresolved = 0;
  for (let i = 0; i < pending.length; i++) {
    const m = pending[i]!;
    try {
      const candidateId = m.fecCandidateId ?? (await findCandidateId(m));
      const pacPct = candidateId ? await fetchPacPct(candidateId) : null;

      await prisma.member.update({
        where: { id: m.id },
        data: { fecCandidateId: candidateId, pacPct, moneySyncedAt: new Date() },
      });

      if (pacPct === null) unresolved++;
      else updated++;
    } catch (err) {
      // Persist progress so a restart resumes here, then re-throw to stop.
      await saveCursor('fec', i > 0 ? pending[i - 1]!.bioguideId : cursor);
      throw err;
    }

    await saveCursor('fec', m.bioguideId);
    if ((i + 1) % 25 === 0) {
      log(`…${i + 1}/${pending.length} processed (${updated} with money data).`);
    }
    if (i < pending.length - 1) await sleep(THROTTLE_MS);
  }

  return `set pacPct for ${updated} members (${unresolved} unresolved / no FEC data).`;
}
