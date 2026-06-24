/**
 * Judicial allowlist + court hierarchy.
 *
 * The Justice *roster, names, and photos* are pulled live from Wikidata by
 * `syncJudicial.ts`. Wikidata is community-edited and its "current SCOTUS
 * justices" query also returns vandalism (e.g. "Bart Simpson"), so each result
 * is validated against `JUSTICE_ALLOWLIST` by stable person Q-id before it is
 * stored. The allowlist holds only identifiers + historical appointment facts
 * (appointer/year, which are constants not uniformly modeled in Wikidata) and a
 * fallback photo — no names, since those come from the API.
 *
 * Wikidata position items queried for current holders:
 *   Q11147 — Chief Justice of the United States
 *   Q11144 — Associate Justice of the Supreme Court of the United States
 */

export const SCOTUS_POSITION_QIDS = ['Q11147', 'Q11144'] as const;

export interface JusticeAllow {
  /** Stable Wikidata person Q-id — the allowlist key. */
  qid: string;
  /** Internal id used by the API/frontend (stable, human-readable). */
  id: string;
  /** Appointing president — historical constant. */
  appointedBy: string;
  /** Year confirmed — historical constant. */
  year: number;
  /** Display order (Chief Justice first, then by seniority). */
  order: number;
  /** Used only if Wikidata has no P18 image for this person. */
  fallbackPhotoUrl: string;
}

function fallback(seed: string): string {
  return `https://i.pravatar.cc/300?u=${encodeURIComponent(`justice-${seed}`)}`;
}

export interface CourtSeed {
  id: string;
  name: string;
  level: 'supreme' | 'appeals' | 'district';
  parentCourtId: string | null;
  clickable: boolean;
}

// Court hierarchy is fixed structure (not a roster), so it stays curated.
export const COURT_SEEDS: CourtSeed[] = [
  { id: 'court-supreme', name: 'Supreme Court', level: 'supreme', parentCourtId: null, clickable: true },
  {
    id: 'court-appeals',
    name: 'U.S. Courts of Appeals',
    level: 'appeals',
    parentCourtId: 'court-supreme',
    clickable: false,
  },
  {
    id: 'court-district',
    name: 'U.S. District Courts',
    level: 'district',
    parentCourtId: 'court-appeals',
    clickable: false,
  },
];

// The 9 current Justices, by Wikidata Q-id. Confirmed via Wikidata position
// lookup. Names + photos are resolved from these Q-ids at sync time.
export const JUSTICE_ALLOWLIST: JusticeAllow[] = [
  { qid: 'Q11153', id: 'justice-roberts', appointedBy: 'George W. Bush', year: 2005, order: 0, fallbackPhotoUrl: fallback('roberts') },
  { qid: 'Q11142', id: 'justice-thomas', appointedBy: 'George H. W. Bush', year: 1991, order: 1, fallbackPhotoUrl: fallback('thomas') },
  { qid: 'Q11138', id: 'justice-alito', appointedBy: 'George W. Bush', year: 2006, order: 2, fallbackPhotoUrl: fallback('alito') },
  { qid: 'Q11107', id: 'justice-sotomayor', appointedBy: 'Barack Obama', year: 2009, order: 3, fallbackPhotoUrl: fallback('sotomayor') },
  { qid: 'Q11105', id: 'justice-kagan', appointedBy: 'Barack Obama', year: 2010, order: 4, fallbackPhotoUrl: fallback('kagan') },
  { qid: 'Q15488345', id: 'justice-gorsuch', appointedBy: 'Donald J. Trump', year: 2017, order: 5, fallbackPhotoUrl: fallback('gorsuch') },
  { qid: 'Q4962244', id: 'justice-kavanaugh', appointedBy: 'Donald J. Trump', year: 2018, order: 6, fallbackPhotoUrl: fallback('kavanaugh') },
  { qid: 'Q29863844', id: 'justice-barrett', appointedBy: 'Donald J. Trump', year: 2020, order: 7, fallbackPhotoUrl: fallback('barrett') },
  { qid: 'Q6395324', id: 'justice-jackson', appointedBy: 'Joe Biden', year: 2022, order: 8, fallbackPhotoUrl: fallback('jackson') },
];
