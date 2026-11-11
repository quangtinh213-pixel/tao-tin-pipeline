// One TTS request per chunk keeps long-form narration under provider text limits.
export const TTS_CHUNK_CHARS = 2400;

/** Pack script entries (split further at sentence ends when one is too long) into chunks of at most maxChars. */
export function groupTextChunks(texts, maxChars = TTS_CHUNK_CHARS) {
  const pieces = texts.flatMap((text) => (text.length > maxChars ? text.split(/(?<=[.?!…])\s+/u) : [text]))
    .map((t) => t.trim())
    .filter(Boolean);
  const chunks = [];
  for (const piece of pieces) {
    const last = chunks.length - 1;
    if (last >= 0 && chunks[last].length + 1 + piece.length <= maxChars) chunks[last] += ` ${piece}`;
    else chunks.push(piece);
  }
  return chunks;
}

/** VieNeu reads Roman-numeral region names as the letter "i"; spell them as numbers ("vùng I" → "vùng một"). */
export function normalizeForVieNeu(text) {
  const names = {I: 'một', II: 'hai', III: 'ba', IV: 'bốn'};
  return text.replace(/\b([Vv]ùng) (IV|III|II|I)\b/gu, (_, word, numeral) => `${word} ${names[numeral]}`);
}
