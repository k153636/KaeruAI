"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Profile, Idea, YoutubeChannelData, TrendingData } from "@/lib/types";
import { loadProfile } from "@/lib/profile";
import { storage } from "@/lib/storage";
import { getFeedback, getFeedbackState, addLiked, addDisliked, removeFeedback } from "@/lib/feedback";
import { addHistory } from "@/lib/history";
import { syncPush } from "@/lib/sync";
import { createSupabaseBrowser } from "@/lib/supabase";
import { IconCamera, IconThumbUp, IconThumbDown, IconSparkle, IconUser, IconLoader } from "@/components/icons";
import { getPlatform } from "@/lib/platforms";
import FadeUp from "@/components/FadeUp";
import BottomNav from "@/components/BottomNav";


const OPTIONAL_FIELDS: (keyof Profile)[] = [
  "youtubeChannelUrl", "creatorIdentity", "targetAudience", "contentApproach", "motivation",
  "avoid", "audienceRelation", "bestComment", "creativeTriger",
  "processingStyle", "successDefinition", "hobby", "expertise", "dreamGoal",
];

const YT_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7日
const TREND_CACHE_TTL = 60 * 60 * 1000; // 1時間

async function fetchTrendingData(niche: string): Promise<TrendingData | null> {
  const cacheKey = `trend_cache_${niche}`;
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const data: TrendingData = JSON.parse(cached);
      if (Date.now() - data.fetchedAt < TREND_CACHE_TTL) return data;
    }
  }
  try {
    const res = await fetch(`/api/trending?niche=${encodeURIComponent(niche)}`);
    if (!res.ok) return null;
    const data: TrendingData = await res.json();
    if (typeof window !== "undefined") localStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch {
    return null;
  }
}

async function fetchYoutubeData(channelUrl: string): Promise<YoutubeChannelData | null> {
  const cacheKey = `yt_cache_${channelUrl}`;
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const data: YoutubeChannelData = JSON.parse(cached);
      if (Date.now() - data.fetchedAt < YT_CACHE_TTL) return data;
    }
  }
  try {
    const res = await fetch(`/api/youtube?channelUrl=${encodeURIComponent(channelUrl)}`);
    if (!res.ok) return null;
    const data: YoutubeChannelData = await res.json();
    if (typeof window !== "undefined") localStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch {
    return null;
  }
}

function IconCopy({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function IconLightning({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13 2L3 14h8l-1 8 11-12h-8l1-8z"/>
    </svg>
  );
}

function IconSliders({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 6h16M4 12h10M4 18h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="18" cy="12" r="2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="14" cy="6" r="2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="10" cy="18" r="2" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

function IconFilm({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 4v16M17 4v16M2 9h5M17 9h5M2 15h5M17 15h5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function IconImage({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function MainPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mood, setMood] = useState("");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");
  const [feedbackMap, setFeedbackMap] = useState<Record<string, "liked" | "disliked" | null>>({});
  const [inputMode, setInputMode] = useState<"detailed" | "quick">("quick");
  const [detailedVisible, setDetailedVisible] = useState(false);
  const [quickVisible, setQuickVisible] = useState(false);

  const [warningVisible, setWarningVisible] = useState(false);
  const [warningMounted, setWarningMounted] = useState(false);

  // 初回マウント
  useEffect(() => {
    const t = setTimeout(() => setQuickVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setWarningMounted(true), 900);
    const t2 = setTimeout(() => setWarningVisible(true), 950);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  function dismissWarning() {
    setWarningVisible(false);
    setTimeout(() => setWarningMounted(false), 350);
  }

  function switchToMode(newMode: "detailed" | "quick") {
    if (newMode === "quick") {
      setDetailedVisible(false);
      setTimeout(() => {
        setInputMode("quick");
        setTimeout(() => setQuickVisible(true), 60);
      }, 300);
    } else {
      setQuickVisible(false);
      setTimeout(() => {
        setInputMode("detailed");
        setTimeout(() => setDetailedVisible(true), 60);
      }, 280);
    }
  }
  const [theme, setTheme] = useState("");
  const [condition, setCondition] = useState("");
  const [audience, setAudience] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [swipeDelta, setSwipeDelta] = useState<{ id: string; deltaX: number } | null>(null);
  const [exitingId, setExitingId] = useState<string | null>(null);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  // Unified drag state for both pointer (mouse) and touch
  const dragStart = useRef<{ id: string; x: number; y: number; horizontal: boolean | null } | null>(null);

  // ── Pointer events (mouse drag on desktop) ──────────────────────────
  function onPointerDown(e: React.PointerEvent, id: string) {
    if (e.pointerType === "touch") return; // touch handled separately
    if ((e.target as HTMLElement).closest("button")) return; // ボタンクリックは通す
    dragStart.current = { id, x: e.clientX, y: e.clientY, horizontal: true };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent, id: string) {
    if (e.pointerType === "touch") return;
    const s = dragStart.current;
    if (!s || s.id !== id) return;
    const dx = e.clientX - s.x;
    setSwipeDelta({ id, deltaX: dx });
  }

  function onPointerUp(e: React.PointerEvent, idea: Idea) {
    if (e.pointerType === "touch") return;
    const s = dragStart.current;
    if (!s || s.id !== idea.title) return;
    const delta = swipeDelta?.id === idea.title ? swipeDelta.deltaX : 0;
    dragStart.current = null;
    setSwipeDelta(null);
    if (delta < -80) triggerDislike(idea);
    else if (delta > 80) triggerLike(idea);
  }

  // ── Touch events (mobile swipe) ──────────────────────────────────────
  function onTouchStart(e: React.TouchEvent, id: string) {
    if ((e.target as HTMLElement).closest("button")) return; // ボタンタップは通す
    dragStart.current = { id, x: e.touches[0].clientX, y: e.touches[0].clientY, horizontal: null };
  }

  function onTouchMove(e: React.TouchEvent, id: string) {
    const s = dragStart.current;
    if (!s || s.id !== id) return;
    const dx = e.touches[0].clientX - s.x;
    const dy = e.touches[0].clientY - s.y;
    if (s.horizontal === null) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) s.horizontal = Math.abs(dx) > Math.abs(dy);
      return;
    }
    if (!s.horizontal) return;
    setSwipeDelta({ id, deltaX: dx });
  }

  function onTouchEnd(idea: Idea) {
    const delta = swipeDelta?.id === idea.title ? swipeDelta.deltaX : 0;
    dragStart.current = null;
    setSwipeDelta(null);
    if (delta < -80) triggerDislike(idea);
    else if (delta > 80) triggerLike(idea);
  }

  // ── Feedback actions ─────────────────────────────────────────────────
  function applyFeedback(idea: Idea, type: "liked" | "disliked") {
    const current = feedbackMap[idea.title];
    removeFeedback(idea.title);
    if (current !== type) {
      if (type === "liked") addLiked({ title: idea.title, mood });
      else addDisliked({ title: idea.title, mood });
      setFeedbackMap((m) => ({ ...m, [idea.title]: type }));
    } else {
      setFeedbackMap((m) => ({ ...m, [idea.title]: null }));
    }
    syncPush();
  }

  function triggerLike(idea: Idea) {
    applyFeedback(idea, "liked");
  }

  // 違う: slide left and disappear
  function triggerDislike(idea: Idea) {
    setExitingId(idea.title);
    applyFeedback(idea, "disliked");
    setTimeout(() => {
      setRemovedIds((prev) => new Set([...prev, idea.title]));
      setExitingId(null);
    }, 380);
  }

  useEffect(() => {
    const p = loadProfile();
    if (!p) { router.replace("/setup"); return; }
    setProfile(p);
  }, [router]);

  const refreshFeedbackMap = useCallback((titles: string[]) => {
    const map: Record<string, "liked" | "disliked" | null> = {};
    titles.forEach((t) => { map[t] = getFeedbackState(t); });
    setFeedbackMap(map);
  }, []);

  async function generate() {
    if (!mood.trim() || !profile) return;
    setLoading(true);
    setRetrying(false);
    setError("");
    setIdeas([]);
    setExpandedId(null);
    setRemovedIds(new Set());

    try {
      const [youtubeData, trendingData] = await Promise.all([
        profile.youtubeChannelUrl ? fetchYoutubeData(profile.youtubeChannelUrl) : null,
        profile.contentNiche ? fetchTrendingData(profile.contentNiche) : null,
      ]);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: mood.trim(), theme: theme.trim(), condition: condition.trim(), audience: audience.trim(), profile, feedback: getFeedback(), youtubeData, trendingData }),
      });

      if (!res.ok) {
        if (res.status === 500) setRetrying(true);
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "生成に失敗しました");
      }

      const data = await res.json();
      const ideas: Idea[] = Array.isArray(data.ideas) ? data.ideas : [];
      setIdeas(ideas);
      refreshFeedbackMap(ideas.map((i) => i.title));
      addHistory(mood.trim(), ideas);
      syncPush();
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }

  function copyIdea(idea: Idea) {
    const text = `【タイトル】\n${idea.title}\n\n【企画内容】\n${idea.description}\n\n【${platform.hookLabel}】\n${idea.hook}\n\n【${platform.visualLabel}】\n${idea.thumbnail}\n\n【${platform.productionLabel}】\n${idea.filming}`;
    navigator.clipboard.writeText(text);
    setCopiedId(idea.title);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (!profile) return null;

  const platform = getPlatform(profile.platform);
  const unansweredCount = OPTIONAL_FIELDS.filter((f) => !profile[f]).length;
  const displayedIdeas = ideas.filter((idea) => !removedIds.has(idea.title));

  return (
    <>
    <div className="min-h-dvh bg-zinc-950 px-4 py-10 pb-[calc(env(safe-area-inset-bottom)+72px)] sm:pb-10">

      <div className="max-w-xl mx-auto">

        {/* Header */}
        <FadeUp delay={0} className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <IconCamera size={22} />
            <span>CaeruAI</span>
          </div>
          <div className="flex items-center gap-3">
            {/* デスクトップのみ表示 — モバイルはBottomNavで代替 */}
            <button onClick={() => router.push("/history")} className="hidden sm:inline text-xs text-white/50 hover:opacity-60 transition-opacity cursor-pointer">
              履歴
            </button>
            <button onClick={() => router.push("/profile")} className="hidden sm:flex items-center gap-1.5 text-xs text-white/50 hover:opacity-60 transition-opacity cursor-pointer">
              <IconUser size={14} />プロフィール
            </button>
            <button
              onClick={async () => {
                storage.clear();
                await createSupabaseBrowser().auth.signOut();
                window.location.href = "/";
              }}
              className="text-xs text-white/30 hover:opacity-60 transition-opacity cursor-pointer"
            >
              ログアウト
            </button>
          </div>
        </FadeUp>

        {/* Profile tags */}
        <FadeUp delay={60} className="flex flex-wrap gap-2 mb-8">
          {[profile.contentNiche, profile.creatorIdentity].filter(Boolean).map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-full text-xs text-white/60 font-medium" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {tag}
            </span>
          ))}
        </FadeUp>

        {/* Main input */}
        <FadeUp delay={120} className="rounded-3xl p-6 mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-white font-semibold text-xl tracking-tight">どんな企画がほしい？</h1>

            {/* Toggle button */}
            <button
              onClick={() => switchToMode(inputMode === "quick" ? "detailed" : "quick")}
              className="flex items-center gap-1 text-xs text-white/35 hover:text-white/60 transition-colors cursor-pointer"
            >
              {inputMode === "quick" ? <><IconSliders size={11} />絞り込む</> : <>▲ 閉じる</>}
            </button>
          </div>

          {/* Quick mode — grid for exact height fit */}
          <div style={{
            display: "grid",
            gridTemplateRows: inputMode === "quick" ? "1fr" : "0fr",
            transition: "grid-template-rows 0.3s ease",
          }}>
            <div style={{ overflow: "hidden" }}>
              <div style={{
                opacity: quickVisible ? 1 : 0,
                transform: quickVisible ? "translateY(0)" : "translateY(10px)",
                transition: "opacity 0.25s ease, transform 0.25s ease",
              }}>
                <input
                  type="text"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !loading && generate()}
                  placeholder="例：やる気ない"
                  className="w-full rounded-2xl px-4 py-3.5 text-base text-white placeholder-white/25 focus:outline-none transition-colors"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Detailed mode — grid for exact height fit */}
          <div style={{
            display: "grid",
            gridTemplateRows: inputMode === "detailed" ? "1fr" : "0fr",
            transition: "grid-template-rows 0.35s ease",
          }}>
            <div style={{ overflow: "hidden" }}>
              {[
                { label: "今の状態", value: mood,      setter: setMood,      placeholder: "やる気ない、挑戦したい...", required: true },
                { label: "テーマ",   value: theme,     setter: setTheme,     placeholder: "AI系、プログラミング...",   required: false },
                { label: "条件",     value: condition, setter: setCondition, placeholder: "短尺、笑える、感動系...",   required: false },
                { label: "視聴者",   value: audience,  setter: setAudience,  placeholder: "初心者、エンジニア...",     required: false },
              ].map(({ label, value, setter, placeholder, required }, i, arr) => (
                <div
                  key={label}
                  style={{
                    opacity: detailedVisible ? 1 : 0,
                    transform: detailedVisible ? "translateY(0)" : "translateY(10px)",
                    transition: `opacity 0.22s ease ${i * 55}ms, transform 0.22s ease ${i * 55}ms`,
                  }}
                  className={`flex items-center gap-4 py-2.5 ${i < arr.length - 1 ? "border-b border-white/[0.07]" : ""}`}
                >
                  <span className={`text-xs w-16 shrink-0 ${required ? "font-medium text-white/80" : "text-white/30"}`}>
                    {label}
                  </span>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !loading && generate()}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-white placeholder-white/25 focus:outline-none"
                    style={{ fontSize: 16 }}
                    disabled={loading}
                  />
                </div>
              ))}
            </div>
          </div>
        </FadeUp>

        {/* Generate button */}
        <FadeUp delay={160} className="mb-4">
          <button
            onClick={generate}
            disabled={!mood.trim() || loading}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90"
            style={{ backgroundColor: '#ffffff', color: '#09090b' }}
          >
            {loading ? (
              <><IconLoader size={18} className="animate-spin" />{retrying ? "リトライ中..." : "企画を考え中..."}</>
            ) : (
              <><IconSparkle size={18} />企画を5つ生成</>
            )}
          </button>
        </FadeUp>

        {/* Accuracy boost */}
        {unansweredCount > 0 && (
          <FadeUp delay={200} className="mb-8">

            <div className="relative">
            {/* 吹き出し警告（レイアウトに影響しない absolute） */}
            {warningMounted && unansweredCount >= 10 && (
              <div
                onClick={dismissWarning}
                className="cursor-pointer"
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 2px)",
                  left: 0,
                  right: 0,
                  zIndex: 10,
                  opacity: warningVisible ? 1 : 0,
                  transform: warningVisible ? "translateY(0)" : "translateY(6px)",
                  transition: "opacity 0.35s ease, transform 0.35s ease",
                  pointerEvents: warningVisible ? "auto" : "none",
                }}
              >
                <div style={{
                  background: "rgba(24,24,27,0.97)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "14px",
                  padding: "12px 14px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                }}>
                  <p className="text-sm text-zinc-200 leading-snug">
                    プロフィールが少ないため企画が<span className="text-white font-semibold">汎用的</span>になっています
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">タップで閉じる</p>
                </div>
                {/* 下向き三角（ボタンを指す） */}
                <div style={{
                  width: 0, height: 0,
                  borderLeft: "7px solid transparent",
                  borderRight: "7px solid transparent",
                  borderTop: "7px solid rgba(24,24,27,0.97)",
                  marginLeft: "20px",
                }} />
              </div>
            )}

            <button
              onClick={() => router.push("/setup?continue=true")}
              className="w-full py-3 rounded-2xl text-sm font-medium text-white/40 hover:text-white/60 transition-colors cursor-pointer flex items-center justify-center gap-2"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            >
              ✦ 精度を上げる
              <span className="text-xs opacity-70">（残り {unansweredCount} 問）</span>
            </button>
            </div>
          </FadeUp>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-2xl p-4 mb-6 text-sm text-white/70" style={{ background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.2)" }}>{error}</div>
        )}

        {/* Ideas */}
        {displayedIdeas.length > 0 && (
          <div className="space-y-4">
            <div className="mb-1">
              <h2 className="text-white/40 text-sm font-medium mb-2">生成された企画（{mood}）</h2>
            </div>

            {displayedIdeas.map((idea, i) => {
              const fb = feedbackMap[idea.title];
              const copied = copiedId === idea.title;
              const expanded = expandedId === idea.title;

              const isDragging = swipeDelta?.id === idea.title;
              const isExiting = exitingId === idea.title;
              const deltaX = isExiting ? -360 : (isDragging ? swipeDelta!.deltaX : 0);
              const transition = isDragging ? "none"
                : isExiting ? "transform 0.38s cubic-bezier(0.4,0,1,1), opacity 0.38s ease"
                : "transform 0.35s ease";

              return (
                <FadeUp key={idea.title} delay={i * 80}>
                  <div
                    onPointerDown={(e) => onPointerDown(e, idea.title)}
                    onPointerMove={(e) => onPointerMove(e, idea.title)}
                    onPointerUp={(e) => onPointerUp(e, idea)}
                    onTouchStart={(e) => onTouchStart(e, idea.title)}
                    onTouchMove={(e) => onTouchMove(e, idea.title)}
                    onTouchEnd={() => onTouchEnd(idea)}
                    style={{
                      transform: `translateX(${deltaX}px) rotate(${deltaX * 0.025}deg)`,
                      opacity: isExiting ? 0 : 1,
                      transition,
                      transformOrigin: "bottom center",
                      boxShadow: isDragging ? "0 16px 40px rgba(0,0,0,0.12)" : undefined,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.09)",
                    }}
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    className="rounded-3xl overflow-hidden relative touch-pan-y select-none"
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <span className="text-white/20 font-semibold text-base leading-none mt-0.5 shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">

                          <h3 className="text-white font-semibold text-base mb-2 leading-snug tracking-tight select-text">
                            {idea.title}
                          </h3>

                          <p className="text-white/60 text-sm mb-3 leading-relaxed select-text">
                            {idea.description}
                          </p>

                          <button
                            onClick={() => setExpandedId(expanded ? null : idea.title)}
                            className="text-xs text-white/35 hover:text-white/60 transition-colors cursor-pointer mb-3 flex items-center gap-1"
                            style={{ touchAction: "manipulation" }}
                          >
                            {expanded ? "▲ 閉じる" : "▼ フック・構成案・制作手順"}
                          </button>

                          {expanded && (
                            <div className="space-y-2 mb-3">
                              <div className="rounded-2xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.05)" }}>
                                <span className="text-xs text-white/50 font-medium">{platform.hookLabel}：</span>
                                <span className="text-xs text-white/80 ml-1 select-text">{idea.hook}</span>
                              </div>
                              <div className="rounded-2xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.05)" }}>
                                <div className="flex items-center gap-1.5 text-xs text-white/50 font-medium mb-1">
                                  <IconImage size={12} />{platform.visualLabel}
                                </div>
                                <p className="text-xs text-white/60 leading-relaxed select-text">{idea.thumbnail}</p>
                              </div>
                              <div className="rounded-2xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.05)" }}>
                                <div className="flex items-center gap-1.5 text-xs text-white/50 font-medium mb-1">
                                  <IconFilm size={12} />{platform.productionLabel}
                                </div>
                                <p className="text-xs text-white/60 leading-relaxed whitespace-pre-line select-text">{idea.filming}</p>
                              </div>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                            <button
                              onClick={() => triggerLike(idea)}
                              className={`flex flex-1 items-center justify-center gap-1.5 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                                fb === "liked" ? "" : "text-white/50 hover:text-white/70"
                              }`}
                              style={fb === "liked"
                                ? { backgroundColor: '#ffffff', color: '#09090b', border: "none", touchAction: "manipulation" }
                                : { border: "1px solid rgba(255,255,255,0.12)", touchAction: "manipulation" }}
                            >
                              <IconThumbUp size={14} /><span>いい感じ</span>
                            </button>
                            <button
                              onClick={() => triggerDislike(idea)}
                              className="flex flex-1 items-center justify-center gap-1.5 py-2 rounded-xl text-sm text-white/50 hover:text-white/70 transition-colors cursor-pointer"
                              style={{ border: "1px solid rgba(255,255,255,0.12)", touchAction: "manipulation" }}
                            >
                              <IconThumbDown size={14} /><span>違う</span>
                            </button>
                            <button
                              onClick={() => copyIdea(idea)}
                              title={copied ? "コピー済み" : "コピー"}
                              className="flex items-center justify-center p-2 rounded-xl text-white/50 hover:text-white/70 transition-colors cursor-pointer"
                              style={{ border: "1px solid rgba(255,255,255,0.12)", touchAction: "manipulation" }}
                            >
                              <IconCopy size={15} />
                            </button>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>
                </FadeUp>
              );
            })}

            <button
              onClick={() => { setMood(""); setTheme(""); setCondition(""); setAudience(""); setIdeas([]); setExpandedId(null); setRemovedIds(new Set()); }}
              className="w-full py-3 rounded-2xl text-sm text-white/50 hover:opacity-60 transition-all cursor-pointer mt-2"
              style={{ border: "1px solid rgba(255,255,255,0.12)" }}
            >
              もう一度生成する
            </button>
          </div>
        )}
      </div>
    </div>
    <BottomNav />
    </>
  );
}
