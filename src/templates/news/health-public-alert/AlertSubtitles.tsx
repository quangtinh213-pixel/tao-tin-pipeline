import React from 'react';
import { Subtitles } from '../../../components/Subtitles';
import { COLORS, TYPOGRAPHY } from './tokens';

export interface AlertSubtitlesProps {
  slug: string;
}

export const AlertSubtitles: React.FC<AlertSubtitlesProps> = ({ slug }) => (
  <Subtitles slug={slug} activeColor={COLORS.coral} fontSize={TYPOGRAPHY.subtitle} maxWords={6} />
);
