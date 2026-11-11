import React from 'react';
import {
  CurrentAffairsHook,
  type CurrentAffairsHookProps as SharedProps,
} from '../current-affairs/Scenes';
import { THEME } from './tokens';

export type SceneHookProps = Omit<SharedProps, 'theme'>;

export const SceneHook: React.FC<SceneHookProps> = (props) => (
  <CurrentAffairsHook {...props} theme={THEME} />
);
