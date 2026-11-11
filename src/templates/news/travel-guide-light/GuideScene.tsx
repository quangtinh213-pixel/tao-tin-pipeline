import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import { GuideBackground } from './Layout';
import { COLORS, FONT_MAIN, LAYOUT, TYPOGRAPHY } from './tokens';
import type { GuideImage, GuideItem, TravelGuideSceneProps } from './types';

export interface GuideSceneRenderProps extends TravelGuideSceneProps {
  durationFrames: number;
}

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const resolveSrc = (image: GuideImage) =>
  image.storage === 'remote' || /^https?:\/\//i.test(image.src) ? image.src : staticFile(image.src);

const appear = (frame: number, delay: number, distance = 18, duration = 28) => {
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
      <span key={`${part}-${index}`} style={{ color: COLORS.blue }}>
        {part}
      </span>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    );
  });
};

const MetaLabel: React.FC<{ meta: string; destination?: string }> = ({ meta, destination }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        ...appear(frame, 0, 8, 24),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: FONT_MAIN,
        fontSize: TYPOGRAPHY.meta,
        fontWeight: 900,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: COLORS.green,
      }}
    >
      <span>{meta}</span>
      {destination ? <span style={{ color: COLORS.coral }}>{destination}</span> : null}
    </div>
  );
};

const Headline: React.FC<{
  text: string;
  accentWords?: string[];
  size: number;
  delay?: number;
}> = ({ text, accentWords, size, delay = 18 }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        marginTop: 48,
        fontFamily: FONT_MAIN,
        fontSize: size,
        lineHeight: 1.04,
        fontWeight: 900,
        color: COLORS.ink,
      }}
    >
      {splitHeadline(text).map((line, index) => (
        <div key={`${line}-${index}`} style={appear(frame, delay + index * 7, 18, 30)}>
          {highlightText(line, accentWords)}
        </div>
      ))}
    </div>
  );
};

const Body: React.FC<{ text?: string; delay?: number; top?: number }> = ({
  text,
  delay = 48,
  top = 28,
}) => {
  const frame = useCurrentFrame();
  if (!text) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 12, 26),
        marginTop: top,
        maxWidth: 900,
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

const GuideImageCard: React.FC<{
  image?: GuideImage;
  height: number;
  delay?: number;
  durationFrames: number;
}> = ({ image, height, delay = 58, durationFrames }) => {
  const frame = useCurrentFrame();
  if (!image) return null;

  const scale = interpolate(frame, [delay, Math.max(delay + 1, durationFrames)], [1.05, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });

  return (
    <div
      style={{
        ...appear(frame, delay, 16, 30),
        marginTop: 50,
        borderRadius: 34,
        overflow: 'hidden',
        background: COLORS.panel,
        boxShadow: `0 22px 70px ${COLORS.shadow}`,
      }}
    >
      <div style={{ position: 'relative', height, overflow: 'hidden', background: COLORS.faint }}>
        <Img
          src={resolveSrc(image)}
          alt={image.alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: image.fit ?? 'cover',
            objectPosition: image.position ?? 'center',
            transform: `scale(${scale})`,
          }}
        />
      </div>
      {image.credit ? (
        <div
          style={{
            padding: '14px 22px',
            fontFamily: FONT_MAIN,
            fontSize: 18,
            fontWeight: 700,
            color: COLORS.muted,
          }}
        >
          Nguồn: {image.credit}
        </div>
      ) : null}
    </div>
  );
};

const Tags: React.FC<{ tags?: string[]; delay?: number }> = ({ tags = [], delay = 48 }) => {
  const frame = useCurrentFrame();
  if (tags.length === 0) return null;

  return (
    <div style={{ marginTop: 26, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {tags.slice(0, 4).map((tag, index) => (
        <div
          key={tag}
          style={{
            ...appear(frame, delay + index * 5, 8, 20),
            borderRadius: 12,
            padding: '10px 14px',
            background: index === 0 ? COLORS.yellow : COLORS.panel,
            border: `1px solid ${COLORS.line}`,
            fontFamily: FONT_MAIN,
            fontSize: 18,
            fontWeight: 900,
            color: COLORS.ink,
          }}
        >
          {tag}
        </div>
      ))}
    </div>
  );
};

const MetricCard: React.FC<{ metric?: TravelGuideSceneProps['metric']; delay?: number }> = ({
  metric,
  delay = 58,
}) => {
  const frame = useCurrentFrame();
  if (!metric) return null;

  return (
    <div
      style={{
        ...appear(frame, delay, 18, 32),
        marginTop: 66,
        padding: '36px 40px',
        borderRadius: 34,
        background: COLORS.panel,
        boxShadow: `0 22px 70px ${COLORS.shadow}`,
        borderTop: `10px solid ${COLORS.yellow}`,
        fontFamily: FONT_MAIN,
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 900, color: COLORS.green, textTransform: 'uppercase' }}>
        {metric.label}
      </div>
      <div style={{ marginTop: 18, display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <div style={{ fontSize: TYPOGRAPHY.bigNumber, lineHeight: 0.9, fontWeight: 900, color: COLORS.blue }}>
          {metric.value}
        </div>
        {metric.unit ? (
          <div style={{ fontSize: 42, fontWeight: 900, color: COLORS.ink }}>{metric.unit}</div>
        ) : null}
      </div>
      {metric.note ? (
        <div style={{ marginTop: 22, fontSize: 28, lineHeight: 1.36, fontWeight: 650, color: COLORS.body }}>
          {metric.note}
        </div>
      ) : null}
    </div>
  );
};

const ItemGrid: React.FC<{ items?: GuideItem[]; avoidItems?: GuideItem[]; delay?: number }> = ({
  items = [],
  avoidItems = [],
  delay = 58,
}) => {
  const frame = useCurrentFrame();
  const allItems = [
    ...items.map((item) => ({ ...item, group: 'DO' })),
    ...avoidItems.map((item) => ({ ...item, group: 'DON' })),
  ];
  if (allItems.length === 0) return null;

  const toneColor = (tone?: GuideItem['tone'], group?: string) => {
    if (group === 'DON' || tone === 'avoid') return COLORS.red;
    if (tone === 'warn') return COLORS.yellow;
    if (tone === 'good') return COLORS.green;
    return COLORS.blue;
  };

  return (
    <div style={{ marginTop: 50, display: 'grid', gap: 18 }}>
      {allItems.slice(0, 6).map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          style={{
            ...appear(frame, delay + index * 7, 12, 26),
            display: 'grid',
            gridTemplateColumns: '92px 1fr',
            gap: 22,
            padding: '22px 24px',
            borderRadius: 24,
            background: COLORS.panel,
            boxShadow: `0 10px 30px rgba(20, 42, 38, 0.075)`,
            borderLeft: `8px solid ${toneColor(item.tone, item.group)}`,
            fontFamily: FONT_MAIN,
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: toneColor(item.tone, item.group),
              letterSpacing: '0.07em',
            }}
          >
            {item.label}
          </div>
          <div style={{ fontSize: TYPOGRAPHY.cardText, lineHeight: 1.3, fontWeight: 700, color: COLORS.ink }}>
            {item.text}
          </div>
        </div>
      ))}
    </div>
  );
};

const Schedule: React.FC<{ schedule?: TravelGuideSceneProps['schedule']; delay?: number }> = ({
  schedule = [],
  delay = 58,
}) => {
  const frame = useCurrentFrame();
  if (schedule.length === 0) return null;

  return (
    <div style={{ marginTop: 54, display: 'grid', gap: 0 }}>
      {schedule.slice(0, 5).map((item, index) => (
        <div
          key={`${item.time}-${item.title}`}
          style={{
            ...appear(frame, delay + index * 8, 12, 26),
            display: 'grid',
            gridTemplateColumns: '120px 1fr',
            gap: 24,
            minHeight: 106,
            paddingTop: 6,
            borderTop: `1px solid ${COLORS.line}`,
            fontFamily: FONT_MAIN,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 900, color: COLORS.coral }}>{item.time}</div>
          <div>
            <div style={{ fontSize: 30, fontWeight: 900, color: COLORS.ink }}>{item.title}</div>
            {item.detail ? (
              <div style={{ marginTop: 7, fontSize: 23, lineHeight: 1.32, fontWeight: 600, color: COLORS.body }}>
                {item.detail}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
};

const contentStyle: React.CSSProperties = {
  position: 'absolute',
  left: LAYOUT.paddingX,
  right: LAYOUT.paddingX,
  top: LAYOUT.top,
};

export const GuideScene: React.FC<GuideSceneRenderProps> = (props) => {
  const frame = useCurrentFrame();
  const {
    variant,
    durationFrames,
    meta,
    destination,
    headline,
    accentWords,
    body,
    image,
    imageHeight,
    metric,
    items,
    avoidItems,
    schedule,
    tags,
    cta,
    hashtags,
  } = props;

  const headlineSize =
    variant === 'opening'
      ? TYPOGRAPHY.headlineHero
      : variant === 'checklist' || variant === 'dosDonts'
        ? TYPOGRAPHY.headlineSmall
        : TYPOGRAPHY.headline;

  return (
    <AbsoluteFill>
      <GuideBackground />
      <div style={contentStyle}>
        <MetaLabel meta={meta} destination={destination} />
        <Headline text={headline} accentWords={accentWords} size={headlineSize} />
        <Body text={body} />
        <Tags tags={tags} />

        {variant === 'opening' || variant === 'season' ? (
          <GuideImageCard
            image={image}
            height={imageHeight ?? (variant === 'opening' ? 640 : 520)}
            durationFrames={durationFrames}
          />
        ) : null}

        {variant === 'budget' ? <MetricCard metric={metric} /> : null}
        {variant === 'itinerary' ? <Schedule schedule={schedule} /> : null}
        {variant === 'checklist' || variant === 'dosDonts' ? (
          <ItemGrid items={items} avoidItems={avoidItems} />
        ) : null}

        {variant === 'closing' ? (
          <div
            style={{
              ...appear(frame, 66, 10, 30),
              marginTop: 58,
              padding: '32px 36px',
              borderRadius: 28,
              background: COLORS.green,
              color: COLORS.panel,
              fontFamily: FONT_MAIN,
              fontSize: 31,
              fontWeight: 900,
              lineHeight: 1.25,
              boxShadow: `0 22px 70px ${COLORS.shadow}`,
            }}
          >
            {cta ?? 'Lưu checklist trước khi đặt chuyến'}
          </div>
        ) : null}
      </div>

      {hashtags ? (
        <div
          style={{
            position: 'absolute',
            left: LAYOUT.paddingX,
            right: LAYOUT.paddingX,
            bottom: 132,
            textAlign: 'center',
            fontFamily: FONT_MAIN,
            fontSize: 23,
            fontWeight: 800,
            color: COLORS.faint,
          }}
        >
          {hashtags}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
