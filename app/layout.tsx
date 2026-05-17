import type { Metadata, Viewport } from "next";
import "./globals.css";
import PageTransition from "@/components/PageTransition";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://kaeruai.vercel.app"),
  title: "KaeruAI",
  description: "気分を一言入れるだけで、あなた専用の企画を5つ即生成",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KaeruAI",
  },
  openGraph: {
    title: "KaeruAI",
    description: "気分を一言入れるだけで、あなた専用の企画を5つ即生成",
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
    <html lang="ja" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');else if(!t||t==='system'){if(window.matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.classList.add('dark')}}catch(e){}` }} />
      </head>
      <body className="min-h-full"><PageTransition>{children}</PageTransition></body>
    </html>
  );
}
