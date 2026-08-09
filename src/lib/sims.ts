/**
 * Fetch the researcher sims owned by daviddao.org (org.simocracy.sim records
 * — Einstein, Curie, Turing, Feynman, Lovelace, …) from the public Simocracy
 * indexer and randomly pick a few to wander around the forum frontpage.
 *
 * Most of these sims are `codexPet` sprites: a single 1536x1872 spritesheet
 * (8 cols x 9 rows of 192x208 cells, the OpenAI hatch-pet contract) stored as
 * a blob in the owner's PDS. We resolve the PDS blob URL server-side, same as
 * simocracy-v2's app/page.tsx. The couple of pipoya (layered) sims are kept
 * as a supported path but filtered out when their settings are empty.
 */

export type SimSpriteSettings = {
  selectedOptions: Record<string, string>;
  partColorSettings?: Record<
    string,
    { red: number; green: number; blue: number; alpha: number }
  >;
  characterSet?: string;
};

export type LandingSim =
  | { kind: "pipoya"; name: string; settings: SimSpriteSettings }
  | { kind: "codexPet"; name: string; petSheetUrl: string };

const INDEXER_GRAPHQL =
  process.env.SIMOCRACY_INDEXER_URL ??
  "https://simocracy-indexer-production.up.railway.app/graphql";

/** daviddao.org — owner of the researcher/scientist sims. */
const RESEARCHER_DID =
  process.env.SIMOCRACY_SIMS_DID ?? "did:plc:qc42fmqqlsmdq7jiypiiigww";

/**
 * Curated allowlist: daviddao.org's roster also contains animal pets
 * (Elephant, Capybara, Corgi Cool, the four elements, …) — only the
 * researchers/thinkers walk the forum. Einstein is deliberately absent:
 * he's the floating feedback agent, not a walker.
 */
const RESEARCHER_NAMES = new Set([
  "Herbert Simon",
  "Plato",
  "Laozi",
  "Ramanujan",
  "Al-Khwarizmi",
  "DaVinci",
  "Turing",
  "Edison",
  "Curie",
  "Habermas",
  "Humboldt",
  "Lovelace",
  "Ostrom",
  "Shannon",
  "Feynman",
  "Newton",
]);

// Typed indexer query: the generic `records` query pages arbitrarily, so a
// did-filtered `orgSimocracySim` is the only way to reliably get one owner's
// full sim roster.
const SIMS_QUERY = `
  query ResearcherSims($w: OrgSimocracySimWhereInput) {
    orgSimocracySim(where: $w, first: 100) {
      edges {
        node {
          name
          did
          spriteKind
          petSheet { ref }
          settings { selectedOptions partColorSettings }
        }
      }
    }
  }
`;

type SimNode = {
  name?: string;
  did?: string;
  spriteKind?: string;
  petSheet?: { ref?: string } | null;
  settings?: {
    selectedOptions?: Record<string, string> | null;
    partColorSettings?: unknown;
  } | null;
};

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Randomly pick `count` renderable researcher sims (pets + pipoya). */
export async function getLandingSims(count = 7): Promise<LandingSim[]> {
  try {
    const res = await fetch(INDEXER_GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: SIMS_QUERY,
        variables: { w: { did: { eq: RESEARCHER_DID } } },
      }),
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      data?: { orgSimocracySim?: { edges?: { node: SimNode }[] } };
    };
    const edges = data.data?.orgSimocracySim?.edges ?? [];
    if (edges.length === 0) return [];

    // One PDS lookup for the whole roster — every sim shares the owner's repo.
    const { resolvePds } = await import("@/lib/atproto/resolve");
    const pds = await resolvePds(RESEARCHER_DID).catch(() => null);

    const candidates: LandingSim[] = [];
    for (const { node: v } of edges) {
      if (!v?.name || !RESEARCHER_NAMES.has(v.name)) continue;
      if (v.spriteKind === "codexPet") {
        const cid = v.petSheet?.ref;
        if (!cid || !pds) continue;
        candidates.push({
          kind: "codexPet",
          name: v.name,
          petSheetUrl: `${pds}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(RESEARCHER_DID)}&cid=${encodeURIComponent(cid)}`,
        });
        continue;
      }
      const opts = v.settings?.selectedOptions;
      if (!opts || Object.values(opts).every((p) => !p)) continue;
      candidates.push({
        kind: "pipoya",
        name: v.name,
        settings: {
          selectedOptions: opts,
          partColorSettings:
            (v.settings?.partColorSettings as SimSpriteSettings["partColorSettings"]) ?? {},
          characterSet: "adult",
        },
      });
    }
    return shuffle(candidates).slice(0, count);
  } catch {
    return [];
  }
}
