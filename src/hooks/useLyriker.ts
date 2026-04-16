import { useState, useEffect, useCallback, useRef } from 'react';
import type { Song, LyrikerData, LyricLine } from '../types';
import { hashLrcLines } from '../utils/hash';

// ── Defaults ──────────────────────────────────────────────────────────────────

export const EMPTY_LYRIKER: LyrikerData = {
  lrcHash: '',
  chunks: [],
  translations: {},
  notes: {},
};

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Manages <song>.lyriker.json:
 * - Loads it when `song` changes
 * - Detects LRC staleness via a stored content hash
 * - Auto-saves (debounced 400 ms) on any mutation
 * - Creates the JSON file lazily on first mutation
 */
export function useLyriker(
  song: Song | null,
  dirHandle: FileSystemDirectoryHandle | null,
  lrcLines: LyricLine[],
) {
  const [data, setData] = useState<LyrikerData>(EMPTY_LYRIKER);
  const [staleVisible, setStaleVisible] = useState(false);

  // ── Stable refs ──────────────────────────────────────────────────────────────
  const songRef = useRef(song);
  const dirHandleRef = useRef(dirHandle);
  const dataRef = useRef<LyrikerData>(EMPTY_LYRIKER);
  const currentLrcHashRef = useRef(''); // hash of lrcLines as-of last computation
  const fileHandleRef = useRef<FileSystemFileHandle | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { songRef.current = song; }, [song]);
  useEffect(() => { dirHandleRef.current = dirHandle; }, [dirHandle]);

  // ── Load on song change ───────────────────────────────────────────────────────
  useEffect(() => {
    const fresh = { ...EMPTY_LYRIKER };
    setData(fresh);
    dataRef.current = fresh;
    setStaleVisible(false);
    fileHandleRef.current = null;

    if (!song || !dirHandle) return;

    let cancelled = false;
    (async () => {
      // Use known handle or look up by name (handles the case where JSON was
      // created this session but song.lyrikerHandle wasn't updated)
      let fh = song.lyrikerHandle;
      if (!fh) {
        try { fh = await dirHandle.getFileHandle(`${song.name}.lyriker.json`); }
        catch { return; } // file doesn't exist yet — that's fine
      }

      fileHandleRef.current = fh;
      try {
        const file = await fh.getFile();
        const parsed = JSON.parse(await file.text()) as Partial<LyrikerData>;
        if (cancelled) return;

        const loaded: LyrikerData = {
          lrcHash:      parsed.lrcHash      ?? '',
          chunks:       Array.isArray(parsed.chunks) ? parsed.chunks : [],
          translations: parsed.translations ?? {},
          notes:        parsed.notes        ?? {},
        };
        setData(loaded);
        dataRef.current = loaded;
      } catch {
        if (!cancelled) {
          setData({ ...EMPTY_LYRIKER });
          dataRef.current = { ...EMPTY_LYRIKER };
        }
      }
    })();
    return () => { cancelled = true; };
  // dirHandle intentionally omitted — stable within a session
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song]);

  // ── Stale check (re-runs when lrcLines or stored hash changes) ────────────────
  useEffect(() => {
    if (lrcLines.length > 0) {
      currentLrcHashRef.current = hashLrcLines(lrcLines);
    }
    if (!data.lrcHash || lrcLines.length === 0) {
      setStaleVisible(false);
      return;
    }
    const stale = currentLrcHashRef.current !== data.lrcHash;
    setStaleVisible(stale);
  }, [lrcLines, data.lrcHash]);

  // ── Debounced save ────────────────────────────────────────────────────────────
  // Uses only refs → stable, no deps
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const s = songRef.current;
      const dir = dirHandleRef.current;
      if (!s || !dir) return;

      // Snapshot current LRC hash into what we persist
      const toSave: LyrikerData = {
        ...dataRef.current,
        lrcHash: currentLrcHashRef.current,
      };

      try {
        if (!fileHandleRef.current) {
          fileHandleRef.current = await dir.getFileHandle(
            `${s.name}.lyriker.json`, { create: true },
          );
        }
        const writable = await fileHandleRef.current.createWritable();
        await writable.write(JSON.stringify(toSave, null, 2));
        await writable.close();
        // Sync persisted hash back into state so stale clears after first save
        dataRef.current = toSave;
        setData(toSave);
      } catch (err) {
        console.error('useLyriker: save failed', err);
      }
    }, 400);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, []);

  // ── Mutators ──────────────────────────────────────────────────────────────────

  /** Toggle a line index as a chunk boundary. */
  const toggleChunk = useCallback((lineIndex: number) => {
    const prev = dataRef.current;
    const chunks = prev.chunks.includes(lineIndex)
      ? prev.chunks.filter(i => i !== lineIndex)
      : [...prev.chunks, lineIndex].sort((a, b) => a - b);
    const next = { ...prev, chunks };
    dataRef.current = next;
    setData(next);
    scheduleSave();
  }, [scheduleSave]);

  /**
   * Replace all chunk boundaries at once.
   * Called from stamp mode after saving LRC — pass `linesHash` to clear stale
   * immediately without waiting for the stale-check effect to re-run.
   */
  const setChunks = useCallback((chunks: number[], linesHash?: string) => {
    if (linesHash !== undefined) currentLrcHashRef.current = linesHash;
    const next = { ...dataRef.current, chunks };
    dataRef.current = next;
    setData(next);
    scheduleSave();
  }, [scheduleSave]);

  const setTranslation = useCallback((lineIndex: number, text: string) => {
    const next: LyrikerData = {
      ...dataRef.current,
      translations: { ...dataRef.current.translations, [String(lineIndex)]: text },
    };
    dataRef.current = next;
    setData(next);
    scheduleSave();
  }, [scheduleSave]);

  const setNotes = useCallback((lineIndex: number, text: string) => {
    const next: LyrikerData = {
      ...dataRef.current,
      notes: { ...dataRef.current.notes, [String(lineIndex)]: text },
    };
    dataRef.current = next;
    setData(next);
    scheduleSave();
  }, [scheduleSave]);

  /**
   * Call this after Lyriker saves the .lrc file so the stored hash stays
   * in sync and the stale warning doesn't fire incorrectly on next load.
   */
  const updateLrcHash = useCallback((lines: LyricLine[]) => {
    currentLrcHashRef.current = hashLrcLines(lines);
  }, []);

  const dismissStale = useCallback(() => setStaleVisible(false), []);

  return {
    // Full data — consumers destructure what they need
    chunks:       data.chunks,
    translations: data.translations,
    notes:        data.notes,
    // Staleness
    isStale:      staleVisible,
    dismissStale,
    // Mutators
    toggleChunk,
    setChunks,
    setTranslation,
    setNotes,
    updateLrcHash,
  };
}
