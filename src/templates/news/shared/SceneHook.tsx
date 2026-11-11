/**
 * SceneHook.tsx — Shared opening hook scene for all news/* templates.
 * Stagger: Tags(f=0) → Badge(f=0) → Headline(f=12) → Body(f=35)
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Badge } from './Badge';
import { Headline } from './Headline';
import { BodyText } from './BodyText';
import { TagRow } from './TagRow';
import type { NewsTheme, BadgeType } from './types';

export interface SceneHookProps {
  badge: { type: BadgeType; date?: string; tags?: string[] };
  headline: string;
  lead: string;
  tags?: string[];
  theme: NewsTheme;
}

export const SceneHook: React.FC<SceneHookProps> = ({ badge, headline, lead, tags, theme }) => {
  const frame = useCurrentFrame();
  const { layout, typography } = theme;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'flex-start', paddingTop: layout.paddingV, paddingBottom: layout.paddingV, paddingLeft: layout.paddingH, paddingRight: layout.paddingH, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 32, width: '100%' }}>
        {tags && tags.length > 0 && <TagRow tags={tags} frame={frame} startFrame={0} theme={theme} />}
        <Badge {...badge} opacity={Math.min(1, frame / 15)} theme={theme} />
        <Headline text={headline} fontSize={typography.headlineLarge} frame={frame} startFrame={12} theme={theme} />
        <BodyText text={lead} frame={frame} startFrame={35} theme={theme} />
      </div>
    </AbsoluteFill>
  );
};
