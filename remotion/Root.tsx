import { Composition } from 'remotion';
import { PhotoLogVideo } from './Video';
import type { VideoProps } from './types';

const defaultProps: VideoProps = {
  scenes: [],
  bgm: 'lofi',
  format: '9:16',
  ttsUrls: [],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PhotoLogVideo"
        component={PhotoLogVideo}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps}
        calculateMetadata={({ props }) => {
          const totalSeconds = props.scenes.reduce((acc, s) => acc + s.duration, 0) || 30;
          return { durationInFrames: Math.ceil(totalSeconds * 30) };
        }}
      />
      <Composition
        id="PhotoLogVideo169"
        component={PhotoLogVideo}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ ...defaultProps, format: '16:9' }}
        calculateMetadata={({ props }) => {
          const totalSeconds = props.scenes.reduce((acc, s) => acc + s.duration, 0) || 30;
          return { durationInFrames: Math.ceil(totalSeconds * 30) };
        }}
      />
      <Composition
        id="PhotoLogVideo11"
        component={PhotoLogVideo}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{ ...defaultProps, format: '1:1' }}
        calculateMetadata={({ props }) => {
          const totalSeconds = props.scenes.reduce((acc, s) => acc + s.duration, 0) || 30;
          return { durationInFrames: Math.ceil(totalSeconds * 30) };
        }}
      />
    </>
  );
};
