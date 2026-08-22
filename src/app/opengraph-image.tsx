import { ImageResponse } from "next/og";

export const alt = "PLRD Forum — a LessWrong-style forum built on ATProto";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          background: "#f8f4ee",
          color: "#2b2a28",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontSize: 96,
            fontWeight: 700,
            fontFamily: "Georgia, serif",
          }}
        >
          <span style={{ color: "#327E09" }}>PL R&D</span>
          <span style={{ marginLeft: 24 }}>Forum</span>
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 34,
            color: "#6b6a66",
            fontFamily: "Georgia, serif",
          }}
        >
          A LessWrong-style forum built on ATProto
        </div>
      </div>
    ),
    size,
  );
}
