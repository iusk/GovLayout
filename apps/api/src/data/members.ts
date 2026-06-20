import type { Chambers, Member, Party } from '@usgov/shared';
import { mulberry32, pick, randInt, weightedPick } from '../lib/prng.js';

/**
 * Mock Congress fixtures: 100 senators + 435 representatives, generated once at
 * module load from a fixed seed so the roster is stable across requests and
 * restarts. Stage 3 replaces this with real members synced into SQLite, keeping
 * the same `Member` shape so the frontend is untouched.
 */

export const CHAMBERS: Chambers = {
  senate: { label: 'Upper Body / Senate', route: '/legislative/senate' },
  house: { label: 'Lower Body / House', route: '/legislative/house' },
};

// State code + House seat count (2020 apportionment, sums to 435). The Senate
// gets exactly 2 per state -> 100.
const STATES: { code: string; houseSeats: number }[] = [
  { code: 'AL', houseSeats: 7 },
  { code: 'AK', houseSeats: 1 },
  { code: 'AZ', houseSeats: 9 },
  { code: 'AR', houseSeats: 4 },
  { code: 'CA', houseSeats: 52 },
  { code: 'CO', houseSeats: 8 },
  { code: 'CT', houseSeats: 5 },
  { code: 'DE', houseSeats: 1 },
  { code: 'FL', houseSeats: 28 },
  { code: 'GA', houseSeats: 14 },
  { code: 'HI', houseSeats: 2 },
  { code: 'ID', houseSeats: 2 },
  { code: 'IL', houseSeats: 17 },
  { code: 'IN', houseSeats: 9 },
  { code: 'IA', houseSeats: 4 },
  { code: 'KS', houseSeats: 4 },
  { code: 'KY', houseSeats: 6 },
  { code: 'LA', houseSeats: 6 },
  { code: 'ME', houseSeats: 2 },
  { code: 'MD', houseSeats: 8 },
  { code: 'MA', houseSeats: 9 },
  { code: 'MI', houseSeats: 13 },
  { code: 'MN', houseSeats: 8 },
  { code: 'MS', houseSeats: 4 },
  { code: 'MO', houseSeats: 8 },
  { code: 'MT', houseSeats: 2 },
  { code: 'NE', houseSeats: 3 },
  { code: 'NV', houseSeats: 4 },
  { code: 'NH', houseSeats: 2 },
  { code: 'NJ', houseSeats: 12 },
  { code: 'NM', houseSeats: 3 },
  { code: 'NY', houseSeats: 26 },
  { code: 'NC', houseSeats: 14 },
  { code: 'ND', houseSeats: 1 },
  { code: 'OH', houseSeats: 15 },
  { code: 'OK', houseSeats: 5 },
  { code: 'OR', houseSeats: 6 },
  { code: 'PA', houseSeats: 17 },
  { code: 'RI', houseSeats: 2 },
  { code: 'SC', houseSeats: 7 },
  { code: 'SD', houseSeats: 1 },
  { code: 'TN', houseSeats: 9 },
  { code: 'TX', houseSeats: 38 },
  { code: 'UT', houseSeats: 4 },
  { code: 'VT', houseSeats: 1 },
  { code: 'VA', houseSeats: 11 },
  { code: 'WA', houseSeats: 10 },
  { code: 'WV', houseSeats: 2 },
  { code: 'WI', houseSeats: 8 },
  { code: 'WY', houseSeats: 1 },
];

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Margaret', 'Anthony', 'Betty', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Andrew', 'Emily', 'Joshua', 'Donna', 'Kenneth', 'Michelle',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Generate a single member. `pacPct` is drawn so every money color appears:
 * ~12% have 0% (green), ~33% under 25% (yellow), the rest >= 25% (red).
 */
function makeMember(
  rng: () => number,
  chamber: 'SENATE' | 'HOUSE',
  seq: number,
  state: string,
  district: number | null,
): Member {
  const fullName = `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
  const party = weightedPick<Party>(rng, { D: 47, R: 47, I: 6 });

  const moneyBucket = rng();
  let pacPct: number;
  if (moneyBucket < 0.12) pacPct = 0;
  else if (moneyBucket < 0.45) pacPct = randInt(rng, 1, 24);
  else pacPct = randInt(rng, 25, 72);

  const letter = chamber === 'SENATE' ? 'S' : 'H';
  const bioguideId = `${letter}${String(seq).padStart(6, '0')}`;
  const cid = `N${String(seq).padStart(8, '0')}`;

  return {
    id: bioguideId,
    bioguideId,
    fullName,
    party,
    state,
    district,
    chamber,
    photoUrl: `https://i.pravatar.cc/150?u=${encodeURIComponent(bioguideId)}`,
    opensecretsUrl: `https://www.opensecrets.org/members-of-congress/${slugify(fullName)}/summary?cid=${cid}`,
    pacPct,
  };
}

function generateSenate(): Member[] {
  const rng = mulberry32(0x5e6a7e); // "senate"
  const members: Member[] = [];
  let seq = 1;
  for (const { code } of STATES) {
    for (let i = 0; i < 2; i++) {
      members.push(makeMember(rng, 'SENATE', seq++, code, null));
    }
  }
  return members;
}

function generateHouse(): Member[] {
  const rng = mulberry32(0x40075e); // "house"
  const members: Member[] = [];
  let seq = 1;
  for (const { code, houseSeats } of STATES) {
    for (let d = 1; d <= houseSeats; d++) {
      members.push(makeMember(rng, 'HOUSE', seq++, code, d));
    }
  }
  return members;
}

export const SENATE: Member[] = generateSenate();
export const HOUSE: Member[] = generateHouse();
