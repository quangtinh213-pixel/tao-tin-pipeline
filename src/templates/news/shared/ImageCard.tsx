/**
 * ImageCard.tsx — Shared image/video card for all news/* templates.
 *
 * - Auto aspect-ratio detection via delayRender/continueRender
 * - Ken Burns zoom (cover mode only)
 * - Top-left media type badge, top-right location label
 * - MANDATORY source credit bar
 */

import React, { useEffect, useState } from 'react';
import { continueRender, delayRender, Img, interpolate, staticFile } from 'remotion';
import { Video } from '@remotion/media';
import { getImageDimensions, getVideoMetadata } from '@remotion/media-utils';
import type { NewsTheme, ImageSource, KenBurnsConfig } from './types';

const VIDEO_EXTENSION = /\.(mp4|mov)(?:[?#].*)?$/i;
const VERTICAL_MEDIA_MAX_HEIGHT = 560;

export const isVideoSource = (image: ImageSource): boolean =>
  VIDEO_EXTENSION.test(image.src);

export const isVerticalNineBySixteen = (width: number, height: number): boolean => {
  const aspectRatio = width / height;
  return height > width && Math.abs(aspectRatio - 9 / 16) <= 0.08;
};

export const resolveMediaSrc = (image: ImageSource): string =>
  image.src.startsWith('http') ? image.src : staticFile(image.src);

export const useMediaDimensions = (image: ImageSource | undefined): { width: number; height: number } | null => {
  const src = image ? resolveMediaSrc(image) : null;
  const [handle] = useState(() => image && src ? delayRender(`Loading media metadata: ${src}`) : null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!image || !src || handle === null) return;

      try {
        const metadata = isVideoSource(image)
          ? await getVideoMetadata(src)
          : await getImageDimensions(src);
        if (!cancelled) {
          setDimensions({ width: metadata.width, height: metadata.height });
        }
      } catch {
        if (!cancelled) {
          setDimensions({ width: 16, height: 9 });
        }
      } finally {
        continueRender(handle);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [handle, image, src]);

  return dimensions;
};

export interface ImageCardProps {
  image: ImageSource;
  width?: number | string;
  height?: number;
  kenBurns?: KenBurnsConfig;
  frame: number;
  startFrame?: number;
  fadeInDuration?: number;
  theme: NewsTheme;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  image, width = '100%', height = 480,
  kenBurns, frame, startFrame = 0, fadeInDuration = 20, theme,
}) => {
  const { colors, typography, layout, fontFamily, useGradientAccent } = theme;
  const f = Math.max(0, frame - startFrame);

  const naturalSize = useMediaDimensions(image);
  const verticalNineBySixteen = naturalSize
    ? isVerticalNineBySixteen(naturalSize.width, naturalSize.height)
    : false;
  const requestedHeight = verticalNineBySixteen
    ? Math.min(height, VERTICAL_MEDIA_MAX_HEIGHT)
    : height;

  const cardPixelWidth = typeof width === 'number' ? width : layout.width - layout.paddingH * 2;

  const objectFit: 'cover' | 'contain' = (() => {
    if (!naturalSize) return 'cover';
    if (verticalNineBySixteen) return 'contain';
    return (naturalSize.width / naturalSize.height) >= (cardPixelWidth / requestedHeight) ? 'cover' : 'contain';
  })();

  const displayHeight = (() => {
    if (!naturalSize) return requestedHeight;
    if (verticalNineBySixteen) return requestedHeight;
    return objectFit === 'cover'
      ? requestedHeight
      : Math.round(cardPixelWidth / (naturalSize.width / naturalSize.height));
  })();

  const cardOpacity = interpolate(f, [0, fadeInDuration], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const cardScale   = interpolate(f, [0, fadeInDuration], [0.97, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const imgTransform = (() => {
    if (objectFit === 'contain') return 'scale(1)';
    if (!kenBurns) return 'scale(1.04)';
    const { direction, startScale = 1.0, endScale = 1.08 } = kenBurns;
    const scale = direction === 'zoom-out'
      ? interpolate(f, [0, 120], [endScale, startScale], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      : interpolate(f, [0, 120], [startScale, endScale], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    return `scale(${scale})`;
  })();

  const imgSrc = resolveMediaSrc(image);
  const mediaStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectPosition: 'center',
    transform: imgTransform,
    transformOrigin: 'center center',
  };

  return (
    <div style={{
      width,
      opacity: cardOpacity,
      transform: `scale(${cardScale})`,
      borderRadius: layout.cardRadius,
      overflow: 'hidden',
      background: colors.cardBg,
      border: useGradientAccent ? `1px solid ${colors.border}` : undefined,
      boxShadow: useGradientAccent
        ? `0 4px 32px rgba(0,0,0,0.40), 0 0 0 1px ${colors.accent}15`
        : '0 4px 24px rgba(0,0,0,0.10)',
    }}>
      <div style={{ position: 'relative', height: displayHeight, overflow: 'hidden', background: colors.cardBg }}>
        {isVideoSource(image) ? (
          <Video
            src={imgSrc}
            muted
            loop
            objectFit={objectFit}
            style={mediaStyle}
          />
        ) : (
          <Img src={imgSrc} style={mediaStyle} />
        )}

        {image.mediaType && (
          <div style={{
            position: 'absolute', top: 14, left: 14,
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,0,0,0.70)', borderRadius: 6, padding: '5px 12px',
            ...(useGradientAccent ? { border: `1px solid ${colors.accent}40` } : {}),
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: colors.accent, display: 'inline-block', ...(useGradientAccent ? { boxShadow: `0 0 6px ${colors.accent}` } : {}) }} />
            <span style={{ fontFamily, fontSize: 16, fontWeight: 700, color: useGradientAccent ? colors.accent : '#FFFFFF', letterSpacing: '0.05em' }}>
              {image.mediaType}
            </span>
          </div>
        )}

        {image.locationLabel && (
          <div style={{
            position: 'absolute', top: 14, right: 14,
            background: useGradientAccent ? 'rgba(0,0,0,0.70)' : 'rgba(255,255,255,0.85)',
            borderRadius: 6, padding: '5px 12px',
            fontFamily, fontSize: 16, fontWeight: 600, color: colors.text,
            ...(useGradientAccent ? { border: `1px solid ${colors.border}` } : {}),
          }}>
            {image.locationLabel}
          </div>
        )}
      </div>

      {/* Caption bar */}
      <div style={{
        padding: '12px 16px', background: colors.cardBg,
        display: 'flex', alignItems: 'center', gap: 8,
        ...(useGradientAccent ? { borderTop: `1px solid ${colors.border}` } : {}),
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors.accent, display: 'inline-block', flexShrink: 0, ...(useGradientAccent ? { boxShadow: `0 0 6px ${colors.accent}` } : {}) }} />
        <span style={{ fontFamily, fontSize: typography.caption, color: colors.muted, fontWeight: 500 }}>
          Nguồn: <strong style={{ color: colors.accent, fontWeight: 700 }}>{image.credit}</strong>
          {image.date ? ` · ${image.date}` : ''}
        </span>
      </div>
    </div>
  );
};
