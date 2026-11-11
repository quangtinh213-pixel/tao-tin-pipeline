export type SportKind =
  | 'football'
  | 'basketball'
  | 'mma'
  | 'boxing'
  | 'tennis'
  | 'racing'
  | 'esports'
  | 'other';

export interface AudioSegment {
  start: number;
  end: number;
  text: string;
}

export interface SportsMedia {
  /** Remote URL, or path relative to public/. */
  src: string;
  storage?: 'local' | 'remote';
  credit: string;
  alt?: string;
  fit?: 'cover' | 'contain';
  position?: string;
  mediaType?: 'ẢNH' | 'VIDEO' | 'POSTER' | 'INFOGRAPHIC';
}

export interface SportsScore {
  home: string;
  away: string;
  homeScore?: string;
  awayScore?: string;
  status?: string;
  note?: string;
}

export interface SportsStat {
  label: string;
  value: string;
  note?: string;
}

export interface SportsTimelineItem {
  time: string;
  label: string;
  detail?: string;
}

export interface SportsQuote {
  text: string;
  source: string;
  context?: string;
}

export interface SportsSceneProps {
  variant:
    | 'opening'
    | 'scoreline'
    | 'playerSpotlight'
    | 'turningPoint'
    | 'statBoard'
    | 'timeline'
    | 'quote'
    | 'fixture'
    | 'closing';
  sport?: SportKind;
  section: string;
  headline: string;
  accentWords?: string[];
  kicker?: string;
  body?: string;
  body2?: string;
  media?: SportsMedia;
  mediaHeight?: number;
  score?: SportsScore;
  stats?: SportsStat[];
  timeline?: SportsTimelineItem[];
  quote?: SportsQuote;
  tags?: string[];
  cta?: string;
  hashtags?: string;
}

export interface SportsArenaDarkScene {
  type: 'sportsArenaDark';
  startFrame: number;
  durationFrames: number;
  audioSegment: AudioSegment;
  sports: SportsSceneProps;
}

export interface SportsArenaDarkSpec {
  templateId: 'news/sports-arena-dark';
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    articleUrl?: string;
    publisher?: string;
    bgMusic?: string | null;
    sport?: SportKind;
    competition?: string;
    venue?: string;
    matchDate?: string;
  };
  scenes: SportsArenaDarkScene[];
}
