import {
  API_ROUTES,
  type BranchesResponse,
  type Chamber,
  type ExecutiveResponse,
  type JudicialCourtsResponse,
  type LegislativeChambersResponse,
  type MembersResponse,
  type SupremeCourtResponse,
} from '@usgov/shared';
import { useApi, type UseApiResult } from './client';

/**
 * Typed, page-specific data hooks. Each wraps the generic `useApi` with the
 * correct endpoint + response type so pages never touch raw fetch or URLs.
 */

export const useBranches = (): UseApiResult<BranchesResponse> =>
  useApi<BranchesResponse>(API_ROUTES.branches);

export const useExecutive = (): UseApiResult<ExecutiveResponse> =>
  useApi<ExecutiveResponse>(API_ROUTES.executive);

export const useJudicialCourts = (): UseApiResult<JudicialCourtsResponse> =>
  useApi<JudicialCourtsResponse>(API_ROUTES.judicialCourts);

export const useSupremeCourt = (): UseApiResult<SupremeCourtResponse> =>
  useApi<SupremeCourtResponse>(API_ROUTES.supremeCourt);

export const useChambers = (): UseApiResult<LegislativeChambersResponse> =>
  useApi<LegislativeChambersResponse>(API_ROUTES.legislativeChambers);

/** Senate (100) or House (435) members, selected by chamber. */
export const useChamberMembers = (chamber: Chamber): UseApiResult<MembersResponse> =>
  useApi<MembersResponse>(
    chamber === 'SENATE' ? API_ROUTES.senate : API_ROUTES.house,
  );
