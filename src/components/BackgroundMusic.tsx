import React from 'react';
import {Audio, staticFile} from 'remotion';
import {getBgMusicVolume} from '../audio/backgroundMusic';

export interface BackgroundMusicProps {
  src?: string | null;
}

export const BackgroundMusic: React.FC<BackgroundMusicProps> = ({src}) => {
  if (!src) {
    return null;
  }

  return (
    <Audio
      src={staticFile(src)}
      volume={getBgMusicVolume(src)}
      loop
    />
  );
};
