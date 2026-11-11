import React, {useMemo} from 'react';
import {Audio} from '@remotion/media';
import {Sequence, Series, staticFile} from 'remotion';
import {
  HOOK_CARD_START_FRAME, HookCard, Layout, MediaShowcaseScene, getHookCardFrames,
  type MediaShowcaseSpec,
} from './templates/news/media-showcase';

export const VideoContent: React.FC<{slug: string}> = ({slug}) => {
  const spec = useMemo(() => require(`../videos/${slug}/spec.json`) as MediaShowcaseSpec, [slug]);
  const assets = useMemo(() => new Map(spec.mediaAssets.map((a) => [a.id, a])), [spec.mediaAssets]);
  const media = (scene: MediaShowcaseSpec['scenes'][number]) => scene.media.map((m) => {
    const asset = assets.get(m.assetId);
    if (!asset) throw new Error(`Media asset not found: ${m.assetId}`);
    return {...m, asset};
  });
  return (
    <Layout slug={slug} headline={spec.video.title} publicationDate={spec.video.date} bgMusic={spec.video.bgMusic} showSubtitles>
      <Audio src={staticFile(`${slug}/voice.mp3`)} />
      <Series>
        {spec.scenes.map((scene) => (
          <Series.Sequence key={scene.startFrame} durationInFrames={scene.durationFrames} premountFor={30}>
            <MediaShowcaseScene publisher={spec.source.publisher} media={media(scene)} durationFrames={scene.durationFrames} />
          </Series.Sequence>
        ))}
      </Series>
      {spec.hookCard?.arm === 'card' ? (
        <Sequence from={HOOK_CARD_START_FRAME} durationInFrames={getHookCardFrames(spec.scenes[0].durationFrames)} premountFor={15}>
          <HookCard value={spec.hookCard.value} label={spec.hookCard.label} durationFrames={getHookCardFrames(spec.scenes[0].durationFrames)} />
        </Sequence>
      ) : null}
    </Layout>
  );
};
