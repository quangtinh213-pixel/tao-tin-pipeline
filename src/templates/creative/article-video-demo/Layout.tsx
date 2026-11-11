import React from 'react';
import {AbsoluteFill, Img, Sequence, staticFile} from 'remotion';
import {Subtitles} from '../../../components/Subtitles';

export interface ArticleVideoDemoLayoutProps {
  slug: string;
  introDurationInFrames: number;
  children: React.ReactNode;
  background?: string;
  subtitleAccent?: string;
  subtitleFontSize?: number;
  watermarkSrc?: string;
}

export const ArticleVideoDemoLayout: React.FC<
  ArticleVideoDemoLayoutProps
> = ({
  slug,
  introDurationInFrames,
  children,
  background = '#050816',
  subtitleAccent = '#63E6FF',
  subtitleFontSize = 38,
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
      <Img src={staticFile(watermarkSrc)} style={{height: 90, width: 'auto'}} />
    </div>

    {process.env.SHOW_SUBTITLES !== 'false' && (
      <Sequence
        durationInFrames={introDurationInFrames}
        layout="none"
      >
        <Subtitles
          slug={slug}
          activeColor={subtitleAccent}
          fontSize={subtitleFontSize}
        />
      </Sequence>
    )}
  </AbsoluteFill>
);
