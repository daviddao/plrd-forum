/**
 * Fetch real Simocracy sims (org.simocracy.sim records) from the public
 * Simocracy indexer, the same source simocracy-v2's landing page uses,
 * and randomly pick a few to walk across the forum frontpage.
 */

export type SimSpriteSettings = {
  selectedOptions: Record<string, string>;
  partColorSettings?: Record<
    string,
    { red: number; green: number; blue: number; alpha: number }
  >;
  characterSet?: string;
};

export type LandingSim = {
  name: string;
  settings: SimSpriteSettings;
};

const INDEXER_GRAPHQL =
  process.env.SIMOCRACY_INDEXER_URL ??
  "https://simocracy-indexer-production.up.railway.app/graphql";

const RECORDS_QUERY = `
  query FetchRecords($collection: String!, $first: Int) {
    records(collection: $collection, first: $first) {
      edges { node { uri did rkey value } }
    }
  }
`;

type SimRecordValue = {
  name?: string;
  spriteKind?: string;
  settings?: SimSpriteSettings;
};

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Randomly pick `count` renderable pipoya sims from the Simocracy network. */
export async function getLandingSims(count = 7): Promise<LandingSim[]> {
  try {
    const res = await fetch(INDEXER_GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: RECORDS_QUERY,
        variables: { collection: "org.simocracy.sim", first: 100 },
      }),
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      data?: { records?: { edges?: { node: { value: SimRecordValue } }[] } };
    };
    const edges = data.data?.records?.edges ?? [];

    const candidates: LandingSim[] = [];
    for (const edge of edges) {
      const v = edge.node.value;
      if (!v?.name) continue;
      if (v.spriteKind === "codexPet") continue; // pet sheets need PDS blob resolution
      const opts = v.settings?.selectedOptions;
      if (!opts || Object.values(opts).every((p) => !p)) continue;
      candidates.push({
        name: v.name,
        settings: {
          selectedOptions: opts,
          partColorSettings: v.settings?.partColorSettings ?? {},
          characterSet: v.settings?.characterSet ?? "adult",
        },
      });
    }
    return shuffle(candidates).slice(0, count);
  } catch {
    return [];
  }
}
