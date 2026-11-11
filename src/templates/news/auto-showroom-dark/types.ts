export type AutoTopic =
  | 'launch'
  | 'review'
  | 'ev'
  | 'market'
  | 'price'
  | 'safety'
  | 'recall'
  | 'technology'
  | 'motorsport'
  | 'other';

export type AutoTone = 'electric' | 'performance' | 'warning' | 'neutral';

export interface AudioSegment {
  start: number;
  end: number;
  text: string;
}

export interface AutoMedia {
  src: string;
  storage?: 'local' | 'remote';
  credit: string;
  alt?: string;
  fit?: 'cover' | 'contain';
  position?: string;
  mediaType?: 'ẢNH' | 'VIDEO' | 'INFOGRAPHIC';
}

export interface AutoSpec {
  label: string;
  value: string;
  unit?: string;
  note?: string;
  tone?: AutoTone;
}

export interface AutoFeature {
  label: string;
  detail?: string;
  tone?: AutoTone;
}

export interface AutoCompareItem {
  label: string;
  left: string;
  right: string;
  winner?: 'left' | 'right' | 'tie';
}

export interface AutoIssue {
  label: string;
  detail?: string;
  tone?: AutoTone;
}

export interface AutoQuote {
  text: string;
  source: string;
  context?: string;
}

export interface AutoSceneProps {
  variant:
    | 'showroomOpening'
    | 'priceAndLaunch'
    | 'powertrainSpec'
    | 'designFeature'
    | 'marketPosition'
    | 'safetyRecall'
    | 'sourceQuote'
    | 'roadAhead';
  topic?: AutoTopic;
  tone?: AutoTone;
  badge: string;
  eyebrow?: string;
  headline: string;
  accentWords?: string[];
  body?: string;
  body2?: string;
  media?: AutoMedia;
  mediaHeight?: number;
  specs?: AutoSpec[];
  features?: AutoFeature[];
  compare?: {
    leftLabel: string;
    rightLabel: string;
    items: AutoCompareItem[];
  };
  issues?: AutoIssue[];
  quote?: AutoQuote;
  checklist?: string[];
  cta?: string;
  hashtags?: string;
}

export interface AutoShowroomDarkScene {
  type: 'autoShowroomDark';
  startFrame: number;
  durationFrames: number;
  audioSegment: AudioSegment;
  auto: AutoSceneProps;
}

export interface AutoShowroomDarkSpec {
  templateId: 'news/auto-showroom-dark';
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    articleUrl?: string;
    publisher?: string;
    bgMusic?: string | null;
    topic?: AutoTopic;
  };
  scenes: AutoShowroomDarkScene[];
}
