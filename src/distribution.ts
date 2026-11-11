export interface Segment {
  title: string;
  content_summary: string;
}

export const MIN_SCENE_FRAMES = 150; // 5 seconds at 30fps
export const MAX_SCENE_FRAMES = 450; // 15 seconds at 30fps

export function distributeSceneDurations(
  segments: Segment[],
  estimatedDurationSec: number,
  fps: number = 30
): number[] {
  const totalContentFrames = Math.ceil(estimatedDurationSec * fps);
  const hookFrames = Math.round(totalContentFrames * 0.15);
  const endingFrames = Math.round(totalContentFrames * 0.15);
  const bodyFrames = totalContentFrames - hookFrames - endingFrames;
  const perSegment = Math.round(bodyFrames / segments.length);

  const durations = [hookFrames];
  for (let i = 0; i < segments.length; i++) {
    durations.push(perSegment);
  }
  durations.push(endingFrames);

  // Adjust last body segment to absorb rounding errors
  const sum = durations.reduce((a, b) => a + b, 0);
  const diff = totalContentFrames - sum;
  durations[durations.length - 2] += diff;

  return enforceSceneBounds(durations);
}

export function enforceSceneBounds(durations: number[]): number[] {
  let result = [...durations];

  // Pass 1: Split scenes that exceed MAX_SCENE_FRAMES
  let i = 0;
  while (i < result.length) {
    if (result[i] > MAX_SCENE_FRAMES) {
      const half1 = Math.ceil(result[i] / 2);
      const half2 = result[i] - half1;
      result.splice(i, 1, half1, half2);
    } else {
      i++;
    }
  }

  // Pass 2: Merge scenes that are below MIN_SCENE_FRAMES
  i = 0;
  while (i < result.length) {
    if (result[i] < MIN_SCENE_FRAMES && result.length > 1) {
      if (i === 0) {
        result[1] += result[0];
        result.splice(0, 1);
      } else {
        result[i - 1] += result[i];
        result.splice(i, 1);
      }
      i = 0; // Re-check from start after merge
    } else {
      i++;
    }
  }

  return result;
}
