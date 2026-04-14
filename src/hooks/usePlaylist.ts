import { useState, useCallback, useEffect } from 'react';
import type { Song } from '../types';
import { idbGet, idbSet, lsLoadTrack } from '../utils/persist';

const AUDIO_EXTS = new Set(['mp3', 'flac', 'wav', 'ogg', 'm4a']);
const IDB_FOLDER_KEY = 'folder_handle';

async function scanFolder(handle: FileSystemDirectoryHandle): Promise<Song[]> {
  const found: Song[] = [];
  for await (const [name, entry] of handle.entries()) {
    if (entry.kind !== 'file') continue;
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (!AUDIO_EXTS.has(ext)) continue;
    const baseName = name.slice(0, name.lastIndexOf('.'));
    let lrcHandle: FileSystemFileHandle | null = null;
    try {
      lrcHandle = await handle.getFileHandle(`${baseName}.lrc`);
    } catch {
      // no sidecar
    }
    found.push({ name: baseName, file: entry as FileSystemFileHandle, lrcHandle });
  }
  found.sort((a, b) => a.name.localeCompare(b.name));
  return found;
}

export function usePlaylist() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [restoredPosition, setRestoredPosition] = useState<number>(0);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  // On mount: try to restore folder from IndexedDB
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await idbGet<FileSystemDirectoryHandle>(IDB_FOLDER_KEY);
        if (!stored || cancelled) return;

        // Re-request permission — requires user gesture only on some browsers;
        // queryPermission first to avoid unnecessary prompts.
        const perm = await stored.queryPermission({ mode: 'readwrite' });
        if (perm !== 'granted') {
          const req = await stored.requestPermission({ mode: 'readwrite' });
          if (req !== 'granted') return;
        }

        const found = await scanFolder(stored);
        if (cancelled) return;

        const saved = lsLoadTrack();
        const savedIndex = saved && saved.index < found.length ? saved.index : 0;
        const savedPos = saved?.position ?? 0;

        setDirHandle(stored);
        setSongs(found);
        setRestoredPosition(savedPos);
        setIsRestoring(true);
        setCurrentIndex(found.length > 0 ? savedIndex : -1);
      } catch {
        // No stored folder or permission denied — silent, user picks manually
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const pickFolder = useCallback(async () => {
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      await idbSet(IDB_FOLDER_KEY, handle);
      const found = await scanFolder(handle);
      setDirHandle(handle);
      setSongs(found);
      setRestoredPosition(0);
      setIsRestoring(false);
      setCurrentIndex(found.length > 0 ? 0 : -1);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.error(err);
    }
  }, []);

  const goNext = useCallback(() => {
    setSongs(s => {
      setCurrentIndex(i => s.length > 0 ? (i + 1) % s.length : -1);
      return s;
    });
  }, []);

  const goPrev = useCallback(() => {
    setSongs(s => {
      setCurrentIndex(i => s.length > 0 ? (i - 1 + s.length) % s.length : -1);
      return s;
    });
  }, []);

  const selectSong = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const clearRestoring = useCallback(() => setIsRestoring(false), []);

  // Update the lrcHandle for a specific song after saving a new .lrc file
  const attachLrcHandle = useCallback((index: number, handle: FileSystemFileHandle) => {
    setSongs(prev => prev.map((s, i) => i === index ? { ...s, lrcHandle: handle } : s));
  }, []);

  return {
    songs, currentIndex, dirHandle,
    pickFolder, goNext, goPrev, selectSong,
    restoredPosition, isRestoring, clearRestoring,
    attachLrcHandle,
  };
}
