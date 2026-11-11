export {DemoVideoScene} from './DemoVideoScene';
export type {DemoVideoSceneProps} from './DemoVideoScene';

// Demo Scroll inherits the creative layout and transition system.
export {
  addTransitionHandles,
  DEFAULT_TRANSITION_FRAMES,
  FREE_STYLE_SAFE_AREA,
  FreeStyleLayout,
  freeStyleTransition,
} from '../free-style';
export type {FreeStyleLayoutProps} from '../free-style';

export {
  FreeStyleSfxLayout,
  getSceneEntrySfxEvents,
  MAX_TRANSITION_SFX_VOLUME,
  REMOTION_SFX,
  TRANSITION_SFX,
  TRANSITION_SFX_DEFAULT_VOLUME,
} from '../free-style-sfx';
export type {
  FreeStyleSfxLayoutProps,
  RemotionSfxName,
  ResolvedSceneEntrySfx,
  SceneEntrySfx,
  SceneWithEntrySfx,
  TransitionSfxName,
} from '../free-style-sfx';
