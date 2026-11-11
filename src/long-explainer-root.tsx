import React from 'react';
import {CalculateMetadataFunction, Composition, registerRoot} from 'remotion';
import {LongExplainerVideo, type LongExplainerVideoProps} from './templates/news/long-explainer/LongExplainerVideo';

// Separate entry point so long-form renders never touch the Shorts files (Root.tsx / VideoContent.tsx).
const calculateMetadata: CalculateMetadataFunction<LongExplainerVideoProps> = async ({props}) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const spec = require(`../videos/${props.slug}/spec.json`);
  return {durationInFrames: spec.totalFrames, width: spec.video.width, height: spec.video.height};
};

export const LongExplainerRoot: React.FC = () => (
  <Composition
    id="LongExplainer"
    component={LongExplainerVideo}
    calculateMetadata={calculateMetadata}
    durationInFrames={300}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{slug: '2026-11-07-luong-toi-thieu-vung-2027-giai-thich'} satisfies LongExplainerVideoProps}
  />
);

registerRoot(LongExplainerRoot);
