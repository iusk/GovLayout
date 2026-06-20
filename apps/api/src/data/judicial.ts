import type { Court, Justice } from '@usgov/shared';

/**
 * Mock Judicial branch fixtures: the court hierarchy and the 9 current Justices.
 * The hierarchy and Justice roster are small and change rarely, so even in
 * Stage 3 these come from curated seed data (photos resolved from Wikidata).
 */

/** Deterministic placeholder portrait, stable per justice id. */
function photo(seed: string): string {
  return `https://i.pravatar.cc/300?u=${encodeURIComponent(`justice-${seed}`)}`;
}

// Court hierarchy: Supreme Court -> Courts of Appeals -> District Courts.
// Only the Supreme Court is clickable (it has a dedicated page).
export const COURTS: Court[] = [
  {
    id: 'court-supreme',
    name: 'Supreme Court',
    level: 'supreme',
    parentCourtId: null,
    clickable: true,
  },
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

export const JUSTICES: Justice[] = [
  {
    id: 'justice-roberts',
    fullName: 'John G. Roberts Jr.',
    photoUrl: photo('roberts'),
    appointedBy: 'George W. Bush',
    year: 2005,
  },
  {
    id: 'justice-thomas',
    fullName: 'Clarence Thomas',
    photoUrl: photo('thomas'),
    appointedBy: 'George H. W. Bush',
    year: 1991,
  },
  {
    id: 'justice-alito',
    fullName: 'Samuel A. Alito Jr.',
    photoUrl: photo('alito'),
    appointedBy: 'George W. Bush',
    year: 2006,
  },
  {
    id: 'justice-sotomayor',
    fullName: 'Sonia Sotomayor',
    photoUrl: photo('sotomayor'),
    appointedBy: 'Barack Obama',
    year: 2009,
  },
  {
    id: 'justice-kagan',
    fullName: 'Elena Kagan',
    photoUrl: photo('kagan'),
    appointedBy: 'Barack Obama',
    year: 2010,
  },
  {
    id: 'justice-gorsuch',
    fullName: 'Neil M. Gorsuch',
    photoUrl: photo('gorsuch'),
    appointedBy: 'Donald J. Trump',
    year: 2017,
  },
  {
    id: 'justice-kavanaugh',
    fullName: 'Brett M. Kavanaugh',
    photoUrl: photo('kavanaugh'),
    appointedBy: 'Donald J. Trump',
    year: 2018,
  },
  {
    id: 'justice-barrett',
    fullName: 'Amy Coney Barrett',
    photoUrl: photo('barrett'),
    appointedBy: 'Donald J. Trump',
    year: 2020,
  },
  {
    id: 'justice-jackson',
    fullName: 'Ketanji Brown Jackson',
    photoUrl: photo('jackson'),
    appointedBy: 'Joe Biden',
    year: 2022,
  },
];
