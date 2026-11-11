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
import { EducationBackground } from './Layout';
import { COLORS, FONT_MAIN, LAYOUT, TYPOGRAPHY } from './tokens';
import type {
  EducationChecklistItem,
  EducationMedia,
  EducationMetric,
  EducationSceneProps,
  EducationTone,
} from './types';

export interface EducationSceneRenderProps extends EducationSceneProps {
  durationFrames: number;
}

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const resolveSrc = (media: EducationMedia) =>
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

const toneColor = (tone?: EducationTone) => {
  if (tone === 'urgent' || tone === 'warning') return COLORS.coral;
  if (tone === 'positive') return COLORS.green;
  return COLORS.navy;
};

const highlightText = (text: string, accentWords: string[] = []) => {
  const escaped = accentWords
    .filter(Boolean)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (escaped.length === 0) return text;

  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'gi'));
  return parts.map((part, index) => {
    const isAccent = accentWords.some((word) => word.toLowerCase() === part.toLowerCase());
    return isAccent ? (
      <span key={`${part}-${index}`} style={{ color: COLORS.green }}>
        {part}
      </span>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    );
  });
};

const Meta: React.FC<{ label: string; tone?: EducationTone; delay?: number }> = ({
  label,
  tone,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const color = toneColor(tone);

  return (
    <div
      style={{
        ...appear(frame, delay, 8, 24),
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 8,
        background: COLORS.white,
        border: `1px solid ${COLORS.rule}`,
        boxShadow: `0 12px 30px ${COLORS.shadow}`,
        color,
        fontFamily: FONT_MAIN,
        fontSize: TYPOGRAPHY.meta,
        fontWeight: 900,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      <span style={{ width: 10, height: 10, borderRadius: 999, background: color }} />
      {label}
    </div>
  );
};

const Eyebrow: React.FC<{ children?: React.ReactNode; delay?: number }> = ({
  children,
  delay = 12,
}) => {
  const frame = useCurrentFrame();
  if (!children) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 8, 24),
        marginTop: 34,
        fontFamily: FONT_MAIN,
        fontSize: TYPOGRAPHY.eyebrow,
        fontWeight: 900,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: COLORS.gold,
      }}
    >
      {children}
    </div>
  );
};

const Headline: React.FC<{
  text: string;
  accentWords?: string[];
  size?: number;
  delay?: number;
  maxWidth?: number;
}> = ({ text, accentWords, size = TYPOGRAPHY.headline, delay = 20, maxWidth = 930 }) => {
  const frame = useCurrentFrame();
  const lines = splitHeadline(text);

  return (
    <div
      style={{
        maxWidth,
        marginTop: 30,
        fontFamily: FONT_MAIN,
        fontSize: size,
        lineHeight: 1.04,
        letterSpacing: 0,
        fontWeight: 900,
        color: COLORS.ink,
      }}
    >
      {lines.map((line, index) => (
        <div key={`${line}-${index}`} style={appear(frame, delay + index * 7, 18, 30)}>
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
  maxWidth = 900,
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

const Tags: React.FC<{ tags?: string[]; delay?: number }> = ({ tags = [], delay = 58 }) => {
  const frame = useCurrentFrame();
  if (tags.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 28 }}>
      {tags.slice(0, 4).map((tag, index) => (
        <div
          key={tag}
          style={{
            ...appear(frame, delay + index * 5, 8, 22),
            border: `1px solid ${COLORS.rule}`,
            borderRadius: 8,
            background: COLORS.white,
            color: COLORS.navy,
            fontFamily: FONT_MAIN,
            fontSize: 19,
            fontWeight: 800,
            padding: '10px 13px',
          }}
        >
          {tag}
        </div>
      ))}
    </div>
  );
};

const MediaCard: React.FC<{
  media?: EducationMedia;
  height: number;
  delay?: number;
  durationFrames: number;
}> = ({ media, height, delay = 58, durationFrames }) => {
  const frame = useCurrentFrame();
  if (!media) return null;

  const isVideo = media.mediaType === 'VIDEO' || /\.(mp4|mov)(\?|$)/i.test(media.src);
  const src = resolveSrc(media);
  const scale = interpolate(frame, [delay, Math.max(delay + 1, durationFrames)], [1.045, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });

  return (
    <div style={{ ...appear(frame, delay, 18, 34), marginTop: 44 }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height,
          overflow: 'hidden',
          borderRadius: LAYOUT.imageRadius,
          background: COLORS.blueSoft,
          border: `1px solid ${COLORS.rule}`,
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
            borderRadius: 8,
            background: 'rgba(255, 255, 255, 0.92)',
            color: COLORS.navy,
            fontFamily: FONT_MAIN,
            fontSize: 17,
            fontWeight: 900,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {media.mediaType ?? 'ẢNH'}
        </div>
      </div>
      <div
        style={{
          marginTop: 12,
          fontFamily: FONT_MAIN,
          fontSize: TYPOGRAPHY.caption,
          fontWeight: 700,
          color: COLORS.muted,
        }}
      >
        Ảnh: {media.credit}
      </div>
    </div>
  );
};

const MetricCards: React.FC<{ metrics?: EducationMetric[]; delay?: number }> = ({
  metrics = [],
  delay = 54,
}) => {
  const frame = useCurrentFrame();
  if (metrics.length === 0) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: metrics.length === 1 ? '1fr' : '1fr 1fr',
        gap: 16,
        marginTop: 40,
      }}
    >
      {metrics.slice(0, 4).map((metric, index) => (
        <div
          key={`${metric.label}-${index}`}
          style={{
            ...appear(frame, delay + index * 7, 12, 28),
            minHeight: 170,
            padding: 22,
            borderRadius: 8,
            background: COLORS.white,
            border: `1px solid ${COLORS.rule}`,
            boxShadow: `0 12px 30px ${COLORS.shadow}`,
          }}
        >
          <div
            style={{
              fontFamily: FONT_MAIN,
              fontSize: metrics.length === 1 ? TYPOGRAPHY.metric : 58,
              lineHeight: 0.95,
              fontWeight: 900,
              color: toneColor(metric.tone),
            }}
          >
            {metric.value}
            {metric.unit ? (
              <span style={{ marginLeft: 10, fontSize: metrics.length === 1 ? TYPOGRAPHY.metricUnit : 29 }}>
                {metric.unit}
              </span>
            ) : null}
          </div>
          <div
            style={{
              marginTop: 14,
              fontFamily: FONT_MAIN,
              fontSize: TYPOGRAPHY.rowMeta,
              fontWeight: 900,
              textTransform: 'uppercase',
              color: COLORS.ink,
            }}
          >
            {metric.label}
          </div>
          {metric.note ? (
            <div style={{ marginTop: 8, fontFamily: FONT_MAIN, fontSize: 19, lineHeight: 1.35, color: COLORS.body }}>
              {metric.note}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

const Timeline: React.FC<{ items?: EducationSceneProps['timeline']; delay?: number }> = ({
  items = [],
  delay = 54,
}) => {
  const frame = useCurrentFrame();
  if (items.length === 0) return null;

  return (
    <div style={{ display: 'grid', gap: 18, marginTop: 38 }}>
      {items.slice(0, 5).map((item, index) => (
        <div
          key={`${item.time}-${index}`}
          style={{
            ...appear(frame, delay + index * 8, 12, 28),
            display: 'grid',
            gridTemplateColumns: '150px 1fr',
            gap: 22,
            alignItems: 'start',
          }}
        >
          <div
            style={{
              borderRadius: 8,
              padding: '14px 12px',
              background: index === 0 ? COLORS.goldSoft : COLORS.white,
              border: `1px solid ${COLORS.rule}`,
              color: index === 0 ? COLORS.gold : COLORS.green,
              fontFamily: FONT_MAIN,
              fontSize: 22,
              fontWeight: 900,
              textAlign: 'center',
            }}
          >
            {item.time}
          </div>
          <div style={{ borderTop: `1px solid ${COLORS.rule}`, paddingTop: 12 }}>
            <div style={{ fontFamily: FONT_MAIN, fontSize: 29, fontWeight: 900, color: COLORS.ink }}>
              {item.label}
            </div>
            {item.detail ? (
              <div style={{ marginTop: 7, fontFamily: FONT_MAIN, fontSize: 22, lineHeight: 1.35, color: COLORS.body }}>
                {item.detail}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
};

const Checklist: React.FC<{ items?: EducationChecklistItem[]; delay?: number }> = ({
  items = [],
  delay = 54,
}) => {
  const frame = useCurrentFrame();
  if (items.length === 0) return null;

  return (
    <div style={{ display: 'grid', gap: 15, marginTop: 38 }}>
      {items.slice(0, 5).map((item, index) => (
        <div
          key={`${item.text}-${index}`}
          style={{
            ...appear(frame, delay + index * 7, 12, 28),
            display: 'grid',
            gridTemplateColumns: '56px 1fr',
            gap: 18,
            alignItems: 'center',
            padding: '18px 20px',
            borderRadius: 8,
            background: COLORS.white,
            border: `1px solid ${COLORS.rule}`,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: toneColor(item.tone),
              color: COLORS.white,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT_MAIN,
              fontSize: 20,
              fontWeight: 900,
            }}
          >
            {item.label ?? index + 1}
          </div>
          <div style={{ fontFamily: FONT_MAIN, fontSize: TYPOGRAPHY.listText, lineHeight: 1.18, fontWeight: 800, color: COLORS.ink }}>
            {item.text}
          </div>
        </div>
      ))}
    </div>
  );
};

const ProfileCard: React.FC<{ profile?: EducationSceneProps['profile']; delay?: number }> = ({
  profile,
  delay = 54,
}) => {
  const frame = useCurrentFrame();
  if (!profile) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 16, 30),
        marginTop: 44,
        padding: 30,
        borderRadius: 8,
        background: COLORS.white,
        border: `1px solid ${COLORS.rule}`,
        boxShadow: `0 16px 38px ${COLORS.shadow}`,
      }}
    >
      <div style={{ fontFamily: FONT_MAIN, fontSize: 54, lineHeight: 1.05, fontWeight: 900, color: COLORS.navy }}>
        {profile.name}
      </div>
      {profile.role ? (
        <div style={{ marginTop: 14, fontFamily: FONT_MAIN, fontSize: 27, fontWeight: 800, color: COLORS.green }}>
          {profile.role}
        </div>
      ) : null}
      {profile.institution ? (
        <div style={{ marginTop: 10, fontFamily: FONT_MAIN, fontSize: 24, fontWeight: 700, color: COLORS.body }}>
          {profile.institution}
        </div>
      ) : null}
      {profile.achievement ? (
        <div style={{ marginTop: 24, fontFamily: FONT_MAIN, fontSize: 31, lineHeight: 1.28, fontWeight: 800, color: COLORS.ink }}>
          {profile.achievement}
        </div>
      ) : null}
    </div>
  );
};

const QuoteCard: React.FC<{ quote?: EducationSceneProps['quote']; delay?: number }> = ({
  quote,
  delay = 50,
}) => {
  const frame = useCurrentFrame();
  if (!quote) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 16, 32),
        marginTop: 44,
        padding: 34,
        borderRadius: 8,
        background: COLORS.white,
        borderLeft: `8px solid ${COLORS.gold}`,
        boxShadow: `0 16px 38px ${COLORS.shadow}`,
      }}
    >
      <div style={{ fontFamily: FONT_MAIN, fontSize: TYPOGRAPHY.quote, lineHeight: 1.16, fontWeight: 900, color: COLORS.ink }}>
        "{quote.text}"
      </div>
      <div style={{ marginTop: 25, fontFamily: FONT_MAIN, fontSize: 24, fontWeight: 900, color: COLORS.green }}>
        {quote.source}
      </div>
      {quote.context ? (
        <div style={{ marginTop: 8, fontFamily: FONT_MAIN, fontSize: 21, color: COLORS.body }}>
          {quote.context}
        </div>
      ) : null}
    </div>
  );
};

const contentStyle: React.CSSProperties = {
  position: 'absolute',
  left: LAYOUT.paddingX,
  right: LAYOUT.paddingX,
  top: LAYOUT.top,
};

export const EducationScene: React.FC<EducationSceneRenderProps> = (props) => {
  const {
    variant,
    durationFrames,
    tone,
    meta,
    eyebrow,
    headline,
    accentWords,
    body,
    body2,
    media,
    mediaHeight,
    metrics,
    timeline,
    checklist,
    profile,
    quote,
    tags,
    cta,
    hashtags,
  } = props;

  const isOpening = variant === 'opening';
  const isClosing = variant === 'closing';
  const headlineSize =
    isOpening ? TYPOGRAPHY.headlineHero : variant === 'checklist' || variant === 'timeline' ? TYPOGRAPHY.headlineSmall : TYPOGRAPHY.headline;

  return (
    <AbsoluteFill>
      <EducationBackground />
      <div style={contentStyle}>
        <Meta label={meta} tone={tone} />
        <Eyebrow>{eyebrow}</Eyebrow>
        <Headline text={headline} accentWords={accentWords} size={headlineSize} />
        <Body text={body} />
        <Tags tags={tags} />

        {(variant === 'media' || variant === 'opening' || media) && (
          <MediaCard media={media} height={mediaHeight ?? (isOpening ? 560 : 470)} durationFrames={durationFrames} />
        )}

        {(variant === 'stats' || variant === 'deadline') && <MetricCards metrics={metrics} />}
        {variant === 'timeline' && <Timeline items={timeline} />}
        {variant === 'checklist' && <Checklist items={checklist} />}
        {variant === 'profile' && <ProfileCard profile={profile} />}
        {variant === 'quote' && <QuoteCard quote={quote} />}

        <Body text={body2} delay={74} top={32} maxWidth={860} />

        {isClosing ? (
          <div style={{ marginTop: 44 }}>
            {cta ? (
              <div
                style={{
                  display: 'inline-flex',
                  padding: '18px 24px',
                  borderRadius: 8,
                  background: COLORS.navy,
                  color: COLORS.white,
                  fontFamily: FONT_MAIN,
                  fontSize: 28,
                  fontWeight: 900,
                }}
              >
                {cta}
              </div>
            ) : null}
            {hashtags ? (
              <div style={{ marginTop: 24, fontFamily: FONT_MAIN, fontSize: 25, fontWeight: 800, color: COLORS.green }}>
                {hashtags}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
