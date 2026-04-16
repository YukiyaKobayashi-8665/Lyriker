import { useMemo, type FC } from 'react';
import type { LyricLine } from '../types';
import LyricLineComponent from './LyricLine';

type Props = {
  lines: LyricLine[];
  activeIndex: number;
  nearestIndex: number;
  followMode: boolean;
  editingIndex: number;
  chunks?: number[];
  onSeek: (time: number) => void;
  onStartEdit: (index: number) => void;
  onSave: (index: number, text: string) => void;
  onToggleChunk?: (index: number) => void;
};

/** Returns the chunk-start index that owns `lineIndex`, or -1 if no chunks defined. */
function getActiveChunkStart(chunks: number[] | undefined, lineIndex: number): number {
  if (!chunks || chunks.length === 0) return -1;
  const sorted = [...chunks].sort((a, b) => a - b);
  let result = sorted[0];
  for (const c of sorted) {
    if (c <= lineIndex) result = c;
    else break;
  }
  return result;
}

const LyricList: FC<Props> = ({
  lines, activeIndex, nearestIndex, followMode, editingIndex, chunks,
  onSeek, onStartEdit, onSave, onToggleChunk,
}) => {
  const activeChunkStart = useMemo(
    () => getActiveChunkStart(chunks, activeIndex),
    [chunks, activeIndex],
  );

  const chunkSet = useMemo(() => new Set(chunks ?? []), [chunks]);

  /** Given a line index, return its owning chunk-start. */
  const chunkOf = useMemo(() => {
    if (!chunks || chunks.length === 0) return (_i: number) => -1;
    const sorted = [...chunks].sort((a, b) => a - b);
    return (i: number) => {
      let result = sorted[0];
      for (const c of sorted) {
        if (c <= i) result = c;
        else break;
      }
      return result;
    };
  }, [chunks]);

  return (
    <ul className="lyric-list">
      {lines.map((line, i) => (
        <LyricLineComponent
          key={i}
          line={line}
          index={i}
          isActive={i === activeIndex}
          isNearest={!followMode && i === nearestIndex}
          isEditing={i === editingIndex}
          isChunkStart={chunkSet.has(i)}
          isInActiveChunk={activeChunkStart < 0 || chunkOf(i) === activeChunkStart}
          onSeek={onSeek}
          onStartEdit={onStartEdit}
          onSave={onSave}
          onToggleChunk={onToggleChunk ? () => onToggleChunk(i) : undefined}
        />
      ))}
    </ul>
  );
};

export default LyricList;
