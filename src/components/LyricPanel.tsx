import { useRef, useEffect, useState, useCallback, useMemo, type FC } from 'react';
import type { LyricLine } from '../types';
import LyricList from './LyricList';
import { useLang } from '../LangContext';

type Props = {
  lines: LyricLine[];
  activeIndex: number;
  hasLrc: boolean;
  chunks?: number[];
  onSeek: (time: number) => void;
  updateLine: (index: number, text: string) => void;
  onEditingChange?: (editing: boolean) => void;
  onToggleChunk?: (index: number) => void;
};

const FOLLOW_RESUME_DELAY = 3000;

function computeNearest(container: HTMLDivElement): number {
  const center = container.scrollTop + container.clientHeight / 2;
  const items = container.querySelectorAll<HTMLLIElement>('[data-index]');
  let nearest = -1;
  let minDist = Infinity;
  items.forEach(el => {
    const mid = el.offsetTop + el.offsetHeight / 2;
    const dist = Math.abs(mid - center);
    if (dist < minDist) { minDist = dist; nearest = parseInt(el.dataset['index']!, 10); }
  });
  return nearest;
}

const LyricPanel: FC<Props> = ({ lines, activeIndex, hasLrc, chunks, onSeek, updateLine, onEditingChange, onToggleChunk }) => {
  const { t } = useLang();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [followMode, setFollowMode] = useState(true);
  const [nearestIndex, setNearestIndex] = useState(-1);
  const [editingIndex, setEditingIndex] = useState(-1);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserScrolling = useRef(false);

  // Compute active chunk start/end indices for centering the chunk in the panel
  const activeChunkStart = useMemo(() => {
    if (!chunks || chunks.length === 0) return activeIndex;
    const sorted = [...chunks].sort((a, b) => a - b);
    let result = sorted[0];
    for (const c of sorted) {
      if (c <= activeIndex) result = c;
      else break;
    }
    return result;
  }, [chunks, activeIndex]);

  const activeChunkEnd = useMemo(() => {
    if (!chunks || chunks.length === 0) return activeIndex;
    const sorted = [...chunks].sort((a, b) => a - b);
    const idx = sorted.indexOf(activeChunkStart);
    if (idx < 0 || idx === sorted.length - 1) return lines.length - 1;
    return sorted[idx + 1] - 1;
  }, [chunks, activeChunkStart, lines.length]);

  // Auto-scroll while following: center the active chunk in the panel
  useEffect(() => {
    if (!followMode || activeIndex < 0 || editingIndex >= 0) return;
    const container = scrollRef.current;
    if (!container) return;
    if (chunks && chunks.length > 0) {
      const firstEl = container.querySelector<HTMLLIElement>(`[data-index="${activeChunkStart}"]`);
      const lastEl  = container.querySelector<HTMLLIElement>(`[data-index="${activeChunkEnd}"]`);
      if (!firstEl || !lastEl) return;
      const chunkMid = (firstEl.offsetTop + lastEl.offsetTop + lastEl.offsetHeight) / 2;
      container.scrollTo({ top: chunkMid - container.clientHeight / 2, behavior: 'smooth' });
    } else {
      const el = container.querySelector<HTMLLIElement>(`[data-index="${activeIndex}"]`);
      if (!el) return;
      container.scrollTo({ top: el.offsetTop - container.clientHeight / 2 + el.offsetHeight / 2, behavior: 'smooth' });
    }
  }, [activeChunkStart, activeChunkEnd, activeIndex, followMode, editingIndex, chunks]);

  const pauseFollow = useCallback((container: HTMLDivElement) => {
    setFollowMode(false);
    setNearestIndex(computeNearest(container));
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setFollowMode(true);
      isUserScrolling.current = false;
    }, FOLLOW_RESUME_DELAY);
  }, []);

  const handleScroll = useCallback(() => {
    if (isUserScrolling.current && scrollRef.current) {
      pauseFollow(scrollRef.current);
    }
  }, [pauseFollow]);

  const handleWheel = useCallback(() => { isUserScrolling.current = true; }, []);
  const handleTouchStart = useCallback(() => { isUserScrolling.current = true; }, []);
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only treat as user scroll if clicking the panel background, not a lyric line
    if ((e.target as HTMLElement).closest('.lyric-line') === null) {
      isUserScrolling.current = true;
    }
  }, []);

  const handleSeek = useCallback((time: number) => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    isUserScrolling.current = false;
    setFollowMode(true);
    onSeek(time);
  }, [onSeek]);

  const handleStartEdit = useCallback((index: number) => {
    setEditingIndex(index);
    onEditingChange?.(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    isUserScrolling.current = false;
    setFollowMode(false);
  }, [onEditingChange]);

  const handleSaveEdit = useCallback((index: number, text: string) => {
    setEditingIndex(-1);
    onEditingChange?.(false);
    updateLine(index, text);
    setFollowMode(true);
  }, [updateLine, onEditingChange]);

  const resumeFollow = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    isUserScrolling.current = false;
    setEditingIndex(-1);
    setFollowMode(true);
  }, []);

  useEffect(() => () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  }, []);

  if (!hasLrc) {
    return (
      <div className="lyric-panel lyric-empty">
        <p>{t.noLyrics}</p>
        <p className="lyric-hint">Add a <code>.lrc</code> file with the same name as the audio file</p>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="lyric-panel lyric-empty">
        <p>{t.lyricsEmpty}</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="lyric-panel"
      onScroll={handleScroll}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onMouseDown={handleMouseDown}
    >
      <div className="lyric-pad" />

      <LyricList
        lines={lines}
        activeIndex={activeIndex}
        nearestIndex={nearestIndex}
        followMode={followMode}
        editingIndex={editingIndex}
        chunks={chunks}
        onSeek={handleSeek}
        onStartEdit={handleStartEdit}
        onSave={handleSaveEdit}
        onToggleChunk={onToggleChunk}
      />

      <div className="lyric-pad" />

      {!followMode && editingIndex < 0 && (
        <button className="follow-resume-btn" onClick={resumeFollow} title={t.resumeAutoScroll}>
          {t.follow}
        </button>
      )}
    </div>
  );
};

export { LyricPanel };
export default LyricPanel;
