import type {
  AudioSegment,
  BeautySceneProps,
} from '../beauty-editorial-light/types';

export type {
  AudioSegment,
  BeautyCategory,
  BeautyComparisonItem,
  BeautyIngredient,
  BeautyMedia,
  BeautyMetric,
  BeautyQuote,
  BeautySceneProps,
  BeautySceneVariant,
  BeautyStep,
} from '../beauty-editorial-light/types';

export interface BeautyLuxuryNoirScene {
  type: 'beautyLuxuryNoir';
  startFrame: number;
  durationFrames: number;
  audioSegment: AudioSegment;
  beauty: BeautySceneProps;
}

export interface BeautyLuxuryNoirSpec {
  templateId: 'news/beauty-luxury-noir';
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    articleUrl?: string;
    publisher?: string;
    bgMusic?: string | null;
  };
  scenes: BeautyLuxuryNoirScene[];
}
