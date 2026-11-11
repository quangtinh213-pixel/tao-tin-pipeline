export type AlertLevel = 'watch' | 'advisory' | 'warning' | 'urgent';

export interface AudioSegment {
  start: number;
  end: number;
  text: string;
}

export interface AlertMedia {
  /** Remote URL, or path relative to public/. */
  src: string;
  storage?: 'local' | 'remote';
  credit: string;
  alt?: string;
  fit?: 'cover' | 'contain';
  position?: string;
  mediaType?: 'ẢNH' | 'VIDEO' | 'INFOGRAPHIC';
}

export interface AlertItem {
  label: string;
  text: string;
  tone?: 'neutral' | 'warning' | 'safe';
}

export interface AlertTimelineItem {
  time: string;
  label: string;
  detail?: string;
}

export interface AlertQuote {
  text: string;
  source: string;
  context?: string;
}

export interface AlertSceneProps {
  variant:
    | 'alertOpening'
    | 'sourceEvidence'
    | 'affectedGroup'
    | 'riskLevel'
    | 'symptomChecklist'
    | 'actionSteps'
    | 'avoidList'
    | 'timeline'
    | 'sourceQuote'
    | 'closing';
  level?: AlertLevel;
  meta: string;
  headline: string;
  accentWords?: string[];
  body?: string;
  body2?: string;
  media?: AlertMedia;
  mediaHeight?: number;
  riskLabel?: string;
  riskValue?: string;
  riskNote?: string;
  items?: AlertItem[];
  timeline?: AlertTimelineItem[];
  quote?: AlertQuote;
  sourceLine?: string;
  cta?: string;
  hashtags?: string;
}

export interface HealthPublicAlertScene {
  type: 'healthPublicAlert';
  startFrame: number;
  durationFrames: number;
  audioSegment: AudioSegment;
  alert: AlertSceneProps;
}

export interface HealthPublicAlertSpec {
  templateId: 'news/health-public-alert';
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    articleUrl?: string;
    publisher?: string;
    bgMusic?: string | null;
  };
  scenes: HealthPublicAlertScene[];
}
