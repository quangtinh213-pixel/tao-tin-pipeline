import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {MediaMontage, type SceneProps, getSceneIds} from './MediaMontage';
import {COLORS, fontFamily} from './tokens';

const FLOW = [
  ['01', 'CÂN ĐO', 'Theo yêu cầu khách hàng'],
  ['02', 'CHẤT LÊN XE', 'Hoàn tất thu gom'],
  ['03', 'THANH TOÁN', 'Tiền mặt hoặc chuyển khoản'],
];

export const Scene5Transparency: React.FC<SceneProps> = ({assets, scene}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 26], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
  const line = interpolate(frame, [24, 150], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});

  return (
    <AbsoluteFill style={{background: COLORS.paper, color: COLORS.text, fontFamily, overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: 260, left: 48, color: COLORS.accent, fontSize: 21, fontWeight: 900, letterSpacing: '0.12em'}}>MINH BẠCH GIAO DỊCH</div>
      <div style={{position: 'absolute', top: 300, left: 48, right: 48, fontSize: 56, lineHeight: 1.04, fontWeight: 900, letterSpacing: '-0.045em', opacity: enter}}>
        Từ cân đo đến thanh toán,
        <br />
        mọi bước đều dễ kiểm tra.
      </div>
      <MediaMontage assets={assets} ids={getSceneIds(scene)} top={500} left={48} width={470} height={720} interval={44} fit="contain" accent={COLORS.accent2} radius={12} />
      <div style={{position: 'absolute', top: 510, left: 560, right: 48, opacity: enter}}>
        {FLOW.map(([number, heading, detail], index) => (
          <div key={number} style={{position: 'relative', minHeight: 190, paddingLeft: 74}}>
            {index < FLOW.length - 1 ? <div style={{position: 'absolute', left: 23, top: 62, width: 4, height: 132, background: COLORS.line}}><div style={{width: '100%', height: `${Math.max(0, Math.min(1, line - index * 0.32)) * 100}%`, background: COLORS.accent}} /></div> : null}
            <div style={{position: 'absolute', left: 0, top: 0, width: 50, height: 50, display: 'grid', placeItems: 'center', borderRadius: '50%', background: index === 2 ? COLORS.accent : COLORS.accent2, color: COLORS.paper, fontSize: 18, fontWeight: 900}}>{number}</div>
            <div style={{fontSize: 28, fontWeight: 900, letterSpacing: '0.02em'}}>{heading}</div>
            <div style={{marginTop: 9, color: COLORS.muted, fontSize: 21, lineHeight: 1.28, fontWeight: 600}}>{detail}</div>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', top: 1290, left: 48, right: 48, paddingTop: 18, borderTop: `2px solid ${COLORS.line}`, color: COLORS.muted, fontSize: 20, fontWeight: 600}}>
        Website xác nhận hình thức thanh toán sau khi phế liệu được chất lên xe.
      </div>
    </AbsoluteFill>
  );
};
