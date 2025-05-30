
export interface LinkedInPost {
  id: string;
  author: {
    name: string;
    profileUrl: string;
    imageUrl?: string;
    headline?: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  postUrl: string;
  images?: string[];
  savedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  relatedPosts?: LinkedInPost[];
}

export interface ScrapingStatus {
  isScrapingActive: boolean;
  progress: number;
  totalPosts: number;
  currentPost: number;
  error?: string;
}
