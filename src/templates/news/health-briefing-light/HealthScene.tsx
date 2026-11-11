import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  Video,
} from 'remotion';
import { HealthBackground } from './Layout';
import { COLORS, FONT_DISPLAY, FONT_MAIN, LAYOUT, TYPOGRAPHY } from './tokens';
import type { HealthMedia, HealthSceneProps } from './types';

export interface HealthSceneRenderProps extends HealthSceneProps {
  durationFrames: number;
}

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const resolveSrc = (media: HealthMedia) =>
  media.storage === 'remote' || /^https?:\/\//i.test(media.src) ? media.src : staticFile(media.src);

const appear = (frame: number, delay: number, distance = 16, duration = 28) => {
  const f = frame - delay;
  return {
    opacity: interpolate(f, [0, duration], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: ease,
    }),
    transform: `translateY(${interpolate(f, [0, duration], [distance, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: ease,
    })}px)`,
  };
};

const splitHeadline = (headline: string) =>
  headline.includes('\n') ? headline.split('\n').filter(Boolean) : [headline];

const highlightText = (text: string, accentWords: string[] = []) => {
  const escaped = accentWords
    .filter(Boolean)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (escaped.length === 0) return text;

  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'gi'));
  return parts.map((part, index) => {
    const isAccent = accentWords.some((word) => word.toLowerCase() === part.toLowerCase());
    return isAccent ? (
      <span key={`${part}-${index}`} style={{ color: COLORS.teal }}>
        {part}
      </span>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    );
  });
};

const Meta: React.FC<{ label: string; delay?: number }> = ({ label, delay = 0 }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        ...appear(frame, delay, 8, 24),
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 18px',
        borderRadius: 999,
        background: COLORS.white,
        border: `1px solid ${COLORS.faint}`,
        boxShadow: `0 12px 30px ${COLORS.shadow}`,
        color: COLORS.tealDark,
        fontFamily: FONT_MAIN,
        fontSize: TYPOGRAPHY.meta,
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      <span style={{ width: 10, height: 10, borderRadius: 999, background: COLORS.teal }} />
      {label}
    </div>
  );
};

const Headline: React.FC<{
  text: string;
  accentWords?: string[];
  size?: number;
  delay?: number;
  maxWidth?: number;
}> = ({ text, accentWords, size = TYPOGRAPHY.headline, delay = 18, maxWidth = 925 }) => {
  const frame = useCurrentFrame();
  const lines = splitHeadline(text);

  return (
    <div
      style={{
        maxWidth,
        marginTop: 42,
        fontFamily: FONT_DISPLAY,
        fontSize: size,
        lineHeight: 1.04,
        letterSpacing: 0,
        fontWeight: 700,
        color: COLORS.ink,
      }}
    >
      {lines.map((line, index) => (
        <div key={`${line}-${index}`} style={{ ...appear(frame, delay + index * 7, 18, 30) }}>
          {highlightText(line, accentWords)}
        </div>
      ))}
    </div>
  );
};

const Body: React.FC<{ text?: string; delay?: number; top?: number; maxWidth?: number }> = ({
  text,
  delay = 44,
  top = 30,
  maxWidth = 910,
}) => {
  const frame = useCurrentFrame();
  if (!text) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 12, 28),
        marginTop: top,
        maxWidth,
        fontFamily: FONT_MAIN,
        fontSize: TYPOGRAPHY.body,
        lineHeight: 1.42,
        fontWeight: 600,
        color: COLORS.body,
      }}
    >
      {text}
    </div>
  );
};

const EvidenceMedia: React.FC<{
  media?: HealthMedia;
  height: number;
  delay?: number;
  durationFrames: number;
}> = ({ media, height, delay = 58, durationFrames }) => {
  const frame = useCurrentFrame();
  if (!media) return null;

  const scale = interpolate(frame, [delay, Math.max(delay + 1, durationFrames)], [1.045, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });

  const isVideo = media.mediaType === 'VIDEO' || /\.(mp4|mov)(\?|$)/i.test(media.src);
  const src = resolveSrc(media);

  return (
    <div style={{ ...appear(frame, delay, 18, 34), marginTop: 50 }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height,
          overflow: 'hidden',
          borderRadius: LAYOUT.imageRadius,
          background: COLORS.mint,
          border: `1px solid ${COLORS.faint}`,
          boxShadow: `0 24px 58px ${COLORS.shadow}`,
        }}
      >
        {isVideo ? (
          <Video
            src={src}
            muted
            loop
            style={{
              width: '100%',
              height: '100%',
              objectFit: media.fit ?? 'cover',
              objectPosition: media.position ?? 'center',
            }}
          />
        ) : (
          <Img
            src={src}
            alt={media.alt}
            style={{
              width: '100%',
              height: '100%',
              objectFit: media.fit ?? 'cover',
              objectPosition: media.position ?? 'center',
              transform: `scale(${scale})`,
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            left: 18,
            top: 18,
            padding: '8px 12px',
            borderRadius: 999,
            background: 'rgba(255, 255, 255, 0.9)',
            color: COLORS.tealDark,
            fontFamily: FONT_MAIN,
            fontSize: 17,
            fontWeight: 900,
            letterSpacing: '0.08em',
          }}
        >
          {media.mediaType ?? (isVideo ? 'VIDEO' : 'ẢNH')}
        </div>
      </div>
      <div
        style={{
          marginTop: 12,
          fontFamily: FONT_MAIN,
          fontSize: TYPOGRAPHY.caption,
          fontWeight: 600,
          color: COLORS.muted,
        }}
      >
        Nguồn: {media.credit}
      </div>
    </div>
  );
};

const StatPanel: React.FC<{ stat?: HealthSceneProps['stat']; delay?: number }> = ({
  stat,
  delay = 56,
}) => {
  const frame = useCurrentFrame();
  if (!stat) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 16, 30),
        marginTop: 46,
        padding: '34px 38px',
        borderRadius: LAYOUT.radius,
        background: COLORS.white,
        border: `1px solid ${COLORS.faint}`,
        boxShadow: `0 20px 48px ${COLORS.shadow}`,
      }}
    >
      <div style={{ fontFamily: FONT_MAIN, fontSize: TYPOGRAPHY.kicker, fontWeight: 900, color: COLORS.tealDark, textTransform: 'uppercase' }}>
        {stat.label}
      </div>
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: TYPOGRAPHY.stat, lineHeight: 0.95, fontWeight: 700, color: COLORS.teal }}>
          {stat.value}
        </span>
        {stat.unit ? (
          <span style={{ fontFamily: FONT_MAIN, fontSize: TYPOGRAPHY.statUnit, fontWeight: 800, color: COLORS.ink }}>
            {stat.unit}
          </span>
        ) : null}
      </div>
      {stat.note ? <Body text={stat.note} delay={delay + 8} top={14} /> : null}
    </div>
  );
};

const ItemList: React.FC<{ items?: HealthSceneProps['items']; title?: string; delay?: number }> = ({
  items = [],
  title,
  delay = 58,
}) => {
  const frame = useCurrentFrame();
  if (items.length === 0) return null;

  return (
    <div style={{ marginTop: 44, display: 'grid', gap: 18 }}>
      {title ? (
        <div style={{ ...appear(frame, delay - 10, 10, 24), fontFamily: FONT_MAIN, fontSize: TYPOGRAPHY.kicker, fontWeight: 900, color: COLORS.tealDark, textTransform: 'uppercase' }}>
          {title}
        </div>
      ) : null}
      {items.slice(0, 5).map((item, index) => (
        <div
          key={`${item.label}-${item.text}`}
          style={{
            ...appear(frame, delay + index * 8, 12, 28),
            display: 'grid',
            gridTemplateColumns: '48px 1fr',
            gap: 20,
            alignItems: 'start',
            padding: '22px 24px',
            borderRadius: 22,
            background: index === 0 ? COLORS.tealSoft : COLORS.white,
            border: `1px solid ${COLORS.faint}`,
          }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 999, background: COLORS.teal, color: COLORS.white, display: 'grid', placeItems: 'center', fontFamily: FONT_MAIN, fontSize: 18, fontWeight: 900 }}>
            {index + 1}
          </div>
          <div>
            <div style={{ fontFamily: FONT_MAIN, fontSize: TYPOGRAPHY.itemTitle, lineHeight: 1.08, fontWeight: 850, color: COLORS.ink }}>
              {item.label}
            </div>
            <div style={{ marginTop: 8, fontFamily: FONT_MAIN, fontSize: TYPOGRAPHY.itemBody, lineHeight: 1.32, fontWeight: 600, color: COLORS.body }}>
              {item.text}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Timeline: React.FC<{ timeline?: HealthSceneProps['timeline']; delay?: number }> = ({
  timeline = [],
  delay = 58,
}) => {
  const frame = useCurrentFrame();
  if (timeline.length === 0) return null;

  return (
    <div style={{ marginTop: 48, display: 'grid', gap: 0 }}>
      {timeline.slice(0, 4).map((step, index) => (
        <div
          key={`${step.time}-${step.label}`}
          style={{
            ...appear(frame, delay + index * 8, 12, 28),
            display: 'grid',
            gridTemplateColumns: '170px 1fr',
            gap: 28,
            padding: '24px 0',
            borderTop: index === 0 ? `1px solid ${COLORS.rule}` : undefined,
            borderBottom: `1px solid ${COLORS.rule}`,
          }}
        >
          <div style={{ fontFamily: FONT_MAIN, fontSize: 25, fontWeight: 900, color: COLORS.teal }}>
            {step.time}
          </div>
          <div>
            <div style={{ fontFamily: FONT_MAIN, fontSize: 36, fontWeight: 850, color: COLORS.ink, lineHeight: 1.08 }}>
              {step.label}
            </div>
            {step.detail ? (
              <div style={{ marginTop: 10, fontFamily: FONT_MAIN, fontSize: 26, fontWeight: 600, color: COLORS.body, lineHeight: 1.34 }}>
                {step.detail}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
};

const QuoteBlock: React.FC<{ quote?: HealthSceneProps['quote']; delay?: number }> = ({
  quote,
  delay = 58,
}) => {
  const frame = useCurrentFrame();
  if (!quote) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 16, 30),
        marginTop: 48,
        padding: '38px 40px',
        borderLeft: `8px solid ${COLORS.teal}`,
        borderRadius: 24,
        background: COLORS.white,
        boxShadow: `0 18px 44px ${COLORS.shadow}`,
      }}
    >
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: TYPOGRAPHY.quote, lineHeight: 1.12, fontWeight: 600, color: COLORS.ink }}>
        "{quote.text}"
      </div>
      <div style={{ marginTop: 24, fontFamily: FONT_MAIN, fontSize: 25, fontWeight: 850, color: COLORS.tealDark }}>
        {quote.source}
      </div>
      {quote.context ? (
        <div style={{ marginTop: 6, fontFamily: FONT_MAIN, fontSize: 22, fontWeight: 600, color: COLORS.muted }}>
          {quote.context}
        </div>
      ) : null}
    </div>
  );
};

const Notice: React.FC<{ text?: string; delay?: number }> = ({ text, delay = 76 }) => {
  const frame = useCurrentFrame();
  if (!text) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 12, 28),
        marginTop: 34,
        padding: '22px 26px',
        borderRadius: 22,
        background: 'rgba(232, 93, 117, 0.09)',
        border: '1px solid rgba(232, 93, 117, 0.22)',
        fontFamily: FONT_MAIN,
        fontSize: 25,
        lineHeight: 1.34,
        fontWeight: 750,
        color: COLORS.body,
      }}
    >
      {text}
    </div>
  );
};

export const HealthScene: React.FC<HealthSceneRenderProps> = ({
  variant,
  meta,
  headline,
  accentWords,
  body,
  body2,
  media,
  mediaHeight = 500,
  stat,
  items,
  timeline,
  quote,
  notice,
  cta,
  hashtags,
  durationFrames,
}) => {
  const isOpening = variant === 'opening';
  const isClosing = variant === 'closing';

  return (
    <AbsoluteFill>
      <HealthBackground />
      <AbsoluteFill
        style={{
          padding: `${LAYOUT.top}px ${LAYOUT.paddingX}px 250px`,
          boxSizing: 'border-box',
          justifyContent: isOpening || isClosing ? 'center' : 'flex-start',
        }}
      >
        <Meta label={meta} />
        <Headline
          text={headline}
          accentWords={accentWords}
          size={isOpening ? TYPOGRAPHY.headlineHero : variant === 'stat' ? TYPOGRAPHY.headlineSmall : TYPOGRAPHY.headline}
        />
        <Body text={body} />
        {variant === 'stat' ? <StatPanel stat={stat} /> : null}
        {variant === 'timeline' ? <Timeline timeline={timeline} /> : null}
        {variant === 'symptoms' || variant === 'recommendation' ? (
          <ItemList items={items} title={variant === 'symptoms' ? 'Dấu hiệu cần chú ý' : 'Khuyến cáo'} />
        ) : null}
        {variant === 'quote' ? <QuoteBlock quote={quote} /> : null}
        {variant === 'evidence' || variant === 'opening' ? (
          <EvidenceMedia media={media} height={mediaHeight} durationFrames={durationFrames} />
        ) : null}
        {body2 ? <Body text={body2} delay={70} top={28} /> : null}
        <Notice text={notice} />
        {cta ? (
          <div style={{ marginTop: 38, fontFamily: FONT_MAIN, fontSize: 28, fontWeight: 900, color: COLORS.tealDark }}>
            {cta}
          </div>
        ) : null}
        {hashtags ? (
          <div style={{ marginTop: 18, fontFamily: FONT_MAIN, fontSize: 22, fontWeight: 800, color: COLORS.muted }}>
            {hashtags}
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
