"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadProfile } from "@/lib/profile";
import { IconCamera, IconSparkle } from "@/components/icons";
import ThemeToggle from "@/components/ThemeToggle";
import FadeUp from "@/components/FadeUp";

function IconCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const profile = loadProfile();
    if (profile) {
      router.replace("/main");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-6 h-6 border-2 border-zinc-300 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-lg">
          <IconCamera size={22} />
          <span>KaeruAI</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle size={15} />
          <button
            onClick={() => router.push("/setup")}
            className="text-sm font-medium text-zinc-900 dark:text-white hover:opacity-60 transition-opacity cursor-pointer"
          >
            はじめる →
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 pt-16 pb-24">

        {/* Hero */}
        <FadeUp delay={0} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-full px-4 py-1.5 text-xs text-zinc-900 dark:text-white font-medium mb-8">
            <IconSparkle size={12} />
            <span>2段階AIで企画の質が変わる</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white leading-tight mb-6">
            あなただけの企画が、<br />
            今すぐ生まれる。
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed mb-10 max-w-lg mx-auto">
            KaeruAIはプロフィールを読んで、<br className="hidden sm:block" />
            そのクリエイターにしか作れない企画を提案します。<br />
            「〇〇してみた」ではなく、あなたの言葉で。
          </p>
          <button
            onClick={() => router.push("/setup")}
            className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white font-bold text-base px-8 py-4 rounded-2xl border border-red-600 transition-colors cursor-pointer"
          >
            <IconSparkle size={18} />
            無料で企画を生成する
            <IconArrowRight size={16} />
          </button>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">登録不要・2問答えるだけでスタート</p>
        </FadeUp>

        {/* Feature cards */}
        <FadeUp delay={80} className="grid gap-4 sm:grid-cols-3 mb-16">
          {[
            {
              icon: "✦",
              title: "2段階AI",
              desc: "生成→批評→改善の2ステップで、弱い企画を徹底的に書き直す。",
            },
            {
              icon: "◎",
              title: "あなた専用",
              desc: "プロフィールの複数の要素が「交差する地点」から企画を発想する。",
            },
            {
              icon: "→",
              title: "即実践",
              desc: "フック・サムネイル案・制作手順まで一括生成。作るだけでいい。",
            },
          ].map((f) => (
            <div key={f.title} className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-3xl p-5">
              <div className="text-2xl mb-3 text-zinc-900 dark:text-white">{f.icon}</div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-sm mb-2">{f.title}</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </FadeUp>

        {/* Example idea */}
        <FadeUp delay={140} className="mb-16">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider mb-4">生成例</p>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-3xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-zinc-500 dark:text-zinc-400 font-bold text-lg leading-none mt-0.5 shrink-0">1</span>
              <div>
                <h4 className="text-zinc-900 dark:text-white font-bold text-base mb-2 leading-tight">
                  バイブコーディングで書いたコードをドレミに変換したら、なぜか悲しい曲になった
                </h4>
                <p className="text-zinc-900 dark:text-white text-sm leading-relaxed">
                  Cマイナーのコードを書くつもりだったのに、デバッグしながら聴いたら葬送行進曲になっていた。偶然性と意図の境界線が曖昧になる瞬間を、コード画面と音声を同時に映して記録する。
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-700">
              {["コーダー × 音楽好き", "考察フォーマット", "フック付き"].map((tag) => (
                <span key={tag} className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs text-zinc-900 dark:text-white">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </FadeUp>

        {/* Checklist */}
        <FadeUp delay={200} className="mb-16">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-3xl p-6">
            <h3 className="font-bold text-zinc-900 dark:text-white text-base mb-5">こんな人に使ってほしい</h3>
            <div className="space-y-3">
              {[
                "ネタ切れが続いていて、投稿ペースが落ちている",
                "ChatGPTで企画を作ったが「自分らしくない」と感じた",
                "「また同じような動画になった」と悩んでいる",
                "バズった動画の再現性をどう高めるか迷っている",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="mt-0.5 text-zinc-900 dark:text-white shrink-0">
                    <IconCheck size={14} />
                  </div>
                  <p className="text-sm text-zinc-900 dark:text-white leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>

        {/* Bottom CTA */}
        <FadeUp delay={260} className="text-center">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">今すぐ試してみる</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8">2問答えるだけ。無料。登録不要。</p>
          <button
            onClick={() => router.push("/setup")}
            className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white font-bold text-base px-8 py-4 rounded-2xl border border-red-600 transition-colors cursor-pointer"
          >
            <IconSparkle size={18} />
            無料で企画を生成する
            <IconArrowRight size={16} />
          </button>
        </FadeUp>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-sm">
            <IconCamera size={16} />
            <span>KaeruAI</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">© 2026 KaeruAI</p>
        </div>
      </footer>
    </div>
  );
}
