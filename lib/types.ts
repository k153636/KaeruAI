export interface Profile {
  platform: string;
  motivation: string;
  bestComment: string;
  creativeTriger: string;
  audienceRelation: string;
  targetAudience: string;
  contentApproach: string;
  avoid: string;
  processingStyle: string;
  creatorIdentity: string;
  successDefinition: string;
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
