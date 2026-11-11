import React from 'react';
import {CalculateMetadataFunction, Composition, registerRoot} from 'remotion';
import {Video, type VideoProps} from './Video';

const defaultSlug = '2026-11-11-dantri-gia-vang-the-gioi-giam-manh-cpi-my';
const defaultDuration = 1142;
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
);

registerRoot(RemotionRoot);
