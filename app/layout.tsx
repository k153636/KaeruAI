import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import PageTransition from "@/components/PageTransition";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto",
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://caeruai.vercel.app"),
  title: "CaeruAI",
  description: "気分を一言入れるだけで、あなた専用の企画を5つ即生成",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "CaeruAI",
  },
  openGraph: {
    title: "CaeruAI",
    description: "気分を一言入れるだけで、あなた専用の企画を5つ即生成",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`h-full dark ${inter.variable} ${notoSansJP.variable}`}>
      <body className="min-h-full"><PageTransition>{children}</PageTransition><Analytics /></body>
    </html>
  );
}
