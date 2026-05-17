import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KaeruAI",
    short_name: "KaeruAI",
    description: "気分を一言入れるだけで、あなた専用の企画を5つ即生成",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#ef4444",
    orientation: "portrait",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
