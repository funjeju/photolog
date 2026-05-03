import { AbsoluteFill, Audio, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { VideoScene } from '../types';
import { SubtitleBox } from './shared/SubtitleBox';
import { FadeOverlay } from './shared/FadeOverlay';

export const MomentScene: React.FC<{ scene: VideoScene; ttsUrl?: string }> = ({ scene, ttsUrl }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeOpacity = interpolate(frame, [0, 12, durationInFrames - 12, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 사진이 여러 장이면 슬라이드쇼
  const photos = scene.photoUrls;
  const perPhotoFrames = Math.floor(durationInFrames / Math.max(photos.length, 1));
  const currentPhotoIdx = Math.min(Math.floor(frame / perPhotoFrames), photos.length - 1);
  const photoFrame = frame % perPhotoFrames;

  const photoFade = interpolate(photoFrame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const scale = interpolate(photoFrame, [0, perPhotoFrames], [1.0, 1.04], { extrapolateRight: 'clamp' });
  const subtitleProgress = spring({ frame: frame - 18, fps, config: { damping: 14, stiffness: 90 } });

  const photoUrl = photos[currentPhotoIdx];

  return (
    <AbsoluteFill style={{ opacity: fadeOpacity }}>
      {ttsUrl && <Audio src={ttsUrl} volume={0.9} />}

      {photoUrl && (
        <Img
          src={photoUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: photoFade,
            transform: `scale(${scale})`,
          }}
        />
      )}

      <AbsoluteFill style={{ background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.55) 100%)' }} />

      <FadeOverlay>
        <SubtitleBox text={scene.subtitle} progress={subtitleProgress} size="medium" />
      </FadeOverlay>
    </AbsoluteFill>
  );
};
