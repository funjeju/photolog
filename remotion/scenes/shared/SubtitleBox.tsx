type Size = 'small' | 'medium' | 'large';

const SIZE_CONFIG: Record<Size, { fontSize: number; padding: string; borderRadius: number }> = {
  small:  { fontSize: 44, padding: '14px 28px', borderRadius: 20 },
  medium: { fontSize: 56, padding: '18px 36px', borderRadius: 24 },
  large:  { fontSize: 72, padding: '22px 44px', borderRadius: 28 },
};

export const SubtitleBox: React.FC<{ text: string; progress: number; size?: Size }> = ({
  text,
  progress,
  size = 'medium',
}) => {
  const { fontSize, padding, borderRadius } = SIZE_CONFIG[size];

  return (
    <div
      style={{
        background: 'rgba(255, 248, 240, 0.92)',
        borderRadius,
        padding,
        fontSize,
        fontFamily: 'Pretendard',
        fontWeight: 700,
        color: '#2D2A26',
        textAlign: 'center',
        maxWidth: '88%',
        lineHeight: 1.4,
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
        opacity: progress,
        transform: `translateY(${(1 - progress) * 40}px)`,
      }}
    >
      {text}
    </div>
  );
};
