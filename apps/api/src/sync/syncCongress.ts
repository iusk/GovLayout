import { prisma } from '../db.js';
import { config } from '../config.js';
import { fetchJson } from './lib/http.js';
import { opensecretsUrl } from './lib/opensecrets.js';

/**
 * Sync the current Congress roster from the Congress.gov API into the `Member`
 * table. One paged pass over `/v3/member/congress/{congress}?currentMember=true`
 * yields every sitting Senator and Representative with party, state, district,
 * and a portrait URL. Idempotent: rows are upserted by bioguideId.
 *
 * The 119th Congress covers 2025–2027. Override with the env var
 * `CONGRESS_NUMBER` if needed for a different session.
 */

const BASE = 'https://api.congress.gov/v3';
const CONGRESS = Number(process.env.CONGRESS_NUMBER ?? 119);
const PAGE_SIZE = 250; // Congress.gov max page size

interface CongressTerm {
  chamber?: string; // "Senate" | "House of Representatives"
}

interface CongressMember {
  bioguideId: string;
  name: string; // "Last, First"
  partyName?: string; // "Democratic" | "Republican" | "Independent" | ...
  state?: string;
  district?: number;
  depiction?: { imageUrl?: string };
  terms?: { item?: CongressTerm[] };
}

interface MemberListResponse {
  members: CongressMember[];
  pagination?: { count?: number; next?: string };
}

/** Map Congress.gov's verbose party name to the contract's single-letter code. */
function partyCode(partyName: string | undefined): 'D' | 'R' | 'I' {
  const p = (partyName ?? '').toLowerCase();
  if (p.startsWith('democrat')) return 'D';
  if (p.startsWith('republican')) return 'R';
  return 'I'; // Independent, Libertarian, vacancies-as-independent, etc.
}

/** Determine SENATE vs HOUSE from the member's most recent term. */
function chamberOf(member: CongressMember): 'SENATE' | 'HOUSE' | null {
  const terms = member.terms?.item ?? [];
  const last = terms[terms.length - 1] ?? terms[0];
  const chamber = (last?.chamber ?? '').toLowerCase();
  if (chamber.includes('senate')) return 'SENATE';
  if (chamber.includes('house')) return 'HOUSE';
  return null;
}

/** "Last, First M." -> "First M. Last" so cards read naturally. */
function normalizeName(name: string): string {
  const comma = name.indexOf(',');
  if (comma === -1) return name.trim();
  const last = name.slice(0, comma).trim();
  const first = name.slice(comma + 1).trim();
  return `${first} ${last}`.trim();
}

async function fetchAllMembers(): Promise<CongressMember[]> {
  const out: CongressMember[] = [];
  let offset = 0;
  // Cap iterations defensively; ~535 members / 250 per page is a handful.
  for (let page = 0; page < 20; page++) {
    const url =
      `${BASE}/member/congress/${CONGRESS}` +
      `?currentMember=true&limit=${PAGE_SIZE}&offset=${offset}` +
      `&api_key=${config.congressApiKey}`;
    const data = await fetchJson<MemberListResponse>(url);
    const batch = data.members ?? [];
    out.push(...batch);
    if (batch.length < PAGE_SIZE) break; // last page
    offset += PAGE_SIZE;
  }
  return out;
}

export async function runCongressSync(log: (msg: string) => void): Promise<string> {
  const members = await fetchAllMembers();
  log(`fetched ${members.length} current members from Congress.gov (${CONGRESS}th).`);

  let senate = 0;
  let house = 0;
  let skipped = 0;

  for (const m of members) {
    const chamber = chamberOf(m);
    if (!chamber || !m.bioguideId) {
      skipped++;
      continue;
    }
    const fullName = normalizeName(m.name);
    const district = chamber === 'HOUSE' ? (m.district ?? null) : null;

    await prisma.member.upsert({
      where: { id: m.bioguideId },
      create: {
        id: m.bioguideId,
        bioguideId: m.bioguideId,
        fullName,
        party: partyCode(m.partyName),
        state: m.state ?? '',
        district,
        chamber,
        photoUrl: m.depiction?.imageUrl ?? '',
        opensecretsUrl: opensecretsUrl(fullName),
        lastSyncedAt: new Date(),
      },
      update: {
        // Preserve money fields (pacPct/fecCandidateId/moneySyncedAt) — those
        // are owned by sync:fec. This pass only refreshes roster + photo.
        fullName,
        party: partyCode(m.partyName),
        state: m.state ?? '',
        district,
        chamber,
        photoUrl: m.depiction?.imageUrl ?? '',
        opensecretsUrl: opensecretsUrl(fullName),
        lastSyncedAt: new Date(),
      },
    });

    if (chamber === 'SENATE') senate++;
    else house++;
  }

  const note = skipped ? ` (${skipped} skipped: no chamber/bioguideId)` : '';
  return `upserted ${senate} senators + ${house} representatives${note}.`;
}
