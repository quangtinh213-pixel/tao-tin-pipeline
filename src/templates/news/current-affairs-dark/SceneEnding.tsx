import React from 'react';
import {
  CurrentAffairsEnding,
  type CurrentAffairsEndingProps as SharedProps,
} from '../current-affairs/Scenes';
import { THEME } from './tokens';

export type SceneEndingProps = Omit<SharedProps, 'theme'>;

export const SceneEnding: React.FC<SceneEndingProps> = (props) => (
  <CurrentAffairsEnding {...props} theme={THEME} />
);
