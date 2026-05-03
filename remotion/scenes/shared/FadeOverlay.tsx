import { AbsoluteFill } from 'remotion';

export const FadeOverlay: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 180,
        paddingLeft: 60,
        paddingRight: 60,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
