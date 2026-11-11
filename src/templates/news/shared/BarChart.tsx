/**
 * BarChart.tsx — Animated bar chart for all news/* templates.
 *
 * Bars grow upward from 0 to value, staggered per bar.
 * Labels shown below bars, optional value label above bar.
 *
 * Usage in spec.json body scene:
 *   "chart": {
 *     "type": "bar",
 *     "title": "Doanh thu theo quý (tỷ USD)",
 *     "bars": [
 *       { "label": "Q1", "value": 2.1, "highlight": false },
 *       { "label": "Q2", "value": 3.4, "highlight": false },
 *       { "label": "Q3", "value": 5.0, "highlight": true }
 *     ],
 *     "unit": "tỷ USD"
 *   }
 */

import React from 'react';
import { interpolate } from 'remotion';
import type { NewsTheme } from './types';

export interface BarData {
  label: string;
  value: number;
  /** Highlighted bar uses accent color at full opacity, others are dimmed */
  highlight?: boolean;
}

export interface BarChartProps {
  title?: string;
  bars: BarData[];
  /** Unit shown after value label, e.g. "tỷ USD", "%" */
  unit?: string;
  frame: number;
  startFrame?: number;
  theme: NewsTheme;
  /** Chart area height in px. Default: 280 */
  chartHeight?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  title, bars, unit = '', frame, startFrame = 0, theme, chartHeight = 280,
}) => {
  const { colors, typography, fontFamily, useGradientAccent } = theme;
  const f = Math.max(0, frame - startFrame);

  const maxValue = Math.max(...bars.map((b) => b.value));

  // Card fade in
  const cardOpacity = interpolate(f, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{
      width: '100%',
      background: `${colors.accent}0A`,
      border: `1px solid ${colors.accent}25`,
      borderRadius: 14,
      padding: '24px 28px',
      boxSizing: 'border-box',
      opacity: cardOpacity,
      ...(useGradientAccent ? { boxShadow: `0 0 24px ${colors.accent}0D` } : {}),
    }}>
      {/* Title */}
      {title && (
        <div style={{ fontFamily, fontSize: typography.caption, fontWeight: 700, color: colors.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>
          {title}
        </div>
      )}

      {/* Bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: chartHeight }}>
        {bars.map((bar, i) => {
          // Each bar starts 12 frames after the previous
          const barF = Math.max(0, f - i * 12);
          const barH = interpolate(barF, [0, 35], [0, chartHeight * (bar.value / maxValue)], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          const valueOpacity = interpolate(barF, [25, 45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const isHighlight = bar.highlight ?? false;
          const barColor = isHighlight ? colors.accent : `${colors.accent}55`;
          const barBg = useGradientAccent && isHighlight
            ? `linear-gradient(180deg, ${colors.gradientA ?? colors.accent} 0%, ${colors.gradientB ?? colors.accent2} 100%)`
            : barColor;

          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: chartHeight, justifyContent: 'flex-end' }}>
              {/* Value label above bar */}
              <div style={{ opacity: valueOpacity, fontFamily, fontSize: typography.caption - 2, fontWeight: 700, color: isHighlight ? colors.accent : colors.muted, marginBottom: 4 }}>
                {bar.value}{unit}
              </div>
              {/* Bar */}
              <div style={{ width: '100%', height: barH, background: barBg, borderRadius: '6px 6px 0 0', minHeight: 2 }} />
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
        {bars.map((bar, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontFamily, fontSize: typography.badge, fontWeight: 600, color: bar.highlight ? colors.accent : colors.muted }}>
            {bar.label}
          </div>
        ))}
      </div>
    </div>
  );
};
