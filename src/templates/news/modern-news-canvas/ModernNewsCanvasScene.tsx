import {Video} from '@remotion/media';
import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {COLORS, FONT_MAIN} from './tokens';
import type {
  ModernNewsCanvasAsset,
  ModernNewsCanvasSelection,
} from './types';

export interface ModernNewsCanvasSceneProps {
  publisher: string;
  publicationDate: string;
  headline: string;
  media: Array<ModernNewsCanvasSelection & {asset: ModernNewsCanvasAsset}>;
  durationFrames: number;
}

const resolveSrc = (src: string) =>
  /^https?:\/\//i.test(src) ? src : staticFile(src);

const MediaSlide: React.FC<{
  item: ModernNewsCanvasSelection & {asset: ModernNewsCanvasAsset};
  durationFrames: number;
}> = ({item, durationFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const transitionFrames = Math.min(
    Math.round(0.55 * fps),
    Math.max(1, Math.floor(durationFrames / 3)),
  );
  const enter = interpolate(frame, [0, transitionFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const exit = interpolate(
    frame,
    [Math.max(0, durationFrames - transitionFrames), durationFrames],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.45, 0, 0.55, 1),
    },
  );
  const x = interpolate(enter - exit, [-1, 0, 1], [-48, 64, 0]);
  const opacity = Math.max(0, Math.min(1, enter - exit));
  const scale = interpolate(frame, [0, durationFrames], [1, 1.04], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fit =
    item.fit ?? (item.asset.height > item.asset.width ? 'contain' : 'cover');
  const src = resolveSrc(item.asset.src);

  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `translateX(${x}px)`,
        background: COLORS.mediaBackground,
      }}
    >
      {fit === 'contain' && item.asset.kind === 'image' ? (
        <Img
          src={src}
          style={{
            position: 'absolute',
            inset: -30,
            width: 'calc(100% + 60px)',
            height: 'calc(100% + 60px)',
            objectFit: 'cover',
            filter: 'blur(34px)',
            opacity: 0.22,
            transform: 'scale(1.08)',
          }}
        />
      ) : null}

      {item.asset.kind === 'video' ? (
        <Video
          src={src}
          muted
          volume={0}
          loop
          trimBefore={Math.max(
            0,
            Math.round((item.clipStartSeconds ?? 0) * fps),
          )}
          trimAfter={
            item.clipEndSeconds === undefined
              ? undefined
              : Math.max(1, Math.round(item.clipEndSeconds * fps))
          }
          style={{width: '100%', height: '100%', objectFit: fit}}
        />
      ) : (
        <Img
          src={src}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            objectFit: fit,
            transform: fit === 'cover' ? `scale(${scale})` : undefined,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

export const ModernNewsCanvasScene: React.FC<
  ModernNewsCanvasSceneProps
> = ({publisher, publicationDate, headline, media, durationFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const headlineEnter = interpolate(frame, [0.16 * fps, 0.68 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const slideDuration = Math.max(
    1,
    Math.floor(durationFrames / Math.max(1, media.length)),
  );

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 28,
          right: 42,
          top: 122,
          height: 1048,
          border: `1px solid ${COLORS.line}`,
          background: COLORS.surface,
          transform: 'translate(12px, 12px)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 28,
          right: 42,
          top: 122,
          height: 1048,
          overflow: 'hidden',
          borderRadius: 3,
          background: COLORS.mediaBackground,
          boxShadow: '0 20px 46px rgba(64, 45, 33, 0.13)',
        }}
      >
        {media.map((item, index) => {
          const from = index * slideDuration;
          const remaining = durationFrames - from;
          const itemDuration =
            index === media.length - 1
              ? Math.max(1, remaining)
              : Math.min(slideDuration, remaining);

          return (
            <Sequence
              key={`${item.asset.id}-${index}`}
              from={from}
              durationInFrames={itemDuration}
              premountFor={fps}
            >
              <MediaSlide item={item} durationFrames={itemDuration} />
            </Sequence>
          );
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 28,
          top: 122,
          width: 94,
          height: 9,
          background: COLORS.orange,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 42,
          top: 1076,
          width: 9,
          height: 94,
          background: COLORS.orange,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 48,
          top: 1206,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          color: COLORS.orangeDark,
          fontFamily: FONT_MAIN,
          fontSize: 16,
          fontWeight: 800,
          letterSpacing: '0.15em',
        }}
      >
        <span
          style={{
            width: 13,
            height: 13,
            border: `4px solid ${COLORS.orange}`,
            transform: 'rotate(45deg)',
          }}
        />
        BẢN TIN · CẬP NHẬT
      </div>

      <div
        style={{
          position: 'absolute',
          right: 48,
          top: 1198,
          width: 108,
          height: 42,
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 6px)',
          gridAutoRows: '6px',
          gap: 10,
          opacity: 0.34,
        }}
      >
        {Array.from({length: 18}).map((_, index) => (
          <span
            key={index}
            style={{
              width: 6,
              height: 6,
              borderRadius: 99,
              background: COLORS.orange,
            }}
          />
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 28,
          right: 64,
          top: 1284,
          height: 326,
          border: `1px solid ${COLORS.line}`,
          background: 'rgba(255,255,255,0.68)',
          boxShadow: '8px 8px 0 rgba(240,100,43,0.12)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 48,
          right: 84,
          top: 1308,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 24,
          color: COLORS.muted,
          fontFamily: FONT_MAIN,
          fontSize: 17,
          fontWeight: 600,
          lineHeight: 1.3,
        }}
      >
        <span style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <span style={{width: 20, height: 3, background: COLORS.orange}} />
          Nguồn: {publisher}
        </span>
        <span
          style={{
            flexShrink: 0,
            paddingLeft: 20,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textAlign: 'right',
          }}
        >
          {publicationDate}
        </span>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 48,
          right: 48,
          top: 1368,
          paddingTop: 30,
          borderTop: `1px solid ${COLORS.line}`,
          color: COLORS.text,
          fontFamily: FONT_MAIN,
          fontSize: headline.length > 76 ? 48 : headline.length > 48 ? 54 : 61,
          fontWeight: 800,
          lineHeight: 1.14,
          letterSpacing: '-0.035em',
          opacity: headlineEnter,
          transform: `translateY(${interpolate(headlineEnter, [0, 1], [16, 0])}px)`,
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: -4,
            width: 174,
            height: 7,
            background: COLORS.orange,
          }}
        />
        <span
          style={{
            display: 'inline',
            background: `linear-gradient(transparent 76%, ${COLORS.orangeSoft} 76%)`,
          }}
        >
          {headline}
        </span>
      </div>
    </AbsoluteFill>
  );
};
