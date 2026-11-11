import creativeManifest from '../../public/assets/creative/manifest.json';
import newsManifest from '../../public/assets/news/manifest.json';

export const DEFAULT_BG_MUSIC_VOLUME = 0.1;

type MusicTrack = {
  path: string;
  volume?: number;
};

const manifests = [
  creativeManifest,
  newsManifest,
] as Array<{music?: MusicTrack[]}>;

const tracksByPath = new Map<string, MusicTrack>();

for (const manifest of manifests) {
  for (const track of manifest.music ?? []) {
    const existing = tracksByPath.get(track.path);

    if (
      existing?.volume !== undefined &&
      track.volume !== undefined &&
      existing.volume !== track.volume
    ) {
      throw new Error(
        `Conflicting background music volumes for "${track.path}": ${existing.volume} and ${track.volume}.`,
      );
    }

    tracksByPath.set(track.path, {
      ...existing,
      ...track,
      volume: track.volume ?? existing?.volume,
    });
  }
}

export const getBgMusicVolume = (path: string): number => {
  const volume = tracksByPath.get(path)?.volume;

  if (volume === undefined) {
    return DEFAULT_BG_MUSIC_VOLUME;
  }

  if (!Number.isFinite(volume) || volume < 0 || volume > 1) {
    throw new Error(
      `Background music volume for "${path}" must be a number between 0 and 1.`,
    );
  }

  return volume;
};
