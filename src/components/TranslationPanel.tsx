import { useRef, useEffect, useMemo, useState, useCallback, type FC } from 'react';
import { useLang } from '../LangContext';
import { getChunkRanges } from '../utils/chunkRanges';
import type { LyricLine } from '../types';
import NotesPanel from './NotesPanel';

type Props = {
  isOpen: boolean;
  onToggle: () => void;
  chunks: number[];
  translations: Record<string, string>;
  notes: Record<string, string>;
  activeIndex: number;
  lineCount: number;
  lines: LyricLine[];
  onSetTranslation: (chunkStart: number, text: string) => void;
  onSetNotes: (chunkStart: number, text: string) => void;
};

const TranslationPanel: FC<Props> = ({
  isOpen, onToggle, chunks, translations, notes, activeIndex, lineCount, lines,
  onSetTranslation, onSetNotes,
}) => {
  const { t } = useLang();
  const scrollRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const [editingChunkStart, setEditingChunkStart] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Vertical split: translation area takes topPct% of the column height
  const [topPct, setTopPct] = useState(70);
  const [notesOpen, setNotesOpen] = useState(true);

  const ranges = useMemo(
    () => getChunkRanges(chunks, lineCount),
    [chunks, lineCount],
  );

  // Active chunk: the range whose [start, end] contains activeIndex
  const activeChunkStart = useMemo(() => {
    if (ranges.length === 0) return -1;
    for (const r of ranges) {
      if (activeIndex >= r.start && activeIndex <= r.end) return r.start;
    }
    return ranges[ranges.length - 1].start;
  }, [ranges, activeIndex]);

  // Scroll the active chunk to center of the translation body
  const scrollToActive = useCallback((smooth: boolean) => {
    if (!scrollRef.current || activeChunkStart < 0 || editingChunkStart !== null) return;
    const el = scrollRef.current.querySelector<HTMLElement>(
      `[data-chunk-start="${activeChunkStart}"]`,
    );
    if (!el) return;
    const container = scrollRef.current;
    const target = el.offsetTop - container.clientHeight / 2 + el.offsetHeight / 2;
    container.scrollTo({ top: target, behavior: smooth ? 'smooth' : 'instant' });
  }, [activeChunkStart, editingChunkStart]);

  // Auto-scroll active chunk block into center — suppressed while editing
  useEffect(() => {
    scrollToActive(true);
  }, [scrollToActive]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (editingChunkStart === null) return;
    const ta = textareaRef.current;
    if (!ta) return;
    setEditingText(ta.value);
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
  }, [editingChunkStart]);

  const commitEdit = useCallback(() => {
    if (editingChunkStart === null || !textareaRef.current) return;
    onSetTranslation(editingChunkStart, textareaRef.current.value);
    setEditingChunkStart(null);
  }, [editingChunkStart, onSetTranslation]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      commitEdit();
    }
  }, [commitEdit]);

  const handleVSplitterMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startPct = topPct;
    const colHeight = columnRef.current?.offsetHeight ?? 1;
    const onMove = (ev: MouseEvent) => {
      const newPct = Math.min(85, Math.max(15, startPct + ((ev.clientY - startY) / colHeight) * 100));
      setTopPct(newPct);
      // Re-center immediately after layout update
      requestAnimationFrame(() => scrollToActive(false));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [topPct, scrollToActive]);

  if (!isOpen) {
    return (
      <div className="translation-column translation-column--folded">
        <button
          className="translation-fold-btn"
          onClick={onToggle}
          title={t.showTranslation}
        >
          ‹
        </button>
      </div>
    );
  }

  const hasAnyTranslation = Object.values(translations).some(v => v.trim() !== '');

  return (
    <div className="translation-column" ref={columnRef}>
      <div className="translation-header">
        <span className="translation-title">{t.translation}</span>
        <button
          className="translation-fold-btn"
          onClick={onToggle}
          title={t.hideTranslation}
        >
          ›
        </button>
      </div>
      {/* Translation body — expands to fill when notes folded */}
      <div className="translation-body" ref={scrollRef} style={{ flex: notesOpen ? `0 0 ${topPct}%` : '1' }}>
        <div className="translation-pad" />
        {ranges.map(({ start, end }) => {
          const text = translations[String(start)] ?? '';
          const isActive = start === activeChunkStart;
          const isEditing = start === editingChunkStart;
          return (
            <div
              key={start}
              data-chunk-start={start}
              className={[
                'translation-chunk',
                isEditing  ? 'translation-chunk--editing'  :
                isActive   ? 'translation-chunk--active'   :
                             'translation-chunk--inactive',
              ].join(' ')}
              onDoubleClick={() => !isEditing && setEditingChunkStart(start)}
            >
              {isEditing ? (
                <textarea
                  ref={textareaRef}
                  className="translation-edit-area"
                  defaultValue={text}
                  onChange={e => setEditingText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={commitEdit}
                  rows={Math.max(5, editingText.split('\n').length)}
                  spellCheck={false}
                />
              ) : text ? (
                text.split('\n').map((line, i) => (
                  <p key={i} className="translation-line">{line}</p>
                ))
              ) : (
                <p className="translation-placeholder">
                  {lines[start]?.text ?? `${start + 1}–${end + 1}`}
                </p>
              )}
            </div>
          );
        })}
        {!hasAnyTranslation && ranges.length <= 1 && (
          <div className="translation-empty-hint">
            <p>{t.noTranslation}</p>
          </div>
        )}
        <div className="translation-pad" />
      </div>
      {/* Vertical splitter — only when notes are open */}
      {notesOpen && <div className="vsplitter" onMouseDown={handleVSplitterMouseDown} />}
      {/* Notes section — collapses to header-only when folded */}
      <div className={notesOpen ? 'notes-column' : 'notes-column notes-column--folded'}>
        <NotesPanel
          notes={notes}
          activeChunkStart={activeChunkStart >= 0 ? activeChunkStart : 0}
          onSetNotes={onSetNotes}
          isOpen={notesOpen}
          onToggle={() => setNotesOpen(o => !o)}
        />
      </div>
    </div>
  );
};

export default TranslationPanel;
