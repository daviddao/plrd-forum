import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Unknown /api/* paths return a structured RFC 9457 problem+json response —
 * never an HTML error page agents can't parse.
 */
function problem(req: NextRequest, status: number, title: string, detail: string, code: string) {
  return Response.json(
    {
      type: `https://plrd-forum.vercel.app/docs#errors`,
      title,
      status,
      detail,
      code,
      resolution:
        "See GET /openapi.json for the documented endpoints, or /docs for the human-readable API reference.",
      instance: req.nextUrl.pathname,
    },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );
}

async function handler(req: NextRequest) {
  return problem(
    req,
    404,
    "API route not found",
    `No API endpoint exists at ${req.nextUrl.pathname}.`,
    "api_route_not_found",
  );
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
