/**
 * src/tokens.ts — Shared types and pipeline constants.
 *
 * This file is committed to the repo and never changes between video runs.
 * It provides:
 *   1. The DesignTokens interface — implemented per-video in src/scenes/tokens.ts
 *   2. Technical constants used by the pipeline logic (distribution.ts, etc.)
 *
 * Per-video values (colors, slug, scene durations) live in src/scenes/tokens.ts,
 * which is generated fresh by the AI coder agent on each /gen-video run.
 */

// ─── Design token interface ───────────────────────────────────────────────────
// Implemented per-video in src/scenes/tokens.ts with AI-chosen colors.
export interface DesignTokens {
  /** Main background color */
  bg: string;
  /** Primary text color */
  text: string;
  /** Accent / highlight color — chosen to match the video topic's emotional tone */
  accent: string;
  /** Secondary / muted text color */
  muted: string;
  /** Subtitle highlight color — used by the Subtitles overlay component.
   *  Pick one dominant color from the palette (usually accent or a vivid variant).
   *  Example: '#FACC15', '#00E5FF', '#FF6B9D'
   */
  subtitleAccent: string;
  /** Primary font family — MUST support Vietnamese.
   *  Approved: BeVietnamPro, NotoSans, Mulish, Nunito, Lexend
   *  NEVER use: Inter, Roboto, Montserrat, Poppins, Lato, Open Sans
   *  Load via: import { loadFont } from '@remotion/google-fonts/BeVietnamPro'
   *  with subsets: ['latin', 'vietnamese']
   */
  fontMain: string;
  /** Optional secondary font for code/tech/numeric elements */
  fontMono?: string;
}

// ─── Pipeline constants ───────────────────────────────────────────────────────
export const FPS = 30;
export const MIN_SCENE_FRAMES = 150; // 5 seconds minimum per scene
export const MAX_SCENE_FRAMES = 450; // 15 seconds maximum per scene
export const PADDING_FRAMES   = 60;  // 2 seconds of tail padding after last scene
