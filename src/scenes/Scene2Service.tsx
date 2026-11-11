import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {MediaMontage, type SceneProps, getSceneIds} from './MediaMontage';
import {COLORS, fontFamily} from './tokens';

const STEPS = ['KHẢO SÁT', 'THƯƠNG THẢO', 'THU GOM', 'PHÂN LOẠI', 'THANH TOÁN'];

export const Scene2Service: React.FC<SceneProps> = ({assets, scene}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 26], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const progress = interpolate(frame, [18, 180], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill style={{background: COLORS.paper, color: COLORS.text, fontFamily, overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: 260, left: 48, color: COLORS.accent, fontSize: 22, fontWeight: 900, letterSpacing: '0.12em'}}>
        DỊCH VỤ TẬN NƠI
      </div>
      <div style={{position: 'absolute', top: 300, left: 48, right: 48, fontSize: 58, lineHeight: 1.02, fontWeight: 900, letterSpacing: '-0.045em', opacity: enter}}>
        Một quy trình rõ ràng
        <br />
        từ khảo sát đến thanh toán.
      </div>
      <MediaMontage
        assets={assets}
        ids={getSceneIds(scene)}
        top={520}
        left={48}
        width={984}
        height={600}
        interval={38}
        fit="contain"
        accent={COLORS.accent2}
        radius={12}
      />
      <div style={{position: 'absolute', top: 1180, left: 60, right: 60, height: 8, background: COLORS.line}}>
        <div style={{width: `${progress * 100}%`, height: '100%', background: COLORS.accent}} />
      </div>
      <div style={{position: 'absolute', top: 1214, left: 48, right: 48, display: 'flex', justifyContent: 'space-between', gap: 10}}>
        {STEPS.map((step, index) => {
          const active = progress >= index / (STEPS.length - 1);
          return (
            <div key={step} style={{width: 180, textAlign: index === 0 ? 'left' : index === STEPS.length - 1 ? 'right' : 'center', color: active ? COLORS.accent : COLORS.muted, fontSize: 18, fontWeight: 900, letterSpacing: '0.05em', opacity: interpolate(frame, [index * 20, index * 20 + 20], [0.25, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
              <div style={{fontSize: 34, lineHeight: 1, marginBottom: 9}}>{String(index + 1).padStart(2, '0')}</div>
              {step}
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', top: 1375, left: 48, right: 48, color: COLORS.muted, fontSize: 22, fontWeight: 600}}>
        Cho doanh nghiệp, nhà xưởng, nhà máy, kho hàng và công trình.
      </div>
    </AbsoluteFill>
  );
};
