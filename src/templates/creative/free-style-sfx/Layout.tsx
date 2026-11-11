import React from 'react';
import {BackgroundMusic} from '../../../components/BackgroundMusic';
import {
  FreeStyleLayout,
  type FreeStyleLayoutProps,
} from '../free-style';

/**
 * Curated sounds for scene entry transitions.
 * SFX templates must not use UI, confirmation, impact, meme, or error sounds.
 */
export const TRANSITION_SFX = {
  whoosh: 'https://remotion.media/whoosh.wav',
  whip: 'https://remotion.media/whip.wav',
  pageTurn: 'https://remotion.media/page-turn.wav',
} as const;

export type TransitionSfxName = keyof typeof TRANSITION_SFX;

export const TRANSITION_SFX_DEFAULT_VOLUME: Record<TransitionSfxName, number> = {
  whoosh: 0.18,
  whip: 0.15,
  pageTurn: 0.2,
};

export const MAX_TRANSITION_SFX_VOLUME = 0.25;

export interface SceneEntrySfx {
  name: TransitionSfxName;
  volume?: number;
  reason: string;
}

export interface SceneWithEntrySfx {
  startFrame: number;
  entrySfx?: SceneEntrySfx;
}

export interface ResolvedSceneEntrySfx extends SceneEntrySfx {
  volume: number;
  frame: number;
}

export const getSceneEntrySfxEvents = (
  scenes: SceneWithEntrySfx[],
): ResolvedSceneEntrySfx[] => {
  const missingSceneIndex = scenes.findIndex((scene) => !scene.entrySfx);

  if (missingSceneIndex !== -1) {
    throw new Error(
      `SFX templates require entrySfx on every scene; scene ${missingSceneIndex + 1} is missing it.`,
    );
  }

  const events = scenes.map((scene) => ({
    ...scene.entrySfx!,
    volume:
      scene.entrySfx!.volume ??
      TRANSITION_SFX_DEFAULT_VOLUME[scene.entrySfx!.name],
    frame: scene.startFrame,
  }));

  return events;
};

/** @deprecated Use TRANSITION_SFX. */
export const REMOTION_SFX = TRANSITION_SFX;
/** @deprecated Use TransitionSfxName. */
export type RemotionSfxName = TransitionSfxName;

export interface FreeStyleSfxLayoutProps extends FreeStyleLayoutProps {
  bgMusic?: string | null;
}

export const FreeStyleSfxLayout: React.FC<FreeStyleSfxLayoutProps> = ({
  bgMusic = null,
  children,
  ...layoutProps
}) => (
  <FreeStyleLayout {...layoutProps}>
    <BackgroundMusic src={bgMusic} />
    {children}
  </FreeStyleLayout>
);
