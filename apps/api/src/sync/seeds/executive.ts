/**
 * Executive allowlist.
 *
 * The *holder names and photos* for each office are pulled live from Wikidata by
 * `syncExecutive.ts`, which queries the current holder (no end date) of each
 * office's Wikidata position item. Those queries also return fictional TV
 * characters (e.g. a "President" from a show, a West Wing "Attorney General"),
 * so each result is validated against `EXECUTIVE_ALLOWLIST` by the expected
 * person Q-id before being stored.
 *
 * Role titles/keys are fixed structure. The person Q-id pins the *current*
 * holder; when the office changes hands, update that one Q-id (a single stable
 * identifier) — the name and photo then follow automatically from Wikidata.
 */

export interface ExecutiveRoleAllow {
  id: string;
  roleKey: string;
  roleTitle: string;
  isPresident: boolean;
  /** Wikidata position item for the office (queried for the current holder). */
  positionQid: string;
  /** Expected current-holder person Q-id — the allowlist gate. */
  holderQid: string;
  /** Used only if Wikidata has no P18 image for the holder. */
  fallbackPhotoUrl: string;
}

function fallback(seed: string): string {
  return `https://i.pravatar.cc/300?u=${encodeURIComponent(`exec-${seed}`)}`;
}

// Order: the president renders on top; remaining roles follow in this order.
// Position + holder Q-ids confirmed via Wikidata lookups.
export const EXECUTIVE_ALLOWLIST: ExecutiveRoleAllow[] = [
  {
    id: 'exec-president',
    roleKey: 'president',
    roleTitle: 'President of the United States',
    isPresident: true,
    positionQid: 'Q11696',
    holderQid: 'Q22686', // Donald Trump
    fallbackPhotoUrl: fallback('president'),
  },
  {
    id: 'exec-vice-president',
    roleKey: 'vice-president',
    roleTitle: 'Vice President',
    isPresident: false,
    positionQid: 'Q11699',
    holderQid: 'Q28935729', // JD Vance
    fallbackPhotoUrl: fallback('vice-president'),
  },
  {
    id: 'exec-secretary-of-state',
    roleKey: 'secretary-of-state',
    roleTitle: 'Secretary of State',
    isPresident: false,
    positionQid: 'Q14213',
    holderQid: 'Q324546', // Marco Rubio
    fallbackPhotoUrl: fallback('secretary-of-state'),
  },
  {
    id: 'exec-secretary-of-treasury',
    roleKey: 'secretary-of-treasury',
    roleTitle: 'Secretary of the Treasury',
    isPresident: false,
    positionQid: 'Q4215834',
    holderQid: 'Q7435987', // Scott Bessent
    fallbackPhotoUrl: fallback('secretary-of-treasury'),
  },
  {
    id: 'exec-secretary-of-defense',
    roleKey: 'secretary-of-defense',
    roleTitle: 'Secretary of Defense',
    isPresident: false,
    positionQid: 'Q735015',
    holderQid: 'Q7172014', // Pete Hegseth
    fallbackPhotoUrl: fallback('secretary-of-defense'),
  },
  {
    id: 'exec-attorney-general',
    roleKey: 'attorney-general',
    roleTitle: 'Attorney General',
    isPresident: false,
    positionQid: 'Q636207',
    holderQid: 'Q7128915', // Pam Bondi
    fallbackPhotoUrl: fallback('attorney-general'),
  },
];
