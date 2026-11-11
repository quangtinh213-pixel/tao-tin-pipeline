/**
 * Headline.tsx — Shared headline for all news/* templates.
 *
 * - Slide up + fade in animation
 * - {accent} words: flat color (light) or CSS gradient clip-text (dark)
 * - Expanding divider line under text
 */

import React from 'react';
import { interpolate } from 'remotion';
import { parseAccent } from './parseAccent';
import type { NewsTheme } from './types';

export interface HeadlineProps {
  text: string;
  fontSize?: number;
  frame: number;
  startFrame?: number;
  theme: NewsTheme;
}

export const Headline: React.FC<HeadlineProps> = ({ text, fontSize, frame, startFrame = 0, theme }) => {
  const { colors, typography, layout, fontFamily, useGradientAccent } = theme;
  const size = fontSize ?? typography.headlineLarge;
  const f = Math.max(0, frame - startFrame);

  const translateY = interpolate(f, [0, 25], [32, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity    = interpolate(f, [0, 20], [0, 1],  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const dividerW   = interpolate(f, [20, 45], [0, layout.dividerWidth], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const segments = parseAccent(text);

  const dividerStyle: React.CSSProperties = useGradientAccent
    ? {
        width: dividerW, height: layout.dividerHeight,
        background: `linear-gradient(90deg, ${colors.gradientA ?? colors.accent} 0%, ${colors.gradientB ?? colors.accent2} 100%)`,
        borderRadius: 3,
        boxShadow: `0 0 8px ${colors.accent}80`,
      }
    : {
        width: dividerW, height: layout.dividerHeight,
        background: colors.accent,
        borderRadius: 3,
      };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, opacity, transform: `translateY(${translateY}px)` }}>
      <div style={{ fontFamily, fontSize: size, fontWeight: 900, color: colors.text, lineHeight: 1.15, letterSpacing: '-0.01em', wordBreak: 'break-word' }}>
        {segments.map((seg, i) =>
          seg.accent ? (
            useGradientAccent ? (
              <span key={i} style={{
                background: `linear-gradient(90deg, ${colors.gradientA ?? colors.accent} 0%, ${colors.gradientB ?? colors.accent2} 100%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>{seg.text}</span>
            ) : (
              <span key={i} style={{ color: colors.accent }}>{seg.text}</span>
            )
          ) : (
            <span key={i} style={{ color: colors.text }}>{seg.text}</span>
          )
        )}
      </div>
      <div style={dividerStyle} />
    </div>
  );
};
