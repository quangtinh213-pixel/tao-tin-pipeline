import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {BackgroundMusic} from '../../../components/BackgroundMusic';
import {Subtitles} from '../../../components/Subtitles';
import {COLORS, FONT_HEADING, FONT_MAIN, STAGE, TOP_BAR_HEIGHT} from './tokens';
import type {LongExplainerChapter} from './types';

/** Index of the chapter playing at `frame` (chapters sorted by startFrame, first at 0). */
export const getChapterIndex = (frame: number, chapters: LongExplainerChapter[]) => {
  let index = 0;
  chapters.forEach((chapter, i) => {
    if (frame >= chapter.startFrame) index = i;
  });
  return index;
};

export interface LayoutProps {
  slug: string;
  chapters: LongExplainerChapter[];
  totalFrames: number;
  bgMusic?: string | null;
  /** Off for YouTube long-form: captions ship as an .srt track instead. */
  showSubtitles?: boolean;
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({slug, chapters, totalFrames, bgMusic = null, showSubtitles = false, children}) => {
  const frame = useCurrentFrame();
  const current = getChapterIndex(frame, chapters);
  const chapter = chapters[current];
  return (
    <AbsoluteFill style={{background: COLORS.background, color: COLORS.text, fontFamily: FONT_MAIN, overflow: 'hidden'}}>
      <BackgroundMusic src={bgMusic} />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${COLORS.grid} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.grid} 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 30% 20%, rgba(239,68,68,0.10), transparent 60%)'}} />

      {children}

      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: TOP_BAR_HEIGHT, display: 'flex', alignItems: 'center', gap: 18, padding: `0 ${STAGE.right}px 0 ${STAGE.left}px`, background: 'rgba(15,23,42,0.86)', borderBottom: '1px solid rgba(255,255,255,0.08)'}}>
        {chapter ? (
          <div style={{fontFamily: FONT_HEADING, fontSize: 32, fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 900}}>
            <span style={{color: COLORS.red}}>{String(current + 1).padStart(2, '0')}</span>
            <span style={{color: COLORS.muted, margin: '0 12px'}}>/</span>
            {chapter.title}
          </div>
        ) : null}
        <div style={{flex: 1, display: 'flex', gap: 5, margin: '0 24px'}}>
          {chapters.map((c, i) => {
            const end = chapters[i + 1]?.startFrame ?? totalFrames;
            const filled = Math.min(1, Math.max(0, (frame - c.startFrame) / Math.max(1, end - c.startFrame)));
            return (
              <div key={c.startFrame} style={{flex: end - c.startFrame, height: 5, background: 'rgba(255,255,255,0.15)'}}>
                <div style={{width: `${filled * 100}%`, height: '100%', background: i === current ? COLORS.red : 'rgba(255,255,255,0.7)'}} />
              </div>
            );
          })}
        </div>
        <Img src={staticFile('watermark.png')} style={{height: 40, width: 'auto', opacity: 0.9}} />
      </div>

      {showSubtitles ? (
        <Subtitles slug={slug} activeColor={COLORS.highlight} textColor={COLORS.text} pastColor="rgba(248,250,252,0.55)" fontSize={44} maxWords={10} bottom={40} maxWidth={1500} />
      ) : null}
    </AbsoluteFill>
  );
};
