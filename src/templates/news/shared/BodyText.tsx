/**
 * BodyText.tsx — Shared body paragraph for all news/* templates.
 * {accent} words: flat color (light) or gradient clip-text (dark).
 */

import React from 'react';
import { interpolate } from 'remotion';
import { parseAccent } from './parseAccent';
import type { NewsTheme } from './types';

export interface BodyTextProps {
  text: string;
  italic?: boolean;
  fontSize?: number;
  frame: number;
  startFrame?: number;
  theme: NewsTheme;
}

export const BodyText: React.FC<BodyTextProps> = ({ text, italic = false, fontSize, frame, startFrame = 0, theme }) => {
  const { colors, typography, fontFamily, useGradientAccent } = theme;
  const f = Math.max(0, frame - startFrame);
  const opacity    = interpolate(f, [0, 20], [0, 1],  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const translateY = interpolate(f, [0, 20], [16, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const size = fontSize ?? typography.body;
  const segments = parseAccent(text);

  return (
    <div style={{ fontFamily, fontSize: size, fontWeight: 400, color: colors.text, lineHeight: 1.65, letterSpacing: '0.01em', fontStyle: italic ? 'italic' : 'normal', opacity, transform: `translateY(${translateY}px)`, wordBreak: 'break-word' }}>
      {segments.map((seg, i) =>
        seg.accent ? (
          useGradientAccent ? (
            <span key={i} style={{
              background: `linear-gradient(90deg, ${colors.gradientA ?? colors.accent} 0%, ${colors.gradientB ?? colors.accent2} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              fontWeight: 700,
            }}>{seg.text}</span>
          ) : (
            <span key={i} style={{ color: colors.accent, fontWeight: 700 }}>{seg.text}</span>
          )
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </div>
  );
};
