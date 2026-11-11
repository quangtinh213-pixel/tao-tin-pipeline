export type AutoMarketTopic =
  | 'market'
  | 'launch'
  | 'discontinued'
  | 'ev-trend'
  | 'policy'
  | 'pricing'
  | 'consumer'
  | 'sales'
  | 'supply-chain'
  | 'other';

export type AutoMarketTone = 'growth' | 'decline' | 'shift' | 'watch' | 'neutral';

export interface AudioSegment {
  start: number;
  end: number;
  text: string;
}

export interface AutoMarketMedia {
  src: string;
  storage?: 'local' | 'remote';
  credit: string;
  alt?: string;
  fit?: 'cover' | 'contain';
  position?: string;
  mediaType?: 'ẢNH' | 'VIDEO' | 'INFOGRAPHIC';
}

export interface AutoMarketMetric {
  label: string;
  value: string;
  note?: string;
  tone?: AutoMarketTone;
}

export interface AutoMarketReason {
  label: string;
  detail?: string;
  tone?: AutoMarketTone;
}

export interface AutoMarketTimelineItem {
  time: string;
  label: string;
  detail?: string;
  tone?: AutoMarketTone;
}

export interface AutoMarketCompareRow {
  label: string;
  before: string;
  after: string;
  tone?: AutoMarketTone;
}

export interface AutoMarketQuote {
  text: string;
  source: string;
  context?: string;
}

export interface AutoMarketSceneProps {
  variant:
    | 'marketOpening'
    | 'launchBrief'
    | 'discontinuedTimeline'
    | 'evTrendExplainer'
    | 'priceShift'
    | 'policyImpact'
    | 'consumerChoice'
    | 'sourceQuote'
    | 'closingWatchlist';
  topic?: AutoMarketTopic;
  tone?: AutoMarketTone;
  section: string;
  dateline?: string;
  headline: string;
  accentWords?: string[];
  body?: string;
  body2?: string;
  media?: AutoMarketMedia;
  mediaHeight?: number;
  metrics?: AutoMarketMetric[];
  reasons?: AutoMarketReason[];
  timeline?: AutoMarketTimelineItem[];
  compareRows?: AutoMarketCompareRow[];
  quote?: AutoMarketQuote;
  checklist?: string[];
  cta?: string;
  hashtags?: string;
}

export interface AutoMarketLightScene {
  type: 'autoMarketLight';
  startFrame: number;
  durationFrames: number;
  audioSegment: AudioSegment;
  market: AutoMarketSceneProps;
}

export interface AutoMarketLightSpec {
  templateId: 'news/auto-market-light';
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    articleUrl?: string;
    publisher?: string;
    bgMusic?: string | null;
    topic?: AutoMarketTopic;
  };
  scenes: AutoMarketLightScene[];
}
