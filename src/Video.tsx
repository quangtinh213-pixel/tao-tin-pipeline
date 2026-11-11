import React from 'react';
import { AbsoluteFill } from 'remotion';
import { VideoContent } from './VideoContent';

export interface VideoProps {
  slug: string;
}

export const Video: React.FC<VideoProps> = ({ slug }) => (
  <AbsoluteFill>
    <VideoContent slug={slug} />
  </AbsoluteFill>
);
