import { useEffect, useRef, useCallback, useState, type FC } from 'react';
import type { Song } from '../types';
import { parseLrc, serializeLrc } from '../utils/parseLrc';
import { useStampSession, validateLines, type StampLine } from '../hooks/useStampSession';
import { useLang } from '../LangContext';

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  song: Song;
  dirHandle: FileSystemDirectoryHandle;
  currentTime: number;
  duration: number;
  chunks?: number[];
  onClose: () => void;
  onSaved: (handle: FileSystemFileHandle) => void;
  onToggleChunk?: (lineIndex: number) => void;
};

// ── Utility ───────────────────────────────────────────────────────────────────

function fmtTime(t: number | null): string {
  if (t === null) return '--:--.--';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const cs = Math.round((t % 1) * 100);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

type LineProps = {
  line: StampLine;
  index: number;
  isFocused: boolean;
  isPlaying: boolean;
  isIllegal: boolean;
  isWarning: boolean;
  isChunkStart: boolean;
  onClick: () => void;
  onToggleChunk?: () => void;
};

const StampLineItem: FC<LineProps> = ({ line, index, isFocused, isPlaying, isIllegal, isWarning, isChunkStart, onClick, onToggleChunk }) => {
  const { t } = useLang();
  return (
    <div
      data-stamp-index={index}
      className={[
        'stamp-line',
        isFocused ? 'stamp-focused' : '',
        !isFocused && isPlaying ? 'stamp-playing' : '',
        !isFocused && !isPlaying && line.time !== null ? 'stamp-done' : '',
        isIllegal ? 'stamp-illegal' : '',
        isWarning && !isIllegal ? 'stamp-warning' : '',
        line.text === '' ? 'stamp-gap-line' : '',
        isChunkStart ? 'stamp-chunk-start' : '',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      <span className="stamp-line-time">{fmtTime(line.time)}</span>
      <span className="stamp-line-text">
        {line.text || <em className="stamp-gap-label">{t.instrumental}</em>}
      </span>
      {onToggleChunk && (
        <button
          className={`chunk-toggle-btn${isChunkStart ? ' chunk-toggle-btn--active' : ''}`}
          title={isChunkStart ? t.removeChunkBoundary : t.addChunkBoundary}
          onClick={e => { e.stopPropagation(); onToggleChunk(); }}
          tabIndex={-1}
        >
          {isChunkStart ? '⊖' : '⊕'}
        </button>
      )}
      {isFocused && <span className="stamp-focus-arrow" aria-hidden>▶</span>}
      {isIllegal && <span className="stamp-illegal-icon" title={t.illegalTimestamp}>!</span>}
      {isWarning && !isIllegal && <span className="stamp-warning-icon" title={t.beyondDuration}>⚠</span>}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const StampEditor: FC<Props> = ({ song, dirHandle, currentTime, duration, chunks, onClose, onSaved, onToggleChunk }) => {
  const { t } = useLang();
  const session = useStampSession();
  const metadataRef = useRef<Record<string, string>>({});
  const prevTimeRef = useRef(currentTime);
  const currentTimeRef = useRef(currentTime);
  const playingIndexRef = useRef(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  // Always-current refs (avoid stale closures in keyboard handler)
  currentTimeRef.current = currentTime;
  // Compute playingIndex: last stamped line with time ≤ currentTime
  let _playingIndex = -1;
  for (let i = session.lines.length - 1; i >= 0; i--) {
    const t = session.lines[i].time;
    if (t !== null && t <= currentTime) { _playingIndex = i; break; }
  }
  playingIndexRef.current = _playingIndex;

  // ── Load existing LRC on mount ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    if (song.lrcHandle) {
      song.lrcHandle.getFile()
        .then(async f => {
          if (cancelled) return;
          const raw = await f.text();
          const { lines: parsed, metadata } = parseLrc(raw);
          metadataRef.current = metadata;
          session.initFromExisting(parsed);
        })
        .catch(() => { if (!cancelled) session.initEmpty(); });
    } else {
      session.initEmpty();
    }
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally mount-only

  // ── Seek detection (recompute focus on large time jumps) ────────────────────
  useEffect(() => {
    if (session.phase !== 'stamping') return;
    const diff = Math.abs(currentTime - prevTimeRef.current);
    prevTimeRef.current = currentTime;
    if (diff > 0.8) session.recomputeFocus(currentTime);
  // session.recomputeFocus is stable (useCallback [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, session.phase]);

  // ── Auto-scroll focused line into view ──────────────────────────────────────
  useEffect(() => {
    if (session.phase !== 'stamping' || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-stamp-index="${session.focusIndex}"]`
    );
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [session.focusIndex, session.phase]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const { illegal, warning, hasIllegal } = validateLines(session.lines, duration);

  // ── Save flow ───────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (hasIllegal || saving) return;
    setSaving(true);
    try {
      const fileName = `${song.name}.lrc`;
      let exists = false;
      try { await dirHandle.getFileHandle(fileName); exists = true; } catch { /* not found */ }
      if (exists && !window.confirm(t.overwriteConfirm(fileName))) {
        setSaving(false);
        return;
      }
      const lrcLines = session.lines.map(l => ({ time: l.time ?? 0, text: l.text }));
      const content = serializeLrc(lrcLines, metadataRef.current);
      const handle = await dirHandle.getFileHandle(fileName, { create: true });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      onSaved(handle);
    } catch (err) {
      console.error('Stamp save error:', err);
      alert(t.saveFailed);
      setSaving(false);
    }
  }, [hasIllegal, saving, song.name, dirHandle, session.lines, onSaved, t]);

  // ── Cancel ──────────────────────────────────────────────────────────────────
  const handleCancel = useCallback(() => {
    if (
      (session.historyLength > 0 || session.phase === 'stamping') &&
      !window.confirm(t.discardConfirm)
    ) return;
    onClose();
  }, [session.historyLength, session.phase, onClose, t]);

  // ── Keyboard shortcuts (stamping phase) ─────────────────────────────────────
  // Use refs so the listener is only registered once per phase change.
  const handleSaveRef = useRef(handleSave);
  const handleCancelRef = useRef(handleCancel);
  useEffect(() => { handleSaveRef.current = handleSave; }, [handleSave]);
  useEffect(() => { handleCancelRef.current = handleCancel; }, [handleCancel]);

  const sessionRef = useRef(session);
  useEffect(() => { sessionRef.current = session; });

  useEffect(() => {
    if (session.phase !== 'stamping') return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') return;

      const s = sessionRef.current;

      if (e.code === 'Enter' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (s.focusIndex < s.lines.length) s.stamp(s.focusIndex, currentTimeRef.current);
      } else if (e.code === 'KeyC' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (onToggleChunk && s.focusIndex < s.lines.length) onToggleChunk(s.focusIndex);
      } else if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        s.undo();
      } else if (e.code === 'KeyS' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSaveRef.current();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        handleCancelRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [session.phase]);

  // ── Beforeunload guard ──────────────────────────────────────────────────────
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (session.historyLength > 0 || session.phase === 'stamping') {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [session.historyLength, session.phase]);

  // ── Render: prepare phase ───────────────────────────────────────────────────
  if (session.phase === 'prepare') {
    return (
      <div className="stamp-editor stamp-prepare">
        <div className="stamp-toolbar">
          <span className="stamp-title">{t.stampLyricsTitle}</span>
          <div className="stamp-toolbar-right">
            <button
              className="stamp-btn-primary"
              onClick={session.startStamping}
              disabled={!session.rawText.trim()}
            >
              {t.startStamping}
            </button>
            <button className="stamp-btn-cancel" onClick={handleCancel}>{t.cancel}</button>
          </div>
        </div>
        <div className="stamp-prepare-hint">
          {t.prepareHint1}<br />{t.prepareHint2}
        </div>
        <textarea
          className="stamp-textarea"
          value={session.rawText}
          onChange={e => session.setRawText(e.target.value)}
          placeholder={t.pastePlaceholder}
          spellCheck={false}
          autoFocus
        />
      </div>
    );
  }

  // ── Render: stamping phase ──────────────────────────────────────────────────
  const stampedCount = session.lines.filter(l => l.time !== null).length;
  const allStamped = session.focusIndex >= session.lines.length;
  const playingIndex = playingIndexRef.current;

  return (
    <div className="stamp-editor stamp-active">
      <div className="stamp-toolbar">
        <span className="stamp-status">
          {t.stampStatus(stampedCount, session.lines.length)}
          {hasIllegal && (
            <span className="stamp-illegal-badge"> {t.illegalBadge(illegal.size)}</span>
          )}
        </span>
        <div className="stamp-toolbar-right">
          <button
            className="stamp-undo-btn"
            onClick={session.undo}
            disabled={session.historyLength === 0}
            title={t.undoTitle}
          >
            {t.undo}
          </button>
          <button
            className="stamp-btn-primary"
            onClick={handleSave}
            disabled={hasIllegal || saving || session.lines.length === 0}
            title={hasIllegal ? t.fixIllegal(illegal.size) : t.saveTitle}
          >
            {saving ? t.saving : t.save}
          </button>
          <button className="stamp-btn-cancel" onClick={handleCancel}>{t.cancel}</button>
        </div>
      </div>
      <div className="stamp-hint">
        {t.stampHintClick} &nbsp;·&nbsp;
        <kbd>Enter</kbd> {t.stampHintEnter} &nbsp;·&nbsp;
        <kbd>C</kbd> {t.stampHintC} &nbsp;·&nbsp;
        <kbd>Ctrl+Z</kbd> {t.stampHintUndo} &nbsp;·&nbsp;
        <kbd>Ctrl+S</kbd> {t.stampHintSave} &nbsp;·&nbsp;
        {t.usePlaybar}
      </div>

      <div className="stamp-list" ref={listRef}>
        {session.lines.map((line, i) => (
          <StampLineItem
            key={i}
            line={line}
            index={i}
            isFocused={i === session.focusIndex}
            isPlaying={i === playingIndex}
            isIllegal={illegal.has(i)}
            isWarning={warning.has(i)}
            isChunkStart={!!(chunks?.includes(i))}
            onClick={() => session.stamp(i, currentTimeRef.current)}
            onToggleChunk={onToggleChunk ? () => onToggleChunk(i) : undefined}
          />
        ))}
        {allStamped && session.lines.length > 0 && (
          <div className="stamp-done-message">
            {t.allStamped}
          </div>
        )}
      </div>
    </div>
  );
};

export default StampEditor;
