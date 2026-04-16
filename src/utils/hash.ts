// djb2 hash — returns 8-char hex string
function djb2(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

// Stable hash of an LRC lines array — captures structure changes (insertions/deletions/edits)
export function hashLrcLines(lines: { time: number; text: string }[]): string {
  return djb2(lines.map(l => `${l.time}|${l.text}`).join('\n'));
}
