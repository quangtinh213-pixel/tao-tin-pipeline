/**
 * CompareCard.tsx — Side-by-side comparison card for all news/* templates.
 *
 * Two columns: left (before/old/bad) and right (after/new/good).
 * Each column fades in staggered.
 *
 * Usage in spec.json body scene:
 *   "compare": {
 *     "leftLabel": "Trước đây",
 *     "leftItems": ["Chậm", "Tốn kém", "Khó dùng"],
 *     "rightLabel": "Hiện tại",
 *     "rightItems": ["Nhanh hơn 40%", "Giảm 60% chi phí", "Tích hợp AI"],
 *     "leftIcon": "❌",
 *     "rightIcon": "✅"
 *   }
 */

import React from 'react';
import { interpolate } from 'remotion';
import type { NewsTheme } from './types';

export interface CompareCardProps {
  leftLabel: string;
  leftItems: string[];
  rightLabel: string;
  rightItems: string[];
  leftIcon?: string;
  rightIcon?: string;
  frame: number;
  startFrame?: number;
  theme: NewsTheme;
}

const NEG_COLOR = '#FF4444';
const POS_COLOR_LIGHT = '#16A34A';
const POS_COLOR_DARK  = '#00E676';

export const CompareCard: React.FC<CompareCardProps> = ({
  leftLabel, leftItems, rightLabel, rightItems,
  leftIcon = '❌', rightIcon = '✅',
  frame, startFrame = 0, theme,
}) => {
  const { colors, typography, fontFamily, useGradientAccent } = theme;
  const f = Math.max(0, frame - startFrame);
  const posColor = useGradientAccent ? POS_COLOR_DARK : POS_COLOR_LIGHT;

  const leftOpacity  = interpolate(f, [0, 20], [0, 1],  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const rightOpacity = interpolate(f, [15, 35], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const leftY        = interpolate(f, [0, 20], [20, 0],  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const rightY       = interpolate(f, [15, 35], [20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const col = (
    label: string, items: string[], icon: string, accent: string,
    op: number, ty: number, bgAlpha: string, borderAlpha: string,
  ) => (
    <div style={{
      flex: 1, opacity: op, transform: `translateY(${ty}px)`,
      background: `${accent}${bgAlpha}`,
      border: `1px solid ${accent}${borderAlpha}`,
      borderRadius: 12, padding: '20px 18px',
    }}>
      <div style={{ fontFamily, fontSize: typography.badge, fontWeight: 700, color: accent, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{icon}</span><span>{label}</span>
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ fontFamily, fontSize: typography.body - 2, color: colors.text, lineHeight: 1.5, marginBottom: i < items.length - 1 ? 10 : 0, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ color: accent, fontWeight: 700, flexShrink: 0 }}>·</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ width: '100%', display: 'flex', gap: 14 }}>
      {col(leftLabel,  leftItems,  leftIcon,  NEG_COLOR, leftOpacity,  leftY,  '12', '30')}
      {col(rightLabel, rightItems, rightIcon, posColor,  rightOpacity, rightY, '12', '30')}
    </div>
  );
};
