export type SceneType = 'arrival' | 'menu' | 'view' | 'moment' | 'summary';

export type SceneLocation = {
  address: string;
  placeName: string;
};

export type VideoScene = {
  id: number;
  type: SceneType;
  photoUrls: string[];
  narration: string;
  subtitle: string;
  duration: number; // seconds
  location?: SceneLocation;
};

export type VideoFormat = '9:16' | '16:9' | '1:1';

export type VideoProps = {
  scenes: VideoScene[];
  bgm: string;   // BgmKey — actual filename resolved at render time
  format: VideoFormat;
  ttsUrls: string[]; // index matches scenes index
};
