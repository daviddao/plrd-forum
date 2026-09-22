/**
 * Single source of truth for the site identity. Every page, API description,
 * OAuth client name, and JSON-LD block reads from here so a rename is one edit.
 *
 * NEXT_PUBLIC_* values are inlined at build time and are safe to expose.
 */

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Open Lab";

/** Short organisation label shown under the wordmark ("BY PL R&D"). */
export const SITE_ORG = "PL R&D";
export const SITE_ORG_NAME = "Polaris Labs R&D";
export const SITE_ORG_URL = "https://www.plrd.org";
export const SITE_CONTACT_EMAIL = "research@protocol.ai";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.PUBLIC_URL?.startsWith("https") ? process.env.PUBLIC_URL : undefined) ??
  "https://plrd-forum.vercel.app";

export const SITE_TAGLINE =
  `${SITE_NAME} is a reading and discussion space for PL R&D and its collaborators, built on ATProto and the standard.site lexicons. Every post, comment, vote, and reaction is a record in the author's own data repository.`;

export const SITE_TAGLINE_SHORT =
  "A research discussion space built on ATProto. Posts, comments, votes, and reactions live in your own PDS.";

/** Kebab-case identifier for user agents, MCP server names, and similar. */
export const SITE_SLUG = "open-lab";
