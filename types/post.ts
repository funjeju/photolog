import { Timestamp } from 'firebase/firestore';

export type PostMode = 'blog' | 'diary';
export type PostStatus = 'draft' | 'completed' | 'failed';
export type SceneType = 'arrival' | 'menu' | 'view' | 'moment' | 'summary';

export type GPS = {
  lat: number;
  lng: number;
};

export type Location = {
  lat: number;
  lng: number;
  address: string;
  placeName: string;
};

export type Scene = {
  id: number;
  type: SceneType;
  photoIds: string[];
  narration: string;
  subtitle: string;
  duration: number;
  timestamp: Timestamp;
  location?: Location;
};

export type Post = {
  postId: string;
  userId: string;
  mode: PostMode;
  title: string;
  status: PostStatus;
  scenes: Scene[];
  totalPhotos: number;
  thumbnailUrl?: string;
  primaryLocation?: string;
  dateRange: {
    start: Timestamp;
    end: Timestamp;
  };
  tags: string[];
  generationOptions?: {
    tone: string;
    titleSource: 'auto' | 'user';
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  videoId?: string;
};

export type Photo = {
  photoId: string;
  postId: string;
  storagePath: string;
  downloadUrl: string;
  thumbnailUrl?: string;
  capturedAt: Timestamp;
  gps?: GPS;
  cameraInfo?: {
    make: string;
    model: string;
  };
  imageSize?: {
    width: number;
    height: number;
  };
  address?: string;
  placeName?: string;
  ocrText?: string;
  ocrItems?: Array<{
    text: string;
    confidence: number;
  }>;
  visionDescription?: string;
  visualMood?: string;
  order: number;
};
