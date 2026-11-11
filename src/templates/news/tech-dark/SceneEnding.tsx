import React from 'react';
import { SceneEnding as SharedSceneEnding, type SceneEndingProps as SharedProps } from '../shared/SceneEnding';
import { THEME } from './tokens';

export type SceneEndingProps = Omit<SharedProps, 'theme'>;
export const SceneEnding: React.FC<SceneEndingProps> = (props) => (
  <SharedSceneEnding {...props} theme={THEME} />
);
