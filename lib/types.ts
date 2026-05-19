export interface Profile {
  platform: string;
  contentNiche: string;
  youtubeChannelUrl?: string;
  motivation?: string;
  bestComment?: string;
  creativeTriger?: string;
  audienceRelation?: string;
  targetAudience?: string;
  contentApproach?: string;
  avoid?: string;
  processingStyle?: string;
  creatorIdentity?: string;
  successDefinition?: string;
  hobby?: string;
  expertise?: string;
  dreamGoal?: string;
}

export interface YoutubeChannelData {
  channelId: string;
  channelName: string;
  subscriberCount: number;
  videoCount: number;
  topVideos: Array<{ title: string; viewCount: number }>;
  fetchedAt: number;
}

export interface TrendingVideo {
  title: string;
  viewCount: number;
}

export interface TrendingData {
  videos: TrendingVideo[];
  fetchedAt: number;
}

export interface Idea {
  title: string;
  description: string;
  hook: string;
  thumbnail: string;
  filming: string;
}

export interface FeedbackEntry {
  title: string;
  mood: string;
}

export interface FeedbackStore {
  liked: FeedbackEntry[];
  disliked: FeedbackEntry[];
}

export interface HistoryEntry {
  id: string;
  mood: string;
  ideas: Idea[];
  createdAt: number;
}
