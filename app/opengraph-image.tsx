import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#0a0a0a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <path d="M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="2" y="7" width="13" height="11" rx="2" stroke="#ef4444" strokeWidth="1.5" />
          </svg>
          <span style={{ color: "#ef4444", fontSize: 48, fontWeight: 700 }}>KaeruAI</span>
        </div>
        <p style={{ color: "#f0f0f0", fontSize: 32, fontWeight: 700, margin: 0 }}>
          気分を一言入れるだけで、あなた専用の企画を5つ即生成
        </p>
        <p style={{ color: "#71717a", fontSize: 20, marginTop: 16 }}>
          AIがあなたの本質を理解して提案
        </p>
      </div>
    ),
    { ...size }
  );
}
