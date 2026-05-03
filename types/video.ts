import { Timestamp } from 'firebase/firestore';

export type VideoStatus = 'queued' | 'rendering' | 'completed' | 'failed';
export type VideoFormat = '9:16' | '16:9' | '1:1';
export type VideoBgm = 'lofi' | 'acoustic' | 'cinematic';

export type Video = {
  videoId: string;
  postId: string;
  userId: string;
  status: VideoStatus;
  format: VideoFormat;
  duration: number;
  storagePath?: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
  fileSize?: number;
  bgm?: VideoBgm;
  renderStartedAt?: Timestamp;
  renderCompletedAt?: Timestamp;
  errorMessage?: string;
  lambdaRequestId?: string;
  createdAt: Timestamp;
};
