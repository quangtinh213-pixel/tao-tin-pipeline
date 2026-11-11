import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {MediaMontage, type SceneProps, getSceneIds} from './MediaMontage';
import {COLORS, fontFamily} from './tokens';

export const Scene1Hook: React.FC<SceneProps> = ({assets, scene}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const title = scene?.visibleText?.[0] ?? 'THU PHẾ LIỆU QUÂN KIỀU';
  const subtitle = scene?.visibleText?.[1] ?? 'Biến phế liệu thành giá trị mới';

  return (
    <AbsoluteFill style={{background: COLORS.bg, color: COLORS.text, fontFamily, overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: 250, left: 48, width: 110, height: 8, background: COLORS.accent}} />
      <div style={{position: 'absolute', top: 278, left: 48, color: COLORS.muted, fontSize: 22, fontWeight: 800, letterSpacing: '0.12em', opacity: enter}}>
        CÔNG TY TNHH TM DV QUÂN KIỀU
      </div>
      <div style={{position: 'absolute', top: 316, left: 48, right: 48, fontSize: 76, lineHeight: 0.98, fontWeight: 900, letterSpacing: '-0.055em', opacity: enter, transform: `translateY(${(1 - enter) * 24}px)`}}>
        {title.split(' ').slice(0, 3).join(' ')}
        <br />
        <span style={{color: COLORS.accent}}>{title.split(' ').slice(3).join(' ')}</span>
      </div>
      <MediaMontage assets={assets} ids={getSceneIds(scene)} top={570} left={48} width={984} height={720} interval={32} accent={COLORS.accent} />
      <div style={{position: 'absolute', top: 1320, left: 48, right: 48, fontSize: 36, lineHeight: 1.1, fontWeight: 700, color: COLORS.dark, opacity: enter}}>
        {subtitle}
      </div>
      <div style={{position: 'absolute', top: 1412, left: 48, color: COLORS.muted, fontSize: 19, fontWeight: 700, letterSpacing: '0.04em'}}>
        THU GOM TẬN NƠI · XỬ LÝ GỌN GÀNG · TƯ LIỆU THỰC TẾ
      </div>
    </AbsoluteFill>
  );
};
