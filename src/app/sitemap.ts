import type { MetadataRoute } from "next";
import { getFrontpagePosts } from "@/lib/queries";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.PUBLIC_URL?.startsWith("https") ? process.env.PUBLIC_URL : undefined) ??
  "https://plrd-forum.vercel.app";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/allPosts",
    "/concepts",
    "/library",
    "/about",
    "/contact",
    "/privacy",
    "/docs",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path === "/allPosts" ? "hourly" : "weekly",
    priority: path === "" ? 1 : 0.6,
  }));

  let posts: MetadataRoute.Sitemap = [];
  try {
    const recent = await getFrontpagePosts(500);
    posts = recent.map((p) => ({
      url: `${SITE_URL}/posts/${p.did}/${p.rkey}`,
      lastModified: p.publishedAt ? new Date(p.publishedAt) : undefined,
      changeFrequency: "daily",
      priority: 0.8,
    }));
  } catch {
    // ephemeral index unavailable — static routes still listed
  }

  return [...staticRoutes, ...posts];
}
