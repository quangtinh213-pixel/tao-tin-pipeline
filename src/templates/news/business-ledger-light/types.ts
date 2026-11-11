export type LedgerTopic =
  | 'markets'
  | 'stocks'
  | 'commodities'
  | 'macro'
  | 'banking'
  | 'earnings'
  | 'trade'
  | 'consumer'
  | 'policy'
  | 'other';

export type LedgerTone = 'gain' | 'loss' | 'watch' | 'neutral';

export interface AudioSegment {
  start: number;
  end: number;
  text: string;
}

export interface LedgerMedia {
  src: string;
  storage?: 'local' | 'remote';
  credit: string;
  alt?: string;
  fit?: 'cover' | 'contain';
  position?: string;
  mediaType?: 'ẢNH' | 'VIDEO' | 'INFOGRAPHIC';
}

export interface LedgerMetric {
  label: string;
  value: string;
  note?: string;
  tone?: LedgerTone;
}

export interface LedgerRow {
  label: string;
  value: string;
  note?: string;
  tone?: LedgerTone;
}

export interface LedgerTimelineItem {
  time: string;
  label: string;
  detail?: string;
}

export interface LedgerQuote {
  text: string;
  source: string;
  context?: string;
}

export interface LedgerSceneProps {
  variant:
    | 'frontPage'
    | 'marketLedger'
    | 'macroMemo'
    | 'companySheet'
    | 'commodityNotebook'
    | 'policyImpact'
    | 'quoteColumn'
    | 'closingBrief';
  topic?: LedgerTopic;
  tone?: LedgerTone;
  section: string;
  dateline?: string;
  headline: string;
  accentWords?: string[];
  body?: string;
  body2?: string;
  metrics?: LedgerMetric[];
  rows?: LedgerRow[];
  timeline?: LedgerTimelineItem[];
  quote?: LedgerQuote;
  media?: LedgerMedia;
  mediaHeight?: number;
  checklist?: string[];
  cta?: string;
  hashtags?: string;
}

export interface BusinessLedgerLightScene {
  type: 'businessLedgerLight';
  startFrame: number;
  durationFrames: number;
  audioSegment: AudioSegment;
  ledger: LedgerSceneProps;
}

export interface BusinessLedgerLightSpec {
  templateId: 'news/business-ledger-light';
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    articleUrl?: string;
    publisher?: string;
    bgMusic?: string | null;
    topic?: LedgerTopic;
  };
  scenes: BusinessLedgerLightScene[];
}
