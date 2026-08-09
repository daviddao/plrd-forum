export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startJetstream } = await import("@/lib/ingest/jetstream");
    startJetstream();

    // On ephemeral hosts (Vercel lambdas) the SQLite index starts empty on
    // every cold start — seed it from known leaflet authors in the background.
    const seedActors = (process.env.SEED_ACTORS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (seedActors.length > 0) {
      const { db, tables } = await import("@/lib/db");
      const { count } = await import("drizzle-orm");
      const row = db.select({ n: count() }).from(tables.posts).get();
      if (!row?.n) {
        const { backfillActor } = await import("@/lib/ingest/backfill");
        const { resolveHandleToDid } = await import("@/lib/atproto/resolve");
        void (async () => {
          for (const actor of seedActors) {
            try {
              const did = await resolveHandleToDid(actor);
              if (did) await backfillActor(did);
            } catch {
              // seeding is best-effort
            }
          }
        })();
      }
    }
  }
}
