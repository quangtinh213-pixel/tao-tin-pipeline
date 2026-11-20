import React, {useMemo} from 'react';
import {Audio} from '@remotion/media';
import {Sequence, Series, staticFile} from 'remotion';
import {
  Layout as MediaShowcaseLayout, HookCard, HOOK_CARD_START_FRAME, getHookCardFrames, MediaShowcaseScene,
  type MediaShowcaseSpec,
} from './templates/news/media-showcase';
import {
  Layout as ModernNewsCanvasLayout,
  ModernNewsCanvasScene,
  type ModernNewsCanvasSpec,
} from './templates/news/modern-news-canvas';
import {
  Layout as RealEstatePlexLightLayout,
  PlexScene,
  type RealEstatePlexLightSpec,
} from './templates/news/real-estate-plex-light';
import {
  Layout as CurrentAffairsLightLayout,
  SceneHook,
  SceneBody,
  SceneEnding,
  type CurrentAffairsLightSpec,
} from './templates/news/current-affairs-light';
import {
  Layout as CurrentAffairsDarkLayout,
  SceneHook as DarkSceneHook,
  SceneBody as DarkSceneBody,
  SceneEnding as DarkSceneEnding,
  type CurrentAffairsDarkSpec,
} from './templates/news/current-affairs-dark';
import {
  Layout as EducationBriefingLightLayout,
  EducationScene,
  type EducationBriefingLightSpec,
} from './templates/news/education-briefing-light';

export const VideoContent: React.FC<{slug: string}> = ({slug}) => {
  const spec = useMemo(() => require(`../videos/${slug}/spec.json`), [slug]);

  if (spec.templateId === 'news/modern-news-canvas') {
    const mncSpec = spec as ModernNewsCanvasSpec;
    const assets = new Map((mncSpec.mediaAssets || []).map((a) => [a.id, a]));
    const resolveMedia = (scene: ModernNewsCanvasSpec['scenes'][number]) =>
      scene.media.map((m) => {
        const asset = assets.get(m.assetId);
        if (!asset) throw new Error(`Media asset not found: ${m.assetId}`);
        return {...m, asset};
      });
    return (
      <ModernNewsCanvasLayout
        slug={slug}
        publisher={mncSpec.source.publisher}
        bgMusic={mncSpec.video.bgMusic}
        showSubtitles
      >
        <Audio src={staticFile(`${slug}/voice.mp3`)} />
        <Series>
          {mncSpec.scenes.map((scene) => (
            <Series.Sequence
              key={scene.startFrame}
              durationInFrames={scene.durationFrames}
              premountFor={30}
            >
              <ModernNewsCanvasScene
                publisher={mncSpec.source.publisher}
                publicationDate={mncSpec.video.date}
                headline={scene.headline}
                media={resolveMedia(scene)}
                durationFrames={scene.durationFrames}
              />
            </Series.Sequence>
          ))}
        </Series>
      </ModernNewsCanvasLayout>
    );
  }

  if (spec.templateId === 'news/real-estate-plex-light') {
    const plexSpec = spec as RealEstatePlexLightSpec;
    return (
      <RealEstatePlexLightLayout
        slug={slug}
        bgMusic={plexSpec.video.bgMusic}
        showSubtitles
      >
        <Audio src={staticFile(`${slug}/voice.mp3`)} />
        <Series>
          {plexSpec.scenes.map((scene, i) => (
            <Series.Sequence
              key={i}
              durationInFrames={scene.durationFrames}
              premountFor={30}
            >
              <PlexScene
                {...scene.plex}
                durationFrames={scene.durationFrames}
              />
            </Series.Sequence>
          ))}
        </Series>
      </RealEstatePlexLightLayout>
    );
  }

  if (spec.templateId === 'news/current-affairs-light') {
    const caSpec = spec as CurrentAffairsLightSpec;
    return (
      <CurrentAffairsLightLayout slug={slug} bgMusic={caSpec.video.bgMusic}>
        <Audio src={staticFile(`${slug}/voice.mp3`)} />
        <Series>
          {caSpec.scenes.map((scene, i) => (
            <Series.Sequence key={i} durationInFrames={scene.durationFrames} premountFor={30}>
              {scene.type === 'hook' && scene.hook ? <SceneHook {...scene.hook} /> : null}
              {scene.type === 'body' && scene.body ? <SceneBody {...scene.body} /> : null}
              {scene.type === 'ending' && scene.ending ? <SceneEnding {...scene.ending} /> : null}
            </Series.Sequence>
          ))}
        </Series>
      </CurrentAffairsLightLayout>
    );
  }

  if (spec.templateId === 'news/current-affairs-dark') {
    const caSpec = spec as CurrentAffairsDarkSpec;
    return (
      <CurrentAffairsDarkLayout slug={slug} bgMusic={caSpec.video.bgMusic}>
        <Audio src={staticFile(`${slug}/voice.mp3`)} />
        <Series>
          {caSpec.scenes.map((scene, i) => (
            <Series.Sequence key={i} durationInFrames={scene.durationFrames} premountFor={30}>
              {scene.type === 'hook' && scene.hook ? <DarkSceneHook {...scene.hook} /> : null}
              {scene.type === 'body' && scene.body ? <DarkSceneBody {...scene.body} /> : null}
              {scene.type === 'ending' && scene.ending ? <DarkSceneEnding {...scene.ending} /> : null}
            </Series.Sequence>
          ))}
        </Series>
      </CurrentAffairsDarkLayout>
    );
  }

  if (spec.templateId === 'news/education-briefing-light') {
    const eduSpec = spec as EducationBriefingLightSpec;
    return (
      <EducationBriefingLightLayout slug={slug} bgMusic={eduSpec.video.bgMusic}>
        <Audio src={staticFile(`${slug}/voice.mp3`)} />
        <Series>
          {eduSpec.scenes.map((scene, i) => (
            <Series.Sequence key={i} durationInFrames={scene.durationFrames} premountFor={30}>
              <EducationScene {...scene.education} durationFrames={scene.durationFrames} />
            </Series.Sequence>
          ))}
        </Series>
      </EducationBriefingLightLayout>
    );
  }

  const msSpec = spec as MediaShowcaseSpec;
  const assets = useMemo(() => new Map((msSpec.mediaAssets || []).map((a) => [a.id, a])), [msSpec.mediaAssets]);
  const media = (scene: MediaShowcaseSpec['scenes'][number]) => scene.media.map((m) => {
    const asset = assets.get(m.assetId);
    if (!asset) throw new Error(`Media asset not found: ${m.assetId}`);
    return {...m, asset};
  });
  return (
    <MediaShowcaseLayout slug={slug} headline={msSpec.video.title} publicationDate={msSpec.video.date} bgMusic={msSpec.video.bgMusic} showSubtitles>
      <Audio src={staticFile(`${slug}/voice.mp3`)} />
      <Series>
        {msSpec.scenes.map((scene) => (
          <Series.Sequence key={scene.startFrame} durationInFrames={scene.durationFrames} premountFor={30}>
            <MediaShowcaseScene publisher={msSpec.source.publisher} media={media(scene)} durationFrames={scene.durationFrames} />
          </Series.Sequence>
        ))}
      </Series>
      {msSpec.hookCard?.arm === 'card' ? (
        <Sequence from={HOOK_CARD_START_FRAME} durationInFrames={getHookCardFrames(msSpec.scenes[0].durationFrames)} premountFor={15}>
          <HookCard value={msSpec.hookCard.value} label={msSpec.hookCard.label} durationFrames={getHookCardFrames(msSpec.scenes[0].durationFrames)} />
        </Sequence>
      ) : null}
    </MediaShowcaseLayout>
  );
};
