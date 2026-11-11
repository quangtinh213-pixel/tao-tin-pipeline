import React from 'react';
import { SceneHook as SharedSceneHook, type SceneHookProps as SharedProps } from '../shared/SceneHook';
import { THEME } from './tokens';

export type SceneHookProps = Omit<SharedProps, 'theme'>;
export const SceneHook: React.FC<SceneHookProps> = (props) => (
  <SharedSceneHook {...props} theme={THEME} />
);
