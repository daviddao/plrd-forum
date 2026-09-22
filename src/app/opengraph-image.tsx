import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_ORG, SITE_TAGLINE_SHORT } from "@/lib/site";

export const alt = `${SITE_NAME}: ${SITE_TAGLINE_SHORT}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* Open Lab light tokens: paper #f8f7f3, ink #17191a, muted #626660, blue #0969ce */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8f7f3",
          color: "#17191a",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 108,
            fontWeight: 400,
            fontFamily: "Georgia, serif",
            letterSpacing: "-0.03em",
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 22,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#0969ce",
            fontWeight: 700,
          }}
        >
          {`By ${SITE_ORG}`}
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 30,
            color: "#626660",
            maxWidth: 820,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          {SITE_TAGLINE_SHORT}
        </div>
      </div>
    ),
    size,
  );
}
