import { AbsoluteFill, Audio, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { VideoScene } from '../types';
import { SubtitleBox } from './shared/SubtitleBox';
import { FadeOverlay } from './shared/FadeOverlay';

export const ArrivalScene: React.FC<{ scene: VideoScene; ttsUrl?: string }> = ({ scene, ttsUrl }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeOpacity = interpolate(frame, [0, 12, durationInFrames - 12, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Ken Burns 줌인
  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.06], { extrapolateRight: 'clamp' });

  const subtitleProgress = spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 90 } });

  const photoUrl = scene.photoUrls[0];

  return (
    <AbsoluteFill style={{ opacity: fadeOpacity }}>
      {ttsUrl && <Audio src={ttsUrl} volume={0.9} />}

      {/* 배경 사진 */}
      {photoUrl && (
        <Img
          src={photoUrl}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})` }}
        />
      )}

      {/* 하단 그라디언트 */}
      <AbsoluteFill style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.65) 100%)' }} />

      {/* 위치 태그 */}
      {scene.location?.placeName && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'flex-start', padding: '80px 60px' }}>
          <div
            style={{
              background: 'rgba(255,248,240,0.9)',
              borderRadius: 40,
              padding: '12px 28px',
              fontSize: 36,
              fontFamily: 'Pretendard',
              fontWeight: 600,
              color: '#2D2A26',
              opacity: subtitleProgress,
              transform: `translateY(${(1 - subtitleProgress) * -20}px)`,
            }}
          >
            📍 {scene.location.placeName}
          </div>
        </AbsoluteFill>
      )}

      {/* 자막 */}
      <FadeOverlay>
        <SubtitleBox text={scene.subtitle} progress={subtitleProgress} size="large" />
      </FadeOverlay>
    </AbsoluteFill>
  );
};
