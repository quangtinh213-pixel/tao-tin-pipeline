import React from 'react';
import {
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {Video} from '@remotion/media';
import type {SourceLedEvidenceAsset, SourceLedSceneSpec} from '../templates/creative/source-led/types';

export type AssetMap = Record<string, SourceLedEvidenceAsset>;
export type SceneSpec = SourceLedSceneSpec & {mediaList?: string[]};
export interface SceneProps {
  assets: AssetMap;
  scene?: SceneSpec;
}

const resolveSource = (src: string) =>
  /^https?:\/\//i.test(src) ? src : staticFile(src);

const creditLabel = (asset: SourceLedEvidenceAsset) =>
  `${asset.kind === 'video' ? 'VIDEO TƯ LIỆU · TẮT ÂM' : 'ẢNH TƯ LIỆU'} · ${asset.credit.replace(/^Nguồn:\s*/i, '')}`;

const MediaAsset: React.FC<{
  asset: SourceLedEvidenceAsset;
  fit: 'cover' | 'contain';
}> = ({asset, fit}) => (
  <div style={{position: 'absolute', inset: 0, background: '#20232A'}}>
    {asset.kind === 'video' ? (
      <Video
        src={resolveSource(asset.src)}
        muted
        volume={0}
        loop
        style={{width: '100%', height: '100%', objectFit: fit}}
      />
    ) : (
      <Img
        src={resolveSource(asset.src)}
        style={{width: '100%', height: '100%', objectFit: fit}}
      />
    )}
    <div
      style={{
        position: 'absolute',
        top: 14,
        left: 14,
        maxWidth: 'calc(100% - 28px)',
        padding: '7px 10px',
        borderRadius: 5,
        background: 'rgba(15, 20, 29, 0.72)',
        color: '#FFFDF7',
        fontFamily: 'Arial, sans-serif',
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: '0.04em',
        lineHeight: 1.25,
      }}
    >
      {creditLabel(asset)}
    </div>
  </div>
);

export const MediaMontage: React.FC<{
  assets: AssetMap;
  ids: string[];
  top: number;
  left?: number;
  width: number;
  height: number;
  interval?: number;
  fit?: 'cover' | 'contain';
  radius?: number;
  accent?: string;
  darken?: number;
}> = ({
  assets,
  ids,
  top,
  left = 48,
  width,
  height,
  interval = 48,
  fit = 'cover',
  radius = 18,
  accent = '#B53A2E',
  darken = 0,
}) => {
  const frame = useCurrentFrame();
  const usableIds = ids.filter((id) => Boolean(assets[id]));
  if (usableIds.length === 0) {
    return null;
  }

  const currentIndex = Math.floor(frame / interval) % usableIds.length;
  const nextIndex = (currentIndex + 1) % usableIds.length;
  const localFrame = frame % interval;
  const currentOpacity = interpolate(
    localFrame,
    [0, Math.max(1, interval - 12), interval],
    [1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const nextOpacity = interpolate(
    localFrame,
    [0, 12, interval],
    [0, 1, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const current = assets[usableIds[currentIndex]];
  const next = assets[usableIds[nextIndex]];

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        width,
        height,
        overflow: 'hidden',
        borderRadius: radius,
        border: `2px solid ${accent}55`,
        background: '#20232A',
        boxShadow: '0 24px 60px rgba(44, 31, 20, 0.18)',
      }}
    >
      <div style={{position: 'absolute', inset: 0, opacity: currentOpacity}}>
        <MediaAsset asset={current} fit={fit} />
      </div>
      <div style={{position: 'absolute', inset: 0, opacity: nextOpacity}}>
        <MediaAsset asset={next} fit={fit} />
      </div>
      {darken > 0 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(10, 15, 20, ${darken})`,
            pointerEvents: 'none',
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          right: 18,
          bottom: 18,
          width: 52,
          height: 5,
          borderRadius: 99,
          background: accent,
          opacity: 0.9,
        }}
      />
    </div>
  );
};

export const getSceneIds = (scene?: SceneSpec) => scene?.mediaList ?? [];
