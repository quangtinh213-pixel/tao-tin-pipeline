import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {BackgroundMusic} from '../../../components/BackgroundMusic';
import {Subtitles} from '../../../components/Subtitles';
import {COLORS, FONTS, TIKTOK_SAFE_ZONE} from './tokens';

export interface LayoutProps {
  slug: string;
  bgMusic?: string | null;
  showSubtitles?: boolean;
  children?: React.ReactNode;
}

export const CommerceBackground: React.FC = () => (
  <AbsoluteFill style={{background: COLORS.bgDarkDeep, overflow: 'hidden'}}>
    {/* Deep Studio Ambient Gradient */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          `radial-gradient(circle at 15% 15%, rgba(0, 242, 254, 0.12), transparent 45%),` +
          `radial-gradient(circle at 85% 25%, rgba(255, 0, 79, 0.12), transparent 45%),` +
          `radial-gradient(circle at 50% 85%, rgba(139, 92, 246, 0.1), transparent 50%),` +
          `linear-gradient(180deg, #07090E 0%, #0D111A 50%, #05070B 100%)`,
      }}
    />

    {/* Subtle Cyber Grid */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage:
          'linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), ' +
          'linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        opacity: 0.7,
      }}
    />

    {/* Atmospheric Vignette */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(5,7,11,0.85) 100%)',
      }}
    />
  </AbsoluteFill>
);

export const Layout: React.FC<LayoutProps> = ({
  slug,
  bgMusic,
  showSubtitles = true,
  children,
}) => {
  return (
    <AbsoluteFill style={{fontFamily: FONTS.main}}>
      <CommerceBackground />

      {/* Main Content Area within TikTok Safe Zone */}
      <AbsoluteFill
        style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
        }}
      >
        {children}
      </AbsoluteFill>

      {/* Watermark Branding */}
      <div
        style={{
          position: 'absolute',
          top: TIKTOK_SAFE_ZONE.top - 50,
          right: TIKTOK_SAFE_ZONE.right,
          zIndex: 40,
          opacity: 0.85,
        }}
      >
        <Img
          src={staticFile('watermark.png')}
          style={{height: 36, objectFit: 'contain'}}
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>

      {/* Subtitles Overlay */}
      {showSubtitles && (
        <div
          style={{
            position: 'absolute',
            left: TIKTOK_SAFE_ZONE.left,
            right: TIKTOK_SAFE_ZONE.right,
            bottom: 270, // Carefully placed above TikTok bottom interactive row
            zIndex: 50,
            pointerEvents: 'none',
          }}
        >
          <Subtitles
            slug={slug}
            fontSize={34}
            activeColor="#FBBF24" // Bright Amber for active words
          />
        </div>
      )}

      {/* Background Music */}
      {bgMusic && <BackgroundMusic src={bgMusic} />}
    </AbsoluteFill>
  );
};
