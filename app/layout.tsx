import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YouTuber企画メーカー",
  description: "気分から企画を5つ生成するYouTuber向けツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
