"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Profile, Idea } from "@/lib/types";

export default function MainPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mood, setMood] = useState("");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("yt_profile");
    if (!raw) {
      router.replace("/setup");
      return;
    }
    setProfile(JSON.parse(raw));
  }, [router]);

  async function generate() {
    if (!mood.trim() || !profile) return;
    setLoading(true);
    setError("");
    setIdeas([]);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: mood.trim(), profile }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "生成に失敗しました");
      }

      const data = await res.json();
      setIdeas(data.ideas);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  function resetProfile() {
    localStorage.removeItem("yt_profile");
    router.push("/setup");
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-10">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-red-500 font-bold text-lg">
            <span className="text-2xl">🎬</span>
            <span>企画メーカー</span>
          </div>
          <button
            onClick={resetProfile}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
          >
            プロフィール変更
          </button>
        </div>

        {/* Profile badge */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[profile.creatorIdentity, profile.coreTheme].filter(Boolean).map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Mood input */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h1 className="text-white font-bold text-xl mb-1">今日の気分は？</h1>
          <p className="text-zinc-500 text-sm mb-4">
            一言入力するだけで企画を5つ生成します
          </p>
          <input
            type="text"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && generate()}
            placeholder="例：なんか元気、やる気ない、ワクワクしてる..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors text-sm"
            disabled={loading}
          />
        </div>

        <button
          onClick={generate}
          disabled={!mood.trim() || loading}
          className="w-full py-4 rounded-xl font-bold text-base transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-red-500 hover:bg-red-400 text-white mb-8"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              企画を考え中...
            </span>
          ) : (
            "企画を5つ生成 ✨"
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 mb-6 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Ideas */}
        {ideas.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-zinc-400 text-sm font-medium mb-2">
              生成された企画（{mood}）
            </h2>
            {ideas.map((idea, i) => (
              <div
                key={i}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-red-500 font-bold text-lg leading-none mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-base mb-2 leading-tight">
                      {idea.title}
                    </h3>
                    <p className="text-zinc-400 text-sm mb-3 leading-relaxed">
                      {idea.description}
                    </p>
                    <div className="bg-zinc-800 rounded-lg px-3 py-2">
                      <span className="text-xs text-zinc-500 font-medium">
                        フック：
                      </span>
                      <span className="text-xs text-zinc-300 ml-1">
                        {idea.hook}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => {
                setMood("");
                setIdeas([]);
              }}
              className="w-full py-3 rounded-xl text-sm text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 transition-all cursor-pointer mt-2"
            >
              もう一度生成する
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
