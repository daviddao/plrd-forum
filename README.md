# PLRD Forum

A faithful port of [LessWrong](https://www.lesswrong.com)'s ([ForumMagnum](https://github.com/ForumMagnum/ForumMagnum)) visual design as a clean **Next.js 16 + Tailwind 4** app, with **ATProto OAuth** for auth and the **[standard.site](https://standard.site) lexicons** (`site.standard.*`, as published by [leaflet.pub](https://leaflet.pub)) as the data layer — legacy `pub.leaflet.*` records are indexed too.

## What's exact about the style

Every value is ported from ForumMagnum source, not eyeballed:

- Palette: `#f8f4ee` bg, `#5f9b65` green, `#327E09` links (`defaultPalette.ts`, `lesswrongTheme.ts`)
- Fonts: the exact Calibri/Gill Sans + warnock-pro/Palatino + ETBookRoman stacks (ET Book self-loaded; set `NEXT_PUBLIC_TYPEKIT_ID` for warnock-pro/gill-sans-nova via Adobe Fonts)
- Posts list: `LWPostsItem` — 16.9px warnock titles, 14.3px grey meta, 2px hairline separators, comment-bubble icon with overlaid count
- Post body: `stylePiping.ts postBodyStyles` — 18.2/26px serif, display0/1/2 headings, dotted `•••` hr, LW code blocks & blockquotes
- Comments: `CommentFrame` borders (`rgba(72,94,144,.16)`), nested indent rules, `CommentsItemMeta` layout
- Vote arrows: the exact `VoteArrowIconHollow` SVG
- Tooltips: MuiTooltip-style bubbles + the LW hover-preview card (`LWPostsPreviewTooltip`, 400px, excerpt fade)
- Dark mode: ForumMagnum's HSL-lightness inversion

## Data model (standard.site lexicons)

| Forum concept | Lexicon |
| --- | --- |
| Post | `site.standard.document` (linearDocument pages/blocks in `content`; legacy `pub.leaflet.document` still indexed) |
| Publication | `site.standard.publication` (legacy `pub.leaflet.publication` still indexed) |
| Comment | `pub.leaflet.comment` (threaded via `reply.parent`) |
| Upvote/karma | `site.standard.graph.recommend` (legacy `pub.leaflet.interactions.recommend` still indexed; comment votes stay legacy) |
| Follow | `site.standard.graph.subscription` |

Leaflet migrated documents/publications to `site.standard.*` keeping the same rkeys; both shapes are normalized at ingest and the `site.standard` record supersedes its legacy twin. All writes go to the logged-in user's own PDS. A SQLite index (Drizzle) aggregates the network via a **Jetstream** listener (`src/lib/ingest/jetstream.ts`, started by `instrumentation.ts`) plus on-demand backfill (`POST /api/backfill {"actor":"handle"}`).

## Run

```bash
npm install
npm run dev   # http://127.0.0.1:3457
```

`.env.local`: `SESSION_SECRET`, `PUBLIC_URL` (loopback OAuth in dev; set your https URL in prod), optional `NEXT_PUBLIC_TYPEKIT_ID`, `NEXT_PUBLIC_SITE_NAME`.

Set `SEED_ACTORS=plrd.org` locally and in production to load PL R&D's published
ATProto articles into an empty index before the first request. This only reads
existing PDS records; it does not publish or duplicate posts.
