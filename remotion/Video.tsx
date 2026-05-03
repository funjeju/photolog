import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { ArrivalScene } from './scenes/ArrivalScene';
import { MenuScene } from './scenes/MenuScene';
import { ViewScene } from './scenes/ViewScene';
import { MomentScene } from './scenes/MomentScene';
import { SummaryScene } from './scenes/SummaryScene';
import { getBgmFile } from '@/lib/video/bgm';
import type { VideoProps, SceneType, VideoScene } from './types';

const SCENE_MAP: Record<SceneType, React.FC<{ scene: VideoScene; ttsUrl?: string }>> = {
  arrival: ArrivalScene,
  menu: MenuScene,
  view: ViewScene,
  moment: MomentScene,
  summary: SummaryScene,
};

export const PhotoLogVideo: React.FC<VideoProps> = ({ scenes, bgm, ttsUrls }) => {
  let frameOffset = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#FDF8F0' }}>
      {/* BGM */}
      <Audio src={staticFile(`bgm/${getBgmFile(bgm as Parameters<typeof getBgmFile>[0])}`)} volume={0.25} />

      {scenes.map((scene, idx) => {
        const SceneComponent = SCENE_MAP[scene.type] ?? MomentScene;
        const durationFrames = Math.ceil(scene.duration * 30);
        const startFrame = frameOffset;
        frameOffset += durationFrames;

        return (
          <Sequence key={scene.id} from={startFrame} durationInFrames={durationFrames}>
            <SceneComponent scene={scene} ttsUrl={ttsUrls[idx]} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
