import { AbsoluteFill, Audio, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { VideoScene } from '../types';
import { SubtitleBox } from './shared/SubtitleBox';
import { FadeOverlay } from './shared/FadeOverlay';

export const MenuScene: React.FC<{ scene: VideoScene; ttsUrl?: string }> = ({ scene, ttsUrl }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeOpacity = interpolate(frame, [0, 12, durationInFrames - 12, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const subtitleProgress = spring({ frame: frame - 15, fps, config: { damping: 14, stiffness: 90 } });
  const photos = scene.photoUrls.slice(0, 4);

  // 사진 1장이면 풀스크린, 2장이면 세로 반반, 3~4장이면 2x2
  const isSingle = photos.length === 1;
  const isDuo = photos.length === 2;

  return (
    <AbsoluteFill style={{ opacity: fadeOpacity, backgroundColor: '#2D2A26' }}>
      {ttsUrl && <Audio src={ttsUrl} volume={0.9} />}

      {isSingle && photos[0] && (
        <Img src={photos[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      )}

      {isDuo && (
        <AbsoluteFill style={{ flexDirection: 'column', gap: 4 }}>
          {photos.map((url, i) => (
            <div key={i} style={{ flex: 1, overflow: 'hidden' }}>
              <Img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </AbsoluteFill>
      )}

      {!isSingle && !isDuo && (
        <AbsoluteFill style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {photos.map((url, i) => (
            <div key={i} style={{ width: 'calc(50% - 2px)', height: 'calc(50% - 2px)', overflow: 'hidden' }}>
              <Img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </AbsoluteFill>
      )}

      <AbsoluteFill style={{ background: 'linear-gradient(to bottom, transparent 55%, rgba(0,0,0,0.7) 100%)' }} />

      <FadeOverlay>
        <SubtitleBox text={scene.subtitle} progress={subtitleProgress} size="medium" />
      </FadeOverlay>
    </AbsoluteFill>
  );
};
