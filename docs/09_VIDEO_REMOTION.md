# 09. Remotion 영상 생성

## 개요

**Remotion** = React로 영상을 만드는 프레임워크.
post.scenes JSON을 그대로 props로 받아 mp4 출력.

## 셋업 순서

1. Phase 5에서 `npm install remotion @remotion/cli @remotion/lambda`
2. `/remotion` 폴더 생성
3. 컴포넌트 작성
4. 로컬 테스트
5. AWS Lambda 배포

## 컴포넌트 구조

```
/remotion
  ├─ Root.tsx                 # 컴포지션 등록
  ├─ Video.tsx                # 메인 영상 컴포넌트
  ├─ scenes/
  │    ├─ ArrivalScene.tsx    # 도착 장면
  │    ├─ MenuScene.tsx       # 메뉴 장면
  │    ├─ ViewScene.tsx       # 풍경 장면
  │    ├─ MomentScene.tsx     # 일반 순간
  │    └─ SummaryScene.tsx    # 마무리
  └─ assets/
       └─ bgm/
            ├─ lofi.mp3
            ├─ acoustic.mp3
            └─ cinematic.mp3
```

## Root.tsx — 컴포지션 등록

```typescript
import { Composition } from 'remotion';
import { Video } from './Video';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="PhotoLogVideo"
        component={Video}
        durationInFrames={1800}        // 30초 기본 (30fps × 60초)
        fps={30}
        width={1080}
        height={1920}                  // 9:16 세로
        defaultProps={{
          scenes: [],
          bgm: 'lofi',
          format: '9:16',
          ttsUrls: [],
        }}
      />
    </>
  );
};
```

## Video.tsx — 메인 영상 컴포넌트

```typescript
import { AbsoluteFill, Audio, Sequence, useCurrentFrame } from 'remotion';
import { ArrivalScene } from './scenes/ArrivalScene';
import { MenuScene } from './scenes/MenuScene';
import { ViewScene } from './scenes/ViewScene';
import { MomentScene } from './scenes/MomentScene';
import { SummaryScene } from './scenes/SummaryScene';
import { staticFile } from 'remotion';

type VideoProps = {
  scenes: Scene[];
  bgm: 'lofi' | 'acoustic' | 'cinematic';
  format: '9:16' | '16:9' | '1:1';
  ttsUrls: string[];
};

const SceneComponentMap = {
  arrival: ArrivalScene,
  menu: MenuScene,
  view: ViewScene,
  moment: MomentScene,
  summary: SummaryScene,
};

export const Video: React.FC<VideoProps> = ({ scenes, bgm, ttsUrls }) => {
  let frameOffset = 0;
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#FDF8F0' }}>
      {/* BGM */}
      <Audio src={staticFile(`bgm/${bgm}.mp3`)} volume={0.3} />
      
      {/* 각 Scene을 Sequence로 시간순 배치 */}
      {scenes.map((scene, idx) => {
        const SceneComponent = SceneComponentMap[scene.type] || MomentScene;
        const durationFrames = scene.duration * 30;
        const startFrame = frameOffset;
        frameOffset += durationFrames;
        
        return (
          <Sequence
            key={scene.id}
            from={startFrame}
            durationInFrames={durationFrames}
          >
            <SceneComponent scene={scene} ttsUrl={ttsUrls[idx]} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
```

## Scene 컴포넌트 예시 — ArrivalScene.tsx

```typescript
import { AbsoluteFill, Img, Audio, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

type Props = {
  scene: Scene;
  ttsUrl: string;
};

export const ArrivalScene: React.FC<Props> = ({ scene, ttsUrl }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // 페이드인
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  
  // Ken Burns 줌인 (1.0 → 1.05)
  const scale = interpolate(frame, [0, 150], [1, 1.05], { extrapolateRight: 'clamp' });
  
  // 자막 등장 (스프링 애니메이션)
  const subtitleY = spring({
    frame: frame - 20,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  
  return (
    <AbsoluteFill style={{ opacity }}>
      {/* TTS 음성 */}
      <Audio src={ttsUrl} volume={0.8} />
      
      {/* 메인 사진 */}
      <Img
        src={scene.photoUrls[0]}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale})`,
        }}
      />
      
      {/* 어두운 그라디언트 (자막 가독성) */}
      <AbsoluteFill style={{
        background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.6) 100%)',
      }} />
      
      {/* 자막 */}
      <AbsoluteFill style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 200,
      }}>
        <div style={{
          fontSize: 80,
          fontWeight: 700,
          color: 'white',
          textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
          fontFamily: 'Pretendard',
          transform: `translateY(${(1 - subtitleY) * 50}px)`,
          opacity: subtitleY,
        }}>
          {scene.subtitle}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

## Scene 타입별 디자인 차이

| Type | 특징 |
|---|---|
| `arrival` | 풀스크린 사진 + Ken Burns 줌인 + 큰 자막 |
| `menu` | 사진 그리드 (2x2 또는 3x1) + 가격 자막 |
| `view` | 풍경 사진 + 슬로우 팬 + 작은 자막 |
| `moment` | 사진 1장 + 페이드 트랜지션 |
| `summary` | 베이지 배경 + 텍스트 중심 + 마지막 멘트 |

## 영상 디자인 가이드 — Soft & Friendly 톤 유지

### 자막 스타일
```typescript
const subtitleStyle = {
  fontSize: 80,
  fontWeight: 700,
  color: '#FFFFFF',
  textShadow: `
    -2px -2px 0 #2D2A26,
    2px -2px 0 #2D2A26,
    -2px 2px 0 #2D2A26,
    2px 2px 0 #2D2A26,
    0 4px 12px rgba(0,0,0,0.4)
  `,                                   // 검정 외곽선 + 부드러운 그림자
  fontFamily: 'Pretendard',
  background: 'rgba(255, 248, 240, 0.9)',  // 베이지 반투명 박스 (선택)
  padding: '16px 32px',
  borderRadius: 24,
};
```

### 트랜지션
```typescript
// scene 간 페이드 트랜지션
const fadeOpacity = interpolate(
  frame,
  [0, 10, durationFrames - 10, durationFrames],
  [0, 1, 1, 0]
);
```

### Ken Burns
- 줌인: scale 1.0 → 1.05 (5초)
- 팬: translateX, translateY 살짝
- 너무 빠르면 멀미남 — 부드럽게

## TTS 통합

```typescript
// API: 영상 생성 시
import { synthesizeSpeech } from '@/lib/tts/elevenlabs';

const ttsUrls = await Promise.all(
  scenes.map(async (scene) => {
    const audioBuffer = await synthesizeSpeech(scene.narration);
    const url = await uploadToStorage(audioBuffer, `users/${uid}/posts/${postId}/tts/scene_${scene.id}.mp3`);
    return url;
  })
);
```

## Remotion Lambda 셋업

### AWS 셋업
```bash
# 1. Lambda 함수 배포
npx remotion lambda functions deploy

# 2. 사이트 배포 (영상 컴포넌트)
npx remotion lambda sites create remotion/index.ts --site-name=photolog

# 3. 렌더 권한 IAM 설정
# AWS Console에서 IAM 역할 생성:
# - AWSLambdaBasicExecutionRole
# - S3FullAccess (출력 버킷)
```

### 환경변수
```
REMOTION_AWS_ACCESS_KEY_ID=
REMOTION_AWS_SECRET_ACCESS_KEY=
REMOTION_AWS_REGION=ap-northeast-2
REMOTION_LAMBDA_FUNCTION_NAME=remotion-render-XXXX
REMOTION_SITE_NAME=photolog
REMOTION_S3_BUCKET=remotionlambda-XXXX
```

### 렌더링 호출 코드

```typescript
// lib/video/render.ts
import { renderMediaOnLambda } from '@remotion/lambda/client';

export async function renderVideoOnLambda(props: VideoProps) {
  const { renderId, bucketName } = await renderMediaOnLambda({
    region: process.env.REMOTION_AWS_REGION as any,
    functionName: process.env.REMOTION_LAMBDA_FUNCTION_NAME!,
    serveUrl: `https://remotionlambda-${bucketName}.s3.${region}.amazonaws.com/sites/${siteName}/index.html`,
    composition: 'PhotoLogVideo',
    inputProps: props,
    codec: 'h264',
    imageFormat: 'jpeg',
    maxRetries: 1,
    privacy: 'public',
    webhook: {
      url: 'https://photolog.com/api/webhooks/remotion',
      secret: process.env.REMOTION_WEBHOOK_SECRET,
    },
  });
  
  return { renderId, bucketName };
}
```

## 비용

| 항목 | 비용 |
|---|---|
| 30초 9:16 1080p 1편 | ~$0.05~0.10 (₩70~150) |
| 60초 9:16 1080p 1편 | ~$0.10~0.20 (₩150~300) |
| 3분 16:9 1080p 1편 | ~$0.30~0.50 (₩400~700) |

Lambda 동시 실행 한도: 200 (AWS 기본)

## 로컬 개발 (Lambda 없이)

```bash
# Remotion Studio 실행 (브라우저 미리보기)
npx remotion studio

# 로컬 렌더 (테스트용)
npx remotion render Video out.mp4 --props='{"scenes":[...]}'
```

## BGM 라이선스

무료 BGM 소스:
- **YouTube Audio Library** (저작권 자유)
- **Pixabay Music** (CC0)
- **Free Music Archive**

선택한 3종을 `/remotion/assets/bgm/`에 배치:
- `lofi.mp3` — 카페·일상용
- `acoustic.mp3` — 따뜻한 다이어리용
- `cinematic.mp3` — 여행·풍경용

## 출력 포맷별 해상도

| 포맷 | 해상도 | 용도 |
|---|---|---|
| 9:16 | 1080×1920 | 인스타 릴스, 틱톡, 유튜브 숏츠 |
| 16:9 | 1920×1080 | 유튜브 일반 |
| 1:1 | 1080×1080 | 인스타 피드 |

## 디버깅 팁

- **Studio에서 먼저 테스트** — 브라우저에서 실시간 확인
- **scenes 배열이 비어있으면 검은 화면** — 빈 상태 처리 필수
- **이미지 로딩 실패 시 fallback** — `Img` 컴포넌트 onError
- **TTS URL이 없으면 무음** — 옵셔널 처리

## 추후 고급 기능 (Phase 6+)

- 자막 스타일 사용자 커스터마이징
- BGM 사용자 업로드
- 트랜지션 종류 선택
- 워터마크 (Free 플랜용)
- 미리보기 화면 (렌더링 전 시뮬레이션)
