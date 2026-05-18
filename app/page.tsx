"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { loadProfile } from "@/lib/profile";
import { IconCamera, IconSparkle } from "@/components/icons";
import ThemeToggle from "@/components/ThemeToggle";

// ── Scroll-triggered fade-up ───────────────────────────────────────────────

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────

function IconX({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function IconCheckSmall({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
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

// ── CTA Button ─────────────────────────────────────────────────────────────

function CTAButton({ label = "無料で企画を生成する", onClick }: { label?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2.5 bg-red-500 hover:bg-red-400 active:scale-95 text-white font-bold text-base px-8 py-4 rounded-2xl border border-red-600 transition-all cursor-pointer"
    >
      <IconSparkle size={18} />
      {label}
      <IconArrowRight size={16} />
    </button>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const profile = loadProfile();
    if (profile) {
      router.replace("/main");
      return;
    }
    setReady(true);
  }, [router]);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-6 h-6 border-2 border-zinc-300 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const goSetup = () => router.push("/setup");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">

      {/* ── Sticky Nav ── */}
      <nav
        style={{ transition: "background 0.3s, border-color 0.3s, backdrop-filter 0.3s" }}
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 ${
          navScrolled
            ? "bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800"
            : "bg-transparent"
        }`}
      >
        <div className="flex items-center gap-2 font-bold text-lg">
          <IconCamera size={20} />
          <span>KaeruAI</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle size={15} />
          <button
            onClick={goSetup}
            className="text-sm font-semibold text-zinc-900 dark:text-white hover:opacity-60 transition-opacity cursor-pointer"
          >
            はじめる →
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-3xl mx-auto px-6 pt-36 pb-28 text-center">
        <div
          style={{ opacity: 1, transform: "translateY(0)", transition: "opacity 0.5s ease, transform 0.5s ease" }}
          className="inline-flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-full px-4 py-1.5 text-xs font-semibold mb-10"
        >
          <IconSparkle size={11} />
          生成→批評→改善。2段階AIで企画品質を保証
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.1] tracking-tight mb-8">
          AIは企画を作れる。<br />
          <span className="relative">
            でも、
            <span className="relative inline-block">
              あなたの
              <span
                className="absolute left-0 right-0 bottom-1 h-[3px] bg-red-500 rounded-full"
                style={{ transform: "scaleX(1)", transformOrigin: "left" }}
              />
            </span>
            企画は
          </span><br />
          作れない。
        </h1>

        <p className="text-zinc-500 dark:text-zinc-400 text-xl leading-relaxed mb-12 max-w-xl mx-auto">
          KaeruAIはプロフィールを読む。<br />
          あなたが何者で、なぜ作り、誰に届けたいか。<br className="hidden sm:block" />
          その<strong className="text-zinc-900 dark:text-white font-bold">交差点</strong>から企画が生まれる。
        </p>

        <div className="flex flex-col items-center gap-3">
          <CTAButton onClick={goSetup} />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            登録不要・無料・2問答えるだけでスタート
          </p>
        </div>
      </section>

      {/* ── Pain ── */}
      <section className="border-t border-zinc-200 dark:border-zinc-800 py-24">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-4">Problem</p>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-6">
              なぜ「AIで企画」が<br />自分らしくないのか
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-xl mx-auto">
              ChatGPTはあなたのことを知らない。だから誰でも言えそうな企画が出てくる。
            </p>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                num: "01",
                title: "「どこかで見た」企画になる",
                desc: "プロフィールなしで生成すると、ジャンルの平均点しか出てこない。あなたのチャンネルである必要がない企画ばかり。",
              },
              {
                num: "02",
                title: "同じフォーマットの繰り返し",
                desc: "「〇〇してみた」「検証系」に偏りがち。視聴者は飽き、チャンネルの個性が薄れていく。",
              },
              {
                num: "03",
                title: "ネタ切れのたびに時間消費",
                desc: "企画を考えることで消耗し、肝心の制作時間が削られる。週1投稿が崩れていく。",
              },
            ].map((item, i) => (
              <Reveal key={item.num} delay={i * 80} className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-3xl p-6">
                <p className="text-xs font-bold text-zinc-400 dark:text-zinc-600 mb-4">{item.num}</p>
                <h3 className="font-bold text-base mb-3">{item.title}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t border-zinc-200 dark:border-zinc-800 py-24 bg-white dark:bg-zinc-900">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-4">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
              3ステップで企画ができる
            </h2>
          </Reveal>

          <div className="space-y-6">
            {[
              {
                step: "01",
                title: "2問だけ答える",
                desc: "プラットフォームと「なぜここに来たか」。これだけでAIはあなたのチャンネルの文脈を掴む。あとは気が向いたときに追加できる。",
                tag: "所要時間：約30秒",
              },
              {
                step: "02",
                title: "今の気分を1行で",
                desc: "「やる気ない」「挑戦したい」「AI系で何か」。その状態をトーンや切り口に変換する。テーマ・条件・視聴者の詳細指定もできる。",
                tag: "入力は1行でOK",
              },
              {
                step: "03",
                title: "5企画から選ぶ・使う",
                desc: "タイトル・企画内容・フック・サムネイル案・制作手順まで一括生成。いいね/違うを押すと次回の精度が上がる。",
                tag: "フック〜手順まで全部出る",
              },
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 100}>
                <div className="flex gap-6 items-start">
                  <div className="shrink-0 w-14 h-14 rounded-2xl border-2 border-zinc-900 dark:border-white flex items-center justify-center font-bold text-sm">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-bold text-lg">{item.title}</h3>
                      <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full text-zinc-500 dark:text-zinc-400">{item.tag}</span>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
                {i < 2 && <div className="ml-7 mt-6 w-px h-6 bg-zinc-200 dark:bg-zinc-700" />}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product Mockup ── */}
      <section className="border-t border-zinc-200 dark:border-zinc-800 py-24">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-4">Output example</p>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
              これがAIの出力だ
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-base">
              コーダー × 音楽好きのクリエイター、気分「探求したい」で生成した例
            </p>
          </Reveal>

          <Reveal delay={80}>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-3xl overflow-hidden">
              {/* Mock header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <IconCamera size={16} />
                  <span>KaeruAI</span>
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">企画 1 / 5</span>
              </div>

              {/* Idea content */}
              <div className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-zinc-400 font-bold text-xl shrink-0 leading-none mt-0.5">1</span>
                  <div>
                    <h3 className="font-bold text-lg leading-snug mb-3">
                      バイブコーディングで書いたコードをドレミに変換したら、なぜか葬送行進曲になった
                    </h3>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4">
                      Cマイナーのコードを書くつもりだったのに、デバッグしながら聴いたら葬送行進曲になっていた。偶然性と意図の境界線が曖昧になる瞬間を、コード画面と音声を同時に映して記録する。
                    </p>
                    <div className="flex flex-wrap gap-2 mb-5">
                      {["コーダー × 音楽好き", "考察フォーマット", "意外な結果"].map((t) => (
                        <span key={t} className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full text-zinc-700 dark:text-zinc-300">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                <div className="space-y-3 mb-5 border-t border-zinc-100 dark:border-zinc-800 pt-5">
                  <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl px-4 py-3">
                    <p className="text-xs font-semibold mb-1.5">フック（冒頭15秒）</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">コードを音符に変換するスクリプトをライブコーディング中に動かす。最初の音が出た瞬間の「え、これ葬式じゃん」というリアルなリアクションから始める。</p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl px-4 py-3">
                    <p className="text-xs font-semibold mb-1.5">サムネイル案</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">左：コードエディタのスクリーンショット（赤いエラーライン）。右：音符の楽譜（短調）。中央大文字「コードが音楽になった」。背景：黒。</p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl px-4 py-3">
                    <p className="text-xs font-semibold mb-1.5">制作手順</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">① Pythonで変数名→MIDIノート変換スクリプト作成（Midiutil使用）② コーディング画面をOBSで録画 ③ 生成した音楽をGarageBandで再生・録音 ④ Final Cut Proで画面+音を合わせて編集</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm border bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-zinc-900 font-medium">
                    ♡ いい感じ
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm border border-zinc-900 dark:border-white text-zinc-900 dark:text-white">
                    × 違う
                  </div>
                  <div className="flex items-center justify-center p-2 rounded-xl border border-zinc-900 dark:border-white text-zinc-900 dark:text-white w-10">
                    ⎘
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120} className="mt-6 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              「違う」を押すとその企画が消える。「いい感じ」を押すと<br className="hidden sm:block" />次回の生成がそのテイストに近づく。
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section className="border-t border-zinc-200 dark:border-zinc-800 py-24 bg-white dark:bg-zinc-900">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-4">Comparison</p>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
              ChatGPTとの違い
            </h2>
          </Reveal>

          <Reveal delay={60}>
            <div className="overflow-hidden rounded-3xl border border-zinc-300 dark:border-zinc-600">
              {/* Header */}
              <div className="grid grid-cols-3 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-300 dark:border-zinc-600">
                <div className="p-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400"></div>
                <div className="p-4 text-sm font-bold text-center border-l border-zinc-300 dark:border-zinc-600">
                  KaeruAI
                </div>
                <div className="p-4 text-sm font-bold text-center border-l border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400">
                  ChatGPT / 他のAI
                </div>
              </div>

              {/* Rows */}
              {[
                ["プロフィールを読んで生成", true, false],
                ["複数要素の交差から発想", true, false],
                ["2段階で品質を保証", true, false],
                ["フック・制作手順まで一括出力", true, "△"],
                ["フィードバックで精度が上がる", true, false],
                ["完全無料で使える", true, "△"],
              ].map(([label, kaeruai, other], i) => (
                <div
                  key={String(label)}
                  className={`grid grid-cols-3 border-b border-zinc-200 dark:border-zinc-700 last:border-b-0 ${i % 2 === 0 ? "" : "bg-zinc-50 dark:bg-zinc-800/50"}`}
                >
                  <div className="p-4 text-sm text-zinc-700 dark:text-zinc-300">{String(label)}</div>
                  <div className="p-4 flex items-center justify-center border-l border-zinc-200 dark:border-zinc-700">
                    {kaeruai === true ? (
                      <span className="text-zinc-900 dark:text-white"><IconCheckSmall size={18} /></span>
                    ) : (
                      <span className="text-zinc-400"><IconX size={16} /></span>
                    )}
                  </div>
                  <div className="p-4 flex items-center justify-center border-l border-zinc-200 dark:border-zinc-700">
                    {other === false ? (
                      <span className="text-zinc-400"><IconX size={16} /></span>
                    ) : other === true ? (
                      <span className="text-zinc-900 dark:text-white"><IconCheckSmall size={18} /></span>
                    ) : (
                      <span className="text-sm text-zinc-400 font-medium">△</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-zinc-200 dark:border-zinc-800 py-24">
        <div className="max-w-2xl mx-auto px-6">
          <Reveal className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-4">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold">よくある質問</h2>
          </Reveal>

          <div className="space-y-4">
            {[
              {
                q: "本当に無料ですか？",
                a: "はい、現在は完全無料で使えます。1日10回まで企画を生成できます。将来的に有料プランを導入予定ですが、無料プランは引き続き提供します。",
              },
              {
                q: "ChatGPTに自分のプロフィールを貼れば同じことができませんか？",
                a: "形式上は似ていますが、KaeruAIは「プロフィールの複数要素の交差点」から発想するよう専用設計されています。また2段階AI（生成→批評→改善）で弱い企画を自動で書き直します。ChatGPTの汎用プロンプトでは再現が難しい精度です。",
              },
              {
                q: "どんなプラットフォームに対応していますか？",
                a: "YouTube、TikTok、Instagram、Podcastに対応しています。それぞれのフォーマット・尺感に最適化した企画を生成します。",
              },
              {
                q: "生成した企画の著作権はどうなりますか？",
                a: "生成されたすべての企画はあなたのものです。自由に使用・改変・商用利用できます。",
              },
              {
                q: "プロフィールを入力するのが面倒ではないですか？",
                a: "最初の2問だけ必須です。あとの10問は任意で、答えるほど精度が上がる仕組みです。使いながら少しずつ答えられます。",
              },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 50}>
                <FAQItem q={item.q} a={item.a} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="border-t border-zinc-200 dark:border-zinc-800 py-28 bg-white dark:bg-zinc-900">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <Reveal>
            <div className="text-5xl mb-6">✦</div>
            <h2 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
              あなたの企画を、<br />今日変える。
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg mb-10 max-w-md mx-auto">
              登録不要。無料。2問答えるだけで、あなた専用の企画生成AIが動き出す。
            </p>
            <CTAButton label="今すぐ無料で試す" onClick={goSetup} />
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-sm">
            <IconCamera size={16} />
            <span>KaeruAI</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            © 2026 KaeruAI · YouTuberのための企画AIアシスタント
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── FAQ Accordion Item ─────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
      >
        <span className="font-semibold text-sm pr-4">{q}</span>
        <span
          className="shrink-0 text-zinc-900 dark:text-white transition-transform duration-300"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          ＋
        </span>
      </button>
      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 0.3s ease",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <p className="px-6 pb-5 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  );
}
