import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, Video} from 'remotion';
import {NoirBackground} from './Layout';
import {COLORS, FONT_SANS, FONT_SERIF, FONT_SERIF_ITALIC, LAYOUT, TYPE} from './tokens';
import type {BeautyMedia, BeautySceneProps} from './types';

export interface LuxuryBeautySceneRenderProps extends BeautySceneProps {
  durationFrames: number;
}

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const enter = (frame: number, delay: number, y = 18, duration = 30) => {
  const p = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
  return {opacity: p, transform: `translateY(${(1 - p) * y}px)`};
};

const mediaSrc = (media: BeautyMedia) =>
  media.storage === 'remote' || /^https?:\/\//i.test(media.src) ? media.src : staticFile(media.src);

const RichHeadline: React.FC<{text: string; accents?: string[]; hero?: boolean; compact?: boolean}> = ({
  text,
  accents = [],
  hero = false,
  compact = false,
}) => {
  const frame = useCurrentFrame();
  const escaped = accents.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const renderLine = (line: string) => {
    if (escaped.length === 0) return line;
    return line.split(new RegExp(`(${escaped.join('|')})`, 'gi')).map((part, index) =>
      accents.some((word) => word.toLocaleLowerCase() === part.toLocaleLowerCase()) ? (
        <span key={`${part}-${index}`} style={{fontFamily: FONT_SERIF_ITALIC, color: COLORS.gold, fontWeight: 500}}>
          {part}
        </span>
      ) : (
        <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
      ),
    );
  };
  return (
    <div
      style={{
        marginTop: 28,
        fontFamily: FONT_SERIF,
        fontSize: hero ? TYPE.hero : compact ? TYPE.compact : TYPE.headline,
        lineHeight: 1,
        fontWeight: 500,
        letterSpacing: '-0.02em',
        color: COLORS.ivory,
        maxWidth: 920,
      }}
    >
      {(text.includes('\n') ? text.split('\n') : [text]).filter(Boolean).map((line, index) => (
        <div key={`${line}-${index}`} style={enter(frame, 14 + index * 8, 22, 32)}>
          {renderLine(line)}
        </div>
      ))}
    </div>
  );
};

const Header: React.FC<{section: string; category: string; eyebrow?: string}> = ({section, category, eyebrow}) => {
  const frame = useCurrentFrame();
  return (
    <>
      <div style={{...enter(frame, 0, 8, 24), display: 'flex', alignItems: 'center', gap: 14}}>
        <div style={{width: 34, height: 1, background: COLORS.gold}} />
        <div style={{fontSize: TYPE.section, fontWeight: 700, color: COLORS.gold, letterSpacing: '.16em'}}>
          {section.toUpperCase()}
        </div>
        <div style={{fontSize: 16, fontWeight: 600, color: COLORS.muted, letterSpacing: '.1em'}}>
          {category.replace(/-/g, ' ').toUpperCase()}
        </div>
      </div>
      {eyebrow ? (
        <div style={{...enter(frame, 8, 8, 24), marginTop: 22, fontSize: TYPE.eyebrow, color: COLORS.rose, fontWeight: 700}}>
          {eyebrow.toUpperCase()}
        </div>
      ) : null}
    </>
  );
};

const Body: React.FC<{text?: string; delay?: number; small?: boolean}> = ({text, delay = 44, small = false}) => {
  const frame = useCurrentFrame();
  if (!text) return null;
  return (
    <div style={{...enter(frame, delay, 12, 28), marginTop: 25, maxWidth: 890, fontSize: small ? TYPE.small : TYPE.body, lineHeight: 1.42, color: COLORS.pearl, fontWeight: 500}}>
      {text}
    </div>
  );
};

const ArchMedia: React.FC<{media?: BeautyMedia; height: number; durationFrames: number}> = ({media, height, durationFrames}) => {
  const frame = useCurrentFrame();
  if (!media) return null;
  const isVideo = media.mediaType === 'VIDEO' || /\.(mp4|mov)(\?|$)/i.test(media.src);
  const scale = interpolate(frame, [48, durationFrames], [1.05, 1.005], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{...enter(frame, 48, 22, 34), marginTop: 38}}>
      <div style={{position: 'relative', height, overflow: 'hidden', borderRadius: '240px 240px 28px 28px', background: `linear-gradient(160deg, ${COLORS.plumSoft}, ${COLORS.espresso})`, border: `1px solid ${COLORS.line}`, boxShadow: `0 34px 90px ${COLORS.shadow}`}}>
        {isVideo ? (
          <Video src={mediaSrc(media)} muted loop style={{width: '100%', height: '100%', objectFit: media.fit ?? 'cover', objectPosition: media.position ?? 'center'}} />
        ) : (
          <Img src={mediaSrc(media)} alt={media.alt} style={{width: '100%', height: '100%', objectFit: media.fit ?? 'cover', objectPosition: media.position ?? 'center', transform: `scale(${scale})`, filter: 'saturate(.82) contrast(1.03)'}} />
        )}
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 56%, rgba(11,8,9,.72))'}} />
        <div style={{position: 'absolute', left: 24, bottom: 22, fontSize: 16, letterSpacing: '.12em', fontWeight: 700, color: COLORS.gold}}>
          {media.mediaType ?? (isVideo ? 'VIDEO' : 'EDITORIAL IMAGE')}
        </div>
      </div>
      <div style={{marginTop: 12, fontSize: 17, color: COLORS.muted}}>Nguồn: {media.credit}</div>
    </div>
  );
};

const Metrics: React.FC<{items?: BeautySceneProps['metrics']}> = ({items = []}) => {
  const frame = useCurrentFrame();
  if (items.length === 0) return null;
  return (
    <div style={{marginTop: 34, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14}}>
      {items.slice(0, 4).map((item, index) => (
        <div key={`${item.label}-${index}`} style={{...enter(frame, 58 + index * 7, 14, 28), minHeight: 140, padding: '24px 26px', borderRadius: '34px 8px 34px 8px', background: index % 2 ? COLORS.roseSoft : COLORS.goldSoft, border: `1px solid ${index % 2 ? 'rgba(201,130,145,.28)' : COLORS.line}`, boxShadow: `0 18px 46px ${COLORS.shadow}`}}>
          <div style={{fontSize: 16, color: index % 2 ? COLORS.rose : COLORS.gold, fontWeight: 700, letterSpacing: '.12em'}}>{item.label.toUpperCase()}</div>
          <div style={{marginTop: 8, fontFamily: FONT_SERIF, fontSize: TYPE.metric, lineHeight: .95, color: COLORS.ivory}}>{item.value}</div>
          {item.note ? <div style={{marginTop: 9, fontSize: 18, color: COLORS.muted}}>{item.note}</div> : null}
        </div>
      ))}
    </div>
  );
};

const IngredientShelf: React.FC<{items?: BeautySceneProps['ingredients']}> = ({items = []}) => {
  const frame = useCurrentFrame();
  if (items.length === 0) return null;
  return (
    <div style={{marginTop: 38, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14}}>
      {items.slice(0, 4).map((item, index) => (
        <div key={`${item.name}-${index}`} style={{...enter(frame, 48 + index * 8, 16, 28), minHeight: 178, padding: '27px 25px', borderRadius: index % 2 ? '12px 44px 12px 44px' : '44px 12px 44px 12px', background: COLORS.glassStrong, border: `1px solid ${COLORS.line}`, backdropFilter: 'blur(12px)'}}>
          <div style={{width: 38, height: 52, borderRadius: '60% 40% 56% 44% / 70% 60% 40% 30%', background: index % 2 ? COLORS.roseSoft : COLORS.goldSoft, border: `1px solid ${index % 2 ? COLORS.rose : COLORS.gold}`, display: 'grid', placeItems: 'center', color: COLORS.gold, fontSize: 15}}>{index + 1}</div>
          <div style={{marginTop: 15, fontFamily: FONT_SERIF, fontSize: TYPE.cardTitle, color: COLORS.ivory}}>{item.name}</div>
          <div style={{marginTop: 5, fontSize: TYPE.cardBody, lineHeight: 1.3, color: COLORS.pearl}}>{item.role}</div>
          {item.note ? <div style={{marginTop: 7, fontSize: 17, color: COLORS.gold}}>{item.note}</div> : null}
        </div>
      ))}
    </div>
  );
};

const RitualSteps: React.FC<{items?: BeautySceneProps['steps']}> = ({items = []}) => {
  const frame = useCurrentFrame();
  if (items.length === 0) return null;
  return (
    <div style={{position: 'relative', marginTop: 38, display: 'grid', gap: 13}}>
      <div style={{position: 'absolute', left: 26, top: 42, bottom: 42, width: 1, background: `linear-gradient(${COLORS.gold}, rgba(225,197,141,.08))`}} />
      {items.slice(0, 5).map((item, index) => (
        <div key={`${item.label}-${index}`} style={{...enter(frame, 46 + index * 8, 12, 27), display: 'grid', gridTemplateColumns: '54px 1fr auto', gap: 18, alignItems: 'center', minHeight: 88, padding: '18px 22px 18px 0', borderBottom: `1px solid ${COLORS.line}`}}>
          <div style={{width: 52, height: 52, borderRadius: 999, display: 'grid', placeItems: 'center', background: COLORS.espresso, border: `1px solid ${COLORS.gold}`, boxShadow: `0 0 24px ${COLORS.goldSoft}`, color: COLORS.gold, fontFamily: FONT_SERIF, fontSize: 21, zIndex: 2}}>{String(index + 1).padStart(2, '0')}</div>
          <div><div style={{fontFamily: FONT_SERIF, fontSize: 29, color: COLORS.ivory}}>{item.label}</div>{item.detail ? <div style={{marginTop: 5, fontSize: 20, color: COLORS.muted}}>{item.detail}</div> : null}</div>
          {item.meta ? <div style={{fontSize: 16, color: COLORS.gold, fontWeight: 700}}>{item.meta}</div> : null}
        </div>
      ))}
    </div>
  );
};

const Compare: React.FC<{items?: BeautySceneProps['comparison']}> = ({items = []}) => {
  const frame = useCurrentFrame();
  if (items.length === 0) return null;
  return (
    <div style={{marginTop: 38, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16}}>
      {items.slice(0, 4).map((item, index) => (
        <div key={`${item.label}-${index}`} style={{...enter(frame, 48 + index * 8, 16, 30), minHeight: items.length <= 2 ? 320 : 210, padding: '30px 27px', borderRadius: index % 2 ? '12px 58px 12px 58px' : '58px 12px 58px 12px', background: index % 2 ? COLORS.goldSoft : COLORS.roseSoft, border: `1px solid ${index % 2 ? COLORS.line : 'rgba(201,130,145,.28)'}`}}>
          <div style={{fontSize: 16, fontWeight: 700, letterSpacing: '.13em', color: index % 2 ? COLORS.gold : COLORS.rose}}>{item.label.toUpperCase()}</div>
          <div style={{marginTop: 20, fontFamily: FONT_SERIF, fontSize: items.length <= 2 ? 43 : 33, lineHeight: 1.08, color: COLORS.ivory}}>{item.value}</div>
          {item.detail ? <div style={{marginTop: 15, fontSize: 20, lineHeight: 1.35, color: COLORS.muted}}>{item.detail}</div> : null}
        </div>
      ))}
    </div>
  );
};

const Quote: React.FC<{quote?: BeautySceneProps['quote']}> = ({quote}) => {
  const frame = useCurrentFrame();
  if (!quote) return null;
  return (
    <div style={{...enter(frame, 48, 18, 32), marginTop: 42, padding: '44px 42px', borderRadius: '80px 16px 80px 16px', background: COLORS.glassStrong, border: `1px solid ${COLORS.line}`, boxShadow: `18px 18px 0 rgba(205,174,115,.06)`}}>
      <div style={{fontFamily: FONT_SERIF, fontSize: 86, lineHeight: .45, color: COLORS.gold}}>“</div>
      <div style={{fontFamily: FONT_SERIF, fontSize: TYPE.quote, lineHeight: 1.15, color: COLORS.ivory}}>{quote.text}</div>
      <div style={{marginTop: 28, width: 72, height: 1, background: COLORS.gold}} />
      <div style={{marginTop: 17, fontSize: 22, fontWeight: 700, color: COLORS.gold}}>{quote.source}</div>
      {quote.context ? <div style={{marginTop: 7, fontSize: 18, color: COLORS.muted}}>{quote.context}</div> : null}
    </div>
  );
};

const Safety: React.FC<{items?: string[]; note?: string}> = ({items = [], note}) => {
  const frame = useCurrentFrame();
  if (items.length === 0 && !note) return null;
  return (
    <div style={{...enter(frame, 48, 16, 30), marginTop: 36, padding: '30px 32px', borderRadius: '50px 12px 50px 12px', background: 'rgba(215,132,109,.09)', border: '1px solid rgba(215,132,109,.30)'}}>
      <div style={{fontSize: 16, fontWeight: 700, letterSpacing: '.14em', color: COLORS.warning}}>SAFETY NOTES</div>
      {items.slice(0, 4).map((item, index) => <div key={`${item}-${index}`} style={{marginTop: 16, display: 'grid', gridTemplateColumns: '24px 1fr', gap: 13, fontSize: 22, lineHeight: 1.35, color: COLORS.pearl}}><span style={{color: COLORS.warning}}>◇</span>{item}</div>)}
      {note ? <div style={{marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(215,132,109,.24)', fontSize: 17, color: COLORS.muted}}>{note}</div> : null}
    </div>
  );
};

const Gallery: React.FC<{items?: BeautyMedia[]; durationFrames: number}> = ({items = [], durationFrames}) => {
  const frame = useCurrentFrame();
  if (items.length === 0) return null;
  return (
    <div style={{marginTop: 38, display: 'grid', gridTemplateColumns: '1.25fr .9fr', gap: 14}}>
      {items.slice(0, 3).map((item, index) => {
        const isVideo = item.mediaType === 'VIDEO' || /\.(mp4|mov)(\?|$)/i.test(item.src);
        const scale = interpolate(frame, [40, durationFrames], [1.05, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return <div key={`${item.src}-${index}`} style={{...enter(frame, 42 + index * 7, 18, 30), position: 'relative', height: index ? 294 : 602, gridRow: index ? undefined : 'span 2', overflow: 'hidden', borderRadius: index ? '18px 70px 18px 18px' : '180px 18px 18px 18px', border: `1px solid ${COLORS.line}`, background: COLORS.plum}}>{isVideo ? <Video src={mediaSrc(item)} muted loop style={{width: '100%', height: '100%', objectFit: item.fit ?? 'cover'}} /> : <Img src={mediaSrc(item)} alt={item.alt} style={{width: '100%', height: '100%', objectFit: item.fit ?? 'cover', transform: `scale(${scale})`, filter: 'saturate(.78)'}} />}<div style={{position: 'absolute', left: 12, right: 12, bottom: 12, padding: '9px 11px', background: 'rgba(11,8,9,.75)', color: COLORS.gold, fontSize: 14}}>Nguồn: {item.credit}</div></div>;
      })}
    </div>
  );
};

const content: React.CSSProperties = {position: 'absolute', left: LAYOUT.paddingX, right: LAYOUT.paddingX, top: LAYOUT.top, bottom: LAYOUT.contentBottom};

export const LuxuryBeautyScene: React.FC<LuxuryBeautySceneRenderProps> = (props) => {
  const {variant, category, section, eyebrow, headline, accentWords, body, body2, media, gallery, mediaHeight, ingredients, steps, metrics, comparison, quote, cautions, sourceNote, cta, hashtags, durationFrames} = props;
  const opening = variant === 'beautyOpening';
  const compact = ['expertQuote', 'benefitRisk', 'mythFact', 'safetyAlert'].includes(variant);
  const primaryMedia = ['beautyOpening', 'productFocus', 'beforeAfterEvidence'].includes(variant);
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <NoirBackground />
      <div style={content}>
        <Header section={section} category={category} eyebrow={eyebrow} />
        <RichHeadline text={headline} accents={accentWords} hero={opening} compact={compact} />
        {body && !opening ? <Body text={body} /> : null}
        {primaryMedia ? <ArchMedia media={media} height={mediaHeight ?? (opening ? 590 : 430)} durationFrames={durationFrames} /> : null}
        {variant === 'trendBoard' ? <Gallery items={gallery ?? (media ? [media] : [])} durationFrames={durationFrames} /> : null}
        {variant === 'ingredientDecode' ? <IngredientShelf items={ingredients} /> : null}
        {variant === 'routineSteps' || variant === 'treatmentTimeline' ? <RitualSteps items={steps} /> : null}
        {variant === 'productFocus' || variant === 'beforeAfterEvidence' ? <Metrics items={metrics} /> : null}
        {variant === 'benefitRisk' || variant === 'mythFact' ? <Compare items={comparison} /> : null}
        {variant === 'expertQuote' ? <Quote quote={quote} /> : null}
        {variant === 'safetyAlert' ? <Safety items={cautions} note={sourceNote} /> : null}
        {variant === 'beautyClosing' ? <><Metrics items={metrics} /><RitualSteps items={steps} />{cta ? <div style={{...enter(frame, 76, 10, 28), marginTop: 34, display: 'inline-flex', padding: '18px 30px', border: `1px solid ${COLORS.gold}`, borderRadius: 999, color: COLORS.gold, fontSize: 24, letterSpacing: '.04em'}}>{cta}</div> : null}</> : null}
        {opening && body ? <Body text={body} delay={68} small /> : null}
        {body2 ? <Body text={body2} delay={88} small /> : null}
        {sourceNote && variant !== 'safetyAlert' ? <div style={{...enter(frame, 88, 8, 24), marginTop: 20, fontSize: 17, color: COLORS.muted}}>{sourceNote}</div> : null}
      </div>
      {hashtags ? <div style={{position: 'absolute', left: 76, right: 76, bottom: 126, textAlign: 'center', fontSize: 19, letterSpacing: '.08em', color: COLORS.gold, opacity: .55}}>{hashtags}</div> : null}
    </AbsoluteFill>
  );
};
