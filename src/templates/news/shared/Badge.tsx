/**
 * Badge.tsx — Shared news badge for all news/* templates.
 *
 * Appearance controlled by NewsTheme:
 *   - useGradientAccent=false (light): flat accent color dot + text
 *   - useGradientAccent=true  (dark):  glowing dot + gradient clip-text label
 */

import React from 'react';
import { BADGE_LABELS, type BadgeType, type NewsTheme } from './types';

export interface BadgeProps {
  type: BadgeType;
  date?: string;
  /** Flag + country tags, e.g. ["🇺🇸 Hoa Kỳ", "🇨🇳 Trung Quốc"] */
  tags?: string[];
  opacity?: number;
  theme: NewsTheme;
}

export const Badge: React.FC<BadgeProps> = ({ type, date, tags, opacity = 1, theme }) => {
  const { colors, typography, fontFamily, useGradientAccent } = theme;

  const dotStyle: React.CSSProperties = {
    width: 10, height: 10, borderRadius: '50%',
    background: colors.accent,
    display: 'inline-block', flexShrink: 0,
    ...(useGradientAccent ? { boxShadow: `0 0 8px ${colors.accent}` } : {}),
  };

  const labelStyle: React.CSSProperties = useGradientAccent
    ? {
        fontSize: typography.badge, fontWeight: 700,
        background: `linear-gradient(90deg, ${colors.gradientA ?? colors.accent} 0%, ${colors.gradientB ?? colors.accent2} 100%)`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        letterSpacing: '0.08em', textTransform: 'uppercase' as const,
      }
    : {
        fontSize: typography.badge, fontWeight: 700,
        color: colors.accent,
        letterSpacing: '0.08em', textTransform: 'uppercase' as const,
      };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily }}>
        <span style={dotStyle} />
        <span style={labelStyle}>{BADGE_LABELS[type]}</span>
        {date && (
          <>
            <span style={{ fontSize: typography.badge, color: colors.muted, fontWeight: 400 }}>·</span>
            <span style={{ fontSize: typography.badge, color: colors.muted, fontWeight: 600 }}>{date}</span>
          </>
        )}
      </div>
      {tags && tags.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily, fontSize: typography.badge, color: colors.text, fontWeight: 600 }}>
          {tags.map((tag, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span style={{ color: colors.muted, fontWeight: 400 }}>→</span>}
              <span>{tag}</span>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
