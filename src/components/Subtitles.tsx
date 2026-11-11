import React, { useEffect, useMemo, useState } from "react";
import { useCurrentFrame, useVideoConfig, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/BeVietnamPro";

// Load font once at module level
const { fontFamily } = loadFont("normal", {
  weights: ["700"],
  subsets: ["latin", "vietnamese"],
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

interface Sentence {
  words: WordTimestamp[];
  start: number;
  end: number;
}

interface Timeline {
  duration?: number;
  segments?: unknown[];
  words?: WordTimestamp[];
}

export interface SubtitlesProps {
  /** Slug used to load public/<slug>/timeline.json */
  slug: string;
  /**
   * Gap threshold in seconds to split into a new sentence. Default: 0.45s
   */
  sentenceGap?: number;
  /**
   * Max words per line — sentences longer than this are split into chunks. Default: 7
   */
  maxWords?: number;
  /**
   * Color for the currently active (highlighted) word. Default: '#FACC15'
   */
  activeColor?: string;
  /**
   * Font size in px. Default: 38
   */
  fontSize?: number;
  /**
   * Upcoming/past word colors. Defaults are white for dark templates;
   * light templates must pass dark colors.
   */
  textColor?: string;
  pastColor?: string;
  /** Shadow for non-active words. Default: dark shadow for dark templates. */
  textShadow?: string;
  /** CSS bottom offset of the subtitle block. Default: '15%'. */
  bottom?: number | string;
  /** Max line width in px. Default: 960 (9:16); landscape templates pass more. */
  maxWidth?: number;
}

// ─── Fixed design constants ───────────────────────────────────────────────────
const DEFAULT_ACTIVE_COLOR = "#FACC15";
const TEXT_COLOR = "rgba(255,255,255,0.82)";
const PAST_COLOR = "rgba(255,255,255,0.35)";
const TEXT_SHADOW = "0 1px 3px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.5)";

// ─── Split words into sentences by silence gap ────────────────────────────────
function buildSentences(words: WordTimestamp[], gap: number): Sentence[] {
  if (words.length === 0) return [];
  const sentences: Sentence[] = [];
  let current: WordTimestamp[] = [words[0]];

  for (let i = 1; i < words.length; i++) {
    if (words[i].start - words[i - 1].end >= gap) {
      sentences.push({
        words: current,
        start: current[0].start,
        end: current[current.length - 1].end,
      });
      current = [words[i]];
    } else {
      current.push(words[i]);
    }
  }
  sentences.push({
    words: current,
    start: current[0].start,
    end: current[current.length - 1].end,
  });
  return sentences;
}

/**
 * Split a sentence into fixed chunks of maxWords.
 * Each chunk is shown as a stable line — no sliding window.
 */
function chunkSentence(sentence: Sentence, maxWords: number): Sentence[] {
  const chunks: Sentence[] = [];
  const words = sentence.words;
  for (let i = 0; i < words.length; i += maxWords) {
    const slice = words.slice(i, i + maxWords);
    chunks.push({
      words: slice,
      start: slice[0].start,
      end: slice[slice.length - 1].end,
    });
  }
  return chunks;
}

// ─── Component ───────────────────────────────────────────────────────────────
export const Subtitles: React.FC<SubtitlesProps> = ({
  slug,
  sentenceGap = 0.45,
  maxWords = 7,
  activeColor = DEFAULT_ACTIVE_COLOR,
  fontSize = 38,
  textColor = TEXT_COLOR,
  pastColor = PAST_COLOR,
  textShadow = TEXT_SHADOW,
  bottom = "15%",
  maxWidth = 960,
}) => {
  const [words, setWords] = useState<WordTimestamp[]>([]);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  useEffect(() => {
    fetch(staticFile(`${slug}/timeline.json`))
      .then((r) => r.json())
      .then((data: Timeline | WordTimestamp[]) => {
        if (Array.isArray(data)) {
          // Legacy: plain array of words
          setWords(data);
        } else if (data.words && data.words.length > 0) {
          // New format: timeline.json with words array
          setWords(data.words);
        } else {
          setWords([]);
        }
      })
      .catch(() => setWords([]));
  }, [slug]);

  // Build sentences, then split each into fixed chunks
  const chunks = useMemo(() => {
    const sentences = buildSentences(words, sentenceGap);
    return sentences.flatMap((s) => chunkSentence(s, maxWords));
  }, [words, sentenceGap, maxWords]);

  const currentTime = frame / fps;

  // Active chunk = last chunk whose start <= currentTime
  const chunkIdx = useMemo(() => {
    let active = -1;
    for (let i = 0; i < chunks.length; i++) {
      if (chunks[i].start <= currentTime) {
        active = i;
      } else {
        break;
      }
    }
    return active;
  }, [chunks, currentTime]);

  // Active word highlight
  const highlightIdx = useMemo(() => {
    if (chunkIdx === -1) return -1;
    const chunk = chunks[chunkIdx];

    // Find the word currently being spoken
    const speaking = chunk.words.findIndex(
      (w) => currentTime >= w.start && currentTime <= w.end,
    );
    if (speaking !== -1) return speaking;

    // Between words: highlight the last word whose start has passed
    let last = -1;
    for (let i = 0; i < chunk.words.length; i++) {
      if (chunk.words[i].start <= currentTime) last = i;
      else break;
    }
    return last;
  }, [chunks, chunkIdx, currentTime]);

  if (chunkIdx === -1) return null;

  const chunk = chunks[chunkIdx];

  return (
    <div
      style={{
        position: "absolute",
        bottom,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        padding: "0 48px",
        pointerEvents: "none",
        zIndex: 30,
      }}
    >
      <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "baseline",
        gap: "0 10px",
        flexWrap: "wrap",
        width: "100%",
        maxWidth,
        boxSizing: "border-box",
        justifyContent: "center",
      }}
      >
        {chunk.words.map((w, i) => {
          const isActive = i === highlightIdx;
          const isPast = i < highlightIdx;
          return (
            <span
              key={`${chunkIdx}-${i}`}
              style={{
                fontFamily,
                fontSize,
                fontWeight: 700,
                lineHeight: 1.4,
                whiteSpace: "nowrap",
                color: isActive
                  ? activeColor
                  : isPast
                    ? pastColor
                    : textColor,
                textShadow: isActive
                  ? `0 1px 3px ${activeColor}90, 0 0 6px ${activeColor}40`
                  : textShadow,
                display: "inline-block",
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
