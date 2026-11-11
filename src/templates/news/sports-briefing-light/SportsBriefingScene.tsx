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
import { SportsBriefingBackground } from './Layout';
import { COLORS, FONT_HEADLINE, FONT_MAIN, LAYOUT, TYPOGRAPHY } from './tokens';
import type {
  SportsBriefingSceneProps,
  SportsMedia,
  SportsQuote,
  SportsScore,
  SportsStat,
  SportsTimelineItem,
} from './types';

export interface SportsBriefingSceneRenderProps extends SportsBriefingSceneProps {
  durationFrames: number;
}

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const appear = (frame: number, delay: number, distance = 14, duration = 26) => {
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

const resolveSrc = (media: SportsMedia) =>
  media.storage === 'remote' || /^https?:\/\//i.test(media.src) ? media.src : staticFile(media.src);

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
      <span key={`${part}-${index}`} style={{ color: COLORS.accent }}>
        {part}
      </span>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    );
  });
};

const SectionPass: React.FC<{ label: string }> = ({ label }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        ...appear(frame, 0, 8, 20),
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        height: 42,
        padding: '0 16px',
        background: COLORS.ink,
        color: COLORS.paper,
        borderLeft: `8px solid ${COLORS.accent}`,
        fontFamily: FONT_MAIN,
        fontSize: TYPOGRAPHY.section,
        fontWeight: 900,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </div>
  );
};

const Kicker: React.FC<{ text?: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  if (!text) return null;

  return (
    <div
      style={{
        ...appear(frame, 14, 10, 22),
        marginTop: 30,
        fontFamily: FONT_MAIN,
        fontSize: TYPOGRAPHY.kicker,
        lineHeight: 1.16,
        fontWeight: 900,
        color: COLORS.accent,
        textTransform: 'uppercase',
      }}
    >
      {text}
    </div>
  );
};

const Headline: React.FC<{
  text: string;
  accentWords?: string[];
  size?: number;
  maxWidth?: number;
}> = ({ text, accentWords, size = TYPOGRAPHY.headline, maxWidth = 900 }) => {
  const frame = useCurrentFrame();
  const lines = splitHeadline(text);

  return (
    <div
      style={{
        maxWidth,
        marginTop: 24,
        fontFamily: FONT_HEADLINE,
        fontSize: size,
        lineHeight: 0.94,
        letterSpacing: 0,
        fontWeight: 700,
        color: COLORS.ink,
        textTransform: 'uppercase',
      }}
    >
      {lines.map((line, index) => (
        <div key={`${line}-${index}`} style={{ ...appear(frame, 22 + index * 6, 18, 28) }}>
          {highlightText(line, accentWords)}
        </div>
      ))}
    </div>
  );
};

const Body: React.FC<{
  text?: string;
  delay?: number;
  top?: number;
  size?: number;
  maxWidth?: number;
}> = ({ text, delay = 48, top = 24, size = TYPOGRAPHY.body, maxWidth = 900 }) => {
  const frame = useCurrentFrame();
  if (!text) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 12, 26),
        marginTop: top,
        maxWidth,
        fontFamily: FONT_MAIN,
        fontSize: size,
        lineHeight: 1.38,
        fontWeight: 650,
        color: COLORS.body,
      }}
    >
      {text}
    </div>
  );
};

const MediaFrame: React.FC<{
  media?: SportsMedia;
  height: number;
  delay?: number;
  durationFrames: number;
}> = ({ media, height, delay = 58, durationFrames }) => {
  const frame = useCurrentFrame();
  if (!media) return null;

  const reveal = interpolate(frame - delay, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
  const scale = interpolate(frame, [delay, Math.max(delay + 1, durationFrames)], [1.05, 1.01], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const isVideo = media.mediaType === 'VIDEO' || /\.(mp4|mov)(\?|$)/i.test(media.src);
  const src = resolveSrc(media);

  return (
    <div style={{ ...appear(frame, delay, 18, 32), marginTop: 40 }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height,
          overflow: 'hidden',
          borderRadius: LAYOUT.imageRadius,
          background: COLORS.cardWarm,
          border: `1px solid ${COLORS.faint}`,
          boxShadow: `0 28px 70px ${COLORS.shadow}`,
          clipPath: `inset(0 ${100 - reveal * 100}% 0 0 round ${LAYOUT.imageRadius}px)`,
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
            left: 16,
            top: 16,
            padding: '8px 12px',
            background: COLORS.ink,
            color: COLORS.paper,
            fontFamily: FONT_MAIN,
            fontSize: 16,
            fontWeight: 900,
            letterSpacing: '0.08em',
          }}
        >
          {media.mediaType ?? (isVideo ? 'VIDEO' : 'ẢNH')}
        </div>
      </div>
      <div
        style={{
          marginTop: 11,
          fontFamily: FONT_MAIN,
          fontSize: TYPOGRAPHY.caption,
          color: COLORS.muted,
          fontWeight: 750,
        }}
      >
        Nguồn: <span style={{ color: COLORS.accent }}>{media.credit}</span>
      </div>
    </div>
  );
};

const ScoreBoard: React.FC<{ score?: SportsScore; delay?: number }> = ({ score, delay = 44 }) => {
  const frame = useCurrentFrame();
  if (!score) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 16, 28),
        marginTop: 30,
        display: 'grid',
        gridTemplateColumns: '1fr 150px 1fr',
        alignItems: 'center',
        gap: 14,
        padding: '22px 22px',
        background: COLORS.card,
        border: `1px solid ${COLORS.faint}`,
        borderTop: `8px solid ${COLORS.accent}`,
        boxShadow: `0 22px 58px ${COLORS.shadow}`,
      }}
    >
      <TeamName text={score.home} align="left" />
      <div
        style={{
          gridColumn: 2,
          gridRow: 1,
          display: 'flex',
          justifyContent: 'center',
          gap: 10,
          fontFamily: FONT_HEADLINE,
          fontSize: TYPOGRAPHY.scoreValue,
          lineHeight: 0.9,
          fontWeight: 700,
          color: COLORS.accent,
        }}
      >
        <span>{score.homeScore ?? '-'}</span>
        <span style={{ color: COLORS.muted, fontSize: 50 }}>:</span>
        <span>{score.awayScore ?? '-'}</span>
      </div>
      <TeamName text={score.away} align="right" />
      {(score.status || score.note) && (
        <div
          style={{
            gridColumn: '1 / -1',
            marginTop: 14,
            borderTop: `1px solid ${COLORS.faint}`,
            paddingTop: 12,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 18,
            fontFamily: FONT_MAIN,
            fontSize: 19,
            color: COLORS.body,
            fontWeight: 850,
            textTransform: 'uppercase',
          }}
        >
          <span style={{ color: COLORS.accent }}>{score.status}</span>
          <span style={{ color: COLORS.muted, textAlign: 'right' }}>{score.note}</span>
        </div>
      )}
    </div>
  );
};

const TeamName: React.FC<{ text: string; align: 'left' | 'right' }> = ({ text, align }) => (
  <div
    style={{
      minWidth: 0,
      gridColumn: align === 'left' ? 1 : 3,
      gridRow: 1,
      textAlign: align,
      fontFamily: FONT_HEADLINE,
      fontSize: TYPOGRAPHY.scoreTeam,
      lineHeight: 1.02,
      color: COLORS.ink,
      fontWeight: 700,
      textTransform: 'uppercase',
    }}
  >
    {text}
  </div>
);

const StatBoard: React.FC<{ stats?: SportsStat[]; delay?: number }> = ({ stats = [], delay = 62 }) => {
  const frame = useCurrentFrame();
  if (stats.length === 0) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 16, 28),
        marginTop: 34,
        display: 'grid',
        gridTemplateColumns: stats.length === 1 ? '1fr' : '1fr 1fr',
        gap: 13,
      }}
    >
      {stats.slice(0, 4).map((stat, index) => (
        <div
          key={`${stat.label}-${index}`}
          style={{
            minHeight: 145,
            padding: 21,
            background: COLORS.card,
            border: `1px solid ${COLORS.faint}`,
            borderLeft: `7px solid ${index === 0 ? COLORS.accent : COLORS.blue}`,
            boxShadow: `0 16px 44px ${COLORS.shadow}`,
          }}
        >
          <div
            style={{
              fontFamily: FONT_HEADLINE,
              fontSize: TYPOGRAPHY.statValue,
              lineHeight: 0.95,
              color: index === 0 ? COLORS.accent : COLORS.ink,
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {stat.value}
          </div>
          <div
            style={{
              marginTop: 12,
              fontFamily: FONT_MAIN,
              fontSize: TYPOGRAPHY.statLabel,
              color: COLORS.ink,
              fontWeight: 900,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
            }}
          >
            {stat.label}
          </div>
          {stat.note && (
            <div style={{ marginTop: 7, fontFamily: FONT_MAIN, fontSize: 18, lineHeight: 1.3, color: COLORS.muted, fontWeight: 650 }}>
              {stat.note}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const Timeline: React.FC<{ items?: SportsTimelineItem[]; delay?: number }> = ({ items = [], delay = 60 }) => {
  const frame = useCurrentFrame();
  if (items.length === 0) return null;

  return (
    <div style={{ ...appear(frame, delay, 16, 28), marginTop: 34, display: 'grid', gap: 12 }}>
      {items.slice(0, 5).map((item, index) => (
        <div
          key={`${item.time}-${index}`}
          style={{
            display: 'grid',
            gridTemplateColumns: '105px 1fr',
            gap: 18,
            padding: '16px 18px',
            background: COLORS.card,
            border: `1px solid ${COLORS.faint}`,
            borderLeft: `7px solid ${index === 0 ? COLORS.accent : COLORS.blue}`,
            boxShadow: `0 14px 36px ${COLORS.shadow}`,
          }}
        >
          <div style={{ fontFamily: FONT_HEADLINE, fontSize: TYPOGRAPHY.timelineTime, color: COLORS.accent, fontWeight: 700 }}>
            {item.time}
          </div>
          <div>
            <div style={{ fontFamily: FONT_MAIN, fontSize: TYPOGRAPHY.timelineLabel, lineHeight: 1.12, color: COLORS.ink, fontWeight: 900 }}>
              {item.label}
            </div>
            {item.detail && (
              <div style={{ marginTop: 6, fontFamily: FONT_MAIN, fontSize: 20, lineHeight: 1.3, color: COLORS.muted, fontWeight: 650 }}>
                {item.detail}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const QuoteBox: React.FC<{ quote?: SportsQuote; delay?: number }> = ({ quote, delay = 60 }) => {
  const frame = useCurrentFrame();
  if (!quote) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 16, 28),
        marginTop: 38,
        padding: '32px 34px',
        background: COLORS.card,
        border: `1px solid ${COLORS.faint}`,
        borderLeft: `9px solid ${COLORS.accent}`,
        boxShadow: `0 20px 58px ${COLORS.shadow}`,
      }}
    >
      <div style={{ fontFamily: FONT_HEADLINE, fontSize: TYPOGRAPHY.quote, lineHeight: 1.04, color: COLORS.ink, fontWeight: 700, textTransform: 'uppercase' }}>
        "{quote.text}"
      </div>
      <div style={{ marginTop: 20, fontFamily: FONT_MAIN, fontSize: TYPOGRAPHY.quoteSource, lineHeight: 1.28, color: COLORS.accent, fontWeight: 900, textTransform: 'uppercase' }}>
        {quote.source}
        {quote.context ? <span style={{ color: COLORS.muted }}> · {quote.context}</span> : null}
      </div>
    </div>
  );
};

const TagRow: React.FC<{ tags?: string[]; delay?: number }> = ({ tags = [], delay = 96 }) => {
  const frame = useCurrentFrame();
  if (tags.length === 0) return null;

  return (
    <div style={{ ...appear(frame, delay, 10, 22), marginTop: 26, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {tags.slice(0, 5).map((tag) => (
        <div
          key={tag}
          style={{
            padding: '9px 13px',
            background: COLORS.card,
            border: `1px solid ${COLORS.faint}`,
            color: COLORS.ink,
            fontFamily: FONT_MAIN,
            fontSize: TYPOGRAPHY.tag,
            fontWeight: 850,
          }}
        >
          {tag}
        </div>
      ))}
    </div>
  );
};

const CtaLine: React.FC<{ cta?: string; hashtags?: string; delay?: number }> = ({ cta, hashtags, delay = 104 }) => {
  const frame = useCurrentFrame();
  if (!cta && !hashtags) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 12, 24),
        marginTop: 34,
        paddingTop: 22,
        borderTop: `1px solid ${COLORS.faint}`,
        fontFamily: FONT_MAIN,
        fontSize: 24,
        lineHeight: 1.32,
        color: COLORS.body,
        fontWeight: 850,
      }}
    >
      {cta ? <div style={{ color: COLORS.accent, textTransform: 'uppercase' }}>{cta}</div> : null}
      {hashtags ? <div style={{ marginTop: 9, color: COLORS.muted }}>{hashtags}</div> : null}
    </div>
  );
};

export const SportsBriefingScene: React.FC<SportsBriefingSceneRenderProps> = ({
  variant,
  section,
  headline,
  accentWords,
  kicker,
  body,
  body2,
  media,
  mediaHeight,
  score,
  stats,
  timeline,
  quote,
  tags,
  cta,
  hashtags,
  durationFrames,
}) => {
  const isOpening = variant === 'opening';
  const headlineSize = isOpening
    ? TYPOGRAPHY.headlineHero
    : headline.length > 76
      ? TYPOGRAPHY.headlineSmall
      : TYPOGRAPHY.headline;
  const mediaH = mediaHeight ?? (isOpening ? 530 : 470);

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <SportsBriefingBackground />
      <div style={{ position: 'absolute', left: LAYOUT.paddingX, right: LAYOUT.paddingX, top: LAYOUT.top }}>
        <SectionPass label={section} />
        <Kicker text={kicker} />
        <Headline text={headline} accentWords={accentWords} size={headlineSize} maxWidth={isOpening ? 930 : 890} />
        <Body text={body} />
        {score ? <ScoreBoard score={score} delay={isOpening ? 50 : 42} /> : null}
        {variant === 'statBoard' ? <StatBoard stats={stats} delay={50} /> : null}
        {variant !== 'statBoard' ? <MediaFrame media={media} height={mediaH} delay={score ? 72 : 56} durationFrames={durationFrames} /> : null}
        {variant !== 'statBoard' ? <StatBoard stats={stats} delay={media ? 92 : 58} /> : null}
        <Timeline items={timeline} delay={media ? 94 : 58} />
        <QuoteBox quote={quote} delay={media ? 94 : 58} />
        <Body text={body2} delay={media || score || stats || timeline || quote ? 96 : 58} top={24} size={TYPOGRAPHY.bodySmall} />
        <TagRow tags={tags} delay={98} />
        <CtaLine cta={cta} hashtags={hashtags} delay={106} />
      </div>
    </AbsoluteFill>
  );
};
