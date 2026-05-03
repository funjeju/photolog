import { AbsoluteFill, Audio, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { VideoScene } from '../types';
import { SubtitleBox } from './shared/SubtitleBox';
import { FadeOverlay } from './shared/FadeOverlay';

export const ViewScene: React.FC<{ scene: VideoScene; ttsUrl?: string }> = ({ scene, ttsUrl }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeOpacity = interpolate(frame, [0, 12, durationInFrames - 12, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 슬로우 팬 (오른쪽으로)
  const panX = interpolate(frame, [0, durationInFrames], [0, -40], { extrapolateRight: 'clamp' });
  const scale = interpolate(frame, [0, durationInFrames], [1.08, 1.02], { extrapolateRight: 'clamp' });

  const subtitleProgress = spring({ frame: frame - 25, fps, config: { damping: 16, stiffness: 70 } });
  const photoUrl = scene.photoUrls[0];

  return (
    <AbsoluteFill style={{ opacity: fadeOpacity }}>
      {ttsUrl && <Audio src={ttsUrl} volume={0.9} />}

      {photoUrl && (
        <Img
          src={photoUrl}
          style={{
            width: '110%',
            height: '110%',
            objectFit: 'cover',
            transform: `scale(${scale}) translateX(${panX}px)`,
          }}
        />
      )}

      {/* 양쪽 그라디언트로 영화적 효과 */}
      <AbsoluteFill style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.5) 100%)' }} />

      <FadeOverlay>
        <SubtitleBox text={scene.subtitle} progress={subtitleProgress} size="small" />
      </FadeOverlay>
    </AbsoluteFill>
  );
};
