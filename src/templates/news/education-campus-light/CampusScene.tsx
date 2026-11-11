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
import { CampusBackground } from './Layout';
import { COLORS, FONT_MAIN, LAYOUT, TYPOGRAPHY } from './tokens';
import type {
  CampusChecklistItem,
  CampusMedia,
  CampusMetric,
  CampusSceneProps,
  EducationCampusTone,
} from './types';

export interface CampusSceneRenderProps extends CampusSceneProps {
  durationFrames: number;
}

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const resolveSrc = (media: CampusMedia) =>
  media.storage === 'remote' || /^https?:\/\//i.test(media.src) ? media.src : staticFile(media.src);

const appear = (frame: number, delay: number, distance = 14, duration = 28) => {
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

const toneColor = (tone?: EducationCampusTone) => {
  if (tone === 'urgent' || tone === 'warning') return COLORS.coral;
  if (tone === 'positive') return COLORS.mint;
  return COLORS.blue;
};

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

const Rail: React.FC<{ section: string; tone?: EducationCampusTone }> = ({ section, tone }) => {
  const frame = useCurrentFrame();
  const color = toneColor(tone);

  return (
    <div
      style={{
        position: 'absolute',
        left: LAYOUT.railX,
        top: LAYOUT.top,
        bottom: 190,
        width: 48,
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <div
        style={{
          ...appear(frame, 0, 8, 24),
          width: 30,
          height: 30,
          borderRadius: 8,
          background: color,
          boxShadow: `0 10px 24px ${COLORS.shadow}`,
        }}
      />
      <div style={{ flex: 1, width: 2, background: color, opacity: 0.36 }} />
      <div
        style={{
          ...appear(frame, 12, 8, 24),
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          fontFamily: FONT_MAIN,
          fontSize: TYPOGRAPHY.rail,
          fontWeight: 900,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: COLORS.indigo,
        }}
      >
        {section}
      </div>
    </div>
  );
};

const HeaderSheet: React.FC<{
  meta: string;
  eyebrow?: string;
  headline: string;
  accentWords?: string[];
  tone?: EducationCampusTone;
  size?: number;
}> = ({ meta, eyebrow, headline, accentWords, tone, size = TYPOGRAPHY.headline }) => {
  const frame = useCurrentFrame();
  const color = toneColor(tone);
  const lines = splitHeadline(headline);

  return (
    <div
      style={{
        ...appear(frame, 2, 16, 30),
        padding: '30px 34px 34px',
        borderRadius: LAYOUT.radius,
        background: COLORS.paper,
        border: `1px solid ${COLORS.line}`,
        boxShadow: `0 18px 42px ${COLORS.shadow}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: -34,
          top: -34,
          width: 130,
          height: 130,
          borderRadius: 999,
          background: tone === 'urgent' || tone === 'warning' ? COLORS.coralSoft : COLORS.blueSoft,
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontFamily: FONT_MAIN,
          fontSize: TYPOGRAPHY.meta,
          fontWeight: 900,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color,
        }}
      >
        <span style={{ width: 42, height: 5, borderRadius: 999, background: color }} />
        {meta}
      </div>
      {eyebrow ? (
        <div
          style={{
            marginTop: 24,
            fontFamily: FONT_MAIN,
            fontSize: TYPOGRAPHY.eyebrow,
            fontWeight: 900,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: COLORS.muted,
          }}
        >
          {eyebrow}
        </div>
      ) : null}
      <div
        style={{
          marginTop: 18,
          fontFamily: FONT_MAIN,
          fontSize: size,
          lineHeight: 1.04,
          letterSpacing: 0,
          fontWeight: 900,
          color: COLORS.ink,
        }}
      >
        {lines.map((line, index) => (
          <div key={`${line}-${index}`} style={appear(frame, 18 + index * 7, 18, 30)}>
            {highlightText(line, accentWords, color)}
          </div>
        ))}
      </div>
    </div>
  );
};

const Body: React.FC<{ text?: string; delay?: number; top?: number }> = ({
  text,
  delay = 45,
  top = 28,
}) => {
  const frame = useCurrentFrame();
  if (!text) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 12, 28),
        marginTop: top,
        fontFamily: FONT_MAIN,
        fontSize: TYPOGRAPHY.body,
        lineHeight: 1.42,
        fontWeight: 650,
        color: COLORS.body,
      }}
    >
      {text}
    </div>
  );
};

const TagStack: React.FC<{ tags?: string[] }> = ({ tags = [] }) => {
  const frame = useCurrentFrame();
  if (tags.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
      {tags.slice(0, 4).map((tag, index) => (
        <div
          key={tag}
          style={{
            ...appear(frame, 58 + index * 5, 8, 24),
            padding: '10px 13px',
            borderRadius: 8,
            background: COLORS.paperWarm,
            border: `1px solid ${COLORS.line}`,
            color: COLORS.indigo,
            fontFamily: FONT_MAIN,
            fontSize: 19,
            fontWeight: 850,
          }}
        >
          {tag}
        </div>
      ))}
    </div>
  );
};

const MediaPostcard: React.FC<{
  media?: CampusMedia;
  height: number;
  durationFrames: number;
  delay?: number;
}> = ({ media, height, durationFrames, delay = 58 }) => {
  const frame = useCurrentFrame();
  if (!media) return null;

  const src = resolveSrc(media);
  const isVideo = media.mediaType === 'VIDEO' || /\.(mp4|mov)(\?|$)/i.test(media.src);
  const scale = interpolate(frame, [delay, Math.max(delay + 1, durationFrames)], [1.05, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });

  return (
    <div
      style={{
        ...appear(frame, delay, 18, 34),
        marginTop: 34,
        padding: 16,
        borderRadius: LAYOUT.radius,
        background: COLORS.paper,
        border: `1px solid ${COLORS.line}`,
        boxShadow: `0 18px 42px ${COLORS.shadow}`,
        transform: `${appear(frame, delay, 18, 34).transform} rotate(-1.2deg)`,
      }}
    >
      <div style={{ position: 'relative', height, borderRadius: 6, overflow: 'hidden', background: COLORS.blueSoft }}>
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
            left: 14,
            top: 14,
            padding: '7px 11px',
            borderRadius: 8,
            background: COLORS.coral,
            color: COLORS.paper,
            fontFamily: FONT_MAIN,
            fontSize: 16,
            fontWeight: 900,
            letterSpacing: '0.08em',
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
          fontWeight: 750,
          color: COLORS.muted,
        }}
      >
        Ảnh: {media.credit}
      </div>
    </div>
  );
};

const MetricBoard: React.FC<{ metrics?: CampusMetric[]; delay?: number }> = ({
  metrics = [],
  delay = 56,
}) => {
  const frame = useCurrentFrame();
  if (metrics.length === 0) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: metrics.length === 1 ? '1fr' : '1fr 1fr', gap: 16, marginTop: 34 }}>
      {metrics.slice(0, 4).map((metric, index) => (
        <div
          key={`${metric.label}-${index}`}
          style={{
            ...appear(frame, delay + index * 7, 12, 28),
            minHeight: 176,
            padding: 22,
            borderRadius: LAYOUT.radius,
            background: index % 2 === 0 ? COLORS.paper : COLORS.paperWarm,
            border: `1px solid ${COLORS.line}`,
            boxShadow: `0 12px 30px ${COLORS.shadow}`,
          }}
        >
          <div style={{ fontFamily: FONT_MAIN, fontSize: metrics.length === 1 ? TYPOGRAPHY.metric : 56, lineHeight: 0.95, fontWeight: 900, color: toneColor(metric.tone) }}>
            {metric.value}
            {metric.unit ? <span style={{ marginLeft: 9, fontSize: metrics.length === 1 ? TYPOGRAPHY.metricUnit : 28 }}>{metric.unit}</span> : null}
          </div>
          <div style={{ marginTop: 14, fontFamily: FONT_MAIN, fontSize: TYPOGRAPHY.bodySmall, fontWeight: 900, color: COLORS.ink }}>
            {metric.label}
          </div>
          {metric.note ? <div style={{ marginTop: 8, fontFamily: FONT_MAIN, fontSize: 19, lineHeight: 1.35, color: COLORS.body }}>{metric.note}</div> : null}
        </div>
      ))}
    </div>
  );
};

const TimelineBoard: React.FC<{ items?: CampusSceneProps['timeline']; delay?: number }> = ({
  items = [],
  delay = 56,
}) => {
  const frame = useCurrentFrame();
  if (items.length === 0) return null;

  return (
    <div style={{ marginTop: 34, padding: 24, borderRadius: LAYOUT.radius, background: COLORS.paper, border: `1px solid ${COLORS.line}` }}>
      {items.slice(0, 5).map((item, index) => (
        <div
          key={`${item.time}-${index}`}
          style={{
            ...appear(frame, delay + index * 8, 12, 28),
            display: 'grid',
            gridTemplateColumns: '132px 1fr',
            gap: 20,
            padding: index === 0 ? '0 0 18px' : '18px 0',
            borderTop: index === 0 ? undefined : `1px dashed ${COLORS.line}`,
          }}
        >
          <div style={{ fontFamily: FONT_MAIN, fontSize: 22, fontWeight: 900, color: index === 0 ? COLORS.coral : COLORS.blue }}>
            {item.time}
          </div>
          <div>
            <div style={{ fontFamily: FONT_MAIN, fontSize: 29, fontWeight: 900, color: COLORS.ink }}>{item.label}</div>
            {item.detail ? <div style={{ marginTop: 6, fontFamily: FONT_MAIN, fontSize: 21, lineHeight: 1.34, color: COLORS.body }}>{item.detail}</div> : null}
          </div>
        </div>
      ))}
    </div>
  );
};

const ChecklistBoard: React.FC<{ items?: CampusChecklistItem[]; delay?: number }> = ({
  items = [],
  delay = 56,
}) => {
  const frame = useCurrentFrame();
  if (items.length === 0) return null;

  return (
    <div style={{ display: 'grid', gap: 13, marginTop: 34 }}>
      {items.slice(0, 5).map((item, index) => (
        <div
          key={`${item.text}-${index}`}
          style={{
            ...appear(frame, delay + index * 7, 12, 28),
            display: 'grid',
            gridTemplateColumns: '64px 1fr',
            gap: 18,
            alignItems: 'center',
            padding: '17px 20px',
            borderRadius: LAYOUT.radius,
            background: COLORS.paper,
            border: `1px solid ${COLORS.line}`,
          }}
        >
          <div style={{ width: 42, height: 42, borderRadius: 8, background: toneColor(item.tone), color: COLORS.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_MAIN, fontSize: 18, fontWeight: 900 }}>
            {item.label ?? index + 1}
          </div>
          <div style={{ fontFamily: FONT_MAIN, fontSize: TYPOGRAPHY.listText, lineHeight: 1.18, fontWeight: 850, color: COLORS.ink }}>
            {item.text}
          </div>
        </div>
      ))}
    </div>
  );
};

const ProfileCard: React.FC<{ profile?: CampusSceneProps['profile']; delay?: number }> = ({
  profile,
  delay = 58,
}) => {
  const frame = useCurrentFrame();
  if (!profile) return null;

  return (
    <div style={{ ...appear(frame, delay, 16, 30), marginTop: 34, padding: 30, borderRadius: LAYOUT.radius, background: COLORS.paperWarm, border: `1px solid ${COLORS.line}`, boxShadow: `0 18px 40px ${COLORS.shadow}` }}>
      <div style={{ fontFamily: FONT_MAIN, fontSize: 52, lineHeight: 1.04, fontWeight: 900, color: COLORS.indigo }}>{profile.name}</div>
      {profile.role ? <div style={{ marginTop: 14, fontFamily: FONT_MAIN, fontSize: 27, fontWeight: 900, color: COLORS.coral }}>{profile.role}</div> : null}
      {profile.institution ? <div style={{ marginTop: 10, fontFamily: FONT_MAIN, fontSize: 23, fontWeight: 750, color: COLORS.body }}>{profile.institution}</div> : null}
      {profile.achievement ? <div style={{ marginTop: 22, fontFamily: FONT_MAIN, fontSize: 30, lineHeight: 1.28, fontWeight: 850, color: COLORS.ink }}>{profile.achievement}</div> : null}
    </div>
  );
};

const QuoteCard: React.FC<{ quote?: CampusSceneProps['quote']; delay?: number }> = ({
  quote,
  delay = 56,
}) => {
  const frame = useCurrentFrame();
  if (!quote) return null;

  return (
    <div style={{ ...appear(frame, delay, 16, 32), marginTop: 34, padding: 34, borderRadius: LAYOUT.radius, background: COLORS.indigo, boxShadow: `0 18px 40px ${COLORS.shadow}` }}>
      <div style={{ fontFamily: FONT_MAIN, fontSize: TYPOGRAPHY.quote, lineHeight: 1.16, fontWeight: 900, color: COLORS.paper }}>
        "{quote.text}"
      </div>
      <div style={{ marginTop: 24, fontFamily: FONT_MAIN, fontSize: 24, fontWeight: 900, color: COLORS.yellow }}>
        {quote.source}
      </div>
      {quote.context ? <div style={{ marginTop: 8, fontFamily: FONT_MAIN, fontSize: 21, color: '#D7DEEA' }}>{quote.context}</div> : null}
    </div>
  );
};

const contentStyle: React.CSSProperties = {
  position: 'absolute',
  left: LAYOUT.contentX,
  right: LAYOUT.right,
  top: LAYOUT.top,
};

export const CampusScene: React.FC<CampusSceneRenderProps> = (props) => {
  const {
    variant,
    durationFrames,
    section,
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

  const headlineSize =
    variant === 'opening' ? TYPOGRAPHY.headlineHero : variant === 'timeline' || variant === 'checklist' ? TYPOGRAPHY.headlineSmall : TYPOGRAPHY.headline;

  return (
    <AbsoluteFill>
      <CampusBackground />
      <Rail section={section} tone={tone} />
      <div style={contentStyle}>
        <HeaderSheet
          meta={meta}
          eyebrow={eyebrow}
          headline={headline}
          accentWords={accentWords}
          tone={tone}
          size={headlineSize}
        />
        <Body text={body} />
        <TagStack tags={tags} />
        {(variant === 'opening' || variant === 'media' || media) && (
          <MediaPostcard media={media} height={mediaHeight ?? (variant === 'opening' ? 520 : 560)} durationFrames={durationFrames} />
        )}
        {(variant === 'stats' || variant === 'deadline') && <MetricBoard metrics={metrics} />}
        {variant === 'timeline' && <TimelineBoard items={timeline} />}
        {variant === 'checklist' && <ChecklistBoard items={checklist} />}
        {variant === 'profile' && <ProfileCard profile={profile} />}
        {variant === 'quote' && <QuoteCard quote={quote} />}
        <Body text={body2} delay={74} top={28} />
        {variant === 'closing' ? (
          <div style={{ marginTop: 38 }}>
            {cta ? (
              <div style={{ display: 'inline-flex', padding: '17px 23px', borderRadius: 8, background: COLORS.coral, color: COLORS.paper, fontFamily: FONT_MAIN, fontSize: 28, fontWeight: 900 }}>
                {cta}
              </div>
            ) : null}
            {hashtags ? <div style={{ marginTop: 22, fontFamily: FONT_MAIN, fontSize: 24, fontWeight: 850, color: COLORS.blue }}>{hashtags}</div> : null}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
