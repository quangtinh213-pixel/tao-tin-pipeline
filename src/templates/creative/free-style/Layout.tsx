import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Subtitles} from '../../../components/Subtitles';

export const FREE_STYLE_SAFE_AREA = {
  top: 250,
  bottom: 440,
  horizontal: 48,
} as const;

export interface FreeStyleLayoutProps {
  slug: string;
  children: React.ReactNode;
  background?: string;
  subtitleAccent?: string;
  subtitleFontSize?: number;
  showSubtitles?: boolean;
  watermarkSrc?: string;
}

export const FreeStyleLayout: React.FC<FreeStyleLayoutProps> = ({
  slug,
  children,
  background = '#050816',
  subtitleAccent = '#32E6FF',
  subtitleFontSize = 38,
  showSubtitles = process.env.SHOW_SUBTITLES !== 'false',
  watermarkSrc = 'watermark.png',
}) => (
  <AbsoluteFill style={{background}}>
    <AbsoluteFill>{children}</AbsoluteFill>

    <div
      style={{
        position: 'absolute',
        top: '7%',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      <Img
        src={staticFile(watermarkSrc)}
        style={{height: 90, width: 'auto'}}
      />
    </div>

    {showSubtitles && (
      <Subtitles
        slug={slug}
        activeColor={subtitleAccent}
        fontSize={subtitleFontSize}
      />
    )}
  </AbsoluteFill>
);
