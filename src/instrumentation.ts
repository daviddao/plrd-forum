export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startJetstream } = await import("@/lib/ingest/jetstream");
    startJetstream();
  }
}
