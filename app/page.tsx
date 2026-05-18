"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase";
import { loadProfile } from "@/lib/profile";
import { syncPull } from "@/lib/sync";

function IconGoogle() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
import { IconCamera, IconSparkle } from "@/components/icons";

// ── Scroll reveal ──────────────────────────────────────────────────────────

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.07 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(28px)", transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

// ── Section gradient transition ────────────────────────────────────────────

function Fade({ from, to }: { from: string; to: string }) {
  return <div className={`h-24 bg-gradient-to-b ${from} ${to} pointer-events-none`} />;
}

// ── Icons ──────────────────────────────────────────────────────────────────

function IconArrow({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconX({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// ── White button — on dark backgrounds ────────────────────────────────────

function LightBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2.5 bg-white hover:bg-zinc-100 active:scale-95 text-zinc-900 font-bold text-base px-8 py-4 rounded-2xl border border-white transition-all cursor-pointer">
      <IconSparkle size={18} />
      {label}
      <IconArrow size={16} />
    </button>
  );
}

// ── Hero floating card (dark glass) ───────────────────────────────────────

function HeroCard() {
  return (
    <div className="relative w-80 xl:w-96 select-none" style={{ isolation: "isolate" }}>
      {/* Shadow card behind — GPU-composited to stay smooth */}
      <div
        className="absolute inset-0 rounded-3xl border border-white/[0.06]"
        style={{
          background: "rgba(255,255,255,0.025)",
          transform: "rotate(-3deg) translate(-10px, 12px) translateZ(0)",
          willChange: "transform",
          animation: "float-card-back 6s ease-in-out infinite",
          borderRadius: "24px",
        }}
      />
      {/* Main dark glass card */}
      <div
        className="relative rounded-3xl border border-white/[0.12]"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          animation: "float-card 5s ease-in-out infinite",
          willChange: "transform",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          boxShadow: "0 24px 56px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.1) inset",
          borderRadius: "24px",
        }}
      >
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            生成完了
          </div>
          <span className="text-xs text-white/40 px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>企画 1 / 5</span>
        </div>
        <div className="p-5">
          <div className="flex items-start gap-2.5 mb-3">
            <span className="text-white/25 font-bold text-base shrink-0 mt-0.5">1</span>
            <h3 className="font-bold text-sm leading-snug text-white/90">
              江戸時代の庶民が食べてた「1日15文の食事」を現代で再現したら、現代人には無理すぎた
            </h3>
          </div>
          <p className="text-xs leading-relaxed mb-4 pl-5" style={{ color: "rgba(255,255,255,0.38)" }}>
            当時の物価換算・食材・調理法を忠実に再現。現代人の舌と胃が最初に拒絶したのは意外なものだった。
          </p>
          <div className="pl-5 flex flex-wrap gap-1.5 mb-4">
            {["料理 × 歴史", "検証", "衝撃結果"].map((t) => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)" }}>{t}</span>
            ))}
          </div>
          <div className="flex gap-2 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex-1 flex items-center justify-center py-2 rounded-xl text-xs font-semibold" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.85)" }}>♡ いい感じ</div>
            <div className="flex-1 flex items-center justify-center py-2 rounded-xl text-xs" style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.28)" }}>× 違う</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FAQ accordion ──────────────────────────────────────────────────────────

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer hover:bg-zinc-800 transition-colors">
        <span className="font-semibold text-sm pr-4 text-white">{q}</span>
        <span className="shrink-0 text-white transition-transform duration-300" style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}>＋</span>
      </button>
      <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows 0.3s ease" }}>
        <div style={{ overflow: "hidden" }}>
          <p className="px-6 pb-5 text-sm text-zinc-400 leading-relaxed">{a}</p>
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
    const p = loadProfile();
    if (p) { router.replace("/main"); return; }

    try {
      const supabase = createSupabaseBrowser();
      supabase.auth.getUser().then(({ data }) => {
        const user = data?.user ?? null;
        if (!user) { setReady(true); return; }
        syncPull().then(() => {
          router.replace(loadProfile() ? "/main" : "/setup");
        });
      }).catch(() => setReady(true));
    } catch {
      setReady(true);
    }
  }, [router]);

  useEffect(() => {
    const fn = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="w-6 h-6 border-2 border-zinc-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  async function signInWithGoogle() {
    try {
      const supabase = createSupabaseBrowser();
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${location.origin}/auth/callback` },
      });
    } catch {
      // Supabase 未設定時はサイレントに無視
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* ── Nav ── */}
      <nav
        style={{ transition: "background 0.3s, backdrop-filter 0.3s" }}
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 ${navScrolled ? "bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/60" : "bg-transparent"}`}
      >
        <div className="flex items-center gap-2 font-bold text-lg text-white">
          <IconCamera size={20} /><span>CaeruAI</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={signInWithGoogle}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-zinc-800 border border-zinc-600 rounded-lg text-white hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            <IconGoogle />
            Googleでログイン
          </button>
        </div>
      </nav>

      {/* ══ HERO — 黒 ════════════════════════════════════════════════════════ */}
      <section className="min-h-screen flex items-center bg-zinc-950 relative overflow-hidden">
        {/* Subtle ambient glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 60%)" }} />
        <div className="max-w-6xl mx-auto px-6 w-full pt-24 pb-16">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">

            {/* Copy */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-full px-4 py-1.5 text-xs font-semibold mb-8 text-zinc-300">
                <IconSparkle size={11} />
                ChatGPTで試したが、どこかで見た企画しか出なかった人へ
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight mb-7 text-white">
                AIは企画を<br />作れる。<br />
                でも、<span className="relative inline-block">
                  あなたの
                  <span className="absolute left-0 right-0 -bottom-1 h-[3px] bg-white rounded-full" />
                </span><br />
                企画は作れない。
              </h1>
              <p className="text-zinc-400 text-lg sm:text-xl leading-relaxed mb-10 max-w-lg mx-auto lg:mx-0">
                CaeruAIはプロフィールを読む。あなたが何者で、なぜ作り、誰に届けたいか。<br className="hidden sm:block" />
                その<strong className="text-white">交差点</strong>から企画が生まれる。
              </p>
              <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4">
                <LightBtn label="無料で企画を生成する" onClick={() => router.push("/setup")} />
                <p className="text-xs text-zinc-400 sm:self-center">登録不要・無料・2問答えるだけ</p>
              </div>
            </div>

            {/* Glass card */}
            <div className="hidden lg:flex items-center justify-center shrink-0">
              <HeroCard />
            </div>

          </div>
        </div>
      </section>

      <Fade from="from-zinc-950" to="to-zinc-900" />

      {/* ══ STATS — zinc-900 ═════════════════════════════════════════════════ */}
      <div className="bg-zinc-900 py-7">
        <div className="max-w-3xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-4 text-center divide-x divide-zinc-700/60">
            {[{ num: "8", label: "対応プラットフォーム" }, { num: "2問", label: "から使い始められる" }, { num: "無料", label: "登録不要で今すぐ" }].map(s => (
              <div key={s.label} className="px-4">
                <div className="font-bold text-2xl sm:text-3xl mb-1 text-white">{s.num}</div>
                <div className="text-xs sm:text-sm text-zinc-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Fade from="from-zinc-900" to="to-zinc-950" />

      {/* ══ PAIN — zinc-950 ══════════════════════════════════════════════════ */}
      <section className="bg-zinc-950 pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">Problem</p>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-10 text-white">
              なぜ「AIで企画」が<br />自分らしくないのか
            </h2>
            <blockquote className="text-left bg-zinc-900 border border-zinc-700 rounded-3xl px-8 py-7 max-w-xl mx-auto">
              <p className="text-xl sm:text-2xl font-bold leading-snug text-white mb-3">
                「AIに頼むと、なんか違う気がする。悪くはないけど、<span className="text-zinc-400">自分のチャンネルじゃない。</span>」
              </p>
              <footer className="text-sm text-zinc-500">— ChatGPTで企画を出し続けたクリエイターのあるある</footer>
            </blockquote>
            <p className="text-zinc-500 text-base mt-8 max-w-lg mx-auto">
              AIに「AIジャンルで企画を出して」と頼むと、AIが知っている「AIジャンルの平均」が出てくる。あなたのチャンネルである必要が、どこにもない。
            </p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { num: "01", title: "「どこかで見た」企画になる", desc: "プロフィールなしで生成すると、ジャンルの平均点しか出てこない。あなたのチャンネルである必要がない企画ばかり。" },
              { num: "02", title: "同じフォーマットの繰り返し", desc: "「〇〇してみた」「検証系」に偏りがち。視聴者は飽き、チャンネルの個性が薄れていく。" },
              { num: "03", title: "ネタ切れのたびに時間消費", desc: "企画を考えることで消耗し、肝心の制作時間が削られる。週1投稿が崩れていく。" },
            ].map((item, i) => (
              <Reveal key={item.num} delay={i * 80} className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6">
                <p className="text-xs font-bold text-zinc-600 mb-4">{item.num}</p>
                <h3 className="font-bold text-base mb-3 text-white">{item.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BEFORE/AFTER — 黒 ════════════════════════════════════════════════ */}
      <section className="bg-zinc-950 pt-4 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-4">Before / After</p>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight text-white">タイトルの質が、ここまで変わる</h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 gap-4">
            <Reveal delay={0}>
              <div className="border border-zinc-800 rounded-3xl overflow-hidden h-full">
                <div className="bg-zinc-900 px-5 py-3 border-b border-zinc-800">
                  <p className="text-xs font-semibold text-zinc-500">ChatGPT に「AIジャンルで企画を出して」</p>
                </div>
                <div className="p-5 space-y-3">
                  {["ChatGPTを使った作業効率化5選", "AIツールを試してみた結果", "今話題のAIをまとめてみた", "AIで〇〇を自動化してみた"].map(t => (
                    <div key={t} className="flex items-start gap-2.5">
                      <span className="mt-0.5 text-zinc-700 shrink-0"><IconX size={14} /></span>
                      <p className="text-sm text-zinc-600 line-through leading-snug">{t}</p>
                    </div>
                  ))}
                  <p className="text-xs text-zinc-700 pt-1">誰でも思いつく。誰のチャンネルでも言える。</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={100}>
              {/* Glass card on black = premium */}
              <div
                className="rounded-3xl overflow-hidden h-full border border-white/20"
                style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
              >
                <div className="bg-white/10 px-5 py-3 border-b border-white/10">
                  <p className="text-xs font-semibold text-white/70">CaeruAI ｜ プロフィール：料理 × 歴史</p>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    "江戸時代の庶民が食べてた「1日15文の食事」を現代で再現したら、現代人には無理すぎた",
                    "「戦国武将は何を食べて戦ったか」を完全再現したら、現代の栄養学が崩壊した",
                    "明治時代の西洋料理を忠実に作ったら、日本人が本当に食べたかったものが見えてきた",
                  ].map(t => (
                    <div key={t} className="flex items-start gap-2.5">
                      <span className="mt-0.5 text-white shrink-0"><IconCheck size={14} /></span>
                      <p className="text-sm font-semibold leading-snug text-white">{t}</p>
                    </div>
                  ))}
                  <p className="text-xs text-white/40 pt-1">このクリエイター以外には出てこない企画。</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Transition: zinc-950 → zinc-900 */}
      <Fade from="from-zinc-950" to="to-zinc-900" />

      {/* ══ HOW IT WORKS — zinc-900 ══════════════════════════════════════════ */}
      <section className="bg-zinc-900 pt-4 pb-28">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight text-white">3ステップで企画ができる</h2>
          </Reveal>
          <div className="space-y-6">
            {[
              { step: "01", title: "2問だけ答える", desc: "プラットフォームと「なぜここに来たか」。これだけでAIはあなたのチャンネルの文脈を掴む。あとは気が向いたときに追加できる。", tag: "所要時間：約30秒" },
              { step: "02", title: "今の気分を1行で", desc: "「やる気ない」「挑戦したい」「AI系で何か」。その状態をトーンや切り口に変換する。テーマ・条件・視聴者の詳細指定もできる。", tag: "入力は1行でOK" },
              { step: "03", title: "5企画から選ぶ・使う", desc: "タイトル・企画内容・フック・サムネイル案・制作手順まで一括生成。いいね/違うのフィードバックが次回の精度に反映される。", tag: "フック〜手順まで全部出る" },
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 100}>
                <div className="flex gap-6 items-start">
                  <div className="shrink-0 w-14 h-14 rounded-2xl border-2 border-white flex items-center justify-center font-bold text-sm text-white">{item.step}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-bold text-lg text-white">{item.title}</h3>
                      <span className="text-xs bg-zinc-800 px-2.5 py-1 rounded-full text-zinc-500">{item.tag}</span>
                    </div>
                    <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
                {i < 2 && <div className="ml-7 mt-6 w-px h-6 bg-zinc-700" />}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Fade from="from-zinc-900" to="to-zinc-800" />

      {/* ══ MOCKUP — zinc-800 ════════════════════════════════════════════════ */}
      <section className="bg-zinc-800 py-28">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">Output example</p>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-4 text-white">プロフィールが違えば、<br />企画も変わる</h2>
            <p className="text-zinc-500 text-base">料理 × 歴史好きのクリエイター、気分「検証したい」で生成。<br className="hidden sm:block" />このクリエイター以外には出てこない企画が届いた。</p>
          </Reveal>
          <Reveal delay={80}>
            <div className="bg-zinc-900 border border-zinc-700 rounded-3xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                <div className="flex items-center gap-2 text-sm font-semibold text-white"><IconCamera size={16} /><span>CaeruAI</span></div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">気分：検証したい</span>
                  <span className="text-xs text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">企画 1/5</span>
                </div>
              </div>
              <div className="p-6">
                <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-5 mb-4">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-zinc-400 font-bold text-lg shrink-0 mt-0.5">1</span>
                    <h3 className="font-bold text-base leading-snug text-white">江戸時代の庶民が食べてた「1日15文の食事」を現代で再現したら、現代人には無理すぎた</h3>
                  </div>
                  <p className="text-sm text-zinc-500 leading-relaxed mb-4 pl-6">当時の物価換算・食材・調理法を忠実に再現。現代人の舌と胃が最初に拒絶したのは意外なものだった。</p>
                  <div className="space-y-2 mb-4">
                    <div className="bg-zinc-900 rounded-xl px-4 py-3">
                      <p className="text-xs font-semibold mb-1 text-white">フック（冒頭15秒）</p>
                      <p className="text-xs text-zinc-500 leading-relaxed">江戸時代の食卓を再現した映像から始まり、一口食べた瞬間の「あ、これ無理かも」というリアルなリアクションで引き込む。</p>
                    </div>
                    <div className="bg-zinc-900 rounded-xl px-4 py-3">
                      <p className="text-xs font-semibold mb-1 text-white">制作手順</p>
                      <p className="text-xs text-zinc-500 leading-relaxed">① 古文書・料理書で当時のレシピを調査 ② 江戸時代の食材を現代で入手・代替品を選定 ③ 当時の調理法で再現 ④ 現代の栄養素と比較解説を追加</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-zinc-700">
                    <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm border bg-white border-white text-zinc-900 font-semibold">♡ いい感じ</div>
                    <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm border border-zinc-600 text-zinc-500">× 違う</div>
                    <div className="flex items-center justify-center w-10 rounded-xl border border-zinc-600 text-zinc-500 text-sm">⎘</div>
                  </div>
                </div>
                <p className="text-center text-xs text-zinc-400">「いい感じ」→ 次回の生成がこのテイストに近づく ·「違う」→ 企画を消せる</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Fade from="from-zinc-800" to="to-zinc-950" />

      {/* ══ COMPARISON — zinc-950 ════════════════════════════════════════════ */}
      <section className="bg-zinc-950 py-28">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">Comparison</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">ChatGPTとの違い</h2>
          </Reveal>
          <Reveal delay={60}>
            <div className="overflow-hidden rounded-3xl border border-zinc-700">
              <div className="grid grid-cols-3 bg-zinc-900 border-b border-zinc-700">
                <div className="p-4" />
                <div className="p-4 text-sm font-bold text-center border-l border-zinc-700 text-white">CaeruAI</div>
                <div className="p-4 text-sm font-bold text-center border-l border-zinc-700 text-zinc-400">ChatGPT</div>
              </div>
              {[
                ["プロフィールを読んで生成", true, false],
                ["複数要素の交差から発想", true, false],
                ["品質の自動批評・改善", true, false],
                ["フック・制作手順まで一括出力", true, "△"],
                ["フィードバックで精度が上がる", true, false],
                ["無料・登録不要", true, "△"],
              ].map(([label, kaeru, other], i) => (
                <div key={String(label)} className={`grid grid-cols-3 border-b border-zinc-700 last:border-b-0 ${i % 2 !== 0 ? "bg-zinc-800/30" : "bg-zinc-900"}`}>
                  <div className="p-4 text-sm text-zinc-300">{String(label)}</div>
                  <div className="p-4 flex items-center justify-center border-l border-zinc-700">
                    {kaeru ? <span className="text-white"><IconCheck size={18} /></span> : <span className="text-zinc-600"><IconX /></span>}
                  </div>
                  <div className="p-4 flex items-center justify-center border-l border-zinc-700">
                    {other === false ? <span className="text-zinc-600"><IconX /></span> : other === true ? <span className="text-white"><IconCheck size={18} /></span> : <span className="text-sm text-zinc-400 font-medium">△</span>}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <Fade from="from-zinc-950" to="to-zinc-900" />

      {/* ══ FAQ — zinc-900 ═══════════════════════════════════════════════════ */}
      <section className="bg-zinc-900 py-28">
        <div className="max-w-2xl mx-auto px-6">
          <Reveal className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">よくある質問</h2>
          </Reveal>
          <div className="space-y-4">
            {[
              { q: "本当に無料ですか？", a: "はい、現在は完全無料で使えます。1日10回まで企画を生成できます。将来的に有料プランを導入予定ですが、無料プランは引き続き提供します。" },
              { q: "ChatGPTに自分のプロフィールを貼れば同じことができませんか？", a: "形式上は似せられます。ただしCaeruAIは「複数の要素が交差する地点」から発想するよう設計されていて、生成後に別のAIが品質を批評して基準を満たさない企画だけを書き直します。好み・嫌いのフィードバックが蓄積されて次回の生成に反映される仕組みもあります。" },
              { q: "どんなプラットフォームに対応していますか？", a: "YouTube、TikTok、Instagram、Podcastに対応しています。それぞれのフォーマット・尺感に最適化した企画を生成します。" },
              { q: "生成した企画の著作権はどうなりますか？", a: "生成されたすべての企画はあなたのものです。自由に使用・改変・商用利用できます。" },
              { q: "プロフィールを全部入力しないといけませんか？", a: "いいえ。最初の2問だけで使い始められます。あとの質問は任意で、答えるほど企画の精度が上がる仕組みです。使いながら少しずつ追加できます。" },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 40}><FAQ q={item.q} a={item.a} /></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Transition: zinc-900 → zinc-950 */}
      <Fade from="from-zinc-900" to="to-zinc-950" />

      {/* ══ FINAL CTA — 黒 + Glass ═══════════════════════════════════════════ */}
      <section className="bg-zinc-950 pt-4 pb-32 relative overflow-hidden">
        {/* Subtle radial glow — gives backdrop-blur something to blur against */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,255,255,0.04) 0%, transparent 70%)" }} />

        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-10">Get started</p>

            {/* Glass card */}
            <div
              className="rounded-3xl border border-white/10 px-8 sm:px-14 py-14"
              style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
            >
              <h2 className="text-4xl sm:text-5xl font-bold leading-tight mb-6 text-white">
                次のネタは、<br />もう考えなくていい。
              </h2>
              <p className="text-zinc-400 text-lg mb-10 max-w-md mx-auto">
                登録不要。無料。2問答えるだけで、あなたのチャンネルに合った企画が5つ届く。
              </p>
              <LightBtn label="今すぐ無料で試す" onClick={() => router.push("/setup")} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ Footer ════════════════════════════════════════════════════════════ */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-sm text-white"><IconCamera size={16} /><span>CaeruAI</span></div>
          <p className="text-xs text-zinc-600">© 2026 CaeruAI · YouTuberのための企画AIアシスタント</p>
        </div>
      </footer>
    </div>
  );
}
