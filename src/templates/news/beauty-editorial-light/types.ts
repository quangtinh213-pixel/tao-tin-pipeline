export type BeautyCategory =
  | 'skincare'
  | 'makeup'
  | 'hair'
  | 'nails'
  | 'cosmetic-procedure'
  | 'wellness'
  | 'beauty-trend'
  | 'product-news';

export type BeautySceneVariant =
  | 'beautyOpening'
  | 'productFocus'
  | 'ingredientDecode'
  | 'routineSteps'
  | 'beforeAfterEvidence'
  | 'treatmentTimeline'
  | 'benefitRisk'
  | 'expertQuote'
  | 'mythFact'
  | 'trendBoard'
  | 'safetyAlert'
  | 'beautyClosing';

export interface AudioSegment {
  start: number;
  end: number;
  text: string;
}

export interface BeautyMedia {
  /** Remote URL, or path relative to public/. */
  src: string;
  storage?: 'local' | 'remote';
  credit: string;
  alt?: string;
  fit?: 'cover' | 'contain';
  position?: string;
  mediaType?: 'ẢNH' | 'VIDEO' | 'SẢN PHẨM' | 'CHÂN DUNG' | 'MINH HỌA';
}

export interface BeautyIngredient {
  name: string;
  role: string;
  note?: string;
  tone?: 'rose' | 'sage' | 'clinical' | 'neutral';
}

export interface BeautyStep {
  label: string;
  detail?: string;
  meta?: string;
}

export interface BeautyMetric {
  label: string;
  value: string;
  note?: string;
  tone?: 'rose' | 'sage' | 'clinical' | 'warning';
}

export interface BeautyComparisonItem {
  label: string;
  value: string;
  detail?: string;
  tone?: 'benefit' | 'risk' | 'neutral';
}

export interface BeautyQuote {
  text: string;
  source: string;
  context?: string;
}

export interface BeautySceneProps {
  variant: BeautySceneVariant;
  category: BeautyCategory;
  section: string;
  eyebrow?: string;
  headline: string;
  accentWords?: string[];
  body?: string;
  body2?: string;
  media?: BeautyMedia;
  gallery?: BeautyMedia[];
  mediaHeight?: number;
  ingredients?: BeautyIngredient[];
  steps?: BeautyStep[];
  metrics?: BeautyMetric[];
  comparison?: BeautyComparisonItem[];
  quote?: BeautyQuote;
  cautions?: string[];
  sourceNote?: string;
  cta?: string;
  hashtags?: string;
}

export interface BeautyEditorialLightScene {
  type: 'beautyEditorialLight';
  startFrame: number;
  durationFrames: number;
  audioSegment: AudioSegment;
  beauty: BeautySceneProps;
}

export interface BeautyEditorialLightSpec {
  templateId: 'news/beauty-editorial-light';
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    articleUrl?: string;
    publisher?: string;
    bgMusic?: string | null;
  };
  scenes: BeautyEditorialLightScene[];
}
