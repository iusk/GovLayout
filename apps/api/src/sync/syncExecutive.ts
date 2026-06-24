import { prisma } from '../db.js';
import { fetchCurrentOfficeHolders, fetchPersonFacts } from './lib/wikidata.js';
import { EXECUTIVE_ALLOWLIST } from './seeds/executive.js';

/**
 * Sync the President + VP + Big 4 cabinet roles.
 *
 * For each office we ask Wikidata for the current holder (no end date) of its
 * position item, then keep only the holder whose Q-id matches the allowlist —
 * which drops the fictional TV characters Wikidata also returns for these
 * offices. Names + photos come from the Wikidata entity API. Role titles/keys
 * are fixed structure.
 *
 * Stale-on-error: on a Wikidata failure we keep the existing DB row for the
 * role, so the Executive page never goes blank.
 */
export async function runExecutiveSync(log: (msg: string) => void): Promise<string> {
  // One roster query across all executive positions, gated by holder Q-id.
  const positionQids = [...new Set(EXECUTIVE_ALLOWLIST.map((r) => r.positionQid))];
  let currentHolderQids = new Set<string>();
  try {
    const holders = await fetchCurrentOfficeHolders(positionQids);
    currentHolderQids = new Set(holders.map((h) => h.qid));
    const matched = EXECUTIVE_ALLOWLIST.filter((r) => currentHolderQids.has(r.holderQid)).length;
    log(`Wikidata returned ${holders.length} current office-holders; ${matched} matched the allowlist.`);
  } catch (err) {
    log(`Wikidata roster query failed (${describe(err)}); using allowlist holders (stale-on-error).`);
    currentHolderQids = new Set(EXECUTIVE_ALLOWLIST.map((r) => r.holderQid));
  }

  const facts = await safeFetchFacts(
    EXECUTIVE_ALLOWLIST.map((r) => r.holderQid),
    log,
  );

  let withPhoto = 0;
  let withWdName = 0;
  for (const role of EXECUTIVE_ALLOWLIST) {
    const fact = facts.get(role.holderQid);
    const existing = await prisma.executiveRole.findUnique({ where: { id: role.id } });

    const holderName = fact?.label ?? existing?.holderName ?? '';
    if (fact?.label) withWdName++;
    const photoUrl = fact?.imageUrl ?? existing?.photoUrl ?? role.fallbackPhotoUrl;
    if (fact?.imageUrl) withPhoto++;
    const source = fact?.label ? 'wikidata' : existing ? existing.source : 'allowlist';
    const order = role.isPresident ? -1 : EXECUTIVE_ALLOWLIST.indexOf(role);

    await prisma.executiveRole.upsert({
      where: { id: role.id },
      create: {
        id: role.id,
        roleKey: role.roleKey,
        roleTitle: role.roleTitle,
        holderName,
        photoUrl,
        source,
        isPresident: role.isPresident,
        order,
      },
      update: {
        roleKey: role.roleKey,
        roleTitle: role.roleTitle,
        holderName,
        photoUrl,
        source,
        isPresident: role.isPresident,
        order,
      },
    });
  }

  return `synced ${EXECUTIVE_ALLOWLIST.length} executive roles from Wikidata (${withWdName} names, ${withPhoto} photos).`;
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
