/**
 * index.ts — Barrel export for all shared news/* components and types.
 */

export * from './types';
export * from './parseAccent';

export { Badge }        from './Badge';
export type { BadgeProps }       from './Badge';

export { Headline }     from './Headline';
export type { HeadlineProps }    from './Headline';

export { BodyText }     from './BodyText';
export type { BodyTextProps }    from './BodyText';

export { TagRow }       from './TagRow';
export type { TagRowProps }      from './TagRow';

export { StatCard }     from './StatCard';
export type { StatCardProps }    from './StatCard';

export { ImageCard }    from './ImageCard';
export type { ImageCardProps }   from './ImageCard';

export { BarChart }     from './BarChart';
export type { BarChartProps, BarData } from './BarChart';

export { CompareCard }  from './CompareCard';
export type { CompareCardProps } from './CompareCard';

export { ParticleNetwork } from './ParticleNetwork';
export type { ParticleNetworkProps } from './ParticleNetwork';

export { SceneHook }    from './SceneHook';
export type { SceneHookProps }   from './SceneHook';

export { SceneBody }    from './SceneBody';
export type { SceneBodyProps }   from './SceneBody';

export { SceneEnding }  from './SceneEnding';
export type { SceneEndingProps } from './SceneEnding';
