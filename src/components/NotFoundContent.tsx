import Link from "next/link";

export function NotFoundContent() {
  return (
    <div className="mx-auto mt-12 max-w-[560px]">
      <div className="lw-card px-8 py-10">
        <h1 className="serif-title pb-1 text-[26px]">404: page not found</h1>
        <p className="pb-6 text-[14px] text-text-dim3">
          There is no page at this address. Nothing was deleted; the path does
          not exist. Try one of these instead:
        </p>
        <ul className="list-disc pl-6 text-[14.5px] leading-[1.9]">
          <li>
            <Link href="/" className="text-link">
              Home
            </Link>
            : the frontpage, ranked by karma
          </li>
          <li>
            <Link href="/allPosts" className="text-link">
              All Posts
            </Link>
            : everything chronologically
          </li>
          <li>
            <Link href="/concepts" className="text-link">
              Concepts
            </Link>
            : posts grouped by tag
          </li>
          <li>
            <Link href="/library" className="text-link">
              Library
            </Link>
            : publications (blogs)
          </li>
          <li>
            <Link href="/about" className="text-link">
              About
            </Link>{" "}
            ·{" "}
            <Link href="/contact" className="text-link">
              Contact
            </Link>{" "}
            ·{" "}
            <Link href="/privacy" className="text-link">
              Privacy
            </Link>
          </li>
          <li>
            <Link href="/docs" className="text-link">
              /docs
            </Link>
            : developer and agent resources (API, OpenAPI, MCP)
          </li>
        </ul>
      </div>
    </div>
  );
}
