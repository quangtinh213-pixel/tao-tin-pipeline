/**
 * parseAccent.ts — Parse {accent} markers in headline/body text.
 *
 * Input:  "Apple ra mắt {chip M5} — mạnh hơn {40%}"
 * Output: [
 *   { text: "Apple ra mắt ", accent: false },
 *   { text: "chip M5",       accent: true  },
 *   { text: " — mạnh hơn ", accent: false },
 *   { text: "40%",           accent: true  },
 * ]
 */
export function parseAccent(text: string): Array<{ text: string; accent: boolean }> {
  const parts: Array<{ text: string; accent: boolean }> = [];
  const regex = /\{([^}]+)\}|([^{]+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1] !== undefined) parts.push({ text: match[1], accent: true });
    else if (match[2] !== undefined) parts.push({ text: match[2], accent: false });
  }
  return parts;
}
