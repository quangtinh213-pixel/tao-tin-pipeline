import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, COUNT_UP_FRAMES, FONT_HEADING, FONT_MAIN} from './tokens';
import type {LongExplainerGraphic} from './types';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Vietnamese number formatting: 390000 → "390.000", 5.7 → "5,7". */
export const formatViNumber = (value: number, decimals = 0) =>
  value.toLocaleString('vi-VN', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});

/** Count-up value at `frame`, easing from 0 to `to` over `frames`. */
export const countUp = (frame: number, to: number, frames = COUNT_UP_FRAMES, from = 0) =>
  interpolate(frame, [0, frames], [from, to], {...clamp, easing: Easing.out(Easing.cubic)});

const Title: React.FC<{text: string; source: string}> = ({text, source}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 34, opacity: interpolate(frame, [0, 10], [0, 1], clamp)}}>
      <div>
        <div style={{fontFamily: FONT_HEADING, fontSize: 64, fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.01em'}}>{text}</div>
        <div style={{width: interpolate(frame, [4, 22], [0, 140], clamp), height: 7, background: COLORS.red, marginTop: 14}} />
      </div>
      <div style={{fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.65)'}}>Nguồn: {source}</div>
    </div>
  );
};

const Bars: React.FC<{graphic: Extract<LongExplainerGraphic, {kind: 'bars'}>}> = ({graphic}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const max = Math.max(...graphic.rows.map((r) => Math.max(r.to, r.from ?? 0)));
  const hasFrom = graphic.rows.some((r) => r.from !== undefined);
  return (
    <>
      <Title text={graphic.title} source={graphic.source} />
      {hasFrom ? (
        <div style={{display: 'flex', gap: 28, marginBottom: 18, fontSize: 24, fontWeight: 700, color: 'rgba(255,255,255,0.8)'}}>
          <span><span style={{display: 'inline-block', width: 22, height: 14, background: 'rgba(255,255,255,0.35)', marginRight: 10}} />{graphic.fromLabel ?? 'Hiện nay'}</span>
          <span><span style={{display: 'inline-block', width: 22, height: 14, background: COLORS.red, marginRight: 10}} />{graphic.toLabel ?? 'Mới'}</span>
        </div>
      ) : null}
      <div style={{display: 'flex', flexDirection: 'column', gap: hasFrom ? 22 : 30}}>
        {graphic.rows.map((row, i) => {
          const start = 10 + i * 8;
          const grow = spring({frame: frame - start, fps, config: {damping: 20, stiffness: 90}});
          const newGrow = spring({frame: frame - start - 14, fps, config: {damping: 18, stiffness: 90}});
          return (
            <div key={row.label} style={{display: 'flex', alignItems: 'center', gap: 26}}>
              <div style={{flex: '0 0 220px', fontSize: 32, fontWeight: 800, color: '#FFFFFF'}}>{row.label}</div>
              <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 8}}>
                {row.from !== undefined ? (
                  <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                    <div style={{width: `${(row.from / max) * 78 * grow}%`, height: 26, background: 'rgba(255,255,255,0.35)'}} />
                    <div style={{fontSize: 24, fontWeight: 700, color: 'rgba(255,255,255,0.75)', opacity: grow}}>{row.fromText}</div>
                  </div>
                ) : null}
                <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                  <div style={{width: `${(row.to / max) * 78 * newGrow}%`, height: hasFrom ? 38 : 48, background: COLORS.red}} />
                  <div style={{fontSize: hasFrom ? 34 : 40, fontWeight: 900, color: '#FFFFFF', opacity: newGrow, whiteSpace: 'nowrap'}}>{row.toText}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

const BigNumber: React.FC<{graphic: Extract<LongExplainerGraphic, {kind: 'bigNumber'}>}> = ({graphic}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame: frame - 30, fps, config: {damping: 10, stiffness: 180}});
  const value = formatViNumber(countUp(frame, graphic.value), graphic.decimals ?? 0);
  return (
    <div style={{height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
      {graphic.kicker ? <div style={{fontSize: 34, fontWeight: 800, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.1em', textTransform: 'uppercase'}}>{graphic.kicker}</div> : null}
      <div style={{fontSize: 210, fontWeight: 900, color: COLORS.red, lineHeight: 1.05, letterSpacing: '-0.05em', transform: `scale(${1 + pop * 0.04 - 0.04})`}}>
        {graphic.prefix ?? ''}{value}
        <span style={{fontSize: 90, color: '#FFFFFF', marginLeft: 18, letterSpacing: '-0.02em'}}>{graphic.unit}</span>
      </div>
      <div style={{fontSize: 44, fontWeight: 800, color: '#FFFFFF', maxWidth: 1300, lineHeight: 1.25, opacity: interpolate(frame, [20, 34], [0, 1], clamp)}}>{graphic.label}</div>
      <div style={{marginTop: 30, fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.6)'}}>Nguồn: {graphic.source}</div>
    </div>
  );
};

const Equation: React.FC<{graphic: Extract<LongExplainerGraphic, {kind: 'equation'}>}> = ({graphic}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const all = [...graphic.steps, {...graphic.result, op: '='}];
  return (
    <>
      <Title text={graphic.title} source={graphic.source} />
      <div style={{display: 'flex', alignItems: 'stretch', justifyContent: 'center', gap: 22, marginTop: 40}}>
        {all.map((step, i) => {
          const show = spring({frame: frame - 12 - i * 24, fps, config: {damping: 16, stiffness: 130}});
          const isResult = i === all.length - 1;
          return (
            <React.Fragment key={step.label}>
              {i > 0 ? <div style={{alignSelf: 'center', fontSize: 90, fontWeight: 900, color: COLORS.red, opacity: show}}>{step.op}</div> : null}
              <div
                style={{
                  flex: 1,
                  padding: '40px 30px',
                  background: isResult ? COLORS.red : 'rgba(255,255,255,0.1)',
                  border: `3px solid ${isResult ? COLORS.red : 'rgba(255,255,255,0.35)'}`,
                  opacity: show,
                  transform: `translateY(${(1 - show) * 40}px)`,
                  textAlign: 'center',
                }}
              >
                <div style={{fontSize: step.value.length > 9 ? 56 : 70, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em', whiteSpace: 'nowrap'}}>{step.value}</div>
                <div style={{fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginTop: 14}}>{step.label}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      {graphic.note ? <div style={{marginTop: 40, textAlign: 'center', fontSize: 26, fontWeight: 600, color: 'rgba(255,255,255,0.7)'}}>{graphic.note}</div> : null}
    </>
  );
};

const DocumentCard: React.FC<{graphic: Extract<LongExplainerGraphic, {kind: 'document'}>}> = ({graphic}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 18, stiffness: 110}});
  const stamp = spring({frame: frame - 28, fps, config: {damping: 9, stiffness: 160}});
  return (
    <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{
          position: 'relative',
          width: 1100,
          padding: '56px 72px',
          background: '#FBFAF6',
          boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
          transform: `translateY(${(1 - enter) * 120}px) rotate(${(1 - enter) * -3}deg)`,
          opacity: enter,
          color: COLORS.ink,
        }}
      >
        <div style={{textAlign: 'center', fontSize: 26, fontWeight: 800, letterSpacing: '0.08em'}}>{graphic.issuer}</div>
        <div style={{textAlign: 'center', fontSize: 24, fontWeight: 600, color: COLORS.inkMuted, marginTop: 6}}>Số: {graphic.number}</div>
        <div style={{textAlign: 'center', fontSize: 50, fontWeight: 900, marginTop: 30, color: COLORS.redDark}}>{graphic.docType}</div>
        <div style={{textAlign: 'center', fontSize: 32, fontWeight: 700, marginTop: 12, lineHeight: 1.3}}>{graphic.title}</div>
        <div style={{height: 3, background: COLORS.ink, opacity: 0.15, margin: '30px 0'}} />
        {graphic.lines.map((line, i) => (
          <div key={line} style={{fontSize: 30, fontWeight: 700, marginBottom: 14, opacity: interpolate(frame, [18 + i * 10, 28 + i * 10], [0, 1], clamp)}}>
            • {line}
          </div>
        ))}
        <div
          style={{
            position: 'absolute',
            right: 60,
            bottom: 40,
            padding: '12px 26px',
            border: `6px solid ${COLORS.red}`,
            color: COLORS.red,
            fontSize: 34,
            fontWeight: 900,
            transform: `rotate(-10deg) scale(${interpolate(stamp, [0, 1], [2.2, 1])})`,
            opacity: stamp,
          }}
        >
          {graphic.stamp}
        </div>
        <div style={{position: 'absolute', left: 72, bottom: 22, fontSize: 20, fontWeight: 700, color: COLORS.inkMuted}}>Nguồn: {graphic.source}</div>
      </div>
    </div>
  );
};

const CalendarCard: React.FC<{graphic: Extract<LongExplainerGraphic, {kind: 'calendar'}>}> = ({graphic}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const drop = spring({frame, fps, config: {damping: 13, stiffness: 140}});
  return (
    <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 90}}>
      <div style={{width: 420, background: COLORS.paper, boxShadow: '0 12px 28px -4px rgba(0,0,0,0.45)', transform: `translateY(${(1 - drop) * -160}px) rotate(${(1 - drop) * 6 - 2}deg)`, opacity: drop}}>
        <div style={{background: COLORS.red, color: '#FFFFFF', textAlign: 'center', fontFamily: FONT_HEADING, fontSize: 52, fontWeight: 800, padding: '16px 0', textTransform: 'uppercase'}}>{graphic.month}</div>
        <div style={{textAlign: 'center', fontFamily: FONT_HEADING, fontSize: 230, fontWeight: 800, color: COLORS.ink, lineHeight: 1.05}}>{graphic.day}</div>
        <div style={{textAlign: 'center', fontSize: 34, fontWeight: 800, color: COLORS.inkMuted, paddingBottom: 26}}>{graphic.year}</div>
      </div>
      <div style={{maxWidth: 820, opacity: interpolate(frame, [12, 26], [0, 1], clamp), transform: `translateX(${interpolate(frame, [12, 26], [40, 0], clamp)}px)`}}>
        <div style={{fontFamily: FONT_HEADING, fontSize: 76, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, textTransform: 'uppercase'}}>{graphic.label}</div>
        <div style={{marginTop: 24, fontSize: 24, fontWeight: 700, color: COLORS.muted}}>Nguồn: {graphic.source}</div>
      </div>
    </div>
  );
};

const Timeline: React.FC<{graphic: Extract<LongExplainerGraphic, {kind: 'timeline'}>}> = ({graphic}) => {
  const frame = useCurrentFrame();
  const n = graphic.events.length;
  const line = interpolate(frame, [8, 8 + n * 12], [0, 100], clamp);
  return (
    <>
      <Title text={graphic.title} source={graphic.source} />
      <div style={{position: 'relative', marginTop: 140, height: 8, background: 'rgba(255,255,255,0.15)'}}>
        <div style={{width: `${line}%`, height: '100%', background: COLORS.red}} />
        {graphic.events.map((event, i) => {
          const x = n === 1 ? 50 : (i / (n - 1)) * 100;
          const show = interpolate(frame, [8 + i * 12, 18 + i * 12], [0, 1], clamp);
          return (
            <div key={event.date} style={{position: 'absolute', left: `${x}%`, top: -14, transform: 'translateX(-50%)', opacity: show, textAlign: 'center', width: 360}}>
              <div style={{width: 36, height: 36, borderRadius: 18, margin: '0 auto', background: event.current ? COLORS.highlight : COLORS.red, border: '6px solid #0F172A'}} />
              <div style={{marginTop: 22, fontFamily: FONT_HEADING, fontSize: 52, fontWeight: 800, color: event.current ? COLORS.highlight : '#FFFFFF'}}>{event.date}</div>
              <div style={{marginTop: 8, fontSize: 28, fontWeight: 700, color: COLORS.muted, lineHeight: 1.3}}>{event.label}</div>
            </div>
          );
        })}
      </div>
    </>
  );
};

/** Full-stage animated data graphic. */
export const Graphic: React.FC<{graphic: LongExplainerGraphic}> = ({graphic}) => (
  <div style={{position: 'absolute', inset: 0, padding: '48px 80px', boxSizing: 'border-box', fontFamily: FONT_MAIN}}>
    {graphic.kind === 'bars' ? <Bars graphic={graphic} /> : null}
    {graphic.kind === 'bigNumber' ? <BigNumber graphic={graphic} /> : null}
    {graphic.kind === 'equation' ? <Equation graphic={graphic} /> : null}
    {graphic.kind === 'document' ? <DocumentCard graphic={graphic} /> : null}
    {graphic.kind === 'calendar' ? <CalendarCard graphic={graphic} /> : null}
    {graphic.kind === 'timeline' ? <Timeline graphic={graphic} /> : null}
  </div>
);
