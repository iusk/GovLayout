import type { ColorMode, Member, Party } from '@usgov/shared';

/**
 * Dot coloring for <ChamberView>, kept pure and side-effect-free so it can be
 * unit-tested. Two modes:
 *  - Party: blue (D), red (R), grey (I).
 *  - Money: green if 0% from PACs, yellow if < 25%, red if >= 25%.
 *
 * The flag colors in the theme are intentionally dark/muted for chrome; these
 * dot colors are brighter so 100–435 small dots stay legible on the dark bg.
 */

export const PARTY_COLORS: Record<Party, string> = {
  D: '#4F8EF7', // blue
  R: '#E0474C', // red
  I: '#9AA0A6', // grey
};

export const MONEY_COLORS = {
  green: '#43A047',
  yellow: '#F2C037',
  red: '#E0474C',
} as const;

export type MoneyColorKey = keyof typeof MONEY_COLORS;

/**
 * Map a PAC-money percentage to its color bucket.
 * Thresholds (from the requirements): 0% -> green, < 25% -> yellow, >= 25% -> red.
 */
export function moneyColorKey(pacPct: number): MoneyColorKey {
  if (pacPct === 0) return 'green';
  if (pacPct < 25) return 'yellow';
  return 'red';
}

/** Resolve the fill color for a single member's dot in the given mode. */
export function dotColor(member: Member, mode: ColorMode): string {
  if (mode === 'money') return MONEY_COLORS[moneyColorKey(member.pacPct)];
  return PARTY_COLORS[member.party];
}
