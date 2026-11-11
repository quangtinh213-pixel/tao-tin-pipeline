import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {BackgroundMusic} from '../../../components/BackgroundMusic';
import {Subtitles} from '../../../components/Subtitles';
import {COLORS, FONT_MAIN, MEDIA_FRAME} from './tokens';

export interface LayoutProps {
  slug: string;
  headline: string;
  publicationDate: string;
  bgMusic?: string | null;
  showSubtitles?: boolean;
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  slug,
  headline,
  publicationDate,
  bgMusic = null,
  showSubtitles = true,
  children,
}) => (
  <AbsoluteFill
    style={{
      background: COLORS.background,
      color: COLORS.text,
      fontFamily: FONT_MAIN,
      overflow: 'hidden',
    }}
  >
    <BackgroundMusic src={bgMusic} />

    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(180deg, #F7F7F5 0%, #EEEEEC 68%, #D8D8D6 100%)',
      }}
    />

    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 72,
        background: `linear-gradient(180deg, ${COLORS.red} 0%, ${COLORS.red} 72%, ${COLORS.redDark} 100%)`,
      }}
    />

    <div
      style={{
        position: 'absolute',
        left: 72,
        top: 0,
        right: 0,
        height: 84,
        background: 'rgba(255,255,255,0.34)',
        borderBottom: `4px solid ${COLORS.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingRight: 32,
        boxSizing: 'border-box',
      }}
    >
      <Img src={staticFile('watermark.png')} style={{height: 52, width: 'auto', opacity: 0.9}} />
    </div>

    {children}

    <div
      style={{
        position: 'absolute',
        left: 116,
        right: 54,
        top: MEDIA_FRAME.top + MEDIA_FRAME.height + 26,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          minHeight: 50,
          padding: '0 22px',
          background: COLORS.dateBackground,
          color: COLORS.dateText,
          fontFamily: FONT_MAIN,
          fontSize: 26,
          fontWeight: 800,
        }}
      >
        Ngày đăng: {publicationDate}
      </div>

      <div
        style={{
          marginTop: 26,
          maxWidth: 850,
          color: COLORS.text,
          fontFamily: FONT_MAIN,
          fontSize: headline.length > 92 ? 48 : headline.length > 62 ? 56 : 64,
          fontWeight: 800,
          lineHeight: 1.18,
          letterSpacing: '-0.035em',
        }}
      >
        {headline}
      </div>
    </div>

    {showSubtitles ? (
      <Subtitles
        slug={slug}
        activeColor={COLORS.red}
        textColor={COLORS.text}
        pastColor="rgba(17,17,17,0.45)"
        textShadow="none"
        fontSize={54}
        maxWords={6}
        bottom={360}
      />
    ) : null}
  </AbsoluteFill>
);
