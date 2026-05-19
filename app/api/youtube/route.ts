import { NextRequest } from "next/server";
import type { YoutubeChannelData } from "@/lib/types";

function parseChannelInput(input: string): { forHandle?: string; id?: string } {
  const trimmed = input.trim();

  const handleMatch = trimmed.match(/youtube\.com\/@([^/?&\s]+)/);
  if (handleMatch) return { forHandle: `@${handleMatch[1]}` };

  const channelIdMatch = trimmed.match(/youtube\.com\/channel\/(UC[^/?&\s]+)/);
  if (channelIdMatch) return { id: channelIdMatch[1] };

  if (trimmed.startsWith("@")) return { forHandle: trimmed };
  if (trimmed.startsWith("UC")) return { id: trimmed };

  return { forHandle: `@${trimmed}` };
}

export async function GET(request: NextRequest) {
  const channelUrl = request.nextUrl.searchParams.get("channelUrl");
  if (!channelUrl) {
    return Response.json({ error: "channelUrl is required" }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "YouTube API key not configured" }, { status: 500 });
  }

  const { forHandle, id } = parseChannelInput(channelUrl);

  const channelParams = new URLSearchParams({
    part: "snippet,statistics",
    key: apiKey,
    ...(forHandle ? { forHandle } : { id: id! }),
  });

  const channelRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?${channelParams}`
  );
  const channelData = await channelRes.json();

  if (!channelData.items?.length) {
    return Response.json({ error: "チャンネルが見つかりませんでした" }, { status: 404 });
  }

  const channel = channelData.items[0];
  const channelId: string = channel.id;
  const channelName: string = channel.snippet.title;
  const subscriberCount = parseInt(channel.statistics.subscriberCount ?? "0", 10);
  const videoCount = parseInt(channel.statistics.videoCount ?? "0", 10);

  // Top videos by view count
  const searchParams = new URLSearchParams({
    part: "snippet",
    channelId,
    order: "viewCount",
    type: "video",
    maxResults: "10",
    key: apiKey,
  });

  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${searchParams}`
  );
  const searchData = await searchRes.json();

  const videoIds = (searchData.items ?? [])
    .map((item: { id: { videoId: string } }) => item.id?.videoId)
    .filter(Boolean)
    .join(",");

  let topVideos: Array<{ title: string; viewCount: number }> = [];

  if (videoIds) {
    const statsParams = new URLSearchParams({
      part: "snippet,statistics",
      id: videoIds,
      key: apiKey,
    });

    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${statsParams}`
    );
    const statsData = await statsRes.json();

    topVideos = ((statsData.items ?? []) as Array<{
      snippet: { title: string };
      statistics: { viewCount?: string };
    }>)
      .map((item) => ({
        title: item.snippet.title,
        viewCount: parseInt(item.statistics.viewCount ?? "0", 10),
      }))
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5);
  }

  const result: YoutubeChannelData = {
    channelId,
    channelName,
    subscriberCount,
    videoCount,
    topVideos,
    fetchedAt: Date.now(),
  };

  return Response.json(result);
}
