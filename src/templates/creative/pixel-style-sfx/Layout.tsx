import React from 'react';
import {BackgroundMusic} from '../../../components/BackgroundMusic';
import {
  PixelStyleLayout,
  type PixelStyleLayoutProps,
} from '../pixel-style';

export interface PixelStyleSfxLayoutProps extends PixelStyleLayoutProps {
  bgMusic?: string | null;
}

export const PixelStyleSfxLayout: React.FC<PixelStyleSfxLayoutProps> = ({
  bgMusic = null,
  children,
  ...layoutProps
}) => (
  <PixelStyleLayout {...layoutProps}>
    <BackgroundMusic src={bgMusic} />
    {children}
  </PixelStyleLayout>
);
