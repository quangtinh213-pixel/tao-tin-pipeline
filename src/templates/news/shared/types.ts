/**
 * types.ts — Shared types and constants for all news/* templates.
 *
 * Imported by both tech-light and tech-dark (and any future news template).
 * No component code, no colors — pure types and label maps.
 */

// ─── Badge ────────────────────────────────────────────────────────────────────
export type BadgeType =
  | 'breaking'    // TIN NÓNG
  | 'event'       // SỰ KIỆN
  | 'analysis'    // PHÂN TÍCH
  | 'exclusive'   // ĐỘC QUYỀN
  | 'update'      // CẬP NHẬT
  | 'summary'     // TÓM TẮT
  | 'ending';     // KẾT LUẬN

export const BADGE_LABELS: Record<BadgeType, string> = {
  breaking:  'TIN NÓNG',
  event:     'SỰ KIỆN',
  analysis:  'PHÂN TÍCH',
  exclusive: 'ĐỘC QUYỀN',
  update:    'CẬP NHẬT',
  summary:   'TÓM TẮT',
  ending:    'KẾT LUẬN',
};

// ─── Image source ─────────────────────────────────────────────────────────────
export interface ImageSource {
  /** URL or staticFile path */
  src: string;
  /** Display credit: "VnExpress", "Reuters", "AP"… */
  credit: string;
  /** Publication date string, e.g. "15/5/2026" */
  date?: string;
  /** Short label shown in corner badge, e.g. "VIDEO", "ẢNH" */
  mediaType?: 'VIDEO' | 'ẢNH' | 'INFOGRAPHIC';
  /** Geographic label shown top-right, e.g. "Bắc Kinh" */
  locationLabel?: string;
}

// ─── Ken Burns ────────────────────────────────────────────────────────────────
export type KenBurnsDirection = 'zoom-in' | 'zoom-out';

export interface KenBurnsConfig {
  direction: KenBurnsDirection;
  startScale?: number;
  endScale?: number;
}

// ─── Theme ────────────────────────────────────────────────────────────────────
/**
 * NewsTheme — passed as props to all shared components.
 * Each template builds this from its own tokens.ts and passes it down.
 */
export interface NewsThemeColors {
  bg: string;
  text: string;
  accent: string;
  accent2: string;
  muted: string;
  border: string;
  cardBg: string;
  subtitleAccent: string;
  /** For gradient text (tech-dark). If absent, flat accent color is used. */
  gradientA?: string;
  gradientB?: string;
}

export interface NewsThemeTypography {
  headlineLarge: number;
  headlineMedium: number;
  body: number;
  caption: number;
  badge: number;
  subtitleSize: number;
}

export interface NewsThemeLayout {
  width: number;
  height: number;
  paddingH: number;
  paddingV: number;
  dividerWidth: number;
  dividerHeight: number;
  cardRadius: number;
}

export interface NewsTheme {
  colors: NewsThemeColors;
  typography: NewsThemeTypography;
  layout: NewsThemeLayout;
  fontFamily: string;
  /**
   * When true, accent words in Headline/BodyText use CSS gradient clip-text.
   * When false, plain accent color is used.
   */
  useGradientAccent: boolean;
}
