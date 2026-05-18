"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { loadProfile } from "@/lib/profile";
import { IconCamera, IconSparkle } from "@/components/icons";
import ThemeToggle from "@/components/ThemeToggle";

// ── Scroll-triggered reveal ────────────────────────────────────────────────

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
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.07 }
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

function IconArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

function IconXMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// ── CTA ────────────────────────────────────────────────────────────────────

function CTAButton({ label = "無料で企画を生成する", size = "lg", onClick }: { label?: string; size?: "sm" | "lg"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 bg-red-500 hover:bg-red-400 active:scale-95 text-white font-bold border border-red-600 transition-all cursor-pointer rounded-2xl ${
        size === "lg" ? "text-base px-8 py-4" : "text-sm px-6 py-3"
      }`}
    >
      <IconSparkle size={size === "lg" ? 18 : 15} />
      {label}
      <IconArrowRight size={size === "lg" ? 16 : 14} />
    </button>
  );
}

// ── Hero Idea Card (floating visual) ──────────────────────────────────────

function HeroCard() {
  return (
    <div className="relative w-80 xl:w-96 select-none">
      {/* Back card */}
      <div
        className="absolute inset-0 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-3xl"
        style={{ transform: "rotate(-3deg) translate(-8px, 8px)", animation: "float-card-back 6s ease-in-out infinite" }}
      />
      {/* Front card */}
      <div
        className="relative bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-3xl shadow-xl overflow-hidden"
        style={{ animation: "float-card 5s ease-in-out infinite" }}
      >
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            生成完了
          </div>
          <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">企画 1 / 5</span>
        </div>
        {/* Card body */}
        <div className="p-5">
          <div className="flex items-start gap-2.5 mb-3">
            <span className="text-zinc-400 font-bold text-base shrink-0 mt-0.5">1</span>
            <h3 className="font-bold text-sm leading-snug">
              バイブコーディングで書いたコードをドレミに変換したら、なぜか葬送行進曲になった
            </h3>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4 pl-5">
            Cマイナーのコードを書くつもりだったのに、デバッグしながら聴いたら葬送行進曲になっていた。偶然性と意図の境界線が曖昧になる瞬間を記録する。
          </p>
          {/* Collapsed detail chips */}
          <div className="pl-5 flex flex-wrap gap-1.5 mb-4">
            {["コーダー × 音楽好き", "考察", "意外な結末"].map((t) => (
              <span key={t} className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-600 dark:text-zinc-400">{t}</span>
            ))}
          </div>
          {/* Action row */}
          <div className="flex gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold border bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-zinc-900">
              ♡ いい感じ
            </div>
            <div className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300">
              × 違う
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FAQ Accordion ──────────────────────────────────────────────────────────

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
          className="shrink-0 transition-transform duration-300"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          ＋
        </span>
      </button>
      <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows 0.3s ease" }}>
        <div style={{ overflow: "hidden" }}>
          <p className="px-6 pb-5 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const profile = loadProfile();
    if (profile) { router.replace("/main"); return; }
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

      {/* ── Nav ── */}
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
          <button onClick={goSetup} className="text-sm font-semibold hover:opacity-60 transition-opacity cursor-pointer">
            はじめる →
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="min-h-screen flex items-center">
        <div className="max-w-6xl mx-auto px-6 w-full pt-24 pb-16">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">

            {/* Left: copy */}
            <div className="flex-1 text-center lg:text-left">
              <div
                className="inline-flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-full px-4 py-1.5 text-xs font-semibold mb-8"
                style={{ opacity: 1 }}
              >
                <IconSparkle size={11} />
                ChatGPTで試したが、どこかで見た企画しか出なかった人へ
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight mb-7">
                AIは企画を<br />作れる。<br />
                <span className="relative inline-block">
                  <span className="relative z-10">でも、</span>
                </span>
                <span className="relative inline-block">
                  あなたの
                  <span className="absolute left-0 right-0 -bottom-1 h-[4px] bg-red-500 rounded-full" />
                </span>
                <br />
                企画は作れない。
              </h1>

              <p className="text-zinc-500 dark:text-zinc-400 text-lg sm:text-xl leading-relaxed mb-10 max-w-lg mx-auto lg:mx-0">
                KaeruAIはプロフィールを読む。あなたが何者で、なぜ作り、誰に届けたいか。<br className="hidden sm:block" />
                その<strong className="text-zinc-900 dark:text-white">交差点</strong>から企画が生まれる。
              </p>

              <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4">
                <CTAButton onClick={goSetup} />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 sm:self-center">
                  登録不要・無料<br className="sm:hidden" />・2問答えるだけ
                </p>
              </div>
            </div>

            {/* Right: floating card (desktop only) */}
            <div className="hidden lg:flex items-center justify-center shrink-0">
              <HeroCard />
            </div>

          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div className="border-t border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-6">
        <div className="max-w-3xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { num: "4", label: "対応プラットフォーム" },
              { num: "2問", label: "から使い始められる" },
              { num: "無料", label: "登録不要で今すぐ" },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-bold text-2xl sm:text-3xl mb-1">{s.num}</div>
                <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Pain ── */}
      <section className="py-28">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-4">Problem</p>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-10">
              なぜ「AIで企画」が<br />自分らしくないのか
            </h2>
            {/* Big creator quote */}
            <blockquote className="text-left bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-3xl px-8 py-7 max-w-xl mx-auto">
              <p className="text-xl sm:text-2xl font-bold leading-snug text-zinc-900 dark:text-white mb-3">
                「AIに頼むと、なんか違う気がする。悪くはないけど、<span className="text-zinc-400 dark:text-zinc-500">自分のチャンネルじゃない。</span>」
              </p>
              <footer className="text-sm text-zinc-500 dark:text-zinc-400">
                — ChatGPTで企画を出し続けたクリエイターのあるある
              </footer>
            </blockquote>
            <p className="text-zinc-500 dark:text-zinc-400 text-base mt-8 max-w-lg mx-auto">
              AIに「AIジャンルで企画を出して」と頼むと、AIが知っている「AIジャンルの平均」が出てくる。あなたのチャンネルである必要が、どこにもない。
            </p>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { num: "01", title: "「どこかで見た」企画になる", desc: "プロフィールなしで生成すると、ジャンルの平均点しか出てこない。あなたのチャンネルである必要がない企画ばかり。" },
              { num: "02", title: "同じフォーマットの繰り返し", desc: "「〇〇してみた」「検証系」に偏りがち。視聴者は飽き、チャンネルの個性が薄れていく。" },
              { num: "03", title: "ネタ切れのたびに時間消費", desc: "企画を考えることで消耗し、肝心の制作時間が削られる。週1投稿が崩れていく。" },
            ].map((item, i) => (
              <Reveal key={item.num} delay={i * 80} className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-3xl p-6">
                <p className="text-xs font-bold text-zinc-300 dark:text-zinc-600 mb-4">{item.num}</p>
                <h3 className="font-bold text-base mb-3">{item.title}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Before / After ── */}
      <section className="border-t border-zinc-200 dark:border-zinc-800 py-28 bg-white dark:bg-zinc-900">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-4">Before / After</p>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
              タイトルの質が、ここまで変わる
            </h2>
          </Reveal>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Before */}
            <Reveal delay={0}>
              <div className="border border-zinc-300 dark:border-zinc-600 rounded-3xl overflow-hidden h-full">
                <div className="bg-zinc-100 dark:bg-zinc-800 px-5 py-3 border-b border-zinc-300 dark:border-zinc-600">
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">ChatGPT に「AIジャンルで企画を出して」</p>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    "ChatGPTを使った作業効率化5選",
                    "AIツールを試してみた結果",
                    "今話題のAIをまとめてみた",
                    "AIで〇〇を自動化してみた",
                  ].map((t) => (
                    <div key={t} className="flex items-start gap-2.5">
                      <span className="mt-0.5 text-zinc-300 dark:text-zinc-600 shrink-0"><IconXMark size={14} /></span>
                      <p className="text-sm text-zinc-400 dark:text-zinc-500 line-through leading-snug">{t}</p>
                    </div>
                  ))}
                  <p className="text-xs text-zinc-400 dark:text-zinc-600 pt-1">誰でも思いつく。誰のチャンネルでも言える。</p>
                </div>
              </div>
            </Reveal>

            {/* After */}
            <Reveal delay={100}>
              <div className="border-2 border-zinc-900 dark:border-white rounded-3xl overflow-hidden h-full">
                <div className="bg-zinc-900 dark:bg-white px-5 py-3 border-b border-zinc-800 dark:border-zinc-200">
                  <p className="text-xs font-semibold text-white dark:text-zinc-900">KaeruAI ｜ プロフィール：コーダー × 音楽好き</p>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    "バイブコーディングで書いたコードをドレミに変換したら、なぜか葬送行進曲になった",
                    "批評家として断言する：今のAI音楽ツール、全部同じ理由でダメ",
                    "GPTに自分のコードを全部読ませたら、俺の癖を言い当てた",
                  ].map((t) => (
                    <div key={t} className="flex items-start gap-2.5">
                      <span className="mt-0.5 text-zinc-900 dark:text-white shrink-0"><IconCheckSmall size={14} /></span>
                      <p className="text-sm font-medium leading-snug">{t}</p>
                    </div>
                  ))}
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-1">このクリエイター以外には出てこない企画。</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t border-zinc-200 dark:border-zinc-800 py-28">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-4">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight">3ステップで企画ができる</h2>
          </Reveal>

          <div className="space-y-6">
            {[
              { step: "01", title: "2問だけ答える", desc: "プラットフォームと「なぜここに来たか」。これだけでAIはあなたのチャンネルの文脈を掴む。あとは気が向いたときに追加できる。", tag: "所要時間：約30秒" },
              { step: "02", title: "今の気分を1行で", desc: "「やる気ない」「挑戦したい」「AI系で何か」。その状態をトーンや切り口に変換する。テーマ・条件・視聴者の詳細指定もできる。", tag: "入力は1行でOK" },
              { step: "03", title: "5企画から選ぶ・使う", desc: "タイトル・企画内容・フック・サムネイル案・制作手順まで一括生成。いいね/違うのフィードバックが次回の精度に反映される。", tag: "フック〜手順まで全部出る" },
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
      <section className="border-t border-zinc-200 dark:border-zinc-800 py-28 bg-white dark:bg-zinc-900">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-4">Output example</p>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
              プロフィールが違えば、<br />企画も変わる
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-base">
              コーダー × 音楽好きのクリエイター、気分「探求したい」で生成。<br className="hidden sm:block" />
              このクリエイター以外には出てこない企画が届いた。
            </p>
          </Reveal>

          <Reveal delay={80}>
            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-600 rounded-3xl overflow-hidden">
              {/* App chrome */}
              <div className="flex items-center justify-between px-5 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <IconCamera size={16} />
                  <span>KaeruAI</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">気分：探求したい</span>
                  <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">企画 1/5</span>
                </div>
              </div>

              <div className="p-6">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-2xl p-5 mb-4">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-zinc-400 font-bold text-lg shrink-0 mt-0.5">1</span>
                    <h3 className="font-bold text-base leading-snug">
                      バイブコーディングで書いたコードをドレミに変換したら、なぜか葬送行進曲になった
                    </h3>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4 pl-6">
                    Cマイナーのコードを書くつもりだったのに、デバッグしながら聴いたら葬送行進曲になっていた。偶然性と意図の境界線が曖昧になる瞬間を、コード画面と音声を同時に映して記録する。
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3">
                      <p className="text-xs font-semibold mb-1">フック（冒頭15秒）</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">コードを音符に変換するスクリプトをライブコーディング中に動かす。最初の音が出た瞬間の「え、これ葬式じゃん」というリアルなリアクションから始める。</p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3">
                      <p className="text-xs font-semibold mb-1">制作手順</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">① Pythonで変数名→MIDIノート変換スクリプト作成（Midiutil使用）② OBSでコーディング画面を録画 ③ GarageBandで音楽を再生・録音 ④ Final Cut Proで画面+音を合わせて編集</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm border bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-zinc-900 font-semibold">♡ いい感じ</div>
                    <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400">× 違う</div>
                    <div className="flex items-center justify-center w-10 rounded-xl border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 text-sm">⎘</div>
                  </div>
                </div>

                <p className="text-center text-xs text-zinc-400 dark:text-zinc-600">
                  「いい感じ」を押すと次回の生成がこのテイストに近づく ·「違う」で企画を消せる
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section className="border-t border-zinc-200 dark:border-zinc-800 py-28">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-4">Comparison</p>
            <h2 className="text-3xl sm:text-4xl font-bold">ChatGPTとの違い</h2>
          </Reveal>

          <Reveal delay={60}>
            <div className="overflow-hidden rounded-3xl border border-zinc-300 dark:border-zinc-600">
              <div className="grid grid-cols-3 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-300 dark:border-zinc-600">
                <div className="p-4 text-xs font-semibold text-zinc-400" />
                <div className="p-4 text-sm font-bold text-center border-l border-zinc-300 dark:border-zinc-600">KaeruAI</div>
                <div className="p-4 text-sm font-bold text-center border-l border-zinc-300 dark:border-zinc-600 text-zinc-400 dark:text-zinc-500">ChatGPT</div>
              </div>
              {[
                ["プロフィールを読んで生成", true, false],
                ["複数要素の交差から発想", true, false],
                ["品質の自動批評・改善", true, false],
                ["フック・制作手順まで一括出力", true, "△"],
                ["フィードバックで精度が上がる", true, false],
                ["無料・登録不要", true, "△"],
              ].map(([label, kaeru, other], i) => (
                <div key={String(label)} className={`grid grid-cols-3 border-b border-zinc-200 dark:border-zinc-700 last:border-b-0 ${i % 2 !== 0 ? "bg-zinc-50 dark:bg-zinc-800/40" : ""}`}>
                  <div className="p-4 text-sm text-zinc-700 dark:text-zinc-300">{String(label)}</div>
                  <div className="p-4 flex items-center justify-center border-l border-zinc-200 dark:border-zinc-700">
                    {kaeru === true ? <span className="text-zinc-900 dark:text-white"><IconCheckSmall size={18} /></span> : <span className="text-zinc-300"><IconXMark size={15} /></span>}
                  </div>
                  <div className="p-4 flex items-center justify-center border-l border-zinc-200 dark:border-zinc-700">
                    {other === false ? <span className="text-zinc-300"><IconXMark size={15} /></span> : other === true ? <span className="text-zinc-900 dark:text-white"><IconCheckSmall size={18} /></span> : <span className="text-sm text-zinc-400 font-medium">△</span>}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-zinc-200 dark:border-zinc-800 py-28 bg-white dark:bg-zinc-900">
        <div className="max-w-2xl mx-auto px-6">
          <Reveal className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-4">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold">よくある質問</h2>
          </Reveal>

          <div className="space-y-4">
            {[
              { q: "本当に無料ですか？", a: "はい、現在は完全無料で使えます。1日10回まで企画を生成できます。将来的に有料プランを導入予定ですが、無料プランは引き続き提供します。" },
              { q: "ChatGPTに自分のプロフィールを貼れば同じことができませんか？", a: "形式上は似せられます。ただしKaeruAIは「複数の要素が交差する地点」から発想するよう設計されていて、生成後に別のAIが品質を批評して基準を満たさない企画だけを書き直します。また好み・嫌いのフィードバックが蓄積されて次回の生成に反映されます。この仕組みをプロンプトで再現するのはかなり手間がかかる部分です。" },
              { q: "どんなプラットフォームに対応していますか？", a: "YouTube、TikTok、Instagram、Podcastに対応しています。それぞれのフォーマット・尺感に最適化した企画を生成します。" },
              { q: "生成した企画の著作権はどうなりますか？", a: "生成されたすべての企画はあなたのものです。自由に使用・改変・商用利用できます。" },
              { q: "プロフィールを全部入力しないといけませんか？", a: "いいえ。最初の2問だけで使い始められます。あとの質問は任意で、答えるほど企画の精度が上がる仕組みです。使いながら少しずつ追加できます。" },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 40}>
                <FAQItem q={item.q} a={item.a} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="border-t border-zinc-200 dark:border-zinc-800 py-32">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-8">Get started</p>
            <h2 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
              次のネタは、<br />もう考えなくていい。
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg mb-12 max-w-md mx-auto">
              登録不要。無料。2問答えるだけで、あなたのチャンネルに合った企画が5つ届く。
            </p>
            <CTAButton label="今すぐ無料で試す" onClick={goSetup} />
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-10 bg-white dark:bg-zinc-900">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-sm">
            <IconCamera size={16} />
            <span>KaeruAI</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">© 2026 KaeruAI · YouTuberのための企画AIアシスタント</p>
        </div>
      </footer>
    </div>
  );
}
