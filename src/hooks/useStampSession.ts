import { useReducer, useCallback } from 'react';
import type { LyricLine } from '../types';

// ── Public types ──────────────────────────────────────────────────────────────

export type StampLine = {
  text: string;
  time: number | null; // null = not yet stamped
};

export type StampPhase = 'prepare' | 'stamping';

// ── Internal reducer types ────────────────────────────────────────────────────

type HistoryEntry = {
  lineIndex: number;
  prevTime: number | null;
  wasInserted: boolean; // true when ADD_GAP inserts a new row; undo removes it entirely
};

type State = {
  phase: StampPhase;
  rawText: string;       // textarea content in prepare phase
  lines: StampLine[];    // active in stamping phase
  focusIndex: number;    // next line to stamp; lines.length = sentinel "all done"
  history: HistoryEntry[];
};

type Action =
  | { type: 'INIT'; lrcLines: LyricLine[] }
  | { type: 'INIT_EMPTY' }
  | { type: 'SET_RAW'; text: string }
  | { type: 'START_STAMPING' }
  | { type: 'STAMP'; lineIndex: number; time: number }
  | { type: 'ADD_GAP'; time: number; afterIndex: number }
  | { type: 'UNDO' }
  | { type: 'RECOMPUTE_FOCUS'; time: number };

const INITIAL: State = {
  phase: 'prepare',
  rawText: '',
  lines: [],
  focusIndex: 0,
  history: [],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTag(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const cs = Math.round((t % 1) * 100);
  return `[${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}]`;
}

// Parses one line: returns time + text if it has a LRC timestamp, else time=null
const TIMING_RE = /^\[(\d{1,3}):(\d{2})[.:](\d{1,3})\]\s*(.*)/;

function parseRaw(rawText: string): StampLine[] {
  return rawText
    .split('\n')
    .map(row => {
      const t = row.trim();
      const m = t.match(TIMING_RE);
      if (m) {
        const time = parseInt(m[1]) * 60
          + parseInt(m[2])
          + parseInt(m[3].padEnd(3, '0').slice(0, 3)) / 1000;
        return { text: m[4].trim(), time };
      }
      return { text: t, time: null as number | null };
    })
    .filter(l => l.text !== '' || l.time !== null);
}

// Index of first unstamped line after `from` (from+1 .. end).
// Returns lines.length if all lines are stamped (sentinel).
function nextUnstamped(lines: StampLine[], from: number): number {
  for (let i = from + 1; i < lines.length; i++) {
    if (lines[i].time === null) return i;
  }
  return lines.length;
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function reduce(state: State, action: Action): State {
  switch (action.type) {

    case 'INIT': {
      // Pre-fill textarea with LRC format so timestamps are visible and preserved
      const rawText = action.lrcLines
        .map(l => `${fmtTag(l.time)} ${l.text}`)
        .join('\n');
      return { ...INITIAL, rawText };
    }

    case 'INIT_EMPTY':
      return { ...INITIAL };

    case 'SET_RAW':
      return { ...state, rawText: action.text };

    case 'START_STAMPING': {
      const lines = parseRaw(state.rawText);
      const firstUnstamped = lines.findIndex(l => l.time === null);
      const focusIndex = firstUnstamped === -1 ? lines.length : firstUnstamped;
      return { ...state, phase: 'stamping', lines, focusIndex, history: [] };
    }

    case 'STAMP': {
      const { lineIndex, time } = action;
      if (lineIndex < 0 || lineIndex >= state.lines.length) return state;
      const prevTime = state.lines[lineIndex].time;
      const lines = state.lines.map((l, i) => i === lineIndex ? { ...l, time } : l);
      const history: HistoryEntry[] = [
        ...state.history,
        { lineIndex, prevTime, wasInserted: false },
      ];
      const focusIndex = lineIndex === state.focusIndex
        ? nextUnstamped(lines, lineIndex)
        : state.focusIndex;
      return { ...state, lines, focusIndex, history };
    }

    case 'ADD_GAP': {
      // afterIndex=-1 means prepend; clamp to valid range
      const insertAt = Math.max(0, Math.min(action.afterIndex + 1, state.lines.length));
      const lines: StampLine[] = [
        ...state.lines.slice(0, insertAt),
        { text: '', time: action.time },
        ...state.lines.slice(insertAt),
      ];
      const history: HistoryEntry[] = [
        ...state.history,
        { lineIndex: insertAt, prevTime: null, wasInserted: true },
      ];
      const focusIndex = nextUnstamped(lines, insertAt);
      return { ...state, lines, focusIndex, history };
    }

    case 'UNDO': {
      if (state.history.length === 0) return state;
      const history = state.history.slice(0, -1);
      const last = state.history[state.history.length - 1];
      const lines = last.wasInserted
        ? state.lines.filter((_, i) => i !== last.lineIndex)
        : state.lines.map((l, i) =>
            i === last.lineIndex ? { ...l, time: last.prevTime } : l
          );
      return { ...state, lines, focusIndex: last.lineIndex, history };
    }

    case 'RECOMPUTE_FOCUS': {
      const { time } = action;
      // First unstamped line whose nearest-preceding-stamped-line's time ≤ `time`.
      // Predecessor time defaults to 0 (song start) when no stamped line precedes.
      for (let i = 0; i < state.lines.length; i++) {
        if (state.lines[i].time !== null) continue; // already stamped
        let predTime = 0;
        for (let j = i - 1; j >= 0; j--) {
          if (state.lines[j].time !== null) { predTime = state.lines[j].time!; break; }
        }
        if (predTime <= time) return { ...state, focusIndex: i };
      }
      // Fallback: first unstamped line
      const first = state.lines.findIndex(l => l.time === null);
      return { ...state, focusIndex: first === -1 ? state.lines.length : first };
    }

    default:
      return state;
  }
}

// ── Validation (pure, exported for use in components) ─────────────────────────

export function validateLines(lines: StampLine[], duration: number) {
  const illegal = new Set<number>();
  const warning = new Set<number>();
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].time;
    if (t === null) continue;
    // Monotonicity: compare against the nearest preceding stamped line
    for (let j = i - 1; j >= 0; j--) {
      if (lines[j].time !== null) {
        if (t < lines[j].time!) illegal.add(i);
        break;
      }
    }
    // Beyond-duration warning (does not block save)
    if (duration > 0 && t > duration) warning.add(i);
  }
  return { illegal, warning, hasIllegal: illegal.size > 0 };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useStampSession() {
  const [state, dispatch] = useReducer(reduce, INITIAL);

  return {
    phase: state.phase,
    rawText: state.rawText,
    lines: state.lines,
    focusIndex: state.focusIndex,
    historyLength: state.history.length,

    initFromExisting: useCallback(
      (lrcLines: LyricLine[]) => dispatch({ type: 'INIT', lrcLines }), []),
    initEmpty: useCallback(
      () => dispatch({ type: 'INIT_EMPTY' }), []),
    setRawText: useCallback(
      (text: string) => dispatch({ type: 'SET_RAW', text }), []),
    startStamping: useCallback(
      () => dispatch({ type: 'START_STAMPING' }), []),
    stamp: useCallback(
      (i: number, t: number) => dispatch({ type: 'STAMP', lineIndex: i, time: t }), []),
    addGap: useCallback(
      (t: number, afterIndex: number) => dispatch({ type: 'ADD_GAP', time: t, afterIndex }), []),
    undo: useCallback(
      () => dispatch({ type: 'UNDO' }), []),
    recomputeFocus: useCallback(
      (t: number) => dispatch({ type: 'RECOMPUTE_FOCUS', time: t }), []),
  };
}
