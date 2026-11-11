import {Video} from '@remotion/media';
import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';

export interface DemoVideoSceneProps {
  /** Path relative to public/, normally "<slug>/demo.mp4". */
  src: string;
  /** Must match the dedicated demo scene duration. Defaults to 14 seconds at 30fps. */
  durationInFrames?: number;
  exitFrames?: number;
  label?: string;
  accent?: string;
  background?: string;
}

export const DemoVideoScene: React.FC<DemoVideoSceneProps> = ({
  src,
  durationInFrames = 420,
  exitFrames = 18,
  label = 'LIVE DEMO',
  accent = '#32E6FF',
  background = '#050816',
}) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exit = interpolate(
    frame,
    [durationInFrames - exitFrames, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );
  const opacity = Math.min(reveal, exit);

  return (
    <AbsoluteFill style={{background}}>
      <AbsoluteFill
        style={{
          opacity,
          transform: `scale(${interpolate(reveal, [0, 1], [1.04, 1])})`,
        }}
      >
        <Video
          src={staticFile(src)}
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </AbsoluteFill>

      <div
        style={{
          position: 'absolute',
          top: 260,
          left: 48,
          padding: '12px 20px',
          border: `2px solid ${accent}`,
          borderRadius: 999,
          background: 'rgba(5, 8, 22, 0.76)',
          color: '#FFFFFF',
          fontFamily: 'Arial, sans-serif',
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: 2,
          opacity,
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
};
