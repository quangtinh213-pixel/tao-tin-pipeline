export function calculateDurationInFrames(estimatedDurationSec: number, fps: number = 30): number {
  if (estimatedDurationSec < 30 || estimatedDurationSec > 120) {
    throw new RangeError(`estimated_duration must be between 30 and 120, got ${estimatedDurationSec}`);
  }
  return Math.ceil(estimatedDurationSec * fps) + 60;
}
