/**
 * TagRow.tsx — Shared tag pills for all news/* templates.
 * First tag: accent-tinted background + accent text (or gradient text on dark).
 * Rest: secondary tint.
 */

import React from 'react';
import { spring, useVideoConfig } from 'remotion';
import type { NewsTheme } from './types';

export interface TagRowProps {
  tags: string[];
  frame: number;
  startFrame?: number;
  gap?: number;
  theme: NewsTheme;
}

export const TagRow: React.FC<TagRowProps> = ({ tags, frame, startFrame = 0, gap = 12, theme }) => {
  const { colors, typography, fontFamily, useGradientAccent } = theme;
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - startFrame);

  return (
    <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap, alignItems: 'center' }}>
      {tags.map((tag, i) => {
        const tagFrame = Math.max(0, f - i * 8);
        const scale = spring({ frame: tagFrame, fps, config: { damping: 14, stiffness: 150 } });
        const label = tag.startsWith('#') ? tag : `#${tag}`;
        const isFirst = i === 0;

        return (
          <div key={i} style={{
            transform: `scale(${scale})`,
            transformOrigin: 'left center',
            background: isFirst
              ? `${colors.accent}20`
              : `${colors.accent2}12`,
            border: isFirst
              ? `1px solid ${colors.accent}50`
              : `1px solid ${colors.accent2}30`,
            borderRadius: 999,
            padding: '7px 18px',
            fontFamily,
            fontSize: typography.badge,
            fontWeight: 600,
            letterSpacing: '0.03em',
            whiteSpace: 'nowrap' as const,
          }}>
            <span style={isFirst && useGradientAccent ? {
              background: `linear-gradient(90deg, ${colors.gradientA ?? colors.accent} 0%, ${colors.gradientB ?? colors.accent2} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            } : { color: isFirst ? colors.accent : colors.accent2 }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
