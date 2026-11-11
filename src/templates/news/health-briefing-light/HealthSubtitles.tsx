import React from 'react';
import { Subtitles } from '../../../components/Subtitles';
import { COLORS, TYPOGRAPHY } from './tokens';

export interface HealthSubtitlesProps {
  slug: string;
}

export const HealthSubtitles: React.FC<HealthSubtitlesProps> = ({ slug }) => (
  <Subtitles slug={slug} activeColor={COLORS.teal} fontSize={TYPOGRAPHY.subtitle} maxWords={6} />
);
