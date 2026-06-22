export interface Video {
  id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  durationStr: string; // e.g. "1h 45m" or "4m 30s"
  size: number; // in bytes
  url: string; // endpoint link /api/videos/:id/stream or external URL
  isExternal: boolean; // if link was added manually
  thumbnailUrl: string; // thumbnail image URL or base64 or gradient string
  category: string; // e.g., "Action", "Drama", "Sci-Fi", "Comedy", etc.
  uploadedAt: string; // ISO string
  views: number;
  rating: string; // e.g., "98% Match" or "4.9 ★"
  year: string; // e.g., "2026"
  maturityRating: string; // e.g., "TV-MA", "PG-13"
}

export interface UploadSession {
  id: string;
  fileName: string;
  totalSize: number;
  totalChunks: number;
  uploadedChunks: number[];
  progress: number;
  speed: number; // bytes/sec
  eta: number; // seconds remaining
  status: 'uploading' | 'paused' | 'merging' | 'completed' | 'failed';
  error?: string;
}

export type CategoryType = 'All' | 'Trending' | 'Movies' | 'TV Shows' | 'Uploader' | 'Favorites';
