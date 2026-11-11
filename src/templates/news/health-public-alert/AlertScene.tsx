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
import { AlertBackground } from './Layout';
import { COLORS, FONT_DISPLAY, FONT_MAIN, LAYOUT, TYPOGRAPHY } from './tokens';
import type { AlertLevel, AlertMedia, AlertSceneProps } from './types';

export interface AlertSceneRenderProps extends AlertSceneProps {
  durationFrames: number;
}

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const levelLabels: Record<AlertLevel, string> = {
  watch: 'THEO DÕI',
  advisory: 'KHUYẾN CÁO',
  warning: 'CẢNH BÁO',
  urgent: 'KHẨN',
};

const levelColors: Record<AlertLevel, string> = {
  watch: COLORS.blue,
  advisory: COLORS.amberDark,
  warning: COLORS.coral,
  urgent: COLORS.coralDark,
};

const resolveSrc = (media: AlertMedia) =>
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

const highlightText = (text: string, accentWords: string[] = [], color: string = COLORS.coral) => {
  const escaped = accentWords
    .filter(Boolean)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (escaped.length === 0) return text;

  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'gi'));
  return parts.map((part, index) => {
    const isAccent = accentWords.some((word) => word.toLowerCase() === part.toLowerCase());
    return isAccent ? (
      <span key={`${part}-${index}`} style={{ color }}>
        {part}
      </span>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    );
  });
};

const BulletinHeader: React.FC<{ meta: string; level: AlertLevel; delay?: number }> = ({
  meta,
  level,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const color = levelColors[level];

  return (
    <div
      style={{
        ...appear(frame, delay, 8, 24),
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: 14,
        alignItems: 'center',
        width: '100%',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderRadius: 10,
          background: color,
          color: COLORS.white,
          fontFamily: FONT_MAIN,
          fontSize: TYPOGRAPHY.alertLabel,
          fontWeight: 900,
          letterSpacing: '0.08em',
        }}
      >
        {levelLabels[level]}
      </div>
      <div
        style={{
          height: 55,
          padding: '0 18px',
          borderRadius: 10,
          background: COLORS.white,
          border: `1px solid ${COLORS.rule}`,
          display: 'flex',
          alignItems: 'center',
          fontFamily: FONT_MAIN,
          fontSize: TYPOGRAPHY.meta,
          fontWeight: 850,
          color: COLORS.ink,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {meta}
      </div>
    </div>
  );
};

const Headline: React.FC<{
  text: string;
  accentWords?: string[];
  level: AlertLevel;
  size?: number;
  delay?: number;
}> = ({ text, accentWords, level, size = TYPOGRAPHY.headline, delay = 18 }) => {
  const frame = useCurrentFrame();
  const lines = splitHeadline(text);

  return (
    <div
      style={{
        marginTop: 44,
        fontFamily: FONT_DISPLAY,
        fontSize: size,
        lineHeight: 0.96,
        letterSpacing: 0,
        fontWeight: 700,
        textTransform: 'uppercase',
        color: COLORS.ink,
      }}
    >
      {lines.map((line, index) => (
        <div key={`${line}-${index}`} style={{ ...appear(frame, delay + index * 7, 18, 30) }}>
          {highlightText(line, accentWords, levelColors[level])}
        </div>
      ))}
    </div>
  );
};

const Body: React.FC<{ text?: string; delay?: number; top?: number }> = ({
  text,
  delay = 44,
  top = 30,
}) => {
  const frame = useCurrentFrame();
  if (!text) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 12, 28),
        marginTop: top,
        maxWidth: 910,
        fontFamily: FONT_MAIN,
        fontSize: TYPOGRAPHY.body,
        lineHeight: 1.38,
        fontWeight: 650,
        color: COLORS.body,
      }}
    >
      {text}
    </div>
  );
};

const EvidenceMedia: React.FC<{
  media?: AlertMedia;
  height: number;
  delay?: number;
  durationFrames: number;
}> = ({ media, height, delay = 58, durationFrames }) => {
  const frame = useCurrentFrame();
  if (!media) return null;

  const isVideo = media.mediaType === 'VIDEO' || /\.(mp4|mov)(\?|$)/i.test(media.src);
  const src = resolveSrc(media);
  const scale = interpolate(frame, [delay, Math.max(delay + 1, durationFrames)], [1.04, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });

  return (
    <div style={{ ...appear(frame, delay, 18, 34), marginTop: 42 }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height,
          overflow: 'hidden',
          borderRadius: LAYOUT.imageRadius,
          background: COLORS.white,
          border: `2px solid ${COLORS.black}`,
          boxShadow: `0 22px 50px ${COLORS.shadow}`,
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
            left: 0,
            right: 0,
            bottom: 0,
            minHeight: 54,
            padding: '13px 18px',
            boxSizing: 'border-box',
            background: 'rgba(17, 22, 20, 0.86)',
            color: COLORS.white,
            fontFamily: FONT_MAIN,
            fontSize: TYPOGRAPHY.caption,
            fontWeight: 800,
            letterSpacing: '0.02em',
          }}
        >
          Nguồn: {media.credit}
        </div>
      </div>
    </div>
  );
};

const RiskPanel: React.FC<{
  level: AlertLevel;
  riskLabel?: string;
  riskValue?: string;
  riskNote?: string;
  delay?: number;
}> = ({ level, riskLabel, riskValue, riskNote, delay = 56 }) => {
  const frame = useCurrentFrame();
  const color = levelColors[level];
  if (!riskLabel && !riskValue && !riskNote) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 16, 30),
        marginTop: 40,
        padding: '30px 34px',
        borderRadius: LAYOUT.radius,
        background: COLORS.white,
        border: `3px solid ${color}`,
        boxShadow: `0 20px 48px ${COLORS.shadow}`,
      }}
    >
      {riskLabel ? (
        <div style={{ fontFamily: FONT_MAIN, fontSize: TYPOGRAPHY.meta, fontWeight: 900, color, textTransform: 'uppercase' }}>
          {riskLabel}
        </div>
      ) : null}
      {riskValue ? (
        <div style={{ marginTop: 8, fontFamily: FONT_DISPLAY, fontSize: TYPOGRAPHY.risk, lineHeight: 0.95, fontWeight: 700, color: COLORS.ink, textTransform: 'uppercase' }}>
          {riskValue}
        </div>
      ) : null}
      {riskNote ? <Body text={riskNote} delay={delay + 8} top={16} /> : null}
    </div>
  );
};

const ItemGrid: React.FC<{
  items?: AlertSceneProps['items'];
  variant: AlertSceneProps['variant'];
  level: AlertLevel;
  delay?: number;
}> = ({ items = [], variant, level, delay = 58 }) => {
  const frame = useCurrentFrame();
  if (items.length === 0) return null;

  const isAvoid = variant === 'avoidList';
  const color = isAvoid ? COLORS.coral : variant === 'actionSteps' ? COLORS.green : levelColors[level];

  return (
    <div style={{ marginTop: 40, display: 'grid', gap: 18 }}>
      {items.slice(0, 5).map((item, index) => {
        const toneColor =
          item.tone === 'safe' ? COLORS.green : item.tone === 'warning' ? COLORS.coral : color;

        return (
          <div
            key={`${item.label}-${item.text}`}
            style={{
              ...appear(frame, delay + index * 8, 12, 28),
              display: 'grid',
              gridTemplateColumns: '54px 1fr',
              gap: 20,
              alignItems: 'start',
              padding: '22px 24px',
              borderRadius: 18,
              background: COLORS.white,
              border: `1px solid ${COLORS.rule}`,
              boxShadow: index === 0 ? `0 16px 36px ${COLORS.shadow}` : undefined,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: isAvoid ? 10 : 999,
                background: toneColor,
                color: COLORS.white,
                display: 'grid',
                placeItems: 'center',
                fontFamily: FONT_MAIN,
                fontSize: 20,
                fontWeight: 900,
              }}
            >
              {isAvoid ? '!' : index + 1}
            </div>
            <div>
              <div style={{ fontFamily: FONT_MAIN, fontSize: TYPOGRAPHY.cardTitle, lineHeight: 1.06, fontWeight: 900, color: COLORS.ink }}>
                {item.label}
              </div>
              <div style={{ marginTop: 8, fontFamily: FONT_MAIN, fontSize: TYPOGRAPHY.cardBody, lineHeight: 1.3, fontWeight: 650, color: COLORS.body }}>
                {item.text}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Timeline: React.FC<{ timeline?: AlertSceneProps['timeline']; delay?: number }> = ({
  timeline = [],
  delay = 58,
}) => {
  const frame = useCurrentFrame();
  if (timeline.length === 0) return null;

  return (
    <div style={{ marginTop: 44, display: 'grid', gap: 16 }}>
      {timeline.slice(0, 4).map((step, index) => (
        <div
          key={`${step.time}-${step.label}`}
          style={{
            ...appear(frame, delay + index * 8, 12, 28),
            display: 'grid',
            gridTemplateColumns: '150px 1fr',
            gap: 22,
            padding: '22px 24px',
            borderRadius: 16,
            background: COLORS.white,
            border: `1px solid ${COLORS.rule}`,
          }}
        >
          <div style={{ fontFamily: FONT_MAIN, fontSize: 24, fontWeight: 900, color: COLORS.coral }}>
            {step.time}
          </div>
          <div>
            <div style={{ fontFamily: FONT_MAIN, fontSize: 34, fontWeight: 900, color: COLORS.ink, lineHeight: 1.08 }}>
              {step.label}
            </div>
            {step.detail ? (
              <div style={{ marginTop: 8, fontFamily: FONT_MAIN, fontSize: 25, fontWeight: 650, color: COLORS.body, lineHeight: 1.32 }}>
                {step.detail}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
};

const QuoteBlock: React.FC<{ quote?: AlertSceneProps['quote']; delay?: number }> = ({
  quote,
  delay = 58,
}) => {
  const frame = useCurrentFrame();
  if (!quote) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 16, 30),
        marginTop: 44,
        padding: '34px 36px',
        borderRadius: 18,
        background: COLORS.black,
        color: COLORS.white,
        boxShadow: `0 20px 48px ${COLORS.shadow}`,
      }}
    >
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: TYPOGRAPHY.quote, lineHeight: 1.08, fontWeight: 700, textTransform: 'uppercase' }}>
        "{quote.text}"
      </div>
      <div style={{ marginTop: 22, fontFamily: FONT_MAIN, fontSize: 25, fontWeight: 900, color: COLORS.amber }}>
        {quote.source}
      </div>
      {quote.context ? (
        <div style={{ marginTop: 6, fontFamily: FONT_MAIN, fontSize: 22, fontWeight: 650, color: 'rgba(255,255,255,0.68)' }}>
          {quote.context}
        </div>
      ) : null}
    </div>
  );
};

const SourceLine: React.FC<{ text?: string; delay?: number }> = ({ text, delay = 80 }) => {
  const frame = useCurrentFrame();
  if (!text) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 12, 28),
        marginTop: 30,
        padding: '18px 20px',
        borderRadius: 12,
        background: COLORS.amberSoft,
        border: `1px solid rgba(183, 120, 0, 0.22)`,
        fontFamily: FONT_MAIN,
        fontSize: 24,
        lineHeight: 1.3,
        fontWeight: 800,
        color: COLORS.body,
      }}
    >
      {text}
    </div>
  );
};

export const AlertScene: React.FC<AlertSceneRenderProps> = ({
  variant,
  level = 'advisory',
  meta,
  headline,
  accentWords,
  body,
  body2,
  media,
  mediaHeight = 500,
  riskLabel,
  riskValue,
  riskNote,
  items,
  timeline,
  quote,
  sourceLine,
  cta,
  hashtags,
  durationFrames,
}) => {
  const isOpening = variant === 'alertOpening';
  const isClosing = variant === 'closing';

  return (
    <AbsoluteFill>
      <AlertBackground />
      <AbsoluteFill
        style={{
          padding: `${LAYOUT.top}px ${LAYOUT.paddingX}px 250px`,
          boxSizing: 'border-box',
          justifyContent: isOpening || isClosing ? 'center' : 'flex-start',
        }}
      >
        <BulletinHeader meta={meta} level={level} />
        <Headline
          text={headline}
          accentWords={accentWords}
          level={level}
          size={isOpening ? TYPOGRAPHY.headlineHero : variant === 'riskLevel' ? TYPOGRAPHY.headlineSmall : TYPOGRAPHY.headline}
        />
        <Body text={body} />
        {variant === 'riskLevel' || variant === 'alertOpening' || variant === 'affectedGroup' ? (
          <RiskPanel level={level} riskLabel={riskLabel} riskValue={riskValue} riskNote={riskNote} />
        ) : null}
        {variant === 'sourceEvidence' || variant === 'alertOpening' ? (
          <EvidenceMedia media={media} height={mediaHeight} durationFrames={durationFrames} />
        ) : null}
        {variant === 'symptomChecklist' || variant === 'actionSteps' || variant === 'avoidList' || variant === 'affectedGroup' ? (
          <ItemGrid items={items} variant={variant} level={level} />
        ) : null}
        {variant === 'timeline' ? <Timeline timeline={timeline} /> : null}
        {variant === 'sourceQuote' ? <QuoteBlock quote={quote} /> : null}
        {body2 ? <Body text={body2} delay={70} top={26} /> : null}
        <SourceLine text={sourceLine} />
        {cta ? (
          <div style={{ marginTop: 36, fontFamily: FONT_MAIN, fontSize: 28, fontWeight: 950, color: levelColors[level], textTransform: 'uppercase' }}>
            {cta}
          </div>
        ) : null}
        {hashtags ? (
          <div style={{ marginTop: 16, fontFamily: FONT_MAIN, fontSize: 22, fontWeight: 800, color: COLORS.muted }}>
            {hashtags}
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
