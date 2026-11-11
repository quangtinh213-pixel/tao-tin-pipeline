import React from 'react';
import {Img, type ImgProps} from 'remotion';
import {
  PIXEL_BORDER_WIDTH,
  PIXEL_FONT_BODY,
  PIXEL_FONT_DISPLAY,
  PIXEL_FONT_TERMINAL,
  PIXEL_SHADOW,
  PIXEL_STYLE_COLORS,
  PIXEL_UNIT,
} from './tokens';

export interface PixelFrameProps {
  children: React.ReactNode;
  accent?: string;
  background?: string;
  style?: React.CSSProperties;
  title?: string;
}

export const PixelFrame: React.FC<PixelFrameProps> = ({
  children,
  accent = PIXEL_STYLE_COLORS.cyan,
  background = PIXEL_STYLE_COLORS.surface,
  style,
  title,
}) => (
  <div
    style={{
      position: 'relative',
      border: `${PIXEL_BORDER_WIDTH}px solid ${accent}`,
      background,
      boxShadow: PIXEL_SHADOW,
      padding: PIXEL_UNIT * 6,
      ...style,
    }}
  >
    {title ? (
      <div
        style={{
          position: 'absolute',
          top: -PIXEL_UNIT * 5,
          left: PIXEL_UNIT * 4,
          background: accent,
          color: PIXEL_STYLE_COLORS.background,
          fontFamily: PIXEL_FONT_DISPLAY,
          fontSize: 24,
          fontWeight: 700,
          lineHeight: 1,
          padding: `${PIXEL_UNIT * 2}px ${PIXEL_UNIT * 3}px`,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </div>
    ) : null}
    {children}
  </div>
);

export interface PixelTextProps {
  children: React.ReactNode;
  variant?: 'display' | 'body' | 'terminal';
  color?: string;
  style?: React.CSSProperties;
}

export const PixelText: React.FC<PixelTextProps> = ({
  children,
  variant = 'display',
  color = PIXEL_STYLE_COLORS.text,
  style,
}) => (
  <div
    style={{
      color,
      fontFamily:
        variant === 'body'
          ? PIXEL_FONT_BODY
          : variant === 'terminal'
            ? PIXEL_FONT_TERMINAL
            : PIXEL_FONT_DISPLAY,
      fontWeight: variant === 'display' ? 700 : 400,
      lineHeight: variant === 'display' ? 0.95 : 1.25,
      ...style,
    }}
  >
    {children}
  </div>
);

export interface PixelImageProps extends ImgProps {
  frameColor?: string;
  framed?: boolean;
}

export const PixelImage: React.FC<PixelImageProps> = ({
  frameColor = PIXEL_STYLE_COLORS.text,
  framed = true,
  style,
  ...props
}) => (
  <Img
    {...props}
    style={{
      display: 'block',
      imageRendering: 'pixelated',
      border: framed ? `${PIXEL_BORDER_WIDTH}px solid ${frameColor}` : undefined,
      boxShadow: framed ? PIXEL_SHADOW : undefined,
      ...style,
    }}
  />
);

export const PixelBadge: React.FC<{
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}> = ({children, color = PIXEL_STYLE_COLORS.green, style}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      background: color,
      color: PIXEL_STYLE_COLORS.background,
      fontFamily: PIXEL_FONT_DISPLAY,
      fontSize: 24,
      fontWeight: 700,
      lineHeight: 1,
      padding: `${PIXEL_UNIT * 2}px ${PIXEL_UNIT * 3}px`,
      boxShadow: `${PIXEL_UNIT}px ${PIXEL_UNIT}px 0 ${PIXEL_STYLE_COLORS.shadow}`,
      textTransform: 'uppercase',
      ...style,
    }}
  >
    {children}
  </div>
);
