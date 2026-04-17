/** A contiguous range of lyric lines forming one chunk. */
export type ChunkRange = {
  start: number; // first line index (inclusive)
  end: number;   // last line index (inclusive)
};

/**
 * Build an ordered array of chunk ranges from a sorted `chunks` boundary list
 * and the total number of lyric lines.
 *
 * If `chunks` is empty the entire lyric is treated as one chunk [0, lineCount-1].
 */
export function getChunkRanges(chunks: number[], lineCount: number): ChunkRange[] {
  if (lineCount === 0) return [];
  if (chunks.length === 0) return [{ start: 0, end: lineCount - 1 }];

  const sorted = [...chunks].sort((a, b) => a - b);
  const ranges: ChunkRange[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const start = sorted[i];
    const end = i + 1 < sorted.length ? sorted[i + 1] - 1 : lineCount - 1;
    ranges.push({ start, end });
  }
  // If the first chunk boundary is not 0, prepend an implicit chunk from 0
  if (sorted[0] > 0) {
    ranges.unshift({ start: 0, end: sorted[0] - 1 });
  }
  return ranges;
}

/**
 * Returns the chunk-start index that owns `lineIndex`, or -1 if no chunks.
 */
export function getOwningChunkStart(chunks: number[], lineIndex: number): number {
  if (chunks.length === 0) return -1;
  const sorted = [...chunks].sort((a, b) => a - b);
  let result = sorted[0];
  for (const c of sorted) {
    if (c <= lineIndex) result = c;
    else break;
  }
  return result;
}
