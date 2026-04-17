import { useRef, useEffect, useState, useCallback, type FC } from 'react';
import { useLang } from '../LangContext';

// ── Rich text helpers ─────────────────────────────────────────────────────────

/** Stored text → safe HTML for display and contentEditable init.
 *  Allows <b>/<i>, escapes everything else, maps \n → <br>. */
function notesTextToHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&lt;(\/?)([bi])&gt;/g, '<$1$2>')
    .replace(/\n/g, '<br>');
}

function serializeNotesNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  const inner = Array.from(el.childNodes).map(serializeNotesNode).join('');
  if (tag === 'b' || tag === 'strong') return `<b>${inner}</b>`;
  if (tag === 'i' || tag === 'em') return `<i>${inner}</i>`;
  if (tag === 'br') return '\n';
  if (tag === 'div' || tag === 'p') return '\n' + inner;
  return inner;
}

/** contentEditable innerHTML → stored text with <b>/<i> and \n. */
function notesHtmlToText(html: string): string {
  const container = document.createElement('div');
  container.innerHTML = html;
  const result = Array.from(container.childNodes).map(serializeNotesNode).join('');
  return result.replace(/^\n+/, '').replace(/\n+$/, '');
}

type Props = {
  notes: Record<string, string>;
  activeChunkStart: number;
  isOpen: boolean;
  onToggle: () => void;
  onSetNotes: (chunkStart: number, text: string) => void;
};

const NotesPanel: FC<Props> = ({ notes, activeChunkStart, isOpen, onToggle, onSetNotes }) => {
  const { t } = useLang();
  const [editingChunkStart, setEditingChunkStart] = useState<number | null>(null);
  const [viewChunkStart, setViewChunkStart] = useState(activeChunkStart);
  const editRef = useRef<HTMLDivElement>(null);
  const didSave = useRef(false);

  // Follow active chunk when not editing
  useEffect(() => {
    if (editingChunkStart === null) {
      setViewChunkStart(activeChunkStart);
    }
  }, [activeChunkStart, editingChunkStart]);

  // Initialise contentEditable when entering edit mode
  useEffect(() => {
    if (editingChunkStart === null) return;
    const el = editRef.current;
    if (!el) return;
    didSave.current = false;
    el.innerHTML = notesTextToHtml(notes[String(editingChunkStart)] ?? '');
    el.focus();
    // Move cursor to end
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, [editingChunkStart]); // intentionally omit notes to avoid resetting mid-edit

  const text = notes[String(viewChunkStart)] ?? '';

  const commitEdit = useCallback(() => {
    if (didSave.current || editingChunkStart === null || !editRef.current) return;
    didSave.current = true;
    onSetNotes(editingChunkStart, notesHtmlToText(editRef.current.innerHTML));
    setEditingChunkStart(null);
  }, [editingChunkStart, onSetNotes]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      commitEdit();
      editRef.current?.blur();
      return;
    }
    if (e.ctrlKey && e.key === 'b') { e.preventDefault(); document.execCommand('bold', false); }
    if (e.ctrlKey && e.key === 'i') { e.preventDefault(); document.execCommand('italic', false); }
  }, [commitEdit]);

  const enterEdit = useCallback(() => {
    setEditingChunkStart(viewChunkStart);
  }, [viewChunkStart]);

  // "Return to current playback" button — shown when editing and playback has moved on
  const playbackMoved = editingChunkStart !== null && activeChunkStart !== editingChunkStart;

  return (
    <div className="notes-panel">
      {/* Header — fold button matches translation-fold-btn style */}
      <div className="notes-header">
        <span className="notes-title">{t.notes}</span>
        <button
          className="translation-fold-btn"
          onClick={onToggle}
          title={isOpen ? t.hideNotes : t.showNotes}
        >
          {isOpen ? '▾' : '▴'}
        </button>
      </div>

      {/* Body — collapsible; double-click anywhere to edit */}
      {isOpen && (
        <div className="notes-body" onDoubleClick={editingChunkStart === null ? enterEdit : undefined}>
          {playbackMoved && (
            <div className="notes-return-bar">
              <button
                className="notes-return-btn"
                onClick={() => {
                  commitEdit();
                  setViewChunkStart(activeChunkStart);
                }}
              >
                ↩ Return to current playback
              </button>
            </div>
          )}
          {editingChunkStart !== null ? (
            <div
              ref={editRef}
              className="notes-edit-area"
              contentEditable
              suppressContentEditableWarning
              onKeyDown={handleKeyDown}
              onBlur={commitEdit}
              spellCheck={false}
            />
          ) : text ? (
            <div
              className="notes-display"
              dangerouslySetInnerHTML={{ __html: notesTextToHtml(text) }}
            />
          ) : (
            <p className="notes-placeholder">
              {t.noNotes}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default NotesPanel;
