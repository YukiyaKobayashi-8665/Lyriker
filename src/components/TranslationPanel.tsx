import { useRef, useEffect, useMemo, useState, useCallback, type FC } from 'react';
import { useLang } from '../LangContext';
import { getChunkRanges } from '../utils/chunkRanges';
import type { LyricLine } from '../types';

type Props = {
  isOpen: boolean;
  onToggle: () => void;
  chunks: number[];
  translations: Record<string, string>;
  activeIndex: number;
  lineCount: number;
  lines: LyricLine[];
  onSetTranslation: (chunkStart: number, text: string) => void;
};

const TranslationPanel: FC<Props> = ({
  isOpen, onToggle, chunks, translations, activeIndex, lineCount, lines, onSetTranslation,
}) => {
  const { t } = useLang();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [editingChunkStart, setEditingChunkStart] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Auto-scroll active chunk block into center — suppressed while editing
  useEffect(() => {
    if (!scrollRef.current || activeChunkStart < 0 || editingChunkStart !== null) return;
    const el = scrollRef.current.querySelector<HTMLElement>(
      `[data-chunk-start="${activeChunkStart}"]`,
    );
    if (!el) return;
    const container = scrollRef.current;
    const target = el.offsetTop - container.clientHeight / 2 + el.offsetHeight / 2;
    container.scrollTo({ top: target, behavior: 'smooth' });
  }, [activeChunkStart, editingChunkStart]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (editingChunkStart === null) return;
    const ta = textareaRef.current;
    if (!ta) return;
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
    <div className="translation-column">
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
      <div className="translation-body" ref={scrollRef}>
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
                  onKeyDown={handleKeyDown}
                  onBlur={commitEdit}
                  rows={Math.max(2, text.split('\n').length)}
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
    </div>
  );
};

export default TranslationPanel;
