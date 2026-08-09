import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolveHandleToDid, getProfile, parseAtUri, blobUrl } from "@/lib/atproto/resolve";
import { getUserContent, getSubscriptionInfo } from "@/lib/queries";
import { getSessionDid } from "@/lib/auth/session";
import { SubscribeButton } from "@/components/SubscribeButton";
import { ProfileTabs, type ProfilePost, type ProfileComment } from "@/components/ProfileTabs";
import { Tooltip } from "@/components/Tooltip";
import { authorName, readableDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = { actor: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { actor } = await params;
  return { title: decodeURIComponent(actor) };
}

/** deterministic placeholder pick, like LW's DEFAULT_PREVIEWS + hashString */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
const DEFAULT_PREVIEWS = [
  "/profile-placeholder-1.png",
  "/profile-placeholder-2.png",
  "/profile-placeholder-3.png",
  "/profile-placeholder-4.png",
];

/**
 * Port of LessWrong's redesigned profile page (app/users/[slug]/ProfilePage):
 * centered ETBook name over a warm hairline, TOP POSTS magazine section
 * (featured 44px article + 3-card grid), then the tabbed POSTS/SEQUENCES/
 * COMMENTS list beside the sticky sidebar with bio and the karma-diamond
 * timeline grids.
 */
export default async function UserPage({ params }: { params: Promise<Params> }) {
  const { actor: rawActor } = await params;
  const actor = decodeURIComponent(rawActor);
  const did = await resolveHandleToDid(actor);
  if (!did) notFound();
  const profile = await getProfile(did);
  // Pull the actor's leaflet + site.standard records from their PDS (at most
  // once per TTL window). A plain "only when empty" check would strand users
  // whose index is partial — e.g. one record arrived via Jetstream while the
  // rest of the repo (or a newly-supported collection) was never fetched.
  const { backfillActorOnce } = await import("@/lib/ingest/backfill");
  await backfillActorOnce(did);
  const content = await getUserContent(did);
  const { posts, comments, publications, karma } = content;

  // subscribe target: the user's standard.site publication (legacy fallback)
  const viewerDid = await getSessionDid();
  const primaryPub =
    publications.find((p) => p.uri.includes("/site.standard.publication/")) ??
    publications[0] ??
    null;
  const subInfo = getSubscriptionInfo(
    publications.map((p) => p.uri),
    viewerDid,
  );

  const name = authorName(profile, did);

  const withImages: ProfilePost[] = posts.map((p) => ({
    uri: p.uri,
    did: p.did,
    rkey: p.rkey,
    title: p.title,
    publishedAt: p.publishedAt,
    karma: p.karma,
    excerpt: p.excerpt,
    imageUrl: p.coverImageCid ? blobUrl(profile?.pds ?? null, did, p.coverImageCid) : null,
  }));

  // top posts by karma (featured + 3 small), like UserProfileTopPostsSection
  const byKarma = [...withImages].sort(
    (a, b) => b.karma - a.karma || (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
  );
  const featured = byKarma[0];
  const smallPosts = byKarma.slice(1, 4);
  const previewImage = (p: ProfilePost) =>
    p.imageUrl ?? DEFAULT_PREVIEWS[hashString(p.uri) % DEFAULT_PREVIEWS.length];

  const profileComments: ProfileComment[] = comments.map((c) => {
    const target = parseAtUri(c.subject);
    return {
      uri: c.uri,
      subject: c.subject,
      plaintext: c.plaintext,
      facets: (c.facets as string | null) ?? null,
      quotedText: c.quotedText,
      createdAt: c.createdAt,
      karma: c.karma,
      postTitle: c.postTitle,
      href: target ? `/posts/${target.did}/${target.rkey}#comments` : "#",
    };
  });

  return (
    <>
      <div className="profile-underlay" aria-hidden="true" />
      <div className="profile-main">
        {/* ── header ── */}
        <header className="profile-header">
          <h1 className="profile-name">{name}</h1>
        </header>

        {/* ── TOP POSTS ── */}
        {featured && (
          <>
            <div className="profile-toplabel">Top Posts</div>
            <a href={`/posts/${featured.did}/${featured.rkey}`} className="top-article">
              <div className="top-article-content">
                <h2 className="top-article-title">{featured.title}</h2>
                <div className="top-article-summary-wrapper">
                  <p className="top-article-summary">{featured.excerpt}</p>
                </div>
                <div className="profile-metabar">
                  <Tooltip title="Karma score" placement="bottom">
                    <span className="profile-karma">{featured.karma}</span>
                  </Tooltip>
                  <span className="profile-date">{readableDate(featured.publishedAt)}</span>
                </div>
              </div>
              <div
                className="top-article-image"
                style={{ backgroundImage: `url("${previewImage(featured)}")` }}
              />
            </a>
            {smallPosts.length > 0 && (
              <div className="small-grid">
                {smallPosts.map((p) => (
                  <a key={p.uri} href={`/posts/${p.did}/${p.rkey}`} className="small-article">
                    <div
                      className="small-article-image"
                      style={{ backgroundImage: `url("${previewImage(p)}")` }}
                    />
                    <div className="small-article-content">
                      <h3 className="small-article-title">{p.title}</h3>
                      <div className="profile-metabar">
                        <span className="profile-karma">{p.karma}</span>
                        <span className="profile-date">{readableDate(p.publishedAt)}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── tabbed section + sidebar ── */}
        <section className="profile-columns">
          <ProfileTabs
            posts={withImages}
            publications={publications}
            comments={profileComments}
          />

          <aside className="profile-sidebar">
            <div className="sidebar-author-block">
              <h2 className="sidebar-author-name">{name}</h2>
              {primaryPub ? (
                <SubscribeButton
                  publication={primaryPub.uri}
                  initialSubscribed={subInfo.mine.has(primaryPub.uri)}
                  initialCount={subInfo.counts.get(primaryPub.uri) ?? 0}
                />
              ) : (
                profile?.handle && (
                  <a
                    href={`https://bsky.app/profile/${profile.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sidebar-action"
                  >
                    Follow on Bluesky
                  </a>
                )
              )}
            </div>
            {profile?.description && <p className="sidebar-bio">{profile.description}</p>}

            {/* ── POSTS diamond timeline ── */}
            {withImages.length > 0 && (
              <div className="diamonds-section">
                <div className="diamonds-header">
                  <div className="diamonds-title">
                    Posts <span className="count">({withImages.length.toLocaleString()})</span>
                  </div>
                </div>
                <div className="diamonds-grid">
                  {withImages.map((p) => (
                    <a
                      key={p.uri}
                      href={`/posts/${p.did}/${p.rkey}`}
                      className="diamond"
                      title={`${p.title} · ${p.karma} karma`}
                      style={{ opacity: 0.2 + 0.8 * Math.min(p.karma / 100, 1) }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── COMMENTS diamond timeline ── */}
            {profileComments.length > 0 && (
              <div className="diamonds-section">
                <div className="diamonds-header">
                  <div className="diamonds-title">
                    Comments <span className="count">({profileComments.length.toLocaleString()})</span>
                  </div>
                </div>
                <div className="diamonds-grid">
                  {profileComments.map((c) => (
                    <a
                      key={c.uri}
                      href={c.href}
                      className="diamond"
                      title={`${c.postTitle ?? "comment"} · ${c.karma} karma`}
                      style={{ opacity: 0.2 + 0.8 * Math.min(c.karma / 100, 1) }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* karma total, kept subtle */}
            <div className="diamonds-section">
              <div className="diamonds-header">
                <div className="diamonds-title">
                  Karma <span className="count">({karma.toLocaleString()})</span>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </>
  );
}
