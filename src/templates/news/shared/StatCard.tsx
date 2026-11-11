/**
 * StatCard.tsx — Shared animated stat/metric card for all news/* templates.
 * Number: flat accent (light) or gradient clip-text (dark).
 */

import React from 'react';
import { interpolate, spring, useVideoConfig } from 'remotion';
import type { NewsTheme } from './types';

export interface StatCardProps {
  value: number;
  suffix?: string;
  prefix?: string;
  /** Override for non-numeric display (e.g. "GPT-5", "#1") */
  displayValue?: string;
  label: string;
  icon?: string;
  context?: string;
  frame: number;
  startFrame?: number;
  theme: NewsTheme;
}

export const StatCard: React.FC<StatCardProps> = ({
  value, suffix = '', prefix = '', displayValue,
  label, icon, context, frame, startFrame = 0, theme,
}) => {
  const { colors, typography, fontFamily, useGradientAccent } = theme;
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - startFrame);

  const cardScale   = spring({ frame: f, fps, config: { damping: 14, stiffness: 120 } });
  const cardOpacity = interpolate(f, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const countProgress = interpolate(f, [8, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const displayNumber = displayValue
    ? displayValue
    : Number.isInteger(value)
      ? Math.round(value * countProgress).toLocaleString('vi-VN')
      : (value * countProgress).toFixed(1);

  const numberStyle: React.CSSProperties = useGradientAccent
    ? {
        background: `linear-gradient(90deg, ${colors.gradientA ?? colors.accent} 0%, ${colors.gradientB ?? colors.accent2} 100%)`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      }
    : { color: colors.accent };

  return (
    <div style={{
      width: '100%',
      background: `linear-gradient(135deg, ${colors.accent}12 0%, ${colors.accent2}0A 100%)`,
      border: `1px solid ${colors.accent}25`,
      borderLeft: `4px solid ${colors.accent}`,
      borderRadius: 14,
      padding: '28px 32px',
      opacity: cardOpacity,
      transform: `scale(${cardScale})`,
      transformOrigin: 'left center',
      boxSizing: 'border-box' as const,
      ...(useGradientAccent ? { boxShadow: `0 0 24px ${colors.accent}10` } : {}),
    }}>
      {/* Label */}
      <div style={{ fontFamily, fontSize: typography.badge, fontWeight: 700, color: colors.muted, letterSpacing: '0.10em', textTransform: 'uppercase' as const, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
        {label}
      </div>

      {/* Number */}
      <div style={{ fontFamily, fontWeight: 900, fontSize: 72, lineHeight: 1, letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: 4 }}>
        {prefix && <span style={{ fontSize: 48, fontWeight: 700, ...numberStyle }}>{prefix}</span>}
        <span style={numberStyle}>{displayNumber}</span>
        {suffix && <span style={{ fontSize: 36, fontWeight: 600, color: colors.muted, marginLeft: 6 }}>{suffix}</span>}
      </div>

      {/* Context */}
      {context && (
        <div style={{ fontFamily, fontSize: typography.caption, color: colors.muted, fontWeight: 400, marginTop: 10, lineHeight: 1.4 }}>
          {context}
        </div>
      )}
    </div>
  );
};
