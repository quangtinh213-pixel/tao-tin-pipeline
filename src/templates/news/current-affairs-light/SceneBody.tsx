import React from 'react';
import {
  CurrentAffairsBody,
  type CurrentAffairsBodyProps as SharedProps,
} from '../current-affairs/Scenes';
import { THEME } from './tokens';

export type SceneBodyProps = Omit<SharedProps, 'theme'>;

export const SceneBody: React.FC<SceneBodyProps> = (props) => (
  <CurrentAffairsBody {...props} theme={THEME} />
);
