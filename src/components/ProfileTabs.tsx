"use client";

import Link from "next/link";
import { useState } from "react";
import type { PublicationListItem } from "@/lib/queries";
import { LibraryCard } from "./LibraryCard";
import { RichText } from "@/lib/leaflet/richtext";
import type { Facet } from "@/lib/leaflet/types";
import { timeAgo, readableDate } from "@/lib/format";

export type ProfilePost = {
  uri: string;
  did: string;
  rkey: string;
  title: string;
  publishedAt: string | null;
  karma: number;
  excerpt: string;
  imageUrl: string | null;
};

export type ProfileComment = {
  uri: string;
  subject: string;
  plaintext: string;
  facets: string | null;
  quotedText: string | null;
  createdAt: string;
  karma: number;
  postTitle: string | null;
  href: string;
};


/**
 * Port of ProfilePageTabbedSection: POSTS | SEQUENCES | COMMENTS tab bar
 * with the AllPostsTab list styling.
 */
export function ProfileTabs({
  posts,
  publications,
  comments,
}: {
  posts: ProfilePost[];
  publications: PublicationListItem[];
  comments: ProfileComment[];
}) {
  const [tab, setTab] = useState<"posts" | "sequences" | "comments">("posts");

  return (
    <div className="profile-left">
      <nav className="profile-tabs">
        <button className={`profile-tab ${tab === "posts" ? "active" : ""}`} onClick={() => setTab("posts")}>
          Posts
        </button>
        <button
          className={`profile-tab ${tab === "sequences" ? "active" : ""}`}
          onClick={() => setTab("sequences")}
        >
          Sequences
        </button>
        <button
          className={`profile-tab ${tab === "comments" ? "active" : ""}`}
          onClick={() => setTab("comments")}
        >
          Comments
        </button>
      </nav>

      {tab === "posts" && (
        <div className="flex flex-col pt-3">
          {posts.length === 0 && <p className="text-[13px] text-text-dim">No posts to display.</p>}
          {posts.map((post) => (
            <Link key={post.uri} href={`/posts/${post.did}/${post.rkey}`} className="list-article">
              <div className="list-article-body">
                <div className="list-article-text">
                  <h3 className="list-article-title">{post.title}</h3>
                  {post.excerpt && <p className="list-article-summary">{post.excerpt}</p>}
                  <div className="list-article-meta">
                    <span className="list-date">{readableDate(post.publishedAt)}</span>
                    <span className="list-meta-divider" aria-hidden="true">
                      •
                    </span>
                    <span className="list-karma" title="Karma score">
                      {post.karma}
                    </span>
                  </div>
                </div>
                {post.imageUrl && (
                  <div
                    className="list-article-image"
                    style={{ backgroundImage: `url("${post.imageUrl}")` }}
                  />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === "sequences" && (
        <div className="grid grid-cols-1 gap-3 pt-3 sm:grid-cols-2">
          {publications.length === 0 && (
            <p className="text-[13px] text-text-dim">No sequences to display.</p>
          )}
          {publications.map((pub) => (
            <LibraryCard key={pub.uri} pub={pub} />
          ))}
        </div>
      )}

      {tab === "comments" && (
        <div className="pt-3">
          {comments.length === 0 && <p className="text-[13px] text-text-dim">No comments to display.</p>}
          {comments.map((c) => (
            <div key={c.uri} className="list-article">
              <Link href={c.href} className="list-article-title !text-[16px] no-underline">
                {c.postTitle ?? "a post"}
              </Link>
              {c.quotedText && (
                <div className="comment-quote mt-2">
                  {c.quotedText.length > 200 ? c.quotedText.slice(0, 200) + "…" : c.quotedText}
                </div>
              )}
              <div className="comment-body mt-1.5">
                <p>
                  <RichText
                    text={c.plaintext}
                    facets={c.facets ? (JSON.parse(c.facets) as Facet[]) : null}
                  />
                </p>
              </div>
              <div className="list-article-meta mt-2">
                <span className="list-date">{readableDate(c.createdAt)}</span>
                <span className="list-meta-divider" aria-hidden="true">
                  •
                </span>
                <span className="list-karma">{c.karma}</span>
                <span className="list-meta-divider" aria-hidden="true">
                  •
                </span>
                <span className="list-date" style={{ textTransform: "none" }}>
                  {timeAgo(c.createdAt)} ago
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
