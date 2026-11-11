import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BackgroundMusic} from '../../../components/BackgroundMusic';
import {Subtitles} from '../../../components/Subtitles';
import {COLORS, FONT_MAIN} from './tokens';

export interface LayoutProps {
  slug: string;
  publisher: string;
  bgMusic?: string | null;
  showSubtitles?: boolean;
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  slug,
  publisher,
  bgMusic = null,
  showSubtitles = true,
  children,
}) => (
  <AbsoluteFill
    style={{
      overflow: 'hidden',
      background: COLORS.background,
      color: COLORS.text,
      fontFamily: FONT_MAIN,
    }}
  >
    <BackgroundMusic src={bgMusic} />

    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(circle at 100% 0%, rgba(240,100,43,0.10), transparent 28%), linear-gradient(115deg, transparent 0 91%, rgba(23,23,23,0.035) 91% 91.4%, transparent 91.4%)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        width: 126,
        height: 10,
        background: COLORS.orange,
      }}
    />

    <div
      style={{
        position: 'absolute',
        left: 48,
        right: 48,
        top: 34,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${COLORS.line}`,
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: '0.08em',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          minHeight: 38,
          padding: '0 16px',
          background: COLORS.orange,
          color: '#FFFFFF',
          fontSize: 17,
          letterSpacing: '0.12em',
        }}
      >
        <span
          style={{
            width: 5,
            height: 18,
            marginRight: 10,
            background: '#FFFFFF',
          }}
        />
        <span>TIN TỨC</span>
      </div>
      <span
        style={{
          maxWidth: 520,
          overflow: 'hidden',
          color: COLORS.muted,
          fontSize: 17,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {publisher.toUpperCase()}
      </span>
    </div>

    {children}

    {showSubtitles ? (
      <Subtitles
        slug={slug}
        activeColor={COLORS.orange}
        fontSize={33}
        maxWords={6}
      />
    ) : null}
  </AbsoluteFill>
);
