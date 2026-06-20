/**
 * Shared API contract between apps/web and apps/api.
 *
 * Every endpoint the UI calls has its response shape declared here.
 * Stage 1 (this file): types only.
 * Stage 2: backend returns mock fixtures matching these shapes; frontend consumes them.
 * Stage 3: backend serves real data via Prisma, shapes unchanged.
 */

// ---------- Enums / unions ----------

export type BranchId = 'executive' | 'judicial' | 'legislative';

export type Party = 'D' | 'R' | 'I';

export type Chamber = 'SENATE' | 'HOUSE';

export type ColorMode = 'party' | 'money';

export type CourtLevel = 'supreme' | 'appeals' | 'district';

// ---------- Core entities ----------

export interface Branch {
  id: BranchId;
  label: string;
  route: string;
}

export interface RepresentativeBase {
  id: string;
  fullName: string;
  photoUrl: string;
}

export interface ExecutiveRole extends RepresentativeBase {
  roleKey: string;
  roleTitle: string;
}

export interface Justice extends RepresentativeBase {
  appointedBy: string;
  year: number;
}

export interface Member extends RepresentativeBase {
  bioguideId: string;
  party: Party;
  state: string;
  district: number | null;
  chamber: Chamber;
  opensecretsUrl: string;
  pacPct: number;
}

export interface Court {
  id: string;
  name: string;
  level: CourtLevel;
  parentCourtId: string | null;
  clickable: boolean;
}

export interface Chambers {
  senate: { label: string; route: string };
  house: { label: string; route: string };
}

// ---------- Endpoint response shapes ----------

export interface BranchesResponse {
  branches: Branch[];
}

export interface ExecutiveResponse {
  president: ExecutiveRole;
  roles: ExecutiveRole[];
}

export interface JudicialCourtsResponse {
  courts: Court[];
}

export interface SupremeCourtResponse {
  justices: Justice[];
}

export interface LegislativeChambersResponse {
  chambers: Chambers;
}

export interface MembersResponse {
  members: Member[];
}

// ---------- Endpoint paths (single source of truth) ----------

export const API_ROUTES = {
  health: '/api/health',
  branches: '/api/branches',
  executive: '/api/executive',
  judicialCourts: '/api/judicial/courts',
  supremeCourt: '/api/judicial/supreme-court',
  legislativeChambers: '/api/legislative/chambers',
  senate: '/api/legislative/senate',
  house: '/api/legislative/house',
} as const;
