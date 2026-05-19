import { NextRequest } from "next/server";
import type { TrendingData } from "@/lib/types";

export async function GET(request: NextRequest) {
  const niche = request.nextUrl.searchParams.get("niche") ?? "";

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "YouTube API key not configured" }, { status: 500 });
  }

  const publishedAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    part: "snippet",
    q: niche,
    type: "video",
    order: "viewCount",
    publishedAfter,
    regionCode: "JP",
    relevanceLanguage: "ja",
    maxResults: "8",
    key: apiKey,
  });

  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params}`
  );
  const searchData = await searchRes.json();

  if (!searchData.items?.length) {
    return Response.json({ videos: [], fetchedAt: Date.now() } satisfies TrendingData);
  }

  const videoIds = (searchData.items as Array<{ id: { videoId?: string } }>)
    .map((item) => item.id?.videoId)
    .filter(Boolean)
    .join(",");

  const statsParams = new URLSearchParams({
    part: "snippet,statistics",
    id: videoIds,
    key: apiKey,
  });

  const statsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${statsParams}`
  );
  const statsData = await statsRes.json();

  const videos = ((statsData.items ?? []) as Array<{
    snippet: { title: string };
    statistics: { viewCount?: string };
  }>)
    .map((item) => ({
      title: item.snippet.title,
      viewCount: parseInt(item.statistics.viewCount ?? "0", 10),
    }))
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5);

  const result: TrendingData = { videos, fetchedAt: Date.now() };
  return Response.json(result);
}
