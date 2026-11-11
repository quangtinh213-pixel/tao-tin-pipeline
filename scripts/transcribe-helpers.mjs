export function normalizeWordTimestamps(words) {
  let previousEnd = -Infinity;

  return words.map((word) => {
    const start = Math.max(word.start, previousEnd);
    const end = Math.max(word.end, start);
    previousEnd = end;

    return {
      ...word,
      start,
      end,
    };
  });
}
