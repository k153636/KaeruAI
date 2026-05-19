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
          background: "#09090b",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 80px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle glow */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 60%)",
          display: "flex",
        }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="2" y="7" width="13" height="11" rx="2" stroke="white" strokeWidth="1.5" />
          </svg>
          <span style={{ color: "white", fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px" }}>CaeruAI</span>
        </div>

        {/* Main headline */}
        <div style={{ display: "flex", flexDirection: "column", marginBottom: 24 }}>
          <span style={{ color: "white", fontSize: 52, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-1px" }}>
            あなただけの企画を、
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
            <span style={{ color: "white", fontSize: 52, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-1px", borderBottom: "4px solid white", paddingBottom: 2 }}>
              CaeruAI
            </span>
            <span style={{ color: "white", fontSize: 52, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-1px" }}>
              が生成する。
            </span>
          </div>
        </div>

        {/* Sub */}
        <p style={{ color: "#a1a1aa", fontSize: 24, margin: "0 0 48px 0", fontWeight: 400 }}>
          あなたのジャンル・動機・スタイルを踏まえて、CaeruAIが企画を5つ生成する。
        </p>

        {/* Tags */}
        <div style={{ display: "flex", gap: 12 }}>
          {["登録不要", "無料", "2問から使える"].map((t) => (
            <div key={t} style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 100,
              padding: "8px 20px",
              color: "rgba(255,255,255,0.7)",
              fontSize: 18,
              fontWeight: 500,
            }}>{t}</div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
