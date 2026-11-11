import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  FREE_STYLE_SAFE_AREA,
  FreeStyleLayout,
  type FreeStyleLayoutProps,
} from '../free-style';
import {PIXEL_FONT_BODY, PIXEL_STYLE_COLORS, PIXEL_UNIT} from './tokens';

export const PIXEL_STYLE_SAFE_AREA = FREE_STYLE_SAFE_AREA;

export interface PixelStyleLayoutProps extends FreeStyleLayoutProps {
  gridColor?: string;
  showGrid?: boolean;
  showScanlines?: boolean;
}

export const PixelStyleLayout: React.FC<PixelStyleLayoutProps> = ({
  background = PIXEL_STYLE_COLORS.background,
  children,
  gridColor = 'rgba(69, 217, 255, 0.07)',
  showGrid = true,
  showScanlines = true,
  subtitleAccent = PIXEL_STYLE_COLORS.gold,
  ...layoutProps
}) => (
  <FreeStyleLayout
    {...layoutProps}
    background={background}
    subtitleAccent={subtitleAccent}
  >
    <AbsoluteFill
      style={{
        fontFamily: PIXEL_FONT_BODY,
        overflow: 'hidden',
      }}
    >
      {showGrid ? (
        <AbsoluteFill
          style={{
            backgroundImage: [
              `linear-gradient(${gridColor} ${PIXEL_UNIT}px, transparent ${PIXEL_UNIT}px)`,
              `linear-gradient(90deg, ${gridColor} ${PIXEL_UNIT}px, transparent ${PIXEL_UNIT}px)`,
            ].join(','),
            backgroundSize: `${PIXEL_UNIT * 8}px ${PIXEL_UNIT * 8}px`,
            pointerEvents: 'none',
          }}
        />
      ) : null}

      <AbsoluteFill>{children}</AbsoluteFill>

      {showScanlines ? (
        <AbsoluteFill
          style={{
            backgroundImage:
              'repeating-linear-gradient(180deg, transparent 0, transparent 6px, rgba(0, 0, 0, 0.12) 6px, rgba(0, 0, 0, 0.12) 8px)',
            mixBlendMode: 'multiply',
            opacity: 0.45,
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </AbsoluteFill>
  </FreeStyleLayout>
);
