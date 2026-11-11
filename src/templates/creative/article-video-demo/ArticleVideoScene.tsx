import {Video} from '@remotion/media';
import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';

export interface ArticleVideoSceneProps {
  /** Remote direct URL, or a path relative to public/. */
  src: string;
  width: number;
  height: number;
  durationInFrames: number;
  hasAudio?: boolean;
  sourceCredit: string;
  articleLabel?: string;
  accent?: string;
  background?: string;
}

const resolveSrc = (src: string) =>
  /^https?:\/\//i.test(src) ? src : staticFile(src);

const fitInside = (
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
  maxHeight: number,
) => {
  const safeWidth = sourceWidth > 0 ? sourceWidth : 16;
  const safeHeight = sourceHeight > 0 ? sourceHeight : 9;
  const scale = Math.min(maxWidth / safeWidth, maxHeight / safeHeight);

  return {
    width: Math.round(safeWidth * scale),
    height: Math.round(safeHeight * scale),
  };
};

export const ArticleVideoScene: React.FC<ArticleVideoSceneProps> = ({
  src,
  width,
  height,
  durationInFrames,
  hasAudio = true,
  sourceCredit,
  articleLabel = 'VIDEO TRONG BÀI VIẾT',
  accent = '#63E6FF',
  background = '#050816',
}) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fitted = fitInside(width, height, 984, 1320);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 45%, ${accent}22, transparent 48%), ${background}`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: fitted.width,
          height: fitted.height,
          borderRadius: 30,
          padding: 8,
          background: `linear-gradient(145deg, ${accent}, rgba(255,255,255,0.18))`,
          boxShadow: `0 0 0 1px ${accent}55, 0 32px 90px rgba(0,0,0,0.55), 0 0 70px ${accent}20`,
          opacity: reveal,
          transform: `scale(${interpolate(reveal, [0, 1], [0.96, 1])})`,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            borderRadius: 23,
            background: '#000',
          }}
        >
          <Video
            src={resolveSrc(src)}
            volume={1}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              background: '#000',
            }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            top: -54,
            left: 20,
            padding: '10px 16px',
            borderRadius: 999,
            background: 'rgba(5,8,22,0.9)',
            border: `1px solid ${accent}88`,
            color: '#FFF',
            fontFamily: 'Arial, sans-serif',
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: 1.6,
          }}
        >
          {articleLabel}
        </div>

        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 24px)',
            right: 0,
            maxWidth: fitted.width,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'right',
            color: 'rgba(255,255,255,0.72)',
            fontFamily: 'Arial, sans-serif',
            fontSize: 20,
            letterSpacing: 1.2,
          }}
        >
          {sourceCredit}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 112,
          left: 54,
          right: 54,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 24,
          color: 'rgba(255,255,255,0.54)',
          fontFamily: 'Arial, sans-serif',
          fontSize: 20,
          letterSpacing: 1.2,
          opacity: interpolate(
            frame,
            [durationInFrames - 24, durationInFrames - 1],
            [1, 0],
            {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
          ),
        }}
      >
        <span>{hasAudio ? 'PHÁT NGUYÊN BẢN • CÓ ÂM THANH' : 'PHÁT NGUYÊN BẢN'}</span>
      </div>
    </AbsoluteFill>
  );
};
