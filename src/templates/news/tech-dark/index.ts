/**
 * index.ts — Entry point for news/tech-dark template.
 *
 * Usage in VideoContent.tsx:
 *
 *   import { Layout, SceneHook, SceneBody, SceneEnding } from '../templates/news/tech-dark';
 *   import type { NewsTechDarkSpec } from '../templates/news/tech-dark';
 */

export { Layout } from './Layout';
export type { LayoutProps } from './Layout';

export { SceneHook } from './SceneHook';
export type { SceneHookProps } from './SceneHook';

export { SceneBody } from './SceneBody';
export type { SceneBodyProps } from './SceneBody';

export { SceneEnding } from './SceneEnding';
export type { SceneEndingProps } from './SceneEnding';

export { Badge } from './Badge';
export type { BadgeProps } from './Badge';

export { Headline } from './Headline';
export { BodyText } from './BodyText';
export { ImageCard } from './ImageCard';
export type { ImageCardProps } from './ImageCard';

export { StatCard } from './StatCard';
export type { StatCardProps } from './StatCard';

export { TagRow } from './TagRow';
export type { TagRowProps } from './TagRow';

export {
  COLORS, FONT_MAIN, LAYOUT, TYPOGRAPHY, TEMPLATE_META, BADGE_LABELS,
} from './tokens';
export type {
  BadgeType, KenBurnsConfig, KenBurnsDirection, ImageSource,
} from './tokens';

// ─── Spec types ───────────────────────────────────────────────────────────────

import type { SceneHookProps } from './SceneHook';
import type { SceneBodyProps } from './SceneBody';
import type { SceneEndingProps } from './SceneEnding';

export type NewsTechDarkSceneType = 'hook' | 'body' | 'ending';

export interface NewsTechDarkScene {
  type: NewsTechDarkSceneType;
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

export interface NewsTechDarkSpec {
  templateId: 'news/tech-dark';
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    bgMusic?: string | null;
  };
  scenes: NewsTechDarkScene[];
}
