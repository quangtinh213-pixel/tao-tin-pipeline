/**
 * index.ts — Entry point for news/tech-light template.
 *
 * Usage in VideoContent.tsx:
 *
 *   import { Layout, SceneHook, SceneBody, SceneEnding } from '../templates/news/tech-light';
 *   import type { NewsTechSpec } from '../templates/news/tech-light';
 *   import specData from '../../videos/<slug>/spec.json';
 *
 *   const spec = specData as NewsTechSpec;
 *
 *   export const VideoContent: React.FC<{ slug: string }> = ({ slug }) => (
 *     <Layout slug={slug} bgMusic={spec.video.bgMusic ?? null}>
 *       <Audio src={staticFile(`${slug}/voice.mp3`)} />
 *       <AbsoluteFill>
 *         <Series>
 *           {spec.scenes.map((scene, i) => (
 *             <Series.Sequence key={i} durationInFrames={scene.durationFrames} premountFor={30}>
 *               {scene.type === 'hook'   && scene.hook   && <SceneHook   {...scene.hook} />}
 *               {scene.type === 'body'   && scene.body   && <SceneBody   {...scene.body} />}
 *               {scene.type === 'ending' && scene.ending && <SceneEnding {...scene.ending} />}
 *             </Series.Sequence>
 *           ))}
 *         </Series>
 *       </AbsoluteFill>
 *     </Layout>
 *   );
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

export type NewsTechSceneType = 'hook' | 'body' | 'ending';

export interface NewsTechScene {
  type: NewsTechSceneType;
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

export interface NewsTechSpec {
  templateId: 'news/tech-light';
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    bgMusic?: string | null;
  };
  scenes: NewsTechScene[];
}
