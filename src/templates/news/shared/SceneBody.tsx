/**
 * SceneBody.tsx — Shared body scene for all news/* templates.
 * Stagger: Tags(f=0) → Badge(f=0) → Headline(f=10) → Body(f=28)
 *          → Stat(f=42) → Chart(f=42) → Compare(f=42) → Image(f=55)
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Badge } from './Badge';
import { Headline } from './Headline';
import { BodyText } from './BodyText';
import { ImageCard } from './ImageCard';
import { StatCard, type StatCardProps } from './StatCard';
import { BarChart, type BarChartProps } from './BarChart';
import { CompareCard, type CompareCardProps } from './CompareCard';
import { TagRow } from './TagRow';
import type { NewsTheme, BadgeType, ImageSource, KenBurnsConfig } from './types';

export interface SceneBodyProps {
  badge: { type: BadgeType; date?: string; tags?: string[] };
  headline: string;
  body: string;
  bodyItalic?: boolean;
  tags?: string[];
  /** Single metric stat card */
  stat?: Omit<StatCardProps, 'frame' | 'startFrame' | 'theme'>;
  /** Bar chart */
  chart?: Omit<BarChartProps, 'frame' | 'startFrame' | 'theme'>;
  /** Side-by-side comparison */
  compare?: Omit<CompareCardProps, 'frame' | 'startFrame' | 'theme'>;
  image?: ImageSource;
  imageKenBurns?: KenBurnsConfig;
  imageHeight?: number;
  theme: NewsTheme;
}

export const SceneBody: React.FC<SceneBodyProps> = ({
  badge, headline, body, bodyItalic = false,
  tags, stat, chart, compare, image, imageKenBurns, imageHeight = 400, theme,
}) => {
  const frame = useCurrentFrame();
  const { layout, typography } = theme;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'flex-start', paddingTop: layout.paddingV, paddingBottom: layout.paddingV, paddingLeft: layout.paddingH, paddingRight: layout.paddingH, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 24, width: '100%' }}>
        {tags && tags.length > 0 && <TagRow tags={tags} frame={frame} startFrame={0} theme={theme} />}
        <Badge {...badge} opacity={Math.min(1, frame / 15)} theme={theme} />
        <Headline text={headline} fontSize={typography.headlineMedium} frame={frame} startFrame={10} theme={theme} />
        <BodyText text={body} italic={bodyItalic} frame={frame} startFrame={28} theme={theme} />
        {stat    && <StatCard   {...stat}    frame={frame} startFrame={42} theme={theme} />}
        {chart   && <BarChart   {...chart}   frame={frame} startFrame={42} theme={theme} />}
        {compare && <CompareCard {...compare} frame={frame} startFrame={42} theme={theme} />}
        {image   && <ImageCard image={image} height={imageHeight} kenBurns={imageKenBurns} frame={frame} startFrame={55} theme={theme} />}
      </div>
    </AbsoluteFill>
  );
};
