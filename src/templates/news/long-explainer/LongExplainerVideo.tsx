import {Audio} from '@remotion/media';
import React, {useMemo} from 'react';
import {Sequence, Series, staticFile} from 'remotion';
import {BeatVisual} from './Beats';
import {ChapterCard} from './ChapterCard';
import {Layout} from './Layout';
import {SFX_URLS, getLongExplainerSfx} from './sfx';
import {CHAPTER_CARD_FRAMES} from './tokens';
import type {LongExplainerSpec} from './types';

// A type alias (not an interface) so Remotion's Record<string, unknown> props constraint accepts it.
export type LongExplainerVideoProps = {slug: string};

/** Whole long-form video from videos/<slug>/spec.json; no per-video code. SFX follow audio.txt via spec.video.sfx. */
export const LongExplainerVideo: React.FC<LongExplainerVideoProps> = ({slug}) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const spec = useMemo(() => require(`../../../../videos/${slug}/spec.json`) as LongExplainerSpec & {video: {sfx?: boolean}}, [slug]);
  const assets = useMemo(() => new Map(spec.mediaAssets.map((a) => [a.id, a])), [spec.mediaAssets]);
  const shots = useMemo(() => new Map(spec.evidenceShots.map((s) => [s.id, s])), [spec.evidenceShots]);
  const sfx = useMemo(() => (spec.video.sfx === false ? [] : getLongExplainerSfx(spec.beats, spec.chapters)), [spec]);

  return (
    <Layout slug={slug} chapters={spec.chapters} totalFrames={spec.totalFrames} bgMusic={spec.video.bgMusic}>
      <Audio src={staticFile(`${slug}/voice.mp3`)} />
      <Series>
        {spec.beats.map((beat, i) => (
          <Series.Sequence key={beat.startFrame} durationInFrames={beat.durationFrames} premountFor={30}>
            <BeatVisual visual={beat.visual} assets={assets} shots={shots} durationFrames={beat.durationFrames} seed={i} />
          </Series.Sequence>
        ))}
      </Series>
      {spec.chapters.slice(1).map((chapter, i) => (
        <Sequence key={chapter.startFrame} from={chapter.startFrame} durationInFrames={CHAPTER_CARD_FRAMES} premountFor={15}>
          <ChapterCard index={i + 1} title={chapter.title} durationFrames={CHAPTER_CARD_FRAMES} />
        </Sequence>
      ))}
      {sfx.map((e) => (
        <Sequence key={`sfx-${e.frame}-${e.name}`} from={e.frame} durationInFrames={60}>
          <Audio src={SFX_URLS[e.name]} volume={e.volume} />
        </Sequence>
      ))}
    </Layout>
  );
};
