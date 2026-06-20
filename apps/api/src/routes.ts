import { Router } from 'express';
import {
  API_ROUTES,
  type BranchesResponse,
  type ExecutiveResponse,
  type JudicialCourtsResponse,
  type LegislativeChambersResponse,
  type MembersResponse,
  type SupremeCourtResponse,
} from '@usgov/shared';
import { BRANCHES } from './data/branches.js';
import { EXECUTIVE } from './data/executive.js';
import { COURTS, JUSTICES } from './data/judicial.js';
import { CHAMBERS, HOUSE, SENATE } from './data/members.js';

/**
 * Stage 2: every endpoint returns mock fixtures matching the shared API
 * contract. Stage 3 swaps the data sources for Prisma-backed reads without
 * changing any of these response shapes, so the frontend stays untouched.
 */
export const apiRouter: Router = Router();

apiRouter.get(API_ROUTES.branches, (_req, res) => {
  const body: BranchesResponse = { branches: BRANCHES };
  res.json(body);
});

apiRouter.get(API_ROUTES.executive, (_req, res) => {
  const body: ExecutiveResponse = EXECUTIVE;
  res.json(body);
});

apiRouter.get(API_ROUTES.judicialCourts, (_req, res) => {
  const body: JudicialCourtsResponse = { courts: COURTS };
  res.json(body);
});

apiRouter.get(API_ROUTES.supremeCourt, (_req, res) => {
  const body: SupremeCourtResponse = { justices: JUSTICES };
  res.json(body);
});

apiRouter.get(API_ROUTES.legislativeChambers, (_req, res) => {
  const body: LegislativeChambersResponse = { chambers: CHAMBERS };
  res.json(body);
});

apiRouter.get(API_ROUTES.senate, (_req, res) => {
  const body: MembersResponse = { members: SENATE };
  res.json(body);
});

apiRouter.get(API_ROUTES.house, (_req, res) => {
  const body: MembersResponse = { members: HOUSE };
  res.json(body);
});
