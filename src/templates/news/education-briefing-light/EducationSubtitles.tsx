import React, { useEffect, useMemo, useState } from 'react';
import { interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT_MAIN, LAYOUT, TYPOGRAPHY } from './tokens';

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
  words?: WordTimestamp[];
}

export interface EducationSubtitlesProps {
  slug: string;
  sentenceGap?: number;
  maxWords?: number;
}

const buildSentences = (words: WordTimestamp[], gap: number): Sentence[] => {
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
};

const chunkSentence = (sentence: Sentence, maxWords: number): Sentence[] => {
  const chunks: Sentence[] = [];
  for (let i = 0; i < sentence.words.length; i += maxWords) {
    const words = sentence.words.slice(i, i + maxWords);
    chunks.push({
      words,
      start: words[0].start,
      end: words[words.length - 1].end,
    });
  }
  return chunks;
};

export const EducationSubtitles: React.FC<EducationSubtitlesProps> = ({
  slug,
  sentenceGap = 0.42,
  maxWords = 11,
}) => {
  const [words, setWords] = useState<WordTimestamp[]>([]);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  useEffect(() => {
    fetch(staticFile(`${slug}/timeline.json`))
      .then((response) => response.json())
      .then((data: Timeline | WordTimestamp[]) => {
        setWords(Array.isArray(data) ? data : data.words ?? []);
      })
      .catch(() => setWords([]));
  }, [slug]);

  const chunks = useMemo(
    () => buildSentences(words, sentenceGap).flatMap((sentence) => chunkSentence(sentence, maxWords)),
    [maxWords, sentenceGap, words],
  );

  const chunkIdx = useMemo(() => {
    let active = -1;
    for (let i = 0; i < chunks.length; i++) {
      if (chunks[i].start <= currentTime) active = i;
      else break;
    }
    return active;
  }, [chunks, currentTime]);

  const highlightIdx = useMemo(() => {
    if (chunkIdx === -1) return -1;
    const chunk = chunks[chunkIdx];
    const speaking = chunk.words.findIndex((word) => currentTime >= word.start && currentTime <= word.end);
    if (speaking !== -1) return speaking;

    let last = -1;
    for (let i = 0; i < chunk.words.length; i++) {
      if (chunk.words[i].start <= currentTime) last = i;
      else break;
    }
    return last;
  }, [chunkIdx, chunks, currentTime]);

  if (chunkIdx === -1) return null;

  const chunk = chunks[chunkIdx];
  const localFrame = frame - Math.round(chunk.start * fps);
  const opacity = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const y = interpolate(localFrame, [0, 12], [8, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 82,
        right: 82,
        bottom: LAYOUT.subtitleBottom,
        zIndex: 50,
        opacity,
        transform: `translateY(${y}px)`,
        textAlign: 'center',
        fontFamily: FONT_MAIN,
        fontSize: TYPOGRAPHY.subtitle,
        lineHeight: 1.45,
        fontWeight: 800,
        color: COLORS.muted,
      }}
    >
      {chunk.words.map((word, index) => {
        const isActive = index === highlightIdx;
        const isPast = index < highlightIdx;
        return (
          <span
            key={`${chunkIdx}-${index}`}
            style={{
              color: isActive ? COLORS.navy : isPast ? COLORS.faint : COLORS.muted,
              marginRight: 9,
              display: 'inline-block',
            }}
          >
            {word.word}
          </span>
        );
      })}
    </div>
  );
};
