/**
 * Open Graph metadata fetcher for link hover previews. Given an external
 * URL, fetch the page (bounded: 5s timeout, HTML only, 300KB scan) and
 * extract og:/twitter:/plain metadata for the preview card.
 */

export type WebsitePreviewData = {
  kind: "website";
  url: string;
  domain: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
};

/** SSRF guard: refuse local/private hosts. */
function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return true;
  // IPv6 literal
  if (h.includes(":")) return true;
  // IPv4 literal in private/reserved ranges
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
    return false; // public IP literal — allow
  }
  return false;
}

function metaContent(html: string, patterns: string[]): string | null {
  for (const name of patterns) {
    // property/name in either attribute order
    const re1 = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`,
      "i",
    );
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`,
      "i",
    );
    const m = html.match(re1) ?? html.match(re2);
    if (m?.[1]) return decodeEntities(m[1]);
  }
  return null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x?27;|&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

export async function fetchWebsitePreview(
  rawUrl: string,
): Promise<WebsitePreviewData | null> {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (isPrivateHost(u.hostname)) return null;

  try {
    const res = await fetch(u, {
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "Mozilla/5.0 (compatible; plrd-forum-link-preview/1.0)",
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html")) return null;
    const html = (await res.text()).slice(0, 300_000);

    const title =
      metaContent(html, ["og:title", "twitter:title"]) ??
      (decodeEntities(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? "") ||
        null);
    const description = metaContent(html, [
      "og:description",
      "twitter:description",
      "description",
    ]);
    let image = metaContent(html, ["og:image", "twitter:image"]);
    if (image && !/^https?:\/\//.test(image)) {
      try {
        image = new URL(image, res.url || rawUrl).toString();
      } catch {
        image = null;
      }
    }
    const siteName = metaContent(html, ["og:site_name"]);

    if (!title && !description) return null;
    return {
      kind: "website",
      url: rawUrl,
      domain: u.hostname,
      title,
      description,
      image,
      siteName,
    };
  } catch {
    return null;
  }
}
