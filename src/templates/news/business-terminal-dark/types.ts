export type BusinessTopic =
  | 'markets'
  | 'stocks'
  | 'commodities'
  | 'macro'
  | 'banking'
  | 'earnings'
  | 'real-economy'
  | 'policy'
  | 'other';

export type MarketTone = 'up' | 'down' | 'neutral' | 'warning';

export interface AudioSegment {
  start: number;
  end: number;
  text: string;
}

export interface BusinessMedia {
  src: string;
  storage?: 'local' | 'remote';
  credit: string;
  alt?: string;
  fit?: 'cover' | 'contain';
  position?: string;
  mediaType?: 'ẢNH' | 'VIDEO' | 'INFOGRAPHIC';
}

export interface TickerItem {
  symbol: string;
  value?: string;
  change?: string;
  tone?: MarketTone;
}

export interface BusinessMetric {
  label: string;
  value: string;
  change?: string;
  note?: string;
  tone?: MarketTone;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface BusinessTableRow {
  label: string;
  value: string;
  change?: string;
  tone?: MarketTone;
}

export interface BusinessRiskItem {
  label: string;
  detail?: string;
  tone?: MarketTone;
}

export interface BusinessQuote {
  text: string;
  source: string;
  context?: string;
}

export interface BusinessSceneProps {
  variant:
    | 'marketOpening'
    | 'indexMove'
    | 'commodityPrice'
    | 'macroSignal'
    | 'companyEarnings'
    | 'riskWatch'
    | 'sourceQuote'
    | 'closingOutlook';
  topic?: BusinessTopic;
  tone?: MarketTone;
  section: string;
  eyebrow?: string;
  headline: string;
  accentWords?: string[];
  body?: string;
  body2?: string;
  ticker?: TickerItem[];
  metrics?: BusinessMetric[];
  chart?: ChartPoint[];
  table?: BusinessTableRow[];
  risks?: BusinessRiskItem[];
  quote?: BusinessQuote;
  media?: BusinessMedia;
  mediaHeight?: number;
  outlook?: string[];
  cta?: string;
  hashtags?: string;
}

export interface BusinessTerminalDarkScene {
  type: 'businessTerminalDark';
  startFrame: number;
  durationFrames: number;
  audioSegment: AudioSegment;
  business: BusinessSceneProps;
}

export interface BusinessTerminalDarkSpec {
  templateId: 'news/business-terminal-dark';
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    articleUrl?: string;
    publisher?: string;
    bgMusic?: string | null;
    topic?: BusinessTopic;
  };
  scenes: BusinessTerminalDarkScene[];
}
