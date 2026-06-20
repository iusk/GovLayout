import type { ExecutiveResponse, ExecutiveRole } from '@usgov/shared';

/**
 * Mock Executive branch fixture: the President plus the essential roles below.
 * Names are plausible current holders; photos are deterministic placeholder
 * avatars. Stage 3 replaces holder names + photos with real data while keeping
 * these role titles/keys curated.
 */

/** Deterministic placeholder portrait, stable per role key. */
function photo(seed: string): string {
  return `https://i.pravatar.cc/300?u=${encodeURIComponent(`exec-${seed}`)}`;
}

const president: ExecutiveRole = {
  id: 'exec-president',
  roleKey: 'president',
  roleTitle: 'President of the United States',
  fullName: 'Donald J. Trump',
  photoUrl: photo('president'),
};

const roles: ExecutiveRole[] = [
  {
    id: 'exec-vice-president',
    roleKey: 'vice-president',
    roleTitle: 'Vice President',
    fullName: 'J.D. Vance',
    photoUrl: photo('vice-president'),
  },
  {
    id: 'exec-secretary-of-state',
    roleKey: 'secretary-of-state',
    roleTitle: 'Secretary of State',
    fullName: 'Marco Rubio',
    photoUrl: photo('secretary-of-state'),
  },
  {
    id: 'exec-secretary-of-treasury',
    roleKey: 'secretary-of-treasury',
    roleTitle: 'Secretary of the Treasury',
    fullName: 'Scott Bessent',
    photoUrl: photo('secretary-of-treasury'),
  },
  {
    id: 'exec-secretary-of-defense',
    roleKey: 'secretary-of-defense',
    roleTitle: 'Secretary of Defense',
    fullName: 'Pete Hegseth',
    photoUrl: photo('secretary-of-defense'),
  },
  {
    id: 'exec-attorney-general',
    roleKey: 'attorney-general',
    roleTitle: 'Attorney General',
    fullName: 'Pam Bondi',
    photoUrl: photo('attorney-general'),
  },
];

export const EXECUTIVE: ExecutiveResponse = { president, roles };
