# AGENTS.md — plrd-forum

Guidance for AI agents (and humans) working on this codebase.

## What this is

A faithful port of LessWrong's ([ForumMagnum](https://github.com/ForumMagnum/ForumMagnum)) visual design as a clean Next.js 16 + Tailwind 4 app. Auth is ATProto OAuth; the data layer is the [standard.site](https://standard.site) lexicons (`site.standard.*`, published by [leaflet.pub](https://leaflet.pub), with legacy `pub.leaflet.*` still indexed) — every post, comment, vote, and reaction is a record in the logged-in user's own PDS, aggregated into a local SQLite index via Jetstream.

## Commands

```bash
npm run dev     # dev server on http://127.0.0.1:3457 (port matters for loopback OAuth)
npm run build   # production build — run before committing
npx tsc --noEmit
```

Seed content: `curl -X POST localhost:3457/api/backfill -H 'Content-Type: application/json' -d '{"actor":"awarm.space"}'`

## The prime directive: style fidelity

**Never eyeball LessWrong styles. Port them from ForumMagnum source.** Every CSS value in `src/app/globals.css` is annotated with the FM file it came from (`lesswrongTheme.ts`, `defaultPalette.ts`, `stylePiping.ts`, `LWPostsItem.tsx`, …). When adding UI:

1. Find the corresponding component in ForumMagnum (`packages/lesswrong/components/...`) via raw.githubusercontent.com
2. Port its JSS `defineStyles` values 1:1 (px values, colors, fonts)
3. Annotate the CSS with the source file name

Key theme facts:
- Palette: bg `#f8f4ee`, green `#5f9b65`, links `#327E09`, greys = MUI grey scale
- Fonts: UI = Calibri/Gill Sans stack @ 15.08px (`body2`); post body = warnock-pro serif 18.2/26px (`body1 + postStyle`); headers/wordmark = ETBookRoman (self-hosted from tufte-css CDN); warnock-pro/gill-sans-nova need `NEXT_PUBLIC_TYPEKIT_ID` (Adobe)
- Dark mode = HSL-lightness inversion of the light palette (FM's `invertHexColor`), toggled via `.dark` on `<html>`
- Posts list rows: white, `2px solid rgba(0,0,0,.05)` bottom border, 16.9px warnock titles, 14.3px grey-600 meta

## Architecture map

```
src/lib/db/           SQLite (better-sqlite3 + Drizzle). DDL bootstraps in index.ts;
                      migrations = try/catch ALTER TABLE statements there.
src/lib/leaflet/      Lexicon types, block renderer (render.tsx), facet richtext,
                      markdown→blocks for the editor
src/lib/ingest/       indexRecord/deleteRecord + Jetstream listener (started by
                      src/instrumentation.ts) + per-actor PDS backfill
src/lib/auth/         NodeOAuthClient (loopback in dev, client-metadata.json in prod)
                      + iron-session cookie holding the DID
src/lib/queries.ts    All read queries (posts, comments tree, votes, tags, publications)
src/lib/reactions.ts  LW's 89 named reacts, extracted from FM's reactions.tsx;
                      icons in public/reactionImages/
src/components/       Ports of FM components — names match FM (PostsItem≈LWPostsItem,
                      Tooltip≈LWTooltip/PopperCard, ReactionsPalette, SelectionToolbar,
                      NavSidebar≈TabNavigationMenu+NavigationDrawer)
src/app/              Routes: / (frontpage), /allPosts (time blocks), /concepts (+/[tag]),
                      /library (+/[did]/[rkey]), /posts/[did]/[rkey], /users/[actor],
                      /new-post, /login, /oauth/*, /api/*
```

## Data model (standard.site lexicons)

| Concept | Record | Notes |
| --- | --- | --- |
| Post | `site.standard.document` (legacy: `pub.leaflet.document`) | linearDocument pages of typed blocks; site.standard wraps them in `content` and uses `site` instead of `publication` |
| Comment | `pub.leaflet.comment` | threaded via `reply.parent` |
| Vote/karma | `pub.leaflet.interactions.recommend` | positive-only; karma = count |
| Reaction | `pub.leaflet.comment` + `linearDocumentQuote` attachment | plaintext = react label (e.g. "Agreed"); UI maps label→icon via `reactionsByLabel` |
| Publication | `site.standard.publication` (legacy: `pub.leaflet.publication`) | the Library page; theme colors used on cards |
| Tag | `document.tags[]` | the Concepts page |

**Leaflet migrated to the `site.standard.*` lexicons** (same block model, new envelope) and kept the legacy records under the *same rkey*. Both shapes are normalized into the internal `LeafletDocument`/`LeafletPublication` shape at ingest (`normalizeDocument`/`normalizePublication` in `src/lib/leaflet/types.ts`); the site.standard record is canonical — indexing one supersedes the legacy row and re-points its votes/comments. `/posts/[did]/[rkey]` and `/library/[did]/[rkey]` URLs don't carry the collection, so `getPost`/`getPublication` try both at-uris. New posts authored here still write `pub.leaflet.document`.

Cosmetics from Simocracy: the frontpage walkers (`WalkingSims`) and the floating
Einstein feedback agent (`FloatingEinstein` + `POST /api/feedback` → local
`feedback` table) render daviddao.org's researcher sims — fetched from the
Simocracy indexer via `src/lib/sims.ts` (curated `RESEARCHER_NAMES` allowlist;
his roster also has animal pets). Sprites are `codexPet` sheets (1536x1872, 8x9
cells of 192x208, per-frame durations — the OpenAI hatch-pet contract) served
from the owner's PDS blobs; Einstein's sheet is bundled in `public/codex-pets/`.
Rendering is ported from simocracy-v2 (`lib/sprites/codex-pet.ts`,
`hooks/useLandingWalkingSims.ts`).

Quote anchors: the block renderer emits `data-block-idx` on each block; `SelectionToolbar` maps DOM selections to `{block: [i], offset}` positions so attachments are meaningful to other leaflet clients. The quoted text itself is kept in a local sidecar column (`comments.quoted_text`) since positions alone aren't renderable.

## Gotchas

- **`better-sqlite3` connection is cached on `globalThis`** — schema changes need a dev-server restart (hot reload keeps the old connection and skips new DDL).
- **`allowedDevOrigins: ["127.0.0.1"]`** in next.config.ts is required; without it Next blocks its own JS chunks and nothing hydrates.
- **OAuth in dev is a loopback client** (`http://localhost?redirect_uri=…`); `PUBLIC_URL` must match the URL you browse on (127.0.0.1:3457). In prod set `PUBLIC_URL=https://…` and metadata is served from `/client-metadata.json`.
- **Vercel deploys are demo-grade**: set `DATABASE_PATH=/tmp/forum.db` — the filesystem is ephemeral, so the index resets between cold starts and Jetstream doesn't run persistently. A real deployment needs a persistent host (Fly/Railway/VPS) or swapping SQLite for a hosted DB.
- **Deploys go through GitHub Actions, not the Vercel git integration.** The Vercel GitHub App is NOT installed on the `protocol` GitHub org (the Vercel team's GitHub connection is a different personal account), so `vercel git connect` fails and pushes alone do NOT deploy. `.github/workflows/deploy.yml` runs `vercel deploy --prod` on every push to `main` using the `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` repo secrets. Manual deploys: `npx vercel --prod` (project link in `.vercel/project.json`, team `protocol`). `NEXT_PUBLIC_SITE_NAME` is inlined at build time — changing it on Vercel requires a redeploy. If the Vercel GitHub App is ever installed on the org, delete the workflow in favor of the native integration.
- **Jetstream gates `site.standard.*` to known actors** (`isKnownActor` in
  `jetstream.ts`): the site.standard firehose is dominated by RSS-bridge spam
  (news mirrors, image boards, `*.web.brid.gy`) that would flood the frontpage.
  Genuine new authors enter the index via the backfill paths (profile/post
  visit, `/api/backfill`), which bypass the gate. Don't remove the gate without
  another spam strategy.
- The selection-toolbar palette's search input steals focus and collapses the browser selection — the toolbar snapshots the quote in state and guards `selectionchange` while the palette is open. Don't "simplify" that away.
- react icons are black SVGs: dark mode and the dark toolbar invert them via CSS `filter: invert(1)`.

## Testing changes

`npm run build` must pass. For visual checks, seed with the backfill above and compare against lesswrong.com — the standard is "indistinguishable at a glance".
