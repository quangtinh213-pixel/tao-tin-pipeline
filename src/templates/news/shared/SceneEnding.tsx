/**
 * SceneEnding.tsx — Shared closing scene for all news/* templates.
 * Always ends with a fixed "Bấm Theo Dõi" subscribe button (bell shake animation).
 * The `cta` prop is IGNORED — subscribe CTA is hardcoded so it always refers
 * to following the current channel, not anything mentioned in the article.
 */

import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Badge } from './Badge';
import { Headline } from './Headline';
import { BodyText } from './BodyText';
import type { NewsTheme, BadgeType } from './types';

export interface SceneEndingProps {
  badge?: { type: BadgeType; date?: string; tags?: string[] };
  headline: string;
  body: string;
  /** @deprecated Ignored — CTA is always the fixed subscribe button */
  cta?: string;
  theme: NewsTheme;
}

export const SceneEnding: React.FC<SceneEndingProps> = ({ badge, headline, body, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { colors, typography, layout, fontFamily, useGradientAccent } = theme;

  // Subscribe button entry animation
  const btnSpring  = spring({ frame: frame - 60, fps, config: { damping: 14, stiffness: 120, mass: 0.8 } });
  const btnY       = interpolate(btnSpring, [0, 1], [48, 0]);
  const btnOpacity = interpolate(frame, [60, 78], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Button subtle scale pulse after entry
  const btnPulse = frame >= 90
    ? interpolate(Math.sin((frame - 90) * 0.05), [-1, 1], [1.0, 1.012])
    : 1;

  // Bell shake: rapid oscillation that loops continuously
  // Pattern: 3 quick shakes every ~60 frames (2s cycle)
  const bellCycle = (frame - 80) % 60; // 0–59 repeating cycle
  let bellRotate = 0;
  if (frame >= 80) {
    if (bellCycle < 8)  bellRotate = interpolate(bellCycle, [0, 4, 8], [0, 18, 0]);
    else if (bellCycle < 16) bellRotate = interpolate(bellCycle, [8, 12, 16], [0, -16, 0]);
    else if (bellCycle < 22) bellRotate = interpolate(bellCycle, [16, 19, 22], [0, 12, 0]);
    else bellRotate = 0;
  }

  const ctaBg = useGradientAccent
    ? `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accent2} 100%)`
    : `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accent}CC 100%)`;

  const ctaShadow = useGradientAccent
    ? `0 8px 40px ${colors.accent}40, 0 0 0 1px ${colors.accent}30`
    : `0 8px 32px ${colors.accent}40`;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'flex-start', paddingTop: layout.paddingV, paddingBottom: layout.paddingV, paddingLeft: layout.paddingH, paddingRight: layout.paddingH, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 28, width: '100%' }}>
        {badge && <Badge {...badge} opacity={Math.min(1, frame / 15)} theme={theme} />}
        <Headline text={headline} fontSize={typography.headlineMedium} frame={frame} startFrame={10} theme={theme} />
        <BodyText text={body} frame={frame} startFrame={28} theme={theme} />

        {/* Fixed subscribe CTA — compact pill button, centered */}
        <div
          style={{
            opacity: btnOpacity,
            transform: `translateY(${btnY}px) scale(${btnPulse})`,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: ctaBg,
              borderRadius: 999,
              paddingTop: 22,
              paddingBottom: 22,
              paddingLeft: 40,
              paddingRight: 48,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              boxShadow: ctaShadow,
            }}
          >
            {/* Bell icon with shake animation */}
            <div
              style={{
                flexShrink: 0,
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.20)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                transformOrigin: '50% 20%',
                transform: `rotate(${bellRotate}deg)`,
              }}
            >
              🔔
            </div>

            {/* Label */}
            <div
              style={{
                fontFamily,
                fontSize: 32,
                fontWeight: 900,
                color: '#FFFFFF',
                lineHeight: 1,
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
              }}
            >
              Bấm Theo Dõi
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
