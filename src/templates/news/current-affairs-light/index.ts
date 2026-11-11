export { Layout } from './Layout';
export type { LayoutProps } from './Layout';

export { SceneHook } from './SceneHook';
export type { SceneHookProps } from './SceneHook';

export { SceneBody } from './SceneBody';
export type { SceneBodyProps } from './SceneBody';

export { SceneEnding } from './SceneEnding';
export type { SceneEndingProps } from './SceneEnding';

export {
  Badge,
  Headline,
  BodyText,
  ImageCard,
  StatCard,
  TagRow,
} from '../shared';
export type {
  BadgeProps,
  ImageCardProps,
  StatCardProps,
  TagRowProps,
} from '../shared';

export {
  COLORS, FONT_MAIN, LAYOUT, TYPOGRAPHY, TEMPLATE_META, BADGE_LABELS,
} from './tokens';
export type {
  BadgeType, KenBurnsConfig, KenBurnsDirection, ImageSource,
} from './tokens';

import type { SceneHookProps } from './SceneHook';
import type { SceneBodyProps } from './SceneBody';
import type { SceneEndingProps } from './SceneEnding';

export type CurrentAffairsLightSceneType = 'hook' | 'body' | 'ending';

export interface CurrentAffairsLightScene {
  type: CurrentAffairsLightSceneType;
  startFrame: number;
  durationFrames: number;
  audioSegment: {
    start: number;
    end: number;
    text: string;
  };
  hook?: SceneHookProps;
  body?: SceneBodyProps;
  ending?: SceneEndingProps;
}

export interface CurrentAffairsLightSpec {
  templateId: 'news/current-affairs-light';
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    bgMusic?: string | null;
  };
  scenes: CurrentAffairsLightScene[];
}
