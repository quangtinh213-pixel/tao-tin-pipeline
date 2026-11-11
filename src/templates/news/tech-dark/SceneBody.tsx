import React from 'react';
import { SceneBody as SharedSceneBody, type SceneBodyProps as SharedProps } from '../shared/SceneBody';
import { THEME } from './tokens';

export type SceneBodyProps = Omit<SharedProps, 'theme'>;
export const SceneBody: React.FC<SceneBodyProps> = (props) => (
  <SharedSceneBody {...props} theme={THEME} />
);
