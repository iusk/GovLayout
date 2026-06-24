import { fetchJson } from './http.js';

/**
 * Wikidata access for the Judicial and Executive syncs.
 *
 * We pull the *roster* (who currently holds each office) and each holder's
 * portrait + facts from Wikidata via its SPARQL endpoint and entity API — so
 * the data is genuinely API-sourced, not hardcoded. Wikidata is community-
 * edited and gets vandalized (its query for "current Supreme Court justices"
 * famously also returns "Bart Simpson", and executive offices return fictional
 * TV characters), so every result is gated against a curated allowlist of
 * expected person Q-IDs before it is trusted. The allowlist holds only stable
 * identifiers — no names, photos, or dates are hardcoded.
 */

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
const ENTITY_API = 'https://www.wikidata.org/w/api.php';
const UA = 'USGovLayout/1.0 (https://github.com/; government-layout demo app)';

/** Person currently holding a position, as returned by the roster query. */
export interface OfficeHolder {
  /** Person Wikidata Q-id, e.g. "Q22686". */
  qid: string;
  /** Position Q-id they hold, e.g. "Q11696". */
  positionQid: string;
  /** Start date of the (open) term, ISO string, if recorded. */
  start: string | null;
}

interface SparqlBinding {
  person: { value: string };
  position: { value: string };
  start?: { value: string };
}
interface SparqlResponse {
  results: { bindings: SparqlBinding[] };
}

function qidFromUri(uri: string): string {
  return uri.split('/').pop() ?? uri;
}

async function runSparql(query: string): Promise<SparqlBinding[]> {
  const url = `${SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(query)}`;
  const data = await fetchJson<SparqlResponse>(url, {
    retries: 4,
    backoffMs: 800,
    headers: { 'User-Agent': UA },
  });
  return data.results.bindings;
}

/**
 * Return everyone Wikidata lists as a *current* holder (no end date) of any of
 * the given position Q-ids. Includes vandalism/fiction — callers MUST filter
 * against an allowlist.
 */
export async function fetchCurrentOfficeHolders(positionQids: string[]): Promise<OfficeHolder[]> {
  const values = positionQids.map((q) => `wd:${q}`).join(' ');
  const query = `SELECT ?person ?position ?start WHERE {
    VALUES ?position { ${values} }
    ?person p:P39 ?st.
    ?st ps:P39 ?position.
    FILTER NOT EXISTS { ?st pq:P582 ?end. }
    OPTIONAL { ?st pq:P580 ?start. }
  }`;
  const bindings = await runSparql(query);
  return bindings.map((b) => ({
    qid: qidFromUri(b.person.value),
    positionQid: qidFromUri(b.position.value),
    start: b.start?.value ?? null,
  }));
}

/** Facts we read per person from the Wikidata entity API. */
export interface PersonFacts {
  qid: string;
  /** English label (display name). */
  label: string | null;
  /** Direct Commons image URL from the P18 claim, full-size. */
  imageUrl: string | null;
}

/** Build the Commons "Special:FilePath" URL for a P18 image filename. */
function commonsImageUrl(filename: string): string {
  const normalized = filename.replace(/ /g, '_');
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(normalized)}?width=400`;
}

/**
 * Fetch label + P18 image for a batch of person Q-ids (≤50 per call, per the
 * Wikidata entity API limit). Returns a map keyed by Q-id.
 */
export async function fetchPersonFacts(qids: string[]): Promise<Map<string, PersonFacts>> {
  const out = new Map<string, PersonFacts>();
  if (qids.length === 0) return out;

  for (let i = 0; i < qids.length; i += 50) {
    const batch = qids.slice(i, i + 50);
    // Request both `en` and `mul`: some entities (e.g. Donald Trump, Q22686)
    // store their name under Wikidata's newer language-agnostic `mul` label
    // rather than `en`, so an en-only query returns no name.
    const url =
      `${ENTITY_API}?action=wbgetentities&format=json&languages=en|mul` +
      `&props=labels|claims&ids=${batch.join('|')}&origin=*`;
    const data = await fetchJson<WbGetEntitiesResponse>(url, {
      retries: 3,
      headers: { 'User-Agent': UA },
    });
    const entities = data.entities ?? {};
    for (const qid of batch) {
      const ent = entities[qid];
      const label = ent?.labels?.en?.value ?? ent?.labels?.mul?.value ?? null;
      const p18 = ent?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      out.set(qid, {
        qid,
        label,
        imageUrl: typeof p18 === 'string' ? commonsImageUrl(p18) : null,
      });
    }
  }
  return out;
}

interface WbGetEntitiesResponse {
  entities?: Record<
    string,
    {
      labels?: { en?: { value?: string }; mul?: { value?: string } };
      claims?: {
        P18?: { mainsnak?: { datavalue?: { value?: unknown } } }[];
      };
    }
  >;
}

/**
 * Resolve a single person's portrait by Wikipedia page title (legacy helper,
 * kept for any title-based lookups). Prefer `fetchPersonFacts` by Q-id.
 */
export async function resolvePortrait(pageTitle: string): Promise<string | null> {
  const title = encodeURIComponent(pageTitle.replace(/\s+/g, '_'));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;
  try {
    const data = await fetchJson<{ originalimage?: { source?: string }; thumbnail?: { source?: string } }>(
      url,
      { retries: 2 },
    );
    return data.originalimage?.source ?? data.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}

export { UA };
