import type {CSSProperties} from 'react';

export type ProductSceneType = 'hook' | 'pain' | 'reveal' | 'features' | 'socialProofCta';

export interface ProductMedia {
  src: string;
  storage?: 'local' | 'remote';
  alt?: string;
}

export interface ProductBadge {
  label: string;
  icon?: string;
  highlight?: boolean;
}

export interface FeatureItem {
  title: string;
  description?: string;
  badge?: string;
}

export interface ProductSceneProps {
  type: ProductSceneType;
  startFrame: number;
  durationFrames: number;

  // Header / context badge
  categoryBadge?: string;

  // Scene main text & typography
  headline: string;
  subheadline?: string;
  accentWords?: string[];

  // Visual Media (Single or Multiple rotating media)
  media?: ProductMedia;
  secondaryMedia?: ProductMedia;
  mediaList?: ProductMedia[];

  // Commerce specifics
  priceText?: string;
  originalPriceText?: string;
  ratingText?: string;
  soldText?: string;

  // Features list or pain points
  features?: FeatureItem[];
  badges?: ProductBadge[];

  // CTA info
  ctaText?: string;
  shopName?: string;
}

export interface ProductStorySpec {
  templateId: 'commerce/storytelling-showcase';
  slug: string;
  totalFrames: number;
  video: {
    productName: string;
    targetAudience?: string;
    productUrl?: string;
    shopName?: string;
    bgMusic?: string | null;
  };
  scenes: ProductSceneProps[];
}
