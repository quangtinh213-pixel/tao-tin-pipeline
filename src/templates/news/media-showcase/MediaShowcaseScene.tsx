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
import {COLORS, FONT_MAIN, MEDIA_FRAME} from './tokens';
import type {MediaShowcaseAsset, MediaShowcaseSelection} from './types';

export interface MediaShowcaseSceneProps {
  publisher: string;
  media: Array<MediaShowcaseSelection & {asset: MediaShowcaseAsset}>;
  durationFrames: number;
}

const resolveSrc = (src: string) =>
  /^https?:\/\//i.test(src) ? src : staticFile(src);

export const MEDIA_SLIDE_MIN_OPACITY = 0.98;

export const getMediaSlideOpacity = (frame: number, durationFrames: number) => {
  const fade = Math.min(12, Math.max(1, Math.floor(durationFrames / 4)));

  return interpolate(
    frame,
    [0, fade, Math.max(fade, durationFrames - fade), durationFrames],
    [MEDIA_SLIDE_MIN_OPACITY, 1, 1, MEDIA_SLIDE_MIN_OPACITY],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
  );
};

// Shorts pacing: with 2+ media in a scene, cycle them so the frame changes at least every 3s.
export const MAX_SLIDE_SECONDS = 3;

export const getSlideOrder = (mediaCount: number, durationFrames: number, fps: number) => {
  if (mediaCount < 2) return mediaCount === 1 ? [0] : [];
  const count = Math.max(mediaCount, Math.ceil(durationFrames / (MAX_SLIDE_SECONDS * fps)));
  return Array.from({length: count}, (_, index) => index % mediaCount);
};

// A single image can hold 7-12s (articles often have 1-2 photos), so long
// cover slides cut between crops of the same photo every 2.5s.
export const CROP_SECONDS = 2.5;
const CROP_ORIGINS = ['50% 45%', '28% 35%', '72% 60%', '40% 70%'];

export const getImageMotion = (frame: number, durationFrames: number, fps: number) => {
  const cropFrames = Math.round(CROP_SECONDS * fps);
  if (durationFrames <= cropFrames * 1.2) {
    return {
      scale: interpolate(frame, [0, durationFrames], [1.025, 1.075], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
      origin: CROP_ORIGINS[0],
    };
  }
  const crop = Math.floor(frame / cropFrames);
  const local = frame - crop * cropFrames;
  return {
    scale: interpolate(local, [0, cropFrames], [1.06, 1.16], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
    origin: CROP_ORIGINS[crop % CROP_ORIGINS.length],
  };
};

const MediaSlide: React.FC<{
  item: MediaShowcaseSelection & {asset: MediaShowcaseAsset};
  durationFrames: number;
}> = ({item, durationFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = getMediaSlideOpacity(frame, durationFrames);
  const motion = getImageMotion(frame, durationFrames, fps);
  const fit = item.fit ?? (item.asset.height > item.asset.width ? 'contain' : 'cover');

  return (
    <AbsoluteFill style={{opacity, background: '#101010'}}>
      {item.asset.kind === 'video' ? (
        <Video
          src={resolveSrc(item.asset.src)}
          muted
          volume={0}
          loop
          trimBefore={Math.max(0, Math.round((item.clipStartSeconds ?? 0) * fps))}
          trimAfter={
            item.clipEndSeconds === undefined
              ? undefined
              : Math.max(1, Math.round(item.clipEndSeconds * fps))
          }
          style={{width: '100%', height: '100%'}}
          objectFit={fit}
        />
      ) : (
        <Img
          src={resolveSrc(item.asset.src)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: fit,
            transform: fit === 'cover' ? `scale(${motion.scale})` : undefined,
            transformOrigin: motion.origin,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

export const MediaShowcaseScene: React.FC<MediaShowcaseSceneProps> = ({
  publisher,
  media,
  durationFrames,
}) => {
  const {fps} = useVideoConfig();
  const slides = getSlideOrder(media.length, durationFrames, fps).map((index) => media[index]);
  const slideDuration = Math.max(1, Math.floor(durationFrames / Math.max(1, slides.length)));

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: MEDIA_FRAME.top,
          height: MEDIA_FRAME.height,
          borderLeft: `4px solid ${COLORS.border}`,
          borderRight: `4px solid ${COLORS.border}`,
          borderBottom: `4px solid ${COLORS.border}`,
          overflow: 'hidden',
          background: '#101010',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '0 0 42px',
            overflow: 'hidden',
            background: '#101010',
          }}
        >
          {slides.map((item, index) => {
            const from = index * slideDuration;
            const remaining = durationFrames - from;
            const itemDuration =
              index === slides.length - 1
                ? Math.max(1, remaining)
                : Math.min(slideDuration, remaining);

            return (
              <Sequence
                key={`${item.asset.id}-${index}`}
                from={from}
                durationInFrames={itemDuration}
              >
                <MediaSlide item={item} durationFrames={itemDuration} />
              </Sequence>
            );
          })}
        </div>

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 42,
            padding: '9px 26px',
            boxSizing: 'border-box',
            background: `linear-gradient(90deg, ${COLORS.red} 0%, ${COLORS.red} 76%, rgba(255,255,255,0.94) 76%)`,
            color: '#FFFFFF',
            fontFamily: FONT_MAIN,
            fontSize: 17,
            fontWeight: 700,
          }}
        >
          Nguồn: {publisher}
        </div>
      </div>
    </AbsoluteFill>
  );
};
