import { AbsoluteFill, Audio, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { VideoScene } from '../types';
import { FadeOverlay } from './shared/FadeOverlay';

export const SummaryScene: React.FC<{ scene: VideoScene; ttsUrl?: string }> = ({ scene, ttsUrl }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeOpacity = interpolate(frame, [0, 15, durationInFrames - 15, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const titleProgress = spring({ frame: frame - 10, fps, config: { damping: 12, stiffness: 80 } });
  const narrationProgress = spring({ frame: frame - 30, fps, config: { damping: 14, stiffness: 70 } });
  const photoUrl = scene.photoUrls[0];

  return (
    <AbsoluteFill style={{ opacity: fadeOpacity }}>
      {ttsUrl && <Audio src={ttsUrl} volume={0.9} />}

      {/* 배경 블러 사진 */}
      {photoUrl && (
        <Img
          src={photoUrl}
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(20px) brightness(0.4)', transform: 'scale(1.1)' }}
        />
      )}
      {!photoUrl && (
        <AbsoluteFill style={{ backgroundColor: '#FDF8F0' }} />
      )}

      {/* 베이지 반투명 오버레이 */}
      <AbsoluteFill style={{ background: 'rgba(253,248,240,0.15)' }} />

      {/* 텍스트 중심 레이아웃 */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '80px 70px' }}>
        <div style={{ textAlign: 'center', width: '100%' }}>
          {/* 부제 */}
          <div
            style={{
              fontSize: 38,
              fontFamily: 'Pretendard',
              fontWeight: 500,
              color: 'rgba(255,248,240,0.8)',
              marginBottom: 30,
              opacity: titleProgress,
              transform: `translateY(${(1 - titleProgress) * 30}px)`,
              letterSpacing: '0.05em',
            }}
          >
            ✨ 오늘의 기록
          </div>

          {/* 메인 자막 */}
          <div
            style={{
              fontSize: 64,
              fontFamily: 'Pretendard',
              fontWeight: 700,
              color: '#FFFFFF',
              lineHeight: 1.4,
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
              opacity: titleProgress,
              transform: `translateY(${(1 - titleProgress) * 20}px)`,
              marginBottom: 48,
            }}
          >
            {scene.subtitle}
          </div>

          {/* 나레이션 요약 (짧게) */}
          <div
            style={{
              fontSize: 36,
              fontFamily: 'Pretendard',
              fontWeight: 400,
              color: 'rgba(255,248,240,0.85)',
              lineHeight: 1.7,
              opacity: narrationProgress,
              transform: `translateY(${(1 - narrationProgress) * 15}px)`,
              maxWidth: 900,
              margin: '0 auto',
            }}
          >
            {scene.narration.slice(0, 80)}{scene.narration.length > 80 ? '...' : ''}
          </div>
        </div>
      </AbsoluteFill>

      {/* 하단 워터마크 */}
      <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 80 }}>
        <div
          style={{
            fontSize: 28,
            fontFamily: 'Pretendard',
            color: 'rgba(255,248,240,0.5)',
            opacity: narrationProgress,
          }}
        >
          PhotoLog AI
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
