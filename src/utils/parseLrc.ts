import type { LyricLine } from '../types';

// Matches [mm:ss.xx] or [mm:ss:xx] timestamp tags
const TIMING_RE = /\[(\d{1,3}):(\d{2})[.:.](\d{1,3})\]/g;
// Matches known metadata tags — preserved but not rendered
const META_RE = /^\[(ti|ar|al|by|offset|length|re|ve):/i;

export type ParsedLrc = {
  lines: LyricLine[];
  metadata: Record<string, string>;
};

function parseTimestamp(min: string, sec: string, centis: string): number {
  const cs = centis.padEnd(3, '0').slice(0, 3); // normalize to milliseconds
  return parseInt(min, 10) * 60 + parseInt(sec, 10) + parseInt(cs, 10) / 1000;
}

export function parseLrc(raw: string): ParsedLrc {
  const metadata: Record<string, string> = {};
  const lines: LyricLine[] = [];

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Collect metadata
    const metaMatch = trimmed.match(/^\[([^[\]]+):([^\]]*)\]/);
    if (metaMatch && META_RE.test(trimmed)) {
      metadata[metaMatch[1].toLowerCase()] = metaMatch[2].trim();
      continue;
    }

    // Extract all timestamps on this line
    const timestamps: number[] = [];
    let m: RegExpExecArray | null;
    TIMING_RE.lastIndex = 0;
    while ((m = TIMING_RE.exec(trimmed)) !== null) {
      timestamps.push(parseTimestamp(m[1], m[2], m[3]));
    }
    if (timestamps.length === 0) continue;

    // Text is everything after the last timestamp tag
    const lastTagEnd = trimmed.lastIndexOf(']');
    const text = trimmed.slice(lastTagEnd + 1).trim();

    // Expanded compressed LRC: one entry per timestamp
    for (const time of timestamps) {
      lines.push({ time, text });
    }
  }

  lines.sort((a, b) => a.time - b.time);
  return { lines, metadata };
}

export function serializeLrc(
  lines: LyricLine[],
  metadata: Record<string, string>
): string {
  const metaLines = Object.entries(metadata)
    .map(([k, v]) => `[${k}:${v}]`)
    .join('\n');

  const lyricLines = lines
    .map(({ time, text }) => {
      const totalSec = Math.floor(time);
      const ms = Math.round((time - totalSec) * 100);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      const tag = `[${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms).padStart(2, '0')}]`;
      return `${tag}${text}`;
    })
    .join('\n');

  return metaLines ? `${metaLines}\n${lyricLines}` : lyricLines;
}
