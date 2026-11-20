import React from 'react';
import {AbsoluteFill} from 'remotion';
import {LongExplainerThumbnail} from './templates/news/long-explainer/Thumbnail';
import type {VideoProps} from './Video';

export const Thumbnail: React.FC<VideoProps> = ({slug}) => (
  <AbsoluteFill>
    <LongExplainerThumbnail slug={slug} />
  </AbsoluteFill>
);
