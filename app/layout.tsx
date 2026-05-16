import type { Metadata, Viewport } from "next";
import "./globals.css";
import PageTransition from "@/components/PageTransition";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://kaeruai.vercel.app"),
  title: "YouTuber企画メーカー",
  description: "今日の気分から企画を5つ生成するYouTuber向けツール",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "企画メーカー",
  },
  openGraph: {
    title: "YouTuber企画メーカー",
    description: "今日の気分から、企画を5つ生成。YouTuber専用AIツール。",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ef4444",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full"><PageTransition>{children}</PageTransition></body>
    </html>
  );
}
