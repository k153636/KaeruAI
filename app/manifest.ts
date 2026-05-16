import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "YouTuber企画メーカー",
    short_name: "企画メーカー",
    description: "今日の気分から企画を5つ生成するYouTuber向けツール",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#ef4444",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
