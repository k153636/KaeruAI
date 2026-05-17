"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Profile, Idea } from "@/lib/types";
import { loadProfile } from "@/lib/profile";
import { getFeedback, getFeedbackState, addLiked, addDisliked, removeFeedback } from "@/lib/feedback";
import { addHistory } from "@/lib/history";
import { IconCamera, IconThumbUp, IconThumbDown, IconSparkle, IconUser, IconLoader } from "@/components/icons";
import { getPlatform } from "@/lib/platforms";
import FadeUp from "@/components/FadeUp";
import ThemeToggle from "@/components/ThemeToggle";

const OPTIONAL_FIELDS: (keyof Profile)[] = [
  "creatorIdentity", "targetAudience", "contentApproach", "motivation",
  "avoid", "audienceRelation", "bestComment", "creativeTriger",
  "processingStyle", "successDefinition", "hobby", "expertise", "dreamGoal",
];

function IconCopy({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5"/>
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [swipeDelta, setSwipeDelta] = useState<{ id: string; deltaX: number } | null>(null);
  const [animatingFeedback, setAnimatingFeedback] = useState<{ id: string; deltaX: number } | null>(null);
  const swipeStart = useRef<{ id: string; x: number; y: number; horizontal: boolean | null } | null>(null);

  function onTouchStart(e: React.TouchEvent, id: string) {
    swipeStart.current = { id, x: e.touches[0].clientX, y: e.touches[0].clientY, horizontal: null };
  }

  function onTouchMove(e: React.TouchEvent, id: string) {
    const s = swipeStart.current;
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
    if (delta > 80) handleFeedback(idea, "liked");
    else if (delta < -80) handleFeedback(idea, "disliked");
    swipeStart.current = null;
    setSwipeDelta(null);
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

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: mood.trim(), profile, feedback: getFeedback() }),
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }

  function applyFeedback(idea: Idea, type: "liked" | "disliked") {
    const current = feedbackMap[idea.title];
    removeFeedback(idea.title);
    if (current === type) {
      setFeedbackMap((m) => ({ ...m, [idea.title]: null }));
    } else {
      if (type === "liked") addLiked({ title: idea.title, mood });
      else addDisliked({ title: idea.title, mood });
      setFeedbackMap((m) => ({ ...m, [idea.title]: type }));
    }
  }

  function handleFeedback(idea: Idea, type: "liked" | "disliked") {
    applyFeedback(idea, type);
  }

  function handleFeedbackWithAnimation(idea: Idea, type: "liked" | "disliked") {
    const deltaX = type === "liked" ? 260 : -260;
    setAnimatingFeedback({ id: idea.title, deltaX });
    setTimeout(() => {
      setAnimatingFeedback(null);
      applyFeedback(idea, type);
    }, 350);
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

  return (
    <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950 px-4 py-10 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <FadeUp delay={0} className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-red-500 font-bold text-lg">
            <IconCamera size={22} />
            <span>KaeruAI</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/history")}
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              履歴
            </button>
            <button
              onClick={() => router.push("/profile")}
              className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <IconUser size={14} />
              プロフィール
            </button>
            <ThemeToggle size={15} />
          </div>
        </FadeUp>

        {/* Profile tags */}
        <FadeUp delay={60} className="flex flex-wrap gap-2 mb-8">
          {[profile.contentNiche, profile.creatorIdentity].filter(Boolean).map((tag) => (
            <span key={tag} className="px-3 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full text-xs text-zinc-500 dark:text-zinc-400">
              {tag}
            </span>
          ))}
        </FadeUp>

        {/* Mood input */}
        <FadeUp delay={120} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-3xl p-6 mb-4">
          <h1 className="text-zinc-900 dark:text-white font-bold text-xl mb-1">今日の気分は？</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">気分でも「〇〇系の企画が欲しい」でも OK</p>
          <input
            type="text"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && generate()}
            placeholder="例：やる気ない　／　AI関連の企画が欲しい..."
            className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors text-base"
            disabled={loading}
          />
        </FadeUp>

        {/* Generate button */}
        <FadeUp delay={160} className="mb-4">
          <button
            onClick={generate}
            disabled={!mood.trim() || loading}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-red-500 hover:bg-red-400 text-white border border-red-600 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><IconLoader size={18} className="animate-spin" />{retrying ? "リトライ中..." : "企画を考え中..."}</>
            ) : (
              <><IconSparkle size={18} />企画を5つ生成</>
            )}
          </button>
        </FadeUp>

        {/* Accuracy boost button */}
        {unansweredCount > 0 && (
          <FadeUp delay={200} className="mb-8">
            <button
              onClick={() => router.push("/setup?continue=true")}
              className="w-full py-3 rounded-2xl text-sm font-medium border border-zinc-200 dark:border-zinc-700 hover:border-red-400 hover:text-red-500 text-zinc-400 dark:text-zinc-500 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              ✦ 精度を上げる
              <span className="text-xs opacity-70">（残り {unansweredCount} 問）</span>
            </button>
          </FadeUp>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-6 text-red-600 dark:text-red-400 text-sm">{error}</div>
        )}

        {/* Ideas */}
        {ideas.length > 0 && (
          <div className="space-y-4">
            {/* Section header with swipe hint */}
            <div className="mb-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">生成された企画（{mood}）</h2>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-600 px-1">
                <span>← スワイプで「違う」</span>
                <span>「いい感じ」→</span>
              </div>
            </div>

            {ideas.map((idea, i) => {
              const fb = feedbackMap[idea.title];
              const copied = copiedId === idea.title;
              const expanded = expandedId === idea.title;

              const isDragging = swipeDelta?.id === idea.title;
              const isAnimating = animatingFeedback?.id === idea.title;
              const deltaX = isAnimating ? animatingFeedback!.deltaX : (isDragging ? swipeDelta!.deltaX : 0);
              const likeOpacity = Math.min(1, Math.max(0, deltaX / 80));
              const dislikeOpacity = Math.min(1, Math.max(0, -deltaX / 80));

              return (
                <FadeUp key={i} delay={i * 80}>
                  <div
                    onTouchStart={(e) => onTouchStart(e, idea.title)}
                    onTouchMove={(e) => onTouchMove(e, idea.title)}
                    onTouchEnd={() => onTouchEnd(idea)}
                    style={{
                      transform: `translateX(${deltaX}px) rotate(${deltaX * 0.03}deg)`,
                      transition: isDragging ? "none" : "transform 0.35s ease",
                      transformOrigin: "bottom center",
                    }}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-3xl overflow-hidden relative cursor-default touch-pan-y"
                  >
                    {/* Swipe overlays */}
                    {likeOpacity > 0 && (
                      <div
                        className="absolute inset-0 rounded-3xl z-10 pointer-events-none flex items-center justify-start pl-5"
                        style={{ backgroundColor: `rgba(16,185,129,${likeOpacity * 0.35})` }}
                      >
                        <span className="text-emerald-700 font-bold text-sm border-2 border-emerald-500 rounded-lg px-2 py-0.5 -rotate-12">
                          いい感じ
                        </span>
                      </div>
                    )}
                    {dislikeOpacity > 0 && (
                      <div
                        className="absolute inset-0 rounded-3xl z-10 pointer-events-none flex items-center justify-end pr-5"
                        style={{ backgroundColor: `rgba(239,68,68,${dislikeOpacity * 0.35})` }}
                      >
                        <span className="text-red-700 font-bold text-sm border-2 border-red-500 rounded-lg px-2 py-0.5 rotate-12">
                          違う
                        </span>
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <span className="text-red-500 font-bold text-lg leading-none mt-0.5 shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">

                          {/* Title */}
                          <h3 className="text-zinc-900 dark:text-white font-bold text-base mb-2 leading-tight">
                            {idea.title}
                          </h3>

                          {/* Description */}
                          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-3 leading-relaxed">
                            {idea.description}
                          </p>

                          {/* Expand details */}
                          <button
                            onClick={() => setExpandedId(expanded ? null : idea.title)}
                            className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer mb-3 flex items-center gap-1"
                          >
                            {expanded ? "▲ 閉じる" : "▼ フック・構成案・制作手順を見る"}
                          </button>

                          {expanded && (
                            <div className="space-y-2 mb-3">
                              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 py-2">
                                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                  {platform.hookLabel}：
                                </span>
                                <span className="text-xs text-zinc-700 dark:text-zinc-300 ml-1">{idea.hook}</span>
                              </div>
                              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 py-2">
                                <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-1">
                                  <IconImage size={12} />
                                  {platform.visualLabel}
                                </div>
                                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">{idea.thumbnail}</p>
                              </div>
                              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 py-2">
                                <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-1">
                                  <IconFilm size={12} />
                                  {platform.productionLabel}
                                </div>
                                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">{idea.filming}</p>
                              </div>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                            <button
                              onClick={() => handleFeedbackWithAnimation(idea, "liked")}
                              disabled={isAnimating}
                              className={`flex flex-1 items-center justify-center gap-1.5 py-2 rounded-xl text-sm border transition-all cursor-pointer disabled:pointer-events-none ${
                                fb === "liked"
                                  ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-400 text-emerald-600"
                                  : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-emerald-300 hover:text-emerald-500"
                              }`}
                            >
                              <IconThumbUp size={14} />
                              <span>いい感じ</span>
                            </button>
                            <button
                              onClick={() => handleFeedbackWithAnimation(idea, "disliked")}
                              disabled={isAnimating}
                              className={`flex flex-1 items-center justify-center gap-1.5 py-2 rounded-xl text-sm border transition-all cursor-pointer disabled:pointer-events-none ${
                                fb === "disliked"
                                  ? "bg-red-50 dark:bg-red-950 border-red-400 text-red-600"
                                  : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-red-300 hover:text-red-500"
                              }`}
                            >
                              <IconThumbDown size={14} />
                              <span>違う</span>
                            </button>
                            <button
                              onClick={() => copyIdea(idea)}
                              title={copied ? "コピー済み" : "コピー"}
                              className={`flex items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                                copied
                                  ? "border-zinc-400 dark:border-zinc-500 text-zinc-700 dark:text-zinc-300"
                                  : "border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 hover:border-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                              }`}
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
              onClick={() => { setMood(""); setIdeas([]); setExpandedId(null); }}
              className="w-full py-3 rounded-2xl text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all cursor-pointer mt-2"
            >
              もう一度生成する
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
