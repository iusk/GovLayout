import type { Branch } from '@usgov/shared';

/**
 * The three branches shown on the Index page.
 *
 * Naming note (see ImplementationPlan.md): the requirements label the second
 * button "Legislative" while describing the Supreme Court under it — that is the
 * Judicial branch. Congress is the Legislative branch. We use the corrected set:
 * Executive, Judicial, Legislative.
 */
export const BRANCHES: Branch[] = [
  { id: 'executive', label: 'Executive', route: '/executive' },
  { id: 'judicial', label: 'Judicial', route: '/judicial' },
  { id: 'legislative', label: 'Legislative', route: '/legislative' },
];
