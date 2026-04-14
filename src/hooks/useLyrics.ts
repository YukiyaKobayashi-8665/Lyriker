import { useState, useEffect, useRef } from 'react';
import type { Song, LyricLine } from '../types';
import { parseLrc, serializeLrc } from '../utils/parseLrc';

export type LyricsState = {
  lines: LyricLine[];
  activeIndex: number;
  hasLrc: boolean;
};

export function useLyrics(song: Song | null, currentTime: number) {
  const [lines, setLines] = useState<LyricLine[]>([]);
  const [hasLrc, setHasLrc] = useState(false);
  const metadataRef = useRef<Record<string, string>>({});

  // Load + parse .lrc file whenever song changes
  useEffect(() => {
    if (!song?.lrcHandle) {
      setLines([]);
      setHasLrc(false);
      metadataRef.current = {};
      return;
    }

    let cancelled = false;
    song.lrcHandle.getFile().then(async file => {
      if (cancelled) return;
      const raw = await file.text();
      const { lines: parsed, metadata } = parseLrc(raw);
      metadataRef.current = metadata;
      setLines(parsed);
      setHasLrc(true);
    }).catch(() => {
      setLines([]);
      setHasLrc(false);
    });

    return () => { cancelled = true; };
  }, [song]);

  // Compute active line index from currentTime
  let activeIndex = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (currentTime >= lines[i].time) {
      activeIndex = i;
      break;
    }
  }

  // Update a single line's text and autosave to the .lrc file
  const updateLine = async (index: number, newText: string) => {
    setLines(prev => {
      const next = prev.map((l, i) => i === index ? { ...l, text: newText } : l);
      // Fire-and-forget save
      saveLrc(song, next, metadataRef.current);
      return next;
    });
  };

  return { lines, activeIndex, hasLrc, updateLine };
}

async function saveLrc(
  song: Song | null,
  lines: LyricLine[],
  metadata: Record<string, string>
) {
  if (!song?.lrcHandle) return;
  try {
    const writable = await song.lrcHandle.createWritable();
    await writable.write(serializeLrc(lines, metadata));
    await writable.close();
  } catch (err) {
    console.error('Failed to save LRC:', err);
  }
}
