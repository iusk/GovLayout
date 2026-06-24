import type {
  Branch,
  Chambers,
  Court,
  ExecutiveResponse,
  ExecutiveRole,
  Justice,
  Member,
  Party,
} from '@usgov/shared';
import { prisma } from './db.js';

/**
 * Data-access layer: reads rows from Prisma and maps them to the shared API
 * contract shapes. Route handlers stay thin and the mapping (DB column -> API
 * field) lives in one place. Everything here reads only the local DB, so
 * endpoints serve whatever was last synced (stale-on-error) and never depend on
 * an upstream being reachable at request time.
 */

// Branches are static structure, not synced data.
export const BRANCHES: Branch[] = [
  { id: 'executive', label: 'Executive', route: '/executive' },
  { id: 'judicial', label: 'Judicial', route: '/judicial' },
  { id: 'legislative', label: 'Legislative', route: '/legislative' },
];

export const CHAMBERS: Chambers = {
  senate: { label: 'Upper Body / Senate', route: '/legislative/senate' },
  house: { label: 'Lower Body / House', route: '/legislative/house' },
};

/** Member photos are served through our proxy so upstream URL churn is hidden. */
function memberPhotoUrl(bioguideId: string): string {
  return `/api/photos/${encodeURIComponent(bioguideId)}`;
}

export async function getMembers(chamber: 'SENATE' | 'HOUSE'): Promise<Member[]> {
  const rows = await prisma.member.findMany({
    where: { chamber },
    orderBy: [{ state: 'asc' }, { district: 'asc' }, { fullName: 'asc' }],
  });
  return rows.map((m) => ({
    id: m.id,
    bioguideId: m.bioguideId,
    fullName: m.fullName,
    party: m.party as Party,
    state: m.state,
    district: m.district,
    chamber: m.chamber as 'SENATE' | 'HOUSE',
    // pacPct is nullable until the FEC sync runs; default 0 so the money view
    // still renders (0 => "green", clearly "no PAC money recorded").
    pacPct: m.pacPct ?? 0,
    opensecretsUrl: m.opensecretsUrl,
    photoUrl: memberPhotoUrl(m.bioguideId),
  }));
}

export async function getExecutive(): Promise<ExecutiveResponse> {
  const rows = await prisma.executiveRole.findMany({ orderBy: { order: 'asc' } });
  const toRole = (r: (typeof rows)[number]): ExecutiveRole => ({
    id: r.id,
    roleKey: r.roleKey,
    roleTitle: r.roleTitle,
    fullName: r.holderName,
    photoUrl: r.photoUrl,
  });
  const presidentRow = rows.find((r) => r.isPresident);
  const roles = rows.filter((r) => !r.isPresident).map(toRole);
  // Fall back to an empty role shape if the executive sync hasn't run; the
  // frontend handles a missing president gracefully via its loading/error UI.
  const president: ExecutiveRole = presidentRow
    ? toRole(presidentRow)
    : { id: 'exec-president', roleKey: 'president', roleTitle: 'President of the United States', fullName: '', photoUrl: '' };
  return { president, roles };
}

export async function getJustices(): Promise<Justice[]> {
  const rows = await prisma.justice.findMany({ orderBy: { order: 'asc' } });
  return rows.map((j) => ({
    id: j.id,
    fullName: j.fullName,
    photoUrl: j.photoUrl,
    appointedBy: j.appointedBy,
    year: j.year,
  }));
}

export async function getCourts(): Promise<Court[]> {
  const rows = await prisma.court.findMany({ orderBy: { order: 'asc' } });
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    level: c.level as Court['level'],
    parentCourtId: c.parentCourtId,
    clickable: c.clickable,
  }));
}

/** Raw stored photo URL for a member (upstream), used by the photo proxy. */
export async function getMemberPhotoSource(bioguideId: string): Promise<string | null> {
  const m = await prisma.member.findUnique({
    where: { bioguideId },
    select: { photoUrl: true },
  });
  return m?.photoUrl?.trim() ? m.photoUrl : null;
}
