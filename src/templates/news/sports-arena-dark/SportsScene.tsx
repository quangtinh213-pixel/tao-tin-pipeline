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
import { ArenaBackground } from './Layout';
import {
  COLORS,
  FONT_MAIN,
  FONT_SCOREBOARD,
  LAYOUT,
  TYPOGRAPHY,
  getSportAccent,
} from './tokens';
import type {
  SportKind,
  SportsMedia,
  SportsQuote,
  SportsSceneProps,
  SportsScore,
  SportsStat,
  SportsTimelineItem,
} from './types';

export interface SportsSceneRenderProps extends SportsSceneProps {
  durationFrames: number;
}

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const resolveSrc = (media: SportsMedia) =>
  media.storage === 'remote' || /^https?:\/\//i.test(media.src) ? media.src : staticFile(media.src);

const appear = (frame: number, delay: number, distance = 16, duration = 26) => {
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

const highlightText = (text: string, accentWords: string[] = [], accent: string) => {
  const escaped = accentWords
    .filter(Boolean)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (escaped.length === 0) return text;

  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'gi'));
  return parts.map((part, index) => {
    const isAccent = accentWords.some((word) => word.toLowerCase() === part.toLowerCase());
    return isAccent ? (
      <span key={`${part}-${index}`} style={{ color: accent }}>
        {part}
      </span>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    );
  });
};

const SectionPass: React.FC<{ label: string; accent: string; delay?: number }> = ({
  label,
  accent,
  delay = 0,
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        ...appear(frame, delay, 8, 20),
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        height: 44,
        padding: '0 18px',
        borderRadius: 6,
        background: 'rgba(248, 250, 252, 0.075)',
        border: `1px solid ${accent}70`,
        boxShadow: `0 18px 42px rgba(0,0,0,0.28), 0 0 22px ${accent}24`,
        fontFamily: FONT_MAIN,
        fontSize: TYPOGRAPHY.section,
        fontWeight: 900,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: accent,
      }}
    >
      <span style={{ width: 26, height: 3, background: accent, display: 'inline-block' }} />
      {label}
    </div>
  );
};

const Kicker: React.FC<{ text?: string; accent: string; delay?: number }> = ({
  text,
  accent,
  delay = 14,
}) => {
  const frame = useCurrentFrame();
  if (!text) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 10, 22),
        marginTop: 32,
        fontFamily: FONT_MAIN,
        fontSize: TYPOGRAPHY.kicker,
        lineHeight: 1.16,
        fontWeight: 900,
        color: accent,
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
  accent: string;
  size?: number;
  delay?: number;
  maxWidth?: number;
}> = ({ text, accentWords, accent, size = TYPOGRAPHY.headline, delay = 22, maxWidth = 900 }) => {
  const frame = useCurrentFrame();
  const lines = splitHeadline(text);

  return (
    <div
      style={{
        maxWidth,
        marginTop: 26,
        fontFamily: FONT_SCOREBOARD,
        fontSize: size,
        lineHeight: 0.92,
        letterSpacing: 0,
        fontWeight: 700,
        color: COLORS.ink,
        textShadow: '0 18px 70px rgba(0,0,0,0.62)',
        textTransform: 'uppercase',
      }}
    >
      {lines.map((line, index) => (
        <div key={`${line}-${index}`} style={{ ...appear(frame, delay + index * 6, 18, 28) }}>
          {highlightText(line, accentWords, accent)}
        </div>
      ))}
    </div>
  );
};

const Body: React.FC<{
  text?: string;
  delay?: number;
  top?: number;
  maxWidth?: number;
  size?: number;
  weight?: number;
}> = ({ text, delay = 48, top = 26, maxWidth = 900, size = TYPOGRAPHY.body, weight = 650 }) => {
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
        fontWeight: weight,
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
  accent: string;
  delay?: number;
  durationFrames: number;
}> = ({ media, height, accent, delay = 58, durationFrames }) => {
  const frame = useCurrentFrame();
  if (!media) return null;

  const scale = interpolate(frame, [delay, Math.max(delay + 1, durationFrames)], [1.06, 1.015], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });
  const reveal = interpolate(frame - delay, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
  const isVideo = media.mediaType === 'VIDEO' || /\.(mp4|mov)(\?|$)/i.test(media.src);
  const src = resolveSrc(media);

  return (
    <div style={{ ...appear(frame, delay, 20, 32), marginTop: 46 }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height,
          overflow: 'hidden',
          borderRadius: LAYOUT.imageRadius,
          background: COLORS.black,
          border: `1px solid ${accent}54`,
          boxShadow: `0 34px 90px ${COLORS.shadow}, 0 0 0 8px rgba(255,255,255,0.045)`,
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
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0) 54%, rgba(0,0,0,0.42) 100%), linear-gradient(90deg, rgba(255,255,255,0.10), rgba(255,255,255,0))',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 18,
            top: 18,
            padding: '8px 13px',
            borderRadius: 6,
            background: 'rgba(5, 7, 11, 0.76)',
            border: `1px solid ${accent}60`,
            color: accent,
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
          lineHeight: 1.3,
          color: COLORS.muted,
          fontWeight: 700,
        }}
      >
        Nguồn: <span style={{ color: accent }}>{media.credit}</span>
      </div>
    </div>
  );
};

const ScoreBoard: React.FC<{ score?: SportsScore; accent: string; delay?: number }> = ({
  score,
  accent,
  delay = 46,
}) => {
  const frame = useCurrentFrame();
  if (!score) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 18, 28),
        marginTop: 34,
        display: 'grid',
        gridTemplateColumns: '1fr 156px 1fr',
        alignItems: 'center',
        gap: 14,
        padding: '24px 24px',
        borderRadius: 12,
        background: COLORS.panel,
        border: `1px solid ${accent}6B`,
        boxShadow: `0 20px 60px rgba(0,0,0,0.32), inset 0 0 38px ${accent}12`,
      }}
    >
      <div
        style={{
          minWidth: 0,
          gridColumn: 1,
          gridRow: 1,
          textAlign: 'left',
          fontFamily: FONT_SCOREBOARD,
          fontSize: TYPOGRAPHY.scoreTeam,
          lineHeight: 1.02,
          color: COLORS.ink,
          fontWeight: 700,
          textTransform: 'uppercase',
        }}
      >
        {score.home}
      </div>
      <div
        style={{
          gridColumn: 2,
          gridRow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          fontFamily: FONT_SCOREBOARD,
          fontSize: TYPOGRAPHY.scoreValue,
          lineHeight: 0.9,
          fontWeight: 700,
          color: accent,
          textShadow: `0 0 22px ${accent}66`,
        }}
      >
        <span>{score.homeScore ?? '-'}</span>
        <span style={{ color: COLORS.muted, fontSize: 52 }}>:</span>
        <span>{score.awayScore ?? '-'}</span>
      </div>
      <div
        style={{
          minWidth: 0,
          gridColumn: 3,
          gridRow: 1,
          textAlign: 'right',
          fontFamily: FONT_SCOREBOARD,
          fontSize: TYPOGRAPHY.scoreTeam,
          lineHeight: 1.02,
          color: COLORS.ink,
          fontWeight: 700,
          textTransform: 'uppercase',
        }}
      >
        {score.away}
      </div>
      {(score.status || score.note) && (
        <div
          style={{
            gridColumn: '1 / -1',
            marginTop: 16,
            borderTop: `1px solid ${COLORS.line}`,
            paddingTop: 14,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 18,
            fontFamily: FONT_MAIN,
            fontSize: 20,
            color: COLORS.body,
            fontWeight: 800,
            textTransform: 'uppercase',
          }}
        >
          <span style={{ color: accent }}>{score.status}</span>
          <span style={{ color: COLORS.muted, textAlign: 'right' }}>{score.note}</span>
        </div>
      )}
    </div>
  );
};

const StatBoard: React.FC<{ stats?: SportsStat[]; accent: string; delay?: number }> = ({
  stats = [],
  accent,
  delay = 64,
}) => {
  const frame = useCurrentFrame();
  if (stats.length === 0) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 18, 28),
        marginTop: 36,
        display: 'grid',
        gridTemplateColumns: stats.length === 1 ? '1fr' : '1fr 1fr',
        gap: 14,
      }}
    >
      {stats.slice(0, 4).map((stat, index) => (
        <div
          key={`${stat.label}-${index}`}
          style={{
            minHeight: 154,
            padding: 22,
            borderRadius: 12,
            background: COLORS.panel,
            border: `1px solid ${index === 0 ? accent : COLORS.line}`,
            boxShadow: index === 0 ? `0 0 32px ${accent}1C` : undefined,
          }}
        >
          <div
            style={{
              fontFamily: FONT_SCOREBOARD,
              fontSize: TYPOGRAPHY.statValue,
              lineHeight: 0.95,
              color: index === 0 ? accent : COLORS.ink,
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {stat.value}
          </div>
          <div
            style={{
              marginTop: 14,
              fontFamily: FONT_MAIN,
              fontSize: TYPOGRAPHY.statLabel,
              color: COLORS.ink,
              fontWeight: 900,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {stat.label}
          </div>
          {stat.note && (
            <div
              style={{
                marginTop: 8,
                fontFamily: FONT_MAIN,
                fontSize: 18,
                lineHeight: 1.3,
                color: COLORS.muted,
                fontWeight: 650,
              }}
            >
              {stat.note}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const Timeline: React.FC<{ items?: SportsTimelineItem[]; accent: string; delay?: number }> = ({
  items = [],
  accent,
  delay = 62,
}) => {
  const frame = useCurrentFrame();
  if (items.length === 0) return null;

  return (
    <div style={{ ...appear(frame, delay, 18, 28), marginTop: 38, display: 'grid', gap: 13 }}>
      {items.slice(0, 5).map((item, index) => (
        <div
          key={`${item.time}-${index}`}
          style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr',
            gap: 18,
            padding: '17px 18px',
            borderRadius: 11,
            background: index === 0 ? `${accent}16` : COLORS.panel,
            border: `1px solid ${index === 0 ? accent : COLORS.line}`,
          }}
        >
          <div
            style={{
              fontFamily: FONT_SCOREBOARD,
              fontSize: TYPOGRAPHY.timelineTime,
              color: accent,
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {item.time}
          </div>
          <div>
            <div
              style={{
                fontFamily: FONT_MAIN,
                fontSize: TYPOGRAPHY.timelineLabel,
                lineHeight: 1.12,
                color: COLORS.ink,
                fontWeight: 900,
              }}
            >
              {item.label}
            </div>
            {item.detail && (
              <div
                style={{
                  marginTop: 6,
                  fontFamily: FONT_MAIN,
                  fontSize: 20,
                  lineHeight: 1.3,
                  color: COLORS.muted,
                  fontWeight: 650,
                }}
              >
                {item.detail}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const QuoteBox: React.FC<{ quote?: SportsQuote; accent: string; delay?: number }> = ({
  quote,
  accent,
  delay = 62,
}) => {
  const frame = useCurrentFrame();
  if (!quote) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 18, 28),
        marginTop: 42,
        padding: '34px 36px',
        borderRadius: 16,
        background: COLORS.panel,
        borderLeft: `8px solid ${accent}`,
        boxShadow: `0 22px 70px rgba(0,0,0,0.32)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT_SCOREBOARD,
          fontSize: TYPOGRAPHY.quote,
          lineHeight: 1.03,
          color: COLORS.ink,
          fontWeight: 700,
          textTransform: 'uppercase',
        }}
      >
        "{quote.text}"
      </div>
      <div
        style={{
          marginTop: 22,
          fontFamily: FONT_MAIN,
          fontSize: TYPOGRAPHY.quoteSource,
          lineHeight: 1.28,
          color: accent,
          fontWeight: 900,
          textTransform: 'uppercase',
        }}
      >
        {quote.source}
        {quote.context ? <span style={{ color: COLORS.muted }}> · {quote.context}</span> : null}
      </div>
    </div>
  );
};

const TagRow: React.FC<{ tags?: string[]; accent: string; delay?: number }> = ({
  tags = [],
  accent,
  delay = 72,
}) => {
  const frame = useCurrentFrame();
  if (tags.length === 0) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 10, 22),
        marginTop: 28,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
      }}
    >
      {tags.slice(0, 5).map((tag) => (
        <div
          key={tag}
          style={{
            padding: '9px 13px',
            borderRadius: 6,
            background: `${accent}18`,
            border: `1px solid ${accent}60`,
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

const CtaLine: React.FC<{ cta?: string; hashtags?: string; accent: string; delay?: number }> = ({
  cta,
  hashtags,
  accent,
  delay = 78,
}) => {
  const frame = useCurrentFrame();
  if (!cta && !hashtags) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 12, 24),
        marginTop: 36,
        paddingTop: 24,
        borderTop: `1px solid ${COLORS.line}`,
        fontFamily: FONT_MAIN,
        fontSize: 25,
        lineHeight: 1.32,
        color: COLORS.body,
        fontWeight: 850,
      }}
    >
      {cta ? <div style={{ color: accent, textTransform: 'uppercase' }}>{cta}</div> : null}
      {hashtags ? <div style={{ marginTop: 10, color: COLORS.muted }}>{hashtags}</div> : null}
    </div>
  );
};

const sportLabel = (sport: SportKind) => {
  const labels: Record<SportKind, string> = {
    football: 'FOOTBALL',
    basketball: 'BASKETBALL',
    mma: 'MMA',
    boxing: 'BOXING',
    tennis: 'TENNIS',
    racing: 'RACING',
    esports: 'ESPORTS',
    other: 'SPORTS',
  };
  return labels[sport];
};

export const SportsScene: React.FC<SportsSceneRenderProps> = ({
  variant,
  sport = 'other',
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
  const frame = useCurrentFrame();
  const accent = getSportAccent(sport);
  const isOpening = variant === 'opening';
  const isClosing = variant === 'closing';
  const headlineSize = isOpening
    ? TYPOGRAPHY.headlineHero
    : headline.length > 76
      ? TYPOGRAPHY.headlineSmall
      : TYPOGRAPHY.headline;
  const mediaH = mediaHeight ?? (isOpening ? 560 : 500);
  const pulse = interpolate(frame, [0, 16, 34], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <ArenaBackground sport={sport} />
      <div
        style={{
          position: 'absolute',
          left: LAYOUT.paddingX,
          right: LAYOUT.paddingX,
          top: LAYOUT.top,
        }}
      >
        <SectionPass label={section || sportLabel(sport)} accent={accent} />
        <Kicker text={kicker} accent={accent} />
        <Headline
          text={headline}
          accentWords={accentWords}
          accent={accent}
          size={headlineSize}
          maxWidth={isOpening ? 930 : 890}
        />
        <Body text={body} />
        {score ? <ScoreBoard score={score} accent={accent} delay={isOpening ? 50 : 42} /> : null}
        {variant === 'statBoard' ? <StatBoard stats={stats} accent={accent} delay={50} /> : null}
        {variant !== 'statBoard' ? <MediaFrame media={media} height={mediaH} accent={accent} delay={score ? 72 : 56} durationFrames={durationFrames} /> : null}
        {variant !== 'statBoard' ? <StatBoard stats={stats} accent={accent} delay={media ? 92 : 58} /> : null}
        <Timeline items={timeline} accent={accent} delay={media ? 94 : 58} />
        <QuoteBox quote={quote} accent={accent} delay={media ? 94 : 58} />
        <Body text={body2} delay={media || score || stats || timeline || quote ? 96 : 58} top={24} size={TYPOGRAPHY.bodySmall} />
        <TagRow tags={tags} accent={accent} delay={98} />
        <CtaLine cta={cta} hashtags={hashtags} accent={accent} delay={106} />
      </div>

      <div
        style={{
          position: 'absolute',
          right: 44,
          bottom: 64,
          opacity: isClosing ? 0.34 : 0.22,
          fontFamily: FONT_SCOREBOARD,
          fontSize: 86,
          fontWeight: 700,
          color: accent,
          textTransform: 'uppercase',
          transform: 'rotate(-90deg)',
          transformOrigin: 'right bottom',
          letterSpacing: 0,
        }}
      >
        {sportLabel(sport)}
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: pulse * 0.18,
          background: accent,
          mixBlendMode: 'screen',
        }}
      />
    </AbsoluteFill>
  );
};
