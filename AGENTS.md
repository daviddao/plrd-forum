# Working on Open Lab

Instructions for coding agents. Start with [README.md](README.md) for the product, setup, and deployment constraints.

## Before changing anything

1. Run `git status --short` and inspect the relevant files. Do not overwrite another person's work.
2. Read the relevant Next.js guide under `node_modules/next/dist/docs/`. This app uses Next.js 16 and Tailwind 4.
3. Keep the requested change narrow. Do not publish PDS records, send verification emails, change production data, or deploy without authorization.
4. Never print credentials, session cookies, OAuth callback parameters, or authorization URLs containing email hints.
5. Keep `.env.local`, `.vercel/`, database files, private keys, and local auth state out of Git. Only `.env.example` is a tracked environment file.

## Commands and acceptance checks

```bash
npm ci
npm run dev
npm run build
npx tsc --noEmit
npm test
npm run lint
LOGIN_TEST_BASE_URL=http://127.0.0.1:3457 npm run test:login
```

- Use `http://127.0.0.1:3457`, matching `PUBLIC_URL`. Do not substitute `localhost` during OAuth testing.
- Run the production build before committing. Report existing lint failures separately; do not suppress them to get a green result.
- `npm test` checks the required session secret. Login tests need a running server, internet access, and `EPDS_URL` configured.
- Login tests stop at redirects. The ePDS login page can automatically send an OTP when its JavaScript runs. Do not open an email-prefilled provider URL in an automated browser without permission to send the code.
- Use a separate browser session and port for visual checks. Check light/dark themes and desktop/mobile sizes. Keep screenshots below 1500px tall.
- Verify the actual production alias after an authorized deployment. A successful upload alone is not verification.

Public seed content:

```bash
curl -X POST http://127.0.0.1:3457/api/backfill \
  -H 'Content-Type: application/json' \
  -d '{"actor":"plrd.org"}'
```

Backfill indexes existing records. Never republish an imported article just to repair the local index.

## Design rules

**Two sources of truth. Port from them; do not eyeball.**

- **Layout and reading metrics** come from [ForumMagnum](https://github.com/ForumMagnum/ForumMagnum), usually under `packages/lesswrong/components/`. Read the `defineStyles` values, port them, and annotate CSS with the source filename. Reference files include `lesswrongTheme.ts`, `defaultPalette.ts`, `stylePiping.ts`, `LWPostsItem.tsx`, and `FixedPositionToC.tsx`.
- **Colour, type, buttons, and the sign-in screen** come from the Open Lab design at `https://open-lab-two.vercel.app/lab/`. Pull its compiled CSS (`.open-lab`, `.lab-login*`, `.lab-button*`, `.lab-header*`) and port the values. The `--lab-*` tokens in `globals.css` are that palette; the `--lw-*` names are kept as aliases so ForumMagnum-derived rules keep working.

| Element | Existing convention |
| --- | --- |
| Palette | Paper `#f8f7f3`, card `#fdfcf9`, ink `#17191a`, muted `#626660`, line `#d9dcd5`, blue `#0969ce`, soft `#eaf1f6` |
| Dark palette | Paper `#161a1c`, card `#1d2225`, ink `#eeeee5`, muted `#b0b8b5`, line `#394348`, blue `#83bdff`, soft `#25343e`, toggled through `.dark` |
| UI font | Aileron (bundled in `public/fonts/`); base UI size 15.08px |
| Headings | Newsreader via `next/font/google`, exposed as `--font-newsreader` |
| Post text | Warnock Pro when Typekit is configured, otherwise Newsreader; 18.2px with 26px leading |
| Adobe fonts | Optional `NEXT_PUBLIC_TYPEKIT_ID`; do not bundle commercial fonts |
| Cards | Hairline `--lab-line` border, 4px radius, no drop shadow |
| Post rows | Card background, 1px line separator, 16.9px serif titles, 14.3px metadata |
| Sign-in | `/login` renders outside the shell; `.lab-login` is a 1:1 port with its own `--login-*` tokens |
| Brand | `src/lib/site.ts` holds the name, organisation, URLs, and taglines. Never hardcode "Open Lab" in a page |

Keep the background static. Walking sim avatars were removed because they distracted from reading. Preserve the separate Einstein feedback widget unless its removal is requested.

## Architecture map

| Path | Responsibility |
| --- | --- |
| `src/app/layout.tsx` | Root layout: fonts, theme bootstrap, metadata. No chrome |
| `src/app/(shell)/` | Every page that gets the header, nav rail, and Einstein widget via `AppShell` |
| `src/app/login/` | Standalone sign-in screen outside the shell |
| `src/app/not-found.tsx` | Root 404 for unmatched URLs; wraps `NotFoundContent` in `AppShell` itself |
| `src/app/api/`, `src/app/oauth/` | JSON API, discovery endpoints, and OAuth routes |
| `src/proxy.ts` | Rate-limit headers for `/api`, markdown content negotiation, `Vary: Accept` (Next 16 proxy, formerly middleware) |
| `src/lib/site.ts` | Site name, organisation, URLs, taglines |
| `src/components/` | ForumMagnum-derived UI, editor, tooltips, and navigation |
| `src/lib/auth/client.ts` | Shared ATProto `NodeOAuthClient` and provider-host corrections |
| `src/lib/auth/secret.ts` | Required session-encryption secret; no default |
| `src/lib/auth/cookie-stores.ts` | Encrypted, chunked OAuth state and session cookies |
| `src/lib/auth/session.ts` | DID session and authenticated ATProto agent |
| `src/lib/db/` | SQLite, Drizzle schema, bootstrap DDL, and incremental ALTERs |
| `src/lib/ingest/` | Record indexing/deletion, actor backfill, Jetstream, and hydration |
| `src/instrumentation.ts` | Starts ingestion and awaits seeding of an empty index |
| `src/lib/queries.ts` | Read queries, post lookup, and profile/publication summaries |
| `src/lib/leaflet/` | Lexicon normalization, block rendering, facets, editor conversion, and heading anchors |
| `src/lib/reactions.ts` | Named reactions; assets live in `public/reactionImages/` |
| `scripts/` | Session-secret and HTTP login checks |

Main routes are `/`, `/allPosts`, `/concepts`, `/library`, `/posts/[did]/[rkey]`, `/users/[actor]`, `/new-post`, and `/login`.

## Data contracts

The author's PDS is the source of published content. SQLite is a derived index. Some local sidecars, including feedback and captured quote text, are not PDS records.

| Concept | Write format | Compatibility |
| --- | --- | --- |
| Post | `site.standard.document` | Read legacy `pub.leaflet.document` too |
| Publication | `site.standard.publication` | Read legacy `pub.leaflet.publication` too |
| Post recommendation | `site.standard.graph.recommend` | Read legacy `pub.leaflet.interactions.recommend` too |
| Comment | `pub.leaflet.comment` | Thread through `reply.parent` |
| Comment vote | `pub.leaflet.interactions.recommend` | No standard.site comment-vote replacement here |
| Follow | `site.standard.graph.subscription` | References a publication |
| Quote reaction | `pub.leaflet.comment` with a quote attachment | Plaintext is the named reaction label |
| Topic | `document.tags[]` | Indexed into the Concepts view |

Rules to preserve:

- Standard.site documents wrap Leaflet pages inside `content` and use `site` instead of `publication`.
- `normalizeDocument` and `normalizePublication` produce the internal shape. Standard.site records supersede legacy records with the same DID and rkey, repointing votes and comments.
- Post and publication URLs omit the collection. Lookups must continue trying both collection names.
- A standard.site document needs a parent publication. The authoring endpoint creates one if needed.
- Recommendations are positive-only. The standard record references `.document`; the legacy record references `.subject`.
- Constellation hydration also reads standard.site recommendation backlinks.
- Do not invent new lexicons when an existing record type fits. Schema changes need a compatibility plan for existing PDS data.
- A new public import must preserve the byline, source URL, publication date, and image attribution. Check for an existing record before creating one.

## Authentication and privacy

- Email is the primary form. ATProto handle login is a collapsible alternative.
- `EPDS_URL` selects the email provider. The hosted forum uses `https://certified.one`.
- `/oauth/login` authorizes the ePDS service URL, then adds `login_hint` and `prompt=login` to the authorization redirect. This follows the Simocracy integration and avoids silently selecting another account's existing provider session.
- Both login methods share the SDK callback and DID session. Legacy form submissions containing only `handle` must continue working.
- Redirect POSTed login forms with **303**, not 307. A 307 replays the POST to the provider and breaks its CSRF checks.
- `SESSION_SECRET` must be a random value of at least 32 characters. The DID session and OAuth cookies use the same configured secret. Never restore a shared fallback password.
- Keep token/state storage in encrypted cookies for serverless compatibility. A token stored in one lambda's SQLite file is unavailable to another lambda.
- Cookie writes from read-only React Server Component renders can fail; token refresh remains in memory until a writable request persists it.
- `PUBLIC_URL` must match the visited origin. Loopback development uses the SDK's `http://localhost?redirect_uri=...` client ID; production serves `/client-metadata.json`.
- `NEXT_PUBLIC_*` values are public. Never put credentials in them.

## UI regressions to avoid

- **Table of contents:** keep row heights content-sized and the rail scrollable, as in ForumMagnum's `rowWrapper` and `stickyBlockScroller`. `min-height: 0` on rows crushes nearby labels into each other. Do not line-clamp away headings.
- **Heading anchors:** the renderer and ToC share the underscore-based `headingAnchor` scheme in `src/lib/leaflet/toc.ts`. Duplicate headings need unique anchors.
- **Selection toolbar:** palette search steals focus and collapses the browser selection. Preserve the snapshotted quote and the `selectionchange` guard while the palette is open.
- **Quote positions:** rendered blocks expose `data-block-idx`; selection offsets map to Leaflet quote positions. Captured quote text is kept in a local sidecar because positions alone cannot render it.
- **Link previews:** external hosts may block image embedding or return dead URLs. Hide failed images and retain the text card. Do not proxy arbitrary URLs without an SSRF review.
- **Reaction icons:** black SVGs need inversion in dark mode and on the dark selection toolbar.
- **Navigation:** post pages use the reading rail instead of the main sidebar. Preserve mobile menu behavior.
- **Layered CSS:** Tailwind utilities live in `@layer utilities`; the hand-written rules in `globals.css` are unlayered and win regardless of specificity. Never set `display` in a component class that also needs responsive `hidden sm:flex` utilities.

## Ingestion and deployment constraints

- The `better-sqlite3` connection is cached on `globalThis`. Restart the dev server after schema changes; hot reload may skip new bootstrap DDL.
- Keep `allowedDevOrigins: ["127.0.0.1"]` in `next.config.ts` so development chunks hydrate correctly.
- Jetstream admits live events only when they extend what the index already knows: documents and publications from known actors, comments and recommends whose subject post is indexed, subscriptions to indexed publications. Both `pub.leaflet.*` and `site.standard.*` are covered. Do not loosen this without a replacement; the public firehose is mostly RSS bridges, SEO spam, and test posts. Explicit backfill, `SEED_ACTORS`, profile visits, post visits, and the authoring endpoints are the entry paths for new authors.
- `SEED_ACTORS` is a comma-separated list. Startup awaits seeding before accepting requests when the index is empty. Fire-and-forget seeding can be suspended on Vercel before it completes.
- Vercel uses ephemeral `/tmp` storage. It is suitable for the demo, not a durable SQLite index or persistent Jetstream worker. Local feedback needs persistent hosting if it must survive restarts.
- The optional Actions deploy job needs all three repository secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`. Without them it skips deployment. Do not copy credentials between repositories.
- For manual deploys, inspect the ignored `.vercel/project.json` and use the correct team scope. Do not relink someone else's production project to a new account.
- `NEXT_PUBLIC_*` changes require a rebuild. Verify deployment logs and the production alias rather than assuming a push deployed successfully.

## Git and public releases

The public repository is `https://github.com/daviddao/plrd-forum`. Existing checkouts may retain a separate `protocol/plrd-forum` remote. Inspect `git remote -v` and push only to the authorized target. Never force-push or rewrite shared history without approval.

Before a public release:

```bash
git status --short
git diff --cached --check
gitleaks git --redact --log-opts="--all" .
```

Also review the staged tree and filenames. Automated scanning is not a guarantee. Do not include live database exports, OAuth state, email addresses from private records, or unrelated workspace files. Secret variable names and public service URLs are safe to document; actual credentials are not.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
