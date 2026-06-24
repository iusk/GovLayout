import { prisma } from '../db.js';
import { fetchCurrentOfficeHolders, fetchPersonFacts } from './lib/wikidata.js';
import {
  COURT_SEEDS,
  JUSTICE_ALLOWLIST,
  SCOTUS_POSITION_QIDS,
} from './seeds/judicial.js';

/**
 * Sync the court hierarchy and the 9 current Justices.
 *
 * Roster + names + photos come live from Wikidata: we ask which people
 * currently hold a Supreme Court seat, keep only those whose Q-id is in our
 * allowlist (drops vandalism like "Bart Simpson"), then read each one's label +
 * portrait from the Wikidata entity API. Appointment facts (appointer/year) are
 * historical constants from the allowlist.
 *
 * Stale-on-error: if Wikidata is unreachable we keep whatever is already in the
 * DB for that justice, so the Supreme Court page never goes blank.
 */
export async function runJudicialSync(log: (msg: string) => void): Promise<string> {
  // Courts — fixed structure, no network.
  for (const [order, court] of COURT_SEEDS.entries()) {
    await prisma.court.upsert({
      where: { id: court.id },
      create: { ...court, order },
      update: { ...court, order },
    });
  }
  log(`upserted ${COURT_SEEDS.length} courts.`);

  // Roster from Wikidata, gated by the Q-id allowlist.
  const allowByQid = new Map(JUSTICE_ALLOWLIST.map((j) => [j.qid, j]));
  let currentQids = new Set<string>();
  try {
    const holders = await fetchCurrentOfficeHolders([...SCOTUS_POSITION_QIDS]);
    currentQids = new Set(holders.map((h) => h.qid).filter((q) => allowByQid.has(q)));
    log(
      `Wikidata returned ${holders.length} current SCOTUS holders; ` +
        `${currentQids.size} matched the allowlist.`,
    );
  } catch (err) {
    log(`Wikidata roster query failed (${describe(err)}); using allowlist as-is (stale-on-error).`);
    currentQids = new Set(allowByQid.keys());
  }

  // Resolve names + photos for the allowlisted justices.
  const facts = await safeFetchFacts([...allowByQid.keys()], log);

  let withPhoto = 0;
  let withWdName = 0;
  for (const allow of JUSTICE_ALLOWLIST) {
    const fact = facts.get(allow.qid);
    const existing = await prisma.justice.findUnique({ where: { id: allow.id } });

    // Name: prefer Wikidata; fall back to whatever we last stored.
    const fullName = fact?.label ?? existing?.fullName ?? allow.id;
    if (fact?.label) withWdName++;
    // Photo: prefer Wikidata P18; then last stored; then placeholder.
    const photoUrl = fact?.imageUrl ?? existing?.photoUrl ?? allow.fallbackPhotoUrl;
    if (fact?.imageUrl) withPhoto++;
    const source = fact?.label ? 'wikidata' : existing ? existing.source : 'allowlist';

    await prisma.justice.upsert({
      where: { id: allow.id },
      create: {
        id: allow.id,
        fullName,
        photoUrl,
        appointedBy: allow.appointedBy,
        year: allow.year,
        source,
        order: allow.order,
      },
      update: { fullName, photoUrl, appointedBy: allow.appointedBy, year: allow.year, source, order: allow.order },
    });
  }

  return `synced ${JUSTICE_ALLOWLIST.length} justices from Wikidata (${withWdName} names, ${withPhoto} photos).`;
}

async function safeFetchFacts(qids: string[], log: (msg: string) => void) {
  try {
    return await fetchPersonFacts(qids);
  } catch (err) {
    log(`Wikidata entity fetch failed (${describe(err)}); falling back to stored data.`);
    return new Map();
  }
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
