import { useRef, useEffect, useCallback, type FC } from 'react';
import type { LyricLine } from '../types';
import { useLang } from '../LangContext';

type Props = {
  line: LyricLine;
  index: number;
  isActive: boolean;
  isNearest: boolean;   // nearest line to panel center when not following
  isEditing: boolean;
  isChunkStart?: boolean;
  isInActiveChunk?: boolean;
  onSeek: (time: number) => void;
  onStartEdit: (index: number) => void;
  onSave: (index: number, text: string) => void;
  onToggleChunk?: () => void;
};

export function safeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&lt;(\/?)([bi])&gt;/g, '<$1$2>');
}

function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    const inner = Array.from(node.childNodes).map(serializeNode).join('');
    const tag = el.tagName.toLowerCase();
    if (tag === 'b' || tag === 'strong') return `<b>${inner}</b>`;
    if (tag === 'i' || tag === 'em') return `<i>${inner}</i>`;
    return inner;
  }
  return '';
}

function htmlToLrcText(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return Array.from(div.childNodes).map(serializeNode).join('');
}

const LyricLineComponent: FC<Props> = ({
  line, index, isActive, isNearest, isEditing, isChunkStart, isInActiveChunk,
  onSeek, onStartEdit, onSave, onToggleChunk,
}) => {
  const { t } = useLang();
  const editRef = useRef<HTMLDivElement>(null);
  const didSave = useRef(false);

  // Initialise editor whenever we enter edit mode
  useEffect(() => {
    if (!isEditing) return;
    const el = editRef.current;
    if (!el) return;
    didSave.current = false;
    el.innerHTML = safeHtml(line.text);
    el.focus();
    // Move cursor to end
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]); // intentionally omit line.text to avoid resetting mid-edit

  const commitSave = useCallback(() => {
    if (didSave.current || !editRef.current) return;
    didSave.current = true;
    onSave(index, htmlToLrcText(editRef.current.innerHTML));
  }, [index, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' || e.key === 'Enter') {
      e.preventDefault();
      commitSave();
      editRef.current?.blur();
      return;
    }
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      document.execCommand('bold', false);
    }
    if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      document.execCommand('italic', false);
    }
  }, [commitSave]);

  const classNames = [
    'lyric-line',
    isActive        ? 'lyric-active'       : '',
    isNearest       ? 'lyric-nearest'      : '',
    isEditing       ? 'lyric-editing'      : '',
    isChunkStart    ? 'lyric-chunk-start'  : '',
    isInActiveChunk === false ? 'lyric-line--inactive' : '',
  ].filter(Boolean).join(' ');

  return (
    <li
      data-index={index}
      className={classNames}
      onClick={() => !isEditing && onSeek(line.time)}
      onDoubleClick={() => !isEditing && isActive && onStartEdit(index)}
      title={isEditing ? undefined : t.clickToSeek}
    >
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
      {isEditing ? (
        <div
          ref={editRef}
          className="lyric-edit"
          contentEditable
          suppressContentEditableWarning
          onKeyDown={handleKeyDown}
          onBlur={commitSave}
          spellCheck={false}
        />
      ) : (
        <span
          dangerouslySetInnerHTML={{
            __html: line.text ? safeHtml(line.text) : '&#8942;',
          }}
        />
      )}
    </li>
  );
};

export default LyricLineComponent;
