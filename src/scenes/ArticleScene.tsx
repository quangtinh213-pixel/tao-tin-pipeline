import React from 'react';
import {MediaShowcaseScene, type MediaShowcaseSpec} from '../templates/news/media-showcase';
export const ArticleScene: React.FC<{spec: MediaShowcaseSpec; index: number}> = ({spec,index}) => {
 const scene=spec.scenes[index];
 const media=scene.media.map(item=>{const asset=spec.mediaAssets.find(a=>a.id===item.assetId);if(!asset) throw new Error(`Missing source asset ${item.assetId}`);return {...item,asset};});
 return <MediaShowcaseScene publisher={spec.source.publisher} media={media} durationFrames={scene.durationFrames}/>;
};
