import React from 'react';
import {CalculateMetadataFunction, Composition, Still, registerRoot} from 'remotion';
import {Thumbnail} from './Thumbnail';
import {Video, type VideoProps} from './Video';
import {PodcastVideo, podcastDuration} from './podcast/PodcastVideo';

const PODCASTS: Array<{id: string; slug: string}> = [];

const defaultSlug = '2026-11-20-tuoitre-vn-xang-giam-5-lan-to-pho-dia-com';
const defaultDuration = 1165;
const defaultWidth = 1080;
const defaultHeight = 1920;

const calculateMetadata: CalculateMetadataFunction<any> = async ({props, defaultProps}) => {
  const slug = (props as VideoProps)?.slug || (defaultProps as VideoProps)?.slug || defaultSlug;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const spec = require(`../videos/${slug}/spec.json`);
    // Landscape templates (e.g. news/long-explainer) declare their canvas in spec.video.
    if (spec?.totalFrames) {
      return {
        durationInFrames: spec.totalFrames,
        ...(spec.video?.width && spec.video?.height ? {width: spec.video.width, height: spec.video.height} : {}),
      };
    }
  } catch (_e) {
    // fallback
  }
  return {durationInFrames: defaultDuration};
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Video"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component={Video as any}
      calculateMetadata={calculateMetadata}
      durationInFrames={defaultDuration}
      fps={30}
      width={defaultWidth}
      height={defaultHeight}
      defaultProps={{slug: defaultSlug} satisfies VideoProps}
    />
    {PODCASTS.map((p) => (
      <Composition
        key={p.id}
        id={p.id}
        component={PodcastVideo}
        durationInFrames={podcastDuration(p.slug, 30)}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{slug: p.slug}}
      />
    ))}
    <Still
      id="Thumbnail"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component={Thumbnail as any}
      width={1280}
      height={720}
      defaultProps={{slug: defaultSlug} satisfies VideoProps}
    />
  </>
);

registerRoot(RemotionRoot);
